from django.db.models import Q
from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from marketplace.models import Product
from accounts.permissions import IsVerifiedUser


class ConversationListCreateView(APIView):
    permission_classes = [IsVerifiedUser]

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
    permission_classes = [IsVerifiedUser]

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
    permission_classes = [IsVerifiedUser]

    def post(self, request, conversation_id):
        from marketplace.models import CartItem

        conv = (
            Conversation.objects.select_related("product")
            .filter(id=conversation_id)
            .filter(Q(buyer=request.user) | Q(seller=request.user))
            .first()
        )
        if not conv:
            return Response({"detail": "Диалог не найден"}, status=404)

        new_status = (request.data.get("status") or "").strip()
        is_seller = request.user.id == conv.seller_id
        is_buyer = request.user.id == conv.buyer_id

        # Seller manages full workflow; buyer can complete purchase (sold) or cancel interest.
        if is_seller:
            allowed = {"active", "reserved", "sold", "cancelled"}
        elif is_buyer:
            allowed = {"sold", "cancelled"}
        else:
            return Response({"detail": "Нет доступа"}, status=403)

        if new_status not in allowed:
            if is_buyer:
                return Response(
                    {
                        "detail": "Покупатель может только подтвердить покупку (sold) "
                        "или отменить интерес (cancelled)"
                    },
                    status=403,
                )
            return Response(
                {"detail": "Недопустимый статус. Допустимо: active, reserved, sold, cancelled"},
                status=400,
            )

        previous = conv.deal_status
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
                # Cart keeps items after «Написать продавцам»; remove only when deal is done.
                CartItem.objects.filter(user=conv.buyer, product=product).delete()
                if previous != "sold":
                    who = "Покупатель" if is_buyer else "Продавец"
                    Message.objects.create(
                        conversation=conv,
                        sender=request.user,
                        text=(
                            f"{who} завершил сделку: товар «{product.title}» куплен. "
                            "Диалог можно закрыть; покупатель может оставить отзыв."
                        ),
                        is_read=False,
                    )
            elif new_status in {"active", "cancelled"}:
                # Return to active only if this conversation was driving reserved/sold
                if product.status in {"reserved", "sold"} and is_seller:
                    product.status = "active"
                    product.save(update_fields=["status"])

        return Response(ConversationSerializer(conv, context={"request": request}).data)


class UnreadTotalView(APIView):
    permission_classes = [IsVerifiedUser]

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
