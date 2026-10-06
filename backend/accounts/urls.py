from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenBlacklistView
from .views import (
    RegisterView,
    LoginView,
    MeView,
    ProfileView,
    SendVerificationCodeView,
    ConfirmVerificationCodeView,
    SellerPublicView,
)

urlpatterns = [
    path("register", RegisterView.as_view()),
    path("login", LoginView.as_view()),
    path("refresh", TokenRefreshView.as_view()),
    path("refresh/", TokenRefreshView.as_view()),
    path("logout", TokenBlacklistView.as_view()),
    path("logout/", TokenBlacklistView.as_view()),
    path("me", MeView.as_view()),
    path("profile", ProfileView.as_view()),
    path("verify/send", SendVerificationCodeView.as_view()),
    path("verify/confirm", ConfirmVerificationCodeView.as_view()),
]

# Seller public profile is mounted from config/urls under /api/sellers/<id>
seller_urlpatterns = [
    path("sellers/<int:seller_id>", SellerPublicView.as_view()),
    path("sellers/<int:seller_id>/", SellerPublicView.as_view()),
]
