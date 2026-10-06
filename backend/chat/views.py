from django.db.models import Q
from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from marketplace.models import Product


class ConversationListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        convs = (
            Conversation.objects.filter(Q(buyer=request.user) | Q(seller=request.user))
            .select_related("buyer", "seller", "product")
            .prefetch_related("messages")
            .order_by("-created_at")
        )
        return Response(ConversationSerializer(convs, many=True, context={"request": request}).data)

    def post(self, request):
        product_id = request.data.get("product_id")
        if not product_id:
            return Response({"detail": "product_id обязателен"}, status=400)
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({"detail": "Товар не найден"}, status=404)

        if product.seller_id == request.user.id:
            return Response({"detail": "Нельзя написать самому себе"}, status=400)

        conv, created = Conversation.objects.get_or_create(
            product=product, buyer=request.user, seller=product.seller
        )
        return Response(
            ConversationSerializer(conv, context={"request": request}).data,
            status=201 if created else 200,
        )


class MessageListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, conversation_id):
        conv = (
            Conversation.objects.filter(id=conversation_id)
            .filter(Q(buyer=request.user) | Q(seller=request.user))
            .first()
        )
        if not conv:
            return Response({"detail": "Диалог не найден"}, status=404)

        messages = conv.messages.select_related("sender")
        messages.exclude(sender=request.user).update(is_read=True)

        return Response(MessageSerializer(messages, many=True).data)


class ConversationDealStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, conversation_id):
        conv = (
            Conversation.objects.select_related("product")
            .filter(id=conversation_id)
            .filter(Q(buyer=request.user) | Q(seller=request.user))
            .first()
        )
        if not conv:
            return Response({"detail": "Диалог не найден"}, status=404)

        # Only seller manages deal workflow
        if request.user.id != conv.seller_id:
            return Response({"detail": "Статус сделки может менять только продавец"}, status=403)

        new_status = (request.data.get("status") or "").strip()
        allowed = {"active", "reserved", "sold", "cancelled"}
        if new_status not in allowed:
            return Response(
                {"detail": "Недопустимый статус. Допустимо: active, reserved, sold, cancelled"},
                status=400,
            )

        conv.deal_status = new_status
        conv.save(update_fields=["deal_status"])

        product = conv.product
        if product:
            if new_status == "reserved":
                product.status = "reserved"
                product.save(update_fields=["status"])
            elif new_status == "sold":
                product.status = "sold"
                product.save(update_fields=["status"])
            elif new_status in {"active", "cancelled"}:
                # Return to active only if this conversation was driving reserved/sold
                if product.status in {"reserved", "sold"}:
                    product.status = "active"
                    product.save(update_fields=["status"])

        return Response(ConversationSerializer(conv, context={"request": request}).data)


class UnreadTotalView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        total = (
            Message.objects.filter(
                conversation__in=Conversation.objects.filter(
                    Q(buyer=request.user) | Q(seller=request.user)
                ),
                is_read=False,
            )
            .exclude(sender=request.user)
            .count()
        )
        return Response({"total": total})
