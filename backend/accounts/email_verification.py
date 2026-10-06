import logging
import random
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from .models import EmailVerificationCode

logger = logging.getLogger(__name__)


def generate_code():
    return f"{random.randint(0, 999999):06d}"


def can_send_code(user):
    latest = (
        EmailVerificationCode.objects.filter(user=user)
        .order_by("-created_at")
        .first()
    )
    if not latest:
        return True, None
    elapsed = (timezone.now() - latest.created_at).total_seconds()
    if elapsed < 60:
        return False, int(60 - elapsed)
    return True, None


def create_verification_code(user):
    code = generate_code()
    obj = EmailVerificationCode.objects.create(
        user=user,
        code=code,
        expires_at=timezone.now() + timedelta(minutes=15),
    )
    return obj


def send_verification_email(user, code):
    subject = "Код подтверждения CampusPlace"
    message = (
        f"Здравствуйте, {user.full_name}!\n\n"
        f"Ваш код подтверждения email: {code}\n"
        f"Код действует 15 минут.\n\n"
        f"Если вы не регистрировались в CampusPlace, просто игнорируйте это письмо."
    )

    if settings.EMAIL_VERIFICATION_DEV_FALLBACK or settings.EMAIL_BACKEND.endswith("console.EmailBackend"):
        logger.warning("CampusPlace verification code for %s: %s", user.email, code)
        print(f"[CampusPlace] Verification code for {user.email}: {code}")

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )
