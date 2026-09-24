from django.contrib.auth import authenticate
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import User
from .serializers import RegisterSerializer, LoginSerializer, UserOutSerializer, build_token_response


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