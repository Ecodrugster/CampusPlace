from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'full_name', 'university', 'dormitory', 'is_verified', 'is_staff')
    list_filter = ('is_verified', 'is_staff', 'university')
    search_fields = ('email', 'full_name', 'phone', 'telegram')
    ordering = ('-created_at',)

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Персональные данные', {'fields': ('full_name', 'university', 'faculty', 'dormitory', 'phone', 'telegram', 'avatar_url')}),
        ('Статус студента', {'fields': ('is_verified', 'firebase_uid')}),
        ('Права доступа', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )
