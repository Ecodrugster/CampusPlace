from django.contrib import admin
from .models import Product, Favorite

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('title', 'price', 'category', 'seller', 'status', 'views_count', 'created_at')
    list_filter = ('category', 'status', 'condition', 'created_at')
    search_fields = ('title', 'description', 'location', 'seller__email', 'seller__full_name')
    ordering = ('-created_at',)

@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'created_at')
    search_fields = ('user__email', 'product__title')
