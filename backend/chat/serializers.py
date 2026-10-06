from rest_framework import serializers
from .models import Conversation, Message
from accounts.serializers import UserOutSerializer


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ["id", "conversation", "sender", "text", "is_read", "created_at"]
        read_only_fields = ["sender", "is_read", "created_at"]


class ConversationSerializer(serializers.ModelSerializer):
    buyer = UserOutSerializer(read_only=True)
    seller = UserOutSerializer(read_only=True)
    last_message = serializers.SerializerMethodField()
    product_title = serializers.CharField(source="product.title", read_only=True)
    product_status = serializers.CharField(source="product.status", read_only=True)
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id",
            "product",
            "product_title",
            "product_status",
            "buyer",
            "seller",
            "deal_status",
            "last_message",
            "unread_count",
            "created_at",
        ]

    def get_last_message(self, obj):
        msg = obj.messages.last()
        if not msg:
            return None
        return {"text": msg.text, "created_at": msg.created_at, "sender_id": msg.sender_id}

    def get_unread_count(self, obj):
        request = self.context.get("request")
        if not request or not request.user or not request.user.is_authenticated:
            return 0
        return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
