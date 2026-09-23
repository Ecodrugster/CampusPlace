from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static

from accounts.views import RegisterView, LoginView, MeView
from marketplace.views import (
    ProductListView,
    ProductDetailView,
    ImageUploadView,
    FavoriteToggleView
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth API
    path('api/auth/register', RegisterView.as_view(), name='register'),
    path('api/auth/login', LoginView.as_view(), name='login'),
    path('api/auth/me', MeView.as_view(), name='me'),
    path('api/auth/profile', MeView.as_view(), name='profile'),

    # Marketplace API
    path('api/products', ProductListView.as_view(), name='products'),
    path('api/products/upload', ImageUploadView.as_view(), name='upload_image'),
    path('api/products/<int:pk>', ProductDetailView.as_view(), name='product_detail'),

    # Favorites API
    path('api/favorites', FavoriteToggleView.as_view(), name='favorites'),
    path('api/favorites/<int:pk>', FavoriteToggleView.as_view(), name='favorite_toggle'),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
