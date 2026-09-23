from rest_framework import serializers
from .models import Product, Favorite
from accounts.serializers import UserSerializer

class ProductSerializer(serializers.ModelSerializer):
    seller = UserSerializer(read_only=True)
    is_favorite = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'title', 'description', 'price', 'category',
            'condition', 'location', 'images', 'status',
            'views_count', 'created_at', 'updated_at',
            'seller', 'is_favorite'
        ]
        read_only_fields = ['id', 'views_count', 'created_at', 'updated_at', 'seller']

    def get_is_favorite(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return obj.favorited_by.filter(user=request.user).exists()
        return False


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            'title', 'description', 'price', 'category',
            'condition', 'location', 'images', 'status'
        ]
