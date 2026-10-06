from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ["id", "email", "full_name", "is_verified", "is_banned"]
    list_filter = ["is_verified", "is_banned"]
    actions = ["ban_users", "unban_users"]

    def ban_users(self, request, queryset):
        queryset.update(is_banned=True)

    def unban_users(self, request, queryset):
        queryset.update(is_banned=False)

    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Персональные данные', {'fields': ('full_name', 'university', 'faculty', 'dormitory', 'phone', 'telegram', 'avatar_url')}),
        ('Статус студента', {'fields': ('is_verified', 'firebase_uid')}),
        ('Права доступа', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )

        
