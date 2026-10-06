from rest_framework import serializers
from .models import Report


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ["id", "product", "reason", "comment", "status", "created_at"]
        read_only_fields = ["status", "created_at"]

    def validate(self, data):
        request = self.context.get("request")
        product = data.get("product")
        if request and product and product.seller_id == request.user.id:
            raise serializers.ValidationError("Нельзя жаловаться на своё объявление")
        if request and product and Report.objects.filter(
            product=product,
            reporter=request.user,
            status="pending",
        ).exists():
            raise serializers.ValidationError("Вы уже отправили жалобу на это объявление")
        return data


class ReportModerationSerializer(serializers.ModelSerializer):
    product = serializers.SerializerMethodField()
    reporter = serializers.SerializerMethodField()
    seller = serializers.SerializerMethodField()
    reason_display = serializers.CharField(source="get_reason_display", read_only=True)

    class Meta:
        model = Report
        fields = [
            "id",
            "reason",
            "reason_display",
            "comment",
            "status",
            "created_at",
            "product",
            "reporter",
            "seller",
        ]

    def get_product(self, obj):
        return {
            "id": obj.product_id,
            "title": obj.product.title,
            "status": obj.product.status,
        }

    def get_reporter(self, obj):
        return {
            "id": obj.reporter_id,
            "full_name": obj.reporter.full_name,
            "email": obj.reporter.email,
        }

    def get_seller(self, obj):
        seller = obj.product.seller
        return {
            "id": seller.id,
            "full_name": seller.full_name,
            "email": seller.email,
            "is_banned": seller.is_banned,
        }
