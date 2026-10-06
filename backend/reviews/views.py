from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Avg
from .models import Review
from .serializers import ReviewSerializer
from accounts.models import User


class ReviewCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ReviewSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        review = serializer.save(reviewer=request.user)
        return Response(ReviewSerializer(review, context={"request": request}).data, status=status.HTTP_201_CREATED)


class SellerReviewsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, seller_id):
        reviews = Review.objects.filter(seller_id=seller_id).select_related("reviewer", "product").order_by("-created_at")
        avg_rating = reviews.aggregate(avg=Avg("rating"))["avg"] or 0
        return Response({
            "average_rating": round(avg_rating, 1),
            "total_reviews": reviews.count(),
            "reviews": ReviewSerializer(reviews, many=True).data,
        })

