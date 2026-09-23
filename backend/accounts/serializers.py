from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'university', 'faculty',
            'dormitory', 'phone', 'telegram', 'avatar_url',
            'is_verified', 'created_at'
        ]
        read_only_fields = ['id', 'is_verified', 'created_at']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = [
            'email', 'password', 'full_name', 'university',
            'faculty', 'dormitory', 'phone', 'telegram'
        ]

    def create(self, validated_data):
        email = validated_data['email']
        is_student_email = any(email.endswith(dom) for dom in ['.edu', '.edu.kz', '.kz'])
        user = User(
            username=email,
            email=email,
            full_name=validated_data.get('full_name', ''),
            university=validated_data.get('university', 'Казахский Национальный Университет'),
            faculty=validated_data.get('faculty', ''),
            dormitory=validated_data.get('dormitory', ''),
            phone=validated_data.get('phone', ''),
            telegram=validated_data.get('telegram', ''),
            avatar_url=f"https://api.dicebear.com/7.x/bottts/svg?seed={email}",
            is_verified=is_student_email
        )
        user.set_password(validated_data['password'])
        user.save()
        return user
