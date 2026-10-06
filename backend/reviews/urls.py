from django.urls import path
from .views import ReviewCreateView, SellerReviewsView

urlpatterns = [
    path("reviews", ReviewCreateView.as_view()),
    path("reviews/", ReviewCreateView.as_view()),
    path("sellers/<int:seller_id>/reviews", SellerReviewsView.as_view()),
    path("sellers/<int:seller_id>/reviews/", SellerReviewsView.as_view()),
]