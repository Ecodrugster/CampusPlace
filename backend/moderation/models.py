from django.db import models
from accounts.models import User
from marketplace.models import Product


class Report(models.Model):
    REASON_CHOICES = [
        ("spam", "Спам"),
        ("scam", "Мошенничество"),
        ("inappropriate", "Неприемлемый контент"),
        ("other", "Другое"),
    ]
    STATUS_CHOICES = [
        ("pending", "На рассмотрении"),
        ("resolved", "Решено"),
        ("dismissed", "Отклонено"),
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="reports")
    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reports_made")
    reason = models.CharField(max_length=20, choices=REASON_CHOICES)
    comment = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "reports"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Report #{self.id} on {self.product} ({self.reason})"