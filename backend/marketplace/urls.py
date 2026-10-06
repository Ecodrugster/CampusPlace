from django.urls import path
from .views import (
    ProductListCreateView,
    ProductDetailView,
    FavoriteListView,
    FavoriteToggleView,
    ImageUploadView,
    CampusMetaView,
)

urlpatterns = [
    path("meta/campuses", CampusMetaView.as_view()),
    path("meta/campuses/", CampusMetaView.as_view()),
    path("products", ProductListCreateView.as_view()),
    path("products/", ProductListCreateView.as_view()),
    path("products/upload", ImageUploadView.as_view()),
    path("products/upload/", ImageUploadView.as_view()),
    path("products/<int:pk>", ProductDetailView.as_view()),
    path("products/<int:pk>/", ProductDetailView.as_view()),
    path("favorites", FavoriteListView.as_view()),
    path("favorites/", FavoriteListView.as_view()),
    path("favorites/<int:product_id>", FavoriteToggleView.as_view()),
    path("favorites/<int:product_id>/", FavoriteToggleView.as_view()),
]
