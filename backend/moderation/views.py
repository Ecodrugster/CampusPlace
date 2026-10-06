from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Report
from .serializers import ReportSerializer, ReportModerationSerializer
from .permissions import IsStaffUser


class ReportCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ReportSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save(reporter=request.user)
        return Response({"detail": "Жалоба отправлена"}, status=status.HTTP_201_CREATED)


class ModerationReportListView(APIView):
    permission_classes = [IsStaffUser]

    def get(self, request):
        qs = Report.objects.select_related(
            "product",
            "product__seller",
            "reporter",
        ).order_by("-created_at")

        status_filter = request.query_params.get("status")
        if status_filter and status_filter != "all":
            qs = qs.filter(status=status_filter)

        return Response({
            "items": ReportModerationSerializer(qs, many=True).data,
            "total": qs.count(),
        })


class ModerationReportActionView(APIView):
    permission_classes = [IsStaffUser]

    def post(self, request, report_id):
        try:
            report = Report.objects.select_related("product", "product__seller").get(pk=report_id)
        except Report.DoesNotExist:
            return Response({"detail": "Жалоба не найдена"}, status=status.HTTP_404_NOT_FOUND)

        action = (request.data.get("action") or "").strip()
        if action not in {"resolve", "dismiss", "ban_seller", "hide_product"}:
            return Response(
                {"detail": "Неизвестное действие. Допустимо: resolve, dismiss, ban_seller, hide_product"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        product = report.product
        seller = product.seller

        if action == "resolve":
            report.status = "resolved"
        elif action == "dismiss":
            report.status = "dismissed"
        elif action == "ban_seller":
            seller.is_banned = True
            seller.save(update_fields=["is_banned"])
            report.status = "resolved"
        elif action == "hide_product":
            product.status = "hidden"
            product.save(update_fields=["status"])
            report.status = "resolved"

        report.save(update_fields=["status"])
        return Response(ReportModerationSerializer(report).data)
