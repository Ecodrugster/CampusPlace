import json
from rest_framework import serializers
from .models import Product, Favorite
from accounts.serializers import UserOutSerializer


class ProductSerializer(serializers.ModelSerializer):
    seller = UserOutSerializer(read_only=True)
    images = serializers.SerializerMethodField()
    is_favorite = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id", "title", "description", "price", "category",
            "condition", "location", "images", "status",
            "views_count", "created_at", "seller", "is_favorite",
        ]

    def get_images(self, obj):
        try:
            return json.loads(obj.images or "[]")
        except (ValueError, TypeError):
            return []

    def get_is_favorite(self, obj):
        request = self.context.get("request")
        if not request or not request.user or not request.user.is_authenticated:
            return False
        return Favorite.objects.filter(user=request.user, product=obj).exists()


class ProductCreateSerializer(serializers.ModelSerializer):
    images = serializers.ListField(child=serializers.CharField(), required=False)

    class Meta:
        model = Product
        fields = [
            "title", "description", "price", "category",
            "condition", "location", "images", "status",
        ]

    def validate_images(self, value):
        return json.dumps(value or [])

    def create(self, validated_data):
        request = self.context["request"]
        return Product.objects.create(seller=request.user, **validated_data)