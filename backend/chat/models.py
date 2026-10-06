from django.db import models
from accounts.models import User
from marketplace.models import Product


class Conversation(models.Model):
    DEAL_STATUS_CHOICES = [
        ("active", "active"),
        ("reserved", "reserved"),
        ("sold", "sold"),
        ("cancelled", "cancelled"),
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="conversations", null=True, blank=True)
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="conversations_as_buyer")
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name="conversations_as_seller")
    deal_status = models.CharField(max_length=20, choices=DEAL_STATUS_CHOICES, default="active")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("product", "buyer", "seller")


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]