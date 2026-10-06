from rest_framework import serializers
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source="reviewer.full_name", read_only=True)
    reviewer_avatar = serializers.CharField(source="reviewer.avatar_url", read_only=True)
    product_title = serializers.CharField(source="product.title", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id", "product", "product_title", "seller", "reviewer",
            "reviewer_name", "reviewer_avatar",
            "rating", "comment", "created_at",
        ]
        read_only_fields = ["reviewer", "seller", "created_at"]

    def validate(self, data):
        product = data.get("product")
        request = self.context.get("request")
        if request and product and product.seller_id == request.user.id:
            raise serializers.ValidationError("Нельзя оставить отзыв самому себе")
        if request and product and Review.objects.filter(product=product, reviewer=request.user).exists():
            raise serializers.ValidationError("Вы уже оставили отзыв к этому товару")
        return data

    def create(self, validated_data):
        product = validated_data["product"]
        validated_data["seller"] = product.seller
        return super().create(validated_data)