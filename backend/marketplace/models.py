from django.db import models
from accounts.models import User


class Product(models.Model):
    STATUS_CHOICES = [
        ("active", "active"),
        ("sold", "sold"),
        ("reserved", "reserved"),
    ]

    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255, db_index=True)
    description = models.TextField()
    price = models.FloatField()
    category = models.CharField(max_length=100, db_index=True)
    condition = models.CharField(max_length=50, default="Отличное")
    location = models.CharField(max_length=255, default="Главный кампус")
    images = models.TextField(default="[]")  # JSON-строка со списком URL
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="active")
    views_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name="products", db_column="seller_id")

    class Meta:
        db_table = "products"


class Favorite(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="favorites", db_column="user_id")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="favorites", db_column="product_id")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "favorites"
        unique_together = ("user", "product")