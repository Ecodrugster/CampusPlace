from rest_framework.test import APITestCase
from rest_framework import status

from accounts.models import User
from marketplace.models import Product, Favorite


class MarketplaceAPITests(APITestCase):
    def setUp(self):
        self.seller_a = User.objects.create_user(
            email="a@test.kz",
            password="secret12",
            full_name="Seller A",
            university="Satbayev University",
            dormitory="Общежитие №2",
            is_verified=True,
        )
        self.seller_b = User.objects.create_user(
            email="b@test.kz",
            password="secret12",
            full_name="Seller B",
            university="КазНУ им. аль-Фараби",
            dormitory="Общежитие №8",
            is_verified=False,
        )
        self.buyer = User.objects.create_user(
            email="buyer@test.kz",
            password="secret12",
            full_name="Buyer",
        )
        self.product_a = Product.objects.create(
            title="Ноутбук A",
            description="Good laptop",
            price=100000,
            category="Электроника",
            seller=self.seller_a,
            status="active",
        )
        self.product_b = Product.objects.create(
            title="Книга B",
            description="Textbook",
            price=5000,
            category="Книги",
            seller=self.seller_b,
            status="active",
        )
        self.product_hidden = Product.objects.create(
            title="Hidden",
            description="Hidden item",
            price=1,
            category="Другое",
            seller=self.seller_a,
            status="hidden",
        )

    def test_list_products_default_active_only(self):
        resp = self.client.get("/api/products")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        titles = {item["title"] for item in resp.data["items"]}
        self.assertIn("Ноутбук A", titles)
        self.assertIn("Книга B", titles)
        self.assertNotIn("Hidden", titles)
        self.assertIn("page", resp.data)
        self.assertIn("has_more", resp.data)

    def test_sort_by_price_asc(self):
        resp = self.client.get("/api/products", {"sort": "price_asc"})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        prices = [item["price"] for item in resp.data["items"]]
        self.assertEqual(prices, sorted(prices))

    def test_pagination(self):
        resp1 = self.client.get("/api/products", {"page": 1, "page_size": 1, "sort": "price_asc"})
        self.assertEqual(resp1.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp1.data["items"]), 1)
        self.assertEqual(resp1.data["total"], 2)
        self.assertTrue(resp1.data["has_more"])

        resp2 = self.client.get("/api/products", {"page": 2, "page_size": 1, "sort": "price_asc"})
        self.assertEqual(resp2.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp2.data["items"]), 1)
        self.assertFalse(resp2.data["has_more"])
        self.assertNotEqual(resp1.data["items"][0]["id"], resp2.data["items"][0]["id"])

    def test_filter_by_university(self):
        resp = self.client.get("/api/products", {"university": "Satbayev"})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        titles = [item["title"] for item in resp.data["items"]]
        self.assertEqual(titles, ["Ноутбук A"])

    def test_filter_by_dormitory(self):
        resp = self.client.get("/api/products", {"dormitory": "Общежитие №8"})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        titles = [item["title"] for item in resp.data["items"]]
        self.assertEqual(titles, ["Книга B"])

    def test_filter_verified_only(self):
        resp = self.client.get("/api/products", {"verified_only": "true"})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        titles = [item["title"] for item in resp.data["items"]]
        self.assertEqual(titles, ["Ноутбук A"])

    def test_campus_meta(self):
        resp = self.client.get("/api/meta/campuses")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("Satbayev University", resp.data["universities"])
        self.assertIn("КазНУ им. аль-Фараби", resp.data["universities"])
        self.assertIn("Общежитие №2", resp.data["dormitories"])
        self.assertIn("Общежитие №8", resp.data["dormitories"])

    def test_create_product_authenticated(self):
        self.client.force_authenticate(user=self.seller_a)
        resp = self.client.post(
            "/api/products",
            {
                "title": "Новый товар",
                "description": "Desc",
                "price": 15000,
                "category": "Другое",
                "condition": "Хорошее",
                "location": "Кампус",
                "images": ["https://example.com/a.jpg", "https://example.com/b.jpg"],
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["title"], "Новый товар")
        self.assertEqual(resp.data["seller"]["id"], self.seller_a.id)
        self.assertEqual(
            resp.data["images"],
            ["https://example.com/a.jpg", "https://example.com/b.jpg"],
        )
        product = Product.objects.get(id=resp.data["id"])
        self.assertIsInstance(product.images, list)
        self.assertEqual(len(product.images), 2)

    def test_favorite_toggle(self):
        self.client.force_authenticate(user=self.buyer)
        add = self.client.post(f"/api/favorites/{self.product_a.id}")
        self.assertEqual(add.status_code, status.HTTP_200_OK)
        self.assertTrue(add.data["is_favorite"])
        self.assertTrue(
            Favorite.objects.filter(user=self.buyer, product=self.product_a).exists()
        )

        remove = self.client.post(f"/api/favorites/{self.product_a.id}")
        self.assertEqual(remove.status_code, status.HTTP_200_OK)
        self.assertFalse(remove.data["is_favorite"])
