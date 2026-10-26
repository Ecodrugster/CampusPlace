from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

from accounts.urls import seller_urlpatterns


def health_check(request):
    return JsonResponse({"status": "ok"})

urlpatterns = [
    path("health/", health_check),
    path("api/auth/", include("accounts.urls")),
    path("api/", include(seller_urlpatterns)),
    path("api/", include("marketplace.urls")),
    path("api/", include("moderation.urls")),
    path("api/", include("reviews.urls")),
    path("api/", include("chat.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
