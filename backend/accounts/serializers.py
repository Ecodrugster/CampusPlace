from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken    
from .models import User


class UserOutSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", "email", "full_name", "university", "faculty",
            "dormitory", "phone", "telegram", "avatar_url",
            "is_verified", "created_at",
        ]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = [
            "email", "password", "full_name", "university",
            "faculty", "dormitory", "phone", "telegram",
        ]

    def create(self, validated_data):
        password = validated_data.pop("password")
        is_student_email = validated_data["email"].endswith((".edu", ".edu.kz", ".kz"))
        user = User(
            **validated_data,
            avatar_url=f"https://api.dicebear.com/7.x/bottts/svg?seed={validated_data['email']}",
            is_verified=is_student_email,
        )
        user.set_password(password)
        user.save()
        return user


def build_token_response(user):
    refresh = RefreshToken.for_user(user)
    return {
        "access_token": str(refresh.access_token),
        "refresh_token": str(refresh),
        "token_type": "bearer",
        "user": UserOutSerializer(user).data,
    }


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)