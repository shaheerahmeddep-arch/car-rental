from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import mixins
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from .models import Category, Car, PaymentMethod, Booking, Review
from .serializers import (
    CategorySerializer, CarListSerializer, CarDetailSerializer,
    PaymentMethodSerializer, BookingSerializer, AvailabilityCheckSerializer,
    ContactMessageSerializer, RegisterSerializer, LoginSerializer, ReviewSerializer,
)


def _auth_response(user):
    token, _ = Token.objects.get_or_create(user=user)
    full_name = f"{user.first_name} {user.last_name}".strip() or user.email
    return {"token": token.key, "email": user.email, "full_name": full_name,
            "username": user.username, "is_staff": user.is_staff}


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(_auth_response(user), status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        return Response(_auth_response(user))


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        full_name = f"{user.first_name} {user.last_name}".strip() or user.email
        return Response({"email": user.email, "full_name": full_name})


class ContactMessageView(APIView):
    """Public endpoint for the site's Contact form. Saves the message and
    emails it to ADMIN_NOTIFICATION_EMAIL."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ContactMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class CarViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public, read-only car listing/detail API.
    Filter examples:
      /api/cars/?category=suv
      /api/cars/?min_price=3000&max_price=10000
      /api/cars/?search=civic
      /api/cars/?ordering=rental_price_per_day
    """
    queryset = Car.objects.filter(is_active=True).select_related("category").prefetch_related("images")
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        "category__slug": ["exact"],
        "brand": ["exact", "icontains"],
        "condition": ["exact"],
        "transmission": ["exact"],
        "fuel_type": ["exact"],
        "rental_price_per_day": ["gte", "lte"],
    }
    search_fields = ["name", "brand", "model", "description", "location"]
    ordering_fields = ["rental_price_per_day", "model_year", "created_at"]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return CarDetailSerializer
        return CarListSerializer

    @action(detail=False, methods=["post"], url_path="check-availability")
    def check_availability(self, request):
        serializer = AvailabilityCheckSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        car = serializer.validated_data["car"]
        pickup = serializer.validated_data["pickup_datetime"]
        ret = serializer.validated_data["return_datetime"]

        available = car.is_available_between(pickup, ret)
        days = max(1, -(-(ret - pickup).total_seconds() // 86400))
        estimated_total = round(float(car.rental_price_per_day) * days, 2)

        return Response({
            "available": available,
            "estimated_days": int(days),
            "estimated_total": estimated_total,
        })


class PaymentMethodViewSet(viewsets.ReadOnlyModelViewSet):
    """Only enabled payment methods are exposed to the storefront."""
    queryset = PaymentMethod.objects.filter(is_enabled=True)
    serializer_class = PaymentMethodSerializer


class BookingViewSet(viewsets.ModelViewSet):
    """
    Customers create bookings here (status starts as 'pending').
    Listing is left open for simplicity; in production, scope this to the
    authenticated customer or require a lookup token/email+id combo.
    """
    queryset = Booking.objects.select_related("car", "payment_method").all()
    serializer_class = BookingSerializer
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        qs = super().get_queryset()
        email = self.request.query_params.get("email")
        if email:
            qs = qs.filter(customer_email__iexact=email)
        return qs


class ReviewViewSet(mixins.ListModelMixin, mixins.CreateModelMixin,
                    viewsets.GenericViewSet):
    """Public reviews: anyone can read the list and submit a new review.
    Only the admin dashboard can delete them (see AdminReviewViewSet)."""
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [AllowAny]
