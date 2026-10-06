from django.contrib import admin
from .models import Report


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ["id", "product", "reporter", "reason", "status", "created_at"]
    list_filter = ["status", "reason"]
    actions = ["mark_resolved", "mark_dismissed", "ban_reported_user"]

    def mark_resolved(self, request, queryset):
        queryset.update(status="resolved")
    mark_resolved.short_description = "Отметить как решённые"

    def mark_dismissed(self, request, queryset):
        queryset.update(status="dismissed")
    mark_dismissed.short_description = "Отклонить жалобы"

    def ban_reported_user(self, request, queryset):
        for report in queryset:
            report.product.seller.is_banned = True
            report.product.seller.save()
            report.status = "resolved"
            report.save()
    ban_reported_user.short_description = "Заблокировать продавца по жалобе"