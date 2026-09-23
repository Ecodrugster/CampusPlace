from django.db import models
from django.conf import settings

class Product(models.Model):
    STATUS_CHOICES = (
        ('active', 'Активно'),
        ('reserved', 'Забронировано'),
        ('sold', 'Продано'),
    )

    CATEGORY_CHOICES = (
        ('Учебники', 'Учебники'),
        ('Электроника', 'Электроника'),
        ('Для комнаты', 'Для комнаты'),
        ('Одежда', 'Одежда'),
        ('Спорт и хобби', 'Спорт и хобби'),
    )

    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='products')
    title = models.CharField(max_length=255, db_index=True)
    description = models.TextField()
    price = models.DecimalField(max_digits=12, decimal_places=2)
    category = models.CharField(max_length=100, choices=CATEGORY_CHOICES, db_index=True)
    condition = models.CharField(max_length=50, default="Отличное")
    location = models.CharField(max_length=255, default="Главный кампус")
    images = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='active')
    views_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.price} ₸"


class Favorite(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorites')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')

    def __str__(self):
        return f"{self.user.email} -> {self.product.title}"
