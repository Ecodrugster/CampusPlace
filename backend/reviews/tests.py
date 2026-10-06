from rest_framework.test import APITestCase
from rest_framework import status

from accounts.models import User
from marketplace.models import Product
from reviews.models import Review


class ReviewsAPITests(APITestCase):
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
            price=1000,
            category="Другое",
            seller=self.seller,
        )

    def test_create_review_and_list_seller_reviews(self):
        self.client.force_authenticate(user=self.buyer)
        create = self.client.post(
            "/api/reviews",
            {
                "product": self.product.id,
                "rating": 5,
                "comment": "Отличный продавец",
            },
            format="json",
        )
        self.assertEqual(create.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create.data["rating"], 5)
        self.assertEqual(Review.objects.count(), 1)

        listing = self.client.get(f"/api/sellers/{self.seller.id}/reviews")
        self.assertEqual(listing.status_code, status.HTTP_200_OK)
        self.assertEqual(listing.data["total_reviews"], 1)
        self.assertEqual(listing.data["average_rating"], 5.0)

    def test_cannot_review_own_product(self):
        self.client.force_authenticate(user=self.seller)
        resp = self.client.post(
            "/api/reviews",
            {
                "product": self.product.id,
                "rating": 4,
                "comment": "self",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_duplicate_review_blocked(self):
        Review.objects.create(
            product=self.product,
            reviewer=self.buyer,
            seller=self.seller,
            rating=4,
            comment="first",
        )
        self.client.force_authenticate(user=self.buyer)
        resp = self.client.post(
            "/api/reviews",
            {
                "product": self.product.id,
                "rating": 3,
                "comment": "second",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
