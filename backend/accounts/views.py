import logging

from django.contrib.auth import authenticate
from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import User, EmailVerificationCode
from .serializers import RegisterSerializer, LoginSerializer, UserOutSerializer, build_token_response
from .email_verification import can_send_code, create_verification_code, send_verification_email

logger = logging.getLogger(__name__)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        if User.objects.filter(email=request.data.get("email")).exists():
            return Response(
                {"detail": "Пользователь с таким email уже зарегистрирован"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Auto-send verification code after register
        try:
            code_obj = create_verification_code(user)
            send_verification_email(user, code_obj.code)
        except Exception:
            logger.exception("Failed to send verification email after register")

        return Response(build_token_response(user), status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request,
            username=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )
        if user is None:
            return Response(
                {"detail": "Неверный email или пароль"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if user.is_banned:
            return Response({"detail": "Ваш аккаунт заблокирован"}, status=403)

        return Response(build_token_response(user))


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserOutSerializer(request.user).data)


class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request):
        user = request.user
        for field in ["full_name", "university", "faculty", "dormitory", "phone", "telegram", "avatar_url"]:
            if field in request.data:
                setattr(user, field, request.data[field])
        user.save()
        return Response(UserOutSerializer(user).data)


class SendVerificationCodeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.is_verified:
            return Response({"detail": "Email уже подтверждён"}, status=status.HTTP_400_BAD_REQUEST)

        allowed, wait_seconds = can_send_code(user)
        if not allowed:
            return Response(
                {"detail": f"Подождите ещё {wait_seconds} сек. перед повторной отправкой"},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        code_obj = create_verification_code(user)
        try:
            send_verification_email(user, code_obj.code)
        except Exception:
            logger.exception("Failed to send verification email")
            return Response(
                {"detail": "Не удалось отправить письмо. Попробуйте позже."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        payload = {
            "detail": "Код отправлен на email",
            "email": user.email,
            "expires_in_minutes": 15,
        }
        if settings.DEBUG and settings.EMAIL_VERIFICATION_DEV_FALLBACK:
            payload["dev_code"] = code_obj.code
        return Response(payload)


class ConfirmVerificationCodeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.is_verified:
            return Response({"detail": "Email уже подтверждён", "user": UserOutSerializer(user).data})

        code = str(request.data.get("code") or "").strip()
        if not code or len(code) != 6 or not code.isdigit():
            return Response({"detail": "Введите 6-значный код"}, status=status.HTTP_400_BAD_REQUEST)

        code_obj = (
            EmailVerificationCode.objects.filter(user=user, code=code, is_used=False)
            .order_by("-created_at")
            .first()
        )
        if not code_obj or not code_obj.is_valid():
            return Response({"detail": "Неверный или просроченный код"}, status=status.HTTP_400_BAD_REQUEST)

        code_obj.is_used = True
        code_obj.save(update_fields=["is_used"])
        user.is_verified = True
        user.save(update_fields=["is_verified"])

        return Response({
            "detail": "Email успешно подтверждён",
            "user": UserOutSerializer(user).data,
        })


class SellerPublicView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, seller_id):
        try:
            seller = User.objects.get(pk=seller_id)
        except User.DoesNotExist:
            return Response({"detail": "Продавец не найден"}, status=status.HTTP_404_NOT_FOUND)

        from marketplace.models import Product

        data = UserOutSerializer(seller).data
        data["products_count"] = Product.objects.filter(seller=seller, status="active").count()
        return Response(data)
