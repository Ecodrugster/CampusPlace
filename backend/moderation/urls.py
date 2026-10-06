from django.urls import path
from .views import ReportCreateView, ModerationReportListView, ModerationReportActionView

urlpatterns = [
    path("reports", ReportCreateView.as_view()),
    path("reports/", ReportCreateView.as_view()),
    path("moderation/reports", ModerationReportListView.as_view()),
    path("moderation/reports/", ModerationReportListView.as_view()),
    path("moderation/reports/<int:report_id>/resolve", ModerationReportActionView.as_view()),
    path("moderation/reports/<int:report_id>/resolve/", ModerationReportActionView.as_view()),
]
