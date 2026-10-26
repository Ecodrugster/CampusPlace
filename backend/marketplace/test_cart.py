from rest_framework.test import APITestCase
from rest_framework import status

from accounts.models import User
from marketplace.models import Product, CartItem
from marketplace.loyalty import get_loyalty_discount_percent, apply_discount
from chat.models import Conversation, Message


class CartLoyaltyAPITests(APITestCase):
    def setUp(self):
        self.seller = User.objects.create_user(
            email="seller_cart@test.kz",
            password="secret12",
            full_name="Seller Cart",
        )
        self.buyer = User.objects.create_user(
            email="buyer_cart@test.kz",
            password="secret12",
            full_name="Buyer Cart",
        )
        self.product = Product.objects.create(
            title="Товар в корзину",
            description="Desc",
            price=10000,
            category="Аксессуары",
            seller=self.seller,
            status="active",
        )

    def test_loyalty_grows_with_sold_purchases_capped_at_50(self):
        self.assertEqual(get_loyalty_discount_percent(self.buyer), 0)
        for i in range(3):
            p = Product.objects.create(
                title=f"Bought {i}",
                description="x",
                price=1000,
                category="Мебель",
                seller=self.seller,
                status="sold",
            )
            Conversation.objects.create(
                product=p,
                buyer=self.buyer,
                seller=self.seller,
                deal_status="sold",
            )
        self.assertEqual(get_loyalty_discount_percent(self.buyer), 15)
        self.assertEqual(apply_discount(10000, 15), 8500.0)

        for i in range(20):
            p = Product.objects.create(
                title=f"Bought more {i}",
                description="x",
                price=1000,
                category="Мебель",
                seller=self.seller,
                status="sold",
            )
            Conversation.objects.create(
                product=p,
                buyer=self.buyer,
                seller=self.seller,
                deal_status="sold",
            )
        self.assertEqual(get_loyalty_discount_percent(self.buyer), 50)

    def test_cart_add_list_checkout(self):
        self.client.force_authenticate(user=self.buyer)
        add = self.client.post(f"/api/cart/{self.product.id}")
        self.assertEqual(add.status_code, status.HTTP_201_CREATED)
        self.assertTrue(add.data["in_cart"])

        listing = self.client.get("/api/cart")
        self.assertEqual(listing.status_code, status.HTTP_200_OK)
        self.assertEqual(listing.data["count"], 1)
        self.assertEqual(listing.data["items"][0]["offer_price"], 10000)

        # Give buyer 10% loyalty (2 purchases)
        for i in range(2):
            p = Product.objects.create(
                title=f"Past {i}",
                description="x",
                price=500,
                category="Обувь",
                seller=self.seller,
                status="sold",
            )
            Conversation.objects.create(
                product=p, buyer=self.buyer, seller=self.seller, deal_status="sold"
            )

        listing2 = self.client.get("/api/cart")
        self.assertEqual(listing2.data["loyalty"]["discount_percent"], 10)
        self.assertEqual(listing2.data["items"][0]["offer_price"], 9000)

        checkout = self.client.post("/api/cart/checkout")
        self.assertEqual(checkout.status_code, status.HTTP_200_OK)
        self.assertEqual(checkout.data["started"], 1)
        # Items stay in cart until the deal is completed (sold).
        self.assertEqual(CartItem.objects.filter(user=self.buyer).count(), 1)
        self.assertTrue(checkout.data.get("kept_in_cart"))
        self.assertTrue(
            Message.objects.filter(sender=self.buyer, text__icontains="бонус-скидка").exists()
        )

        conv_id = checkout.data["conversations"][0]["id"]
        complete = self.client.post(
            f"/api/conversations/{conv_id}/deal-status",
            {"status": "sold"},
            format="json",
        )
        self.assertEqual(complete.status_code, status.HTTP_200_OK)
        self.assertEqual(complete.data["deal_status"], "sold")
        self.assertEqual(CartItem.objects.filter(user=self.buyer).count(), 0)

    def test_cannot_add_own_product(self):
        self.client.force_authenticate(user=self.seller)
        resp = self.client.post(f"/api/cart/{self.product.id}")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
