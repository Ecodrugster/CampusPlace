from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Product, Favorite
from .serializers import ProductSerializer, ProductCreateSerializer
import uuid
from django.core.files.storage import default_storage
from rest_framework.parsers import MultiPartParser


class ImageUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response({"detail": "Файл не предоставлен"}, status=400)

        ext = file.name.split(".")[-1] if "." in file.name else "jpg"
        filename = f"{uuid.uuid4().hex}.{ext}"
        path = default_storage.save(filename, file)
        url = request.build_absolute_uri(f"/media/{path}")
        return Response({"url": url})


class ProductListCreateView(APIView):
    permission_classes = [permissions.AllowAny]

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get(self, request):
        qs = Product.objects.select_related("seller").all()

        category = request.query_params.get("category")
        if category:
            qs = qs.filter(category=category)

        search = request.query_params.get("search")
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(description__icontains=search))

        min_price = request.query_params.get("min_price")
        if min_price:
            qs = qs.filter(price__gte=float(min_price))

        max_price = request.query_params.get("max_price")
        if max_price:
            qs = qs.filter(price__lte=float(max_price))

        seller_id = request.query_params.get("seller_id")
        if seller_id:
            qs = qs.filter(seller_id=seller_id)

        verified_only = request.query_params.get("verified_only")
        if verified_only == "true":
            qs = qs.filter(seller__is_verified=True)

        university = request.query_params.get("university")
        if university:
            qs = qs.filter(seller__university__icontains=university.strip())

        dormitory = request.query_params.get("dormitory")
        if dormitory:
            qs = qs.filter(seller__dormitory__icontains=dormitory.strip())

        status_filter = request.query_params.get("status_filter")
        if status_filter and status_filter != "all":
            qs = qs.filter(status=status_filter)
        elif not status_filter:
            qs = qs.filter(status="active")

        sort = (request.query_params.get("sort") or "newest").strip()
        sort_map = {
            "newest": ("-created_at",),
            "price_asc": ("price", "-created_at"),
            "price_desc": ("-price", "-created_at"),
            "popular": ("-views_count", "-created_at"),
        }
        qs = qs.order_by(*sort_map.get(sort, sort_map["newest"]))

        total = qs.count()

        try:
            page = max(1, int(request.query_params.get("page") or 1))
        except (TypeError, ValueError):
            page = 1
        try:
            page_size = int(request.query_params.get("page_size") or 12)
        except (TypeError, ValueError):
            page_size = 12
        page_size = max(1, min(page_size, 100))

        offset = (page - 1) * page_size
        page_qs = qs[offset: offset + page_size]
        serializer = ProductSerializer(page_qs, many=True, context={"request": request})
        has_more = offset + page_size < total

        return Response({
            "items": serializer.data,
            "total": total,
            "page": page,
            "page_size": page_size,
            "has_more": has_more,
        })

    def post(self, request):
        serializer = ProductCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        product = serializer.save()
        return Response(ProductSerializer(product, context={"request": request}).data, status=status.HTTP_201_CREATED)


class ProductDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get_permissions(self):
        if self.request.method in ("PUT", "DELETE"):
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_object(self, pk):
        try:
            return Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return None

    def get(self, request, pk):
        product = self.get_object(pk)
        if not product:
            return Response({"detail": "Товар не найден"}, status=404)
        product.views_count += 1
        product.save(update_fields=["views_count"])
        return Response(ProductSerializer(product, context={"request": request}).data)

    def put(self, request, pk):
        product = self.get_object(pk)
        if not product:
            return Response({"detail": "Товар не найден"}, status=404)
        if product.seller_id != request.user.id:
            return Response({"detail": "Нет доступа"}, status=403)
        serializer = ProductCreateSerializer(product, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ProductSerializer(product, context={"request": request}).data)

    def delete(self, request, pk):
        product = self.get_object(pk)
        if not product:
            return Response({"detail": "Товар не найден"}, status=404)
        if product.seller_id != request.user.id:
            return Response({"detail": "Нет доступа"}, status=403)
        product.delete()
        return Response(status=204)


class FavoriteListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        favs = Favorite.objects.filter(user=request.user).select_related("product", "product__seller")
        products = [f.product for f in favs]
        serializer = ProductSerializer(products, many=True, context={"request": request})
        return Response(serializer.data)


class FavoriteToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, product_id):
        fav = Favorite.objects.filter(user=request.user, product_id=product_id).first()
        if fav:
            fav.delete()
            return Response({"is_favorite": False})
        Favorite.objects.create(user=request.user, product_id=product_id)
        return Response({"is_favorite": True})


class CampusMetaView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from accounts.models import User

        seller_ids = (
            Product.objects.filter(status="active")
            .values_list("seller_id", flat=True)
            .distinct()
        )
        sellers = User.objects.filter(id__in=seller_ids)
        universities = sorted({
            (u.university or "").strip()
            for u in sellers
            if (u.university or "").strip()
        })
        dormitories = sorted({
            (u.dormitory or "").strip()
            for u in sellers
            if (u.dormitory or "").strip()
        })
        return Response({
            "universities": universities,
            "dormitories": dormitories,
        })
