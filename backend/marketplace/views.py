import os
import uuid
from django.conf import settings
from django.db.models import Q, F
from django.core.files.storage import default_storage
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import Product, Favorite
from .serializers import ProductSerializer, ProductCreateUpdateSerializer

class ProductListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Product.objects.select_related('seller').all()

        category = request.GET.get('category')
        if category and category != 'Все':
            qs = qs.filter(category=category)

        search = request.GET.get('search')
        if search:
            qs = qs.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(location__icontains=search)
            )

        min_price = request.GET.get('min_price')
        if min_price:
            qs = qs.filter(price__gte=min_price)

        max_price = request.GET.get('max_price')
        if max_price:
            qs = qs.filter(price__lte=max_price)

        seller_id = request.GET.get('seller_id')
        if seller_id:
            qs = qs.filter(seller_id=seller_id)

        verified_only = request.GET.get('verified_only') == 'true'
        if verified_only:
            qs = qs.filter(seller__is_verified=True)

        status_filter = request.GET.get('status_filter', 'active')
        if status_filter and status_filter != 'all':
            qs = qs.filter(status=status_filter)

        total = qs.count()
        serializer = ProductSerializer(qs, many=True, context={'request': request})
        return Response({
            'items': serializer.data,
            'total': total,
            'page': 1,
            'limit': total
        })

    def post(self, request):
        if not request.user.is_authenticated:
            return Response({'detail': 'Требуется авторизация'}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = ProductCreateUpdateSerializer(data=request.data)
        if serializer.is_valid():
            product = serializer.save(seller=request.user)
            return Response(ProductSerializer(product, context={'request': request}).data, status=status.HTTP_201_CREATED)
        return Response({'detail': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class ProductDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            product = Product.objects.select_related('seller').get(pk=pk)
        except Product.DoesNotExist:
            return Response({'detail': 'Объявление не найдено'}, status=status.HTTP_404_NOT_FOUND)

        # Increment views
        Product.objects.filter(pk=pk).update(views_count=F('views_count') + 1)
        product.refresh_from_db()

        return Response(ProductSerializer(product, context={'request': request}).data)

    def put(self, request, pk):
        if not request.user.is_authenticated:
            return Response({'detail': 'Требуется авторизация'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            product = Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return Response({'detail': 'Объявление не найдено'}, status=status.HTTP_404_NOT_FOUND)

        if product.seller != request.user:
            return Response({'detail': 'Вы можете редактировать только свои объявления'}, status=status.HTTP_403_FORBIDDEN)

        serializer = ProductCreateUpdateSerializer(product, data=request.data, partial=True)
        if serializer.is_valid():
            product = serializer.save()
            return Response(ProductSerializer(product, context={'request': request}).data)
        return Response({'detail': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        if not request.user.is_authenticated:
            return Response({'detail': 'Требуется авторизация'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            product = Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return Response({'detail': 'Объявление не найдено'}, status=status.HTTP_404_NOT_FOUND)

        if product.seller != request.user:
            return Response({'detail': 'Вы можете удалять только свои объявления'}, status=status.HTTP_403_FORBIDDEN)

        product.delete()
        return Response({'message': 'Объявление успешно удалено'})


class ImageUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'detail': 'Файл не передан'}, status=status.HTTP_400_BAD_REQUEST)

        ext = os.path.splitext(file.name)[1].lower()
        if ext not in ['.jpg', '.jpeg', '.png', '.webp', '.gif']:
            return Response({'detail': 'Недопустимый формат файла'}, status=status.HTTP_400_BAD_REQUEST)

        filename = f"uploads/{uuid.uuid4().hex}{ext}"
        upload_path = os.path.join(settings.BASE_DIR, 'static', filename)
        os.makedirs(os.path.dirname(upload_path), exist_ok=True)

        with open(upload_path, 'wb+') as destination:
            for chunk in file.chunks():
                destination.write(chunk)

        return Response({'url': f"/static/{filename}"})


class FavoriteToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        favs = Favorite.objects.filter(user=request.user).select_related('product__seller')
        products = [f.product for f in favs]
        return Response(ProductSerializer(products, many=True, context={'request': request}).data)

    def post(self, request, pk):
        try:
            product = Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return Response({'detail': 'Товар не найден'}, status=status.HTTP_404_NOT_FOUND)

        fav, created = Favorite.objects.get_or_create(user=request.user, product=product)
        if not created:
            fav.delete()
            return Response({'is_favorite': False, 'message': 'Удалено из избранного'})
        return Response({'is_favorite': True, 'message': 'Добавлено в избранное'})
