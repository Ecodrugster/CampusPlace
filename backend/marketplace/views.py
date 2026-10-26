from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Product, Favorite, CartItem
from .loyalty import loyalty_summary, apply_discount, get_loyalty_discount_percent
from .serializers import ProductSerializer, ProductCreateSerializer
import uuid
from django.core.files.storage import default_storage
from rest_framework.parsers import MultiPartParser
from accounts.permissions import IsVerifiedUser


class ImageUploadView(APIView):
    permission_classes = [IsVerifiedUser]
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
            return [IsVerifiedUser()]
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
            return [IsVerifiedUser()]
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
    permission_classes = [IsVerifiedUser]

    def get(self, request):
        favs = Favorite.objects.filter(user=request.user).select_related("product", "product__seller")
        products = [f.product for f in favs]
        serializer = ProductSerializer(products, many=True, context={"request": request})
        return Response(serializer.data)


class FavoriteToggleView(APIView):
    permission_classes = [IsVerifiedUser]

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


class LoyaltyView(APIView):
    permission_classes = [IsVerifiedUser]

    def get(self, request):
        return Response(loyalty_summary(request.user))


class CartView(APIView):
    permission_classes = [IsVerifiedUser]

    def get(self, request):
        from chat.models import Conversation

        items = (
            CartItem.objects.filter(user=request.user)
            .select_related("product", "product__seller")
            .order_by("-created_at")
        )
        loyalty = loyalty_summary(request.user)
        discount = loyalty["discount_percent"]
        product_ids = [item.product_id for item in items]
        conv_by_product = {
            c.product_id: c
            for c in Conversation.objects.filter(
                buyer=request.user,
                product_id__in=product_ids,
            ).only("id", "product_id", "deal_status")
        }
        payload_items = []
        subtotal = 0.0
        offer_total = 0.0
        for item in items:
            product = item.product
            product_data = ProductSerializer(product, context={"request": request}).data
            price = float(product.price or 0)
            offer = apply_discount(price, discount)
            subtotal += price
            offer_total += offer
            conv = conv_by_product.get(product.id)
            payload_items.append({
                "id": item.id,
                "product": product_data,
                "price": price,
                "offer_price": offer,
                "discount_percent": discount,
                "created_at": item.created_at,
                "conversation_id": conv.id if conv else None,
                "deal_status": conv.deal_status if conv else None,
                "chat_started": bool(conv),
            })
        return Response({
            "items": payload_items,
            "count": len(payload_items),
            "subtotal": round(subtotal, 2),
            "offer_total": round(offer_total, 2),
            "savings": round(subtotal - offer_total, 2),
            "loyalty": loyalty,
        })


class CartAddView(APIView):
    permission_classes = [IsVerifiedUser]

    def post(self, request, product_id):
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({"detail": "Товар не найден"}, status=404)
        if product.seller_id == request.user.id:
            return Response({"detail": "Нельзя добавить свой товар в корзину"}, status=400)
        if product.status not in {"active", "reserved"}:
            return Response({"detail": "Товар недоступен для покупки"}, status=400)

        item, created = CartItem.objects.get_or_create(user=request.user, product=product)
        count = CartItem.objects.filter(user=request.user).count()
        return Response({
            "in_cart": True,
            "created": created,
            "cart_count": count,
            "item_id": item.id,
        }, status=201 if created else 200)


class CartRemoveView(APIView):
    permission_classes = [IsVerifiedUser]

    def delete(self, request, product_id):
        deleted, _ = CartItem.objects.filter(user=request.user, product_id=product_id).delete()
        count = CartItem.objects.filter(user=request.user).count()
        return Response({"in_cart": False, "removed": bool(deleted), "cart_count": count})


class CartClearView(APIView):
    permission_classes = [IsVerifiedUser]

    def delete(self, request):
        deleted, _ = CartItem.objects.filter(user=request.user).delete()
        return Response({"cleared": deleted, "cart_count": 0})


class CartCheckoutView(APIView):
    """
    Open/reuse chats with each seller and send a loyalty price offer message.
    Does not charge money — P2P campus deals stay in chat.
    """
    permission_classes = [IsVerifiedUser]

    def post(self, request):
        from chat.models import Conversation, Message
        from chat.serializers import ConversationSerializer

        items = (
            CartItem.objects.filter(user=request.user)
            .select_related("product", "product__seller")
        )
        if not items.exists():
            return Response({"detail": "Корзина пуста"}, status=400)

        loyalty = loyalty_summary(request.user)
        discount = loyalty["discount_percent"]
        conversations = []
        skipped = []
        contacted_product_ids = []

        for item in items:
            product = item.product
            if product.seller_id == request.user.id:
                skipped.append({"product_id": product.id, "reason": "own_product"})
                continue
            if product.status == "sold":
                skipped.append({"product_id": product.id, "reason": "sold"})
                continue

            conv, created = Conversation.objects.get_or_create(
                product=product,
                buyer=request.user,
                seller=product.seller,
            )
            # Keep cart items until the deal is completed (sold).
            # Only send the auto-offer once per new conversation.
            if created or not conv.messages.exists():
                offer = apply_discount(product.price, discount)
                if discount > 0:
                    text = (
                        f"Здравствуйте! Хочу купить «{product.title}».\n"
                        f"У меня бонус-скидка покупателя {discount}% "
                        f"({loyalty['purchases_count']} завершённых покупок).\n"
                        f"Предлагаю {offer:,.0f} ₸ вместо {float(product.price):,.0f} ₸. "
                        f"Можем встретиться на кампусе?"
                    ).replace(",", " ")
                else:
                    text = (
                        f"Здравствуйте! Хочу купить «{product.title}» за {float(product.price):,.0f} ₸.\n"
                        f"Пока бонус-скидка 0% — после покупок вырастет до 50%. "
                        f"Когда удобно встретиться?"
                    ).replace(",", " ")

                Message.objects.create(
                    conversation=conv, sender=request.user, text=text, is_read=False
                )
            conversations.append(ConversationSerializer(conv, context={"request": request}).data)
            contacted_product_ids.append(product.id)

        return Response({
            "ok": True,
            "loyalty": loyalty,
            "conversations": conversations,
            "started": len(conversations),
            "skipped": skipped,
            "cart_count": CartItem.objects.filter(user=request.user).count(),
            "kept_in_cart": True,
        })
