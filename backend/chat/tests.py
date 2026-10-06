from rest_framework.test import APITestCase
from rest_framework import status

from accounts.models import User
from marketplace.models import Product
from chat.models import Conversation, Message


class ChatAPITests(APITestCase):
    def setUp(self):
        self.seller = User.objects.create_user(
            email="seller@test.kz",
            password="secret12",
            full_name="Seller",
        )
        self.buyer = User.objects.create_user(
            email="buyer@test.kz",
            password="secret12",
            full_name="Buyer",
        )
        self.product = Product.objects.create(
            title="Товар",
            description="Desc",
            price=2000,
            category="Другое",
            seller=self.seller,
            status="active",
        )

    def test_start_conversation_and_unread(self):
        self.client.force_authenticate(user=self.buyer)
        start = self.client.post(
            "/api/conversations",
            {"product_id": self.product.id},
            format="json",
        )
        self.assertIn(start.status_code, (status.HTTP_200_OK, status.HTTP_201_CREATED))
        conv_id = start.data["id"]

        Message.objects.create(
            conversation_id=conv_id,
            sender=self.seller,
            text="Привет",
            is_read=False,
        )

        unread = self.client.get("/api/conversations/unread-total")
        self.assertEqual(unread.status_code, status.HTTP_200_OK)
        self.assertEqual(unread.data["total"], 1)

        messages = self.client.get(f"/api/conversations/{conv_id}/messages")
        self.assertEqual(messages.status_code, status.HTTP_200_OK)
        self.assertEqual(len(messages.data), 1)

        unread_after = self.client.get("/api/conversations/unread-total")
        self.assertEqual(unread_after.data["total"], 0)

    def test_seller_can_set_deal_status_reserved(self):
        conv = Conversation.objects.create(
            product=self.product,
            buyer=self.buyer,
            seller=self.seller,
        )
        self.client.force_authenticate(user=self.seller)
        resp = self.client.post(
            f"/api/conversations/{conv.id}/deal-status",
            {"status": "reserved"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["deal_status"], "reserved")
        self.product.refresh_from_db()
        self.assertEqual(self.product.status, "reserved")

    def test_buyer_cannot_set_deal_status(self):
        conv = Conversation.objects.create(
            product=self.product,
            buyer=self.buyer,
            seller=self.seller,
        )
        self.client.force_authenticate(user=self.buyer)
        resp = self.client.post(
            f"/api/conversations/{conv.id}/deal-status",
            {"status": "sold"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_cannot_chat_with_self(self):
        self.client.force_authenticate(user=self.seller)
        resp = self.client.post(
            "/api/conversations",
            {"product_id": self.product.id},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
