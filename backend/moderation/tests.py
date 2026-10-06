from rest_framework.test import APITestCase
from rest_framework import status

from accounts.models import User
from marketplace.models import Product
from moderation.models import Report


class ModerationAPITests(APITestCase):
    def setUp(self):
        self.seller = User.objects.create_user(
            email="seller@test.kz",
            password="secret12",
            full_name="Seller",
        )
        self.reporter = User.objects.create_user(
            email="reporter@test.kz",
            password="secret12",
            full_name="Reporter",
        )
        self.staff = User.objects.create_user(
            email="staff@test.kz",
            password="secret12",
            full_name="Staff",
            is_staff=True,
        )
        self.product = Product.objects.create(
            title="Подозрительный товар",
            description="Desc",
            price=999,
            category="Другое",
            seller=self.seller,
            status="active",
        )

    def test_create_report(self):
        self.client.force_authenticate(user=self.reporter)
        resp = self.client.post(
            "/api/reports",
            {
                "product": self.product.id,
                "reason": "scam",
                "comment": "Похоже на мошенничество",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Report.objects.count(), 1)

    def test_staff_lists_and_hides_product(self):
        report = Report.objects.create(
            product=self.product,
            reporter=self.reporter,
            reason="spam",
            comment="spam",
        )
        self.client.force_authenticate(user=self.staff)

        listing = self.client.get("/api/moderation/reports")
        self.assertEqual(listing.status_code, status.HTTP_200_OK)
        self.assertEqual(listing.data["total"], 1)

        action = self.client.post(
            f"/api/moderation/reports/{report.id}/resolve",
            {"action": "hide_product"},
            format="json",
        )
        self.assertEqual(action.status_code, status.HTTP_200_OK)
        self.assertEqual(action.data["status"], "resolved")
        self.product.refresh_from_db()
        self.assertEqual(self.product.status, "hidden")

    def test_non_staff_cannot_moderate(self):
        report = Report.objects.create(
            product=self.product,
            reporter=self.reporter,
            reason="other",
        )
        self.client.force_authenticate(user=self.reporter)
        listing = self.client.get("/api/moderation/reports")
        self.assertIn(listing.status_code, (status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED))

        action = self.client.post(
            f"/api/moderation/reports/{report.id}/resolve",
            {"action": "dismiss"},
            format="json",
        )
        self.assertIn(action.status_code, (status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED))
