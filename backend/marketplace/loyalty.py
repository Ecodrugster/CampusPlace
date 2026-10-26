"""Buyer loyalty: more completed purchases → higher suggested discount, capped at 50%."""

from chat.models import Conversation

DISCOUNT_PER_PURCHASE = 5
MAX_DISCOUNT_PERCENT = 50


def get_completed_purchases_count(user) -> int:
    if not user or not getattr(user, "is_authenticated", False):
        return 0
    return (
        Conversation.objects.filter(buyer=user, deal_status="sold")
        .values("product_id")
        .distinct()
        .count()
    )


def get_loyalty_discount_percent(user) -> int:
    purchases = get_completed_purchases_count(user)
    return min(MAX_DISCOUNT_PERCENT, purchases * DISCOUNT_PER_PURCHASE)


def loyalty_summary(user) -> dict:
    purchases = get_completed_purchases_count(user)
    discount = min(MAX_DISCOUNT_PERCENT, purchases * DISCOUNT_PER_PURCHASE)
    next_discount = min(MAX_DISCOUNT_PERCENT, (purchases + 1) * DISCOUNT_PER_PURCHASE)
    return {
        "purchases_count": purchases,
        "discount_percent": discount,
        "discount_per_purchase": DISCOUNT_PER_PURCHASE,
        "max_discount_percent": MAX_DISCOUNT_PERCENT,
        "next_discount_percent": next_discount,
    }


def apply_discount(price: float, discount_percent: int) -> float:
    price = float(price or 0)
    discounted = price * (100 - discount_percent) / 100.0
    return round(discounted, 2)
