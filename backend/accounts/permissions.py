from rest_framework.permissions import BasePermission


class IsVerifiedUser(BasePermission):
    message = "Подтвердите email перед выполнением этого действия."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_verified and not user.is_banned)
