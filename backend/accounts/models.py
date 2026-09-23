from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    university = models.CharField(max_length=255, default="Казахский Национальный Университет")
    faculty = models.CharField(max_length=255, blank=True, default="")
    dormitory = models.CharField(max_length=255, blank=True, default="")
    phone = models.CharField(max_length=50, blank=True, default="")
    telegram = models.CharField(max_length=100, blank=True, default="")
    avatar_url = models.CharField(max_length=500, blank=True, default="")
    is_verified = models.BooleanField(default=False)
    firebase_uid = models.CharField(max_length=128, blank=True, null=True, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'full_name']

    def __str__(self):
        return f"{self.full_name} ({self.email})"
