from rest_framework.test import APITestCase
from rest_framework import status

from accounts.models import User, EmailVerificationCode


class AccountsAPITests(APITestCase):
    def test_register_login_and_me(self):
        register = self.client.post(
            "/api/auth/register",
            {
                "email": "student1@test.kz",
                "password": "secret12",
                "full_name": "Student One",
                "university": "Satbayev University",
                "dormitory": "Общежитие №2",
            },
            format="json",
        )
        self.assertEqual(register.status_code, status.HTTP_201_CREATED)
        self.assertIn("access_token", register.data)
        self.assertFalse(register.data["user"]["is_verified"])

        login = self.client.post(
            "/api/auth/login",
            {"email": "student1@test.kz", "password": "secret12"},
            format="json",
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        token = login.data["access_token"]

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        me = self.client.get("/api/auth/me")
        self.assertEqual(me.status_code, status.HTTP_200_OK)
        self.assertEqual(me.data["email"], "student1@test.kz")
        self.assertEqual(me.data["university"], "Satbayev University")

    def test_email_verification_flow(self):
        user = User.objects.create_user(
            email="verify@test.kz",
            password="secret12",
            full_name="Verify Me",
        )
        self.client.force_authenticate(user=user)

        send = self.client.post("/api/auth/verify/send", {}, format="json")
        self.assertEqual(send.status_code, status.HTTP_200_OK)

        code_obj = EmailVerificationCode.objects.filter(user=user, is_used=False).latest("created_at")
        confirm = self.client.post(
            "/api/auth/verify/confirm",
            {"code": code_obj.code},
            format="json",
        )
        self.assertEqual(confirm.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertTrue(user.is_verified)

    def test_seller_public_profile(self):
        seller = User.objects.create_user(
            email="seller@test.kz",
            password="secret12",
            full_name="Seller",
            university="КазНУ",
        )
        resp = self.client.get(f"/api/sellers/{seller.id}")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["full_name"], "Seller")
        self.assertEqual(resp.data["university"], "КазНУ")
        self.assertIn("products_count", resp.data)

    def test_update_avatar_url(self):
        user = User.objects.create_user(
            email="avatar@test.kz",
            password="secret12",
            full_name="Avatar User",
        )
        self.client.force_authenticate(user=user)
        resp = self.client.put(
            "/api/auth/profile",
            {"avatar_url": "https://example.com/avatar.png"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["avatar_url"], "https://example.com/avatar.png")
        user.refresh_from_db()
        self.assertEqual(user.avatar_url, "https://example.com/avatar.png")

    def test_banned_user_cannot_login(self):
        user = User.objects.create_user(
            email="banned@test.kz",
            password="secret12",
            full_name="Banned",
            is_banned=True,
        )
        resp = self.client.post(
            "/api/auth/login",
            {"email": "banned@test.kz", "password": "secret12"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_refresh_and_logout_blacklist(self):
        User.objects.create_user(
            email="refresh@test.kz",
            password="secret12",
            full_name="Refresh User",
        )
        login = self.client.post(
            "/api/auth/login",
            {"email": "refresh@test.kz", "password": "secret12"},
            format="json",
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        self.assertIn("refresh_token", login.data)
        refresh = login.data["refresh_token"]

        refreshed = self.client.post(
            "/api/auth/refresh",
            {"refresh": refresh},
            format="json",
        )
        self.assertEqual(refreshed.status_code, status.HTTP_200_OK)
        self.assertIn("access", refreshed.data)
        self.assertIn("refresh", refreshed.data)
        new_refresh = refreshed.data["refresh"]

        # Rotated old refresh must no longer work
        old_refresh_reuse = self.client.post(
            "/api/auth/refresh",
            {"refresh": refresh},
            format="json",
        )
        self.assertEqual(old_refresh_reuse.status_code, status.HTTP_401_UNAUTHORIZED)

        logout = self.client.post(
            "/api/auth/logout",
            {"refresh": new_refresh},
            format="json",
        )
        self.assertEqual(logout.status_code, status.HTTP_200_OK)

        after_logout = self.client.post(
            "/api/auth/refresh",
            {"refresh": new_refresh},
            format="json",
        )
        self.assertEqual(after_logout.status_code, status.HTTP_401_UNAUTHORIZED)
