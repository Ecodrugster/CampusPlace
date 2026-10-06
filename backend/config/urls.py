from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from accounts.urls import seller_urlpatterns

urlpatterns = [
    path("api/auth/", include("accounts.urls")),
    path("api/", include(seller_urlpatterns)),
    path("api/", include("marketplace.urls")),
    path("api/", include("moderation.urls")),
    path("api/", include("reviews.urls")),
    path("api/", include("chat.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)