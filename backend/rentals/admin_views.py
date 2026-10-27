"""
Staff-only API used by the React admin dashboard (/admin in the frontend).
Every endpoint here requires a token belonging to a user with is_staff=True.
"""
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import ProtectedError, Sum
from rest_framework import mixins, status, viewsets
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Booking, Car, CarImage, Category, ContactMessage, PaymentMethod, Review
from .serializers import (
    AdminAccountSerializer, AdminBookingSerializer, AdminCarImageSerializer,
    AdminCarSerializer, AdminCategorySerializer, AdminCustomerSerializer,
    AdminMessageSerializer, AdminPaymentMethodSerializer, AdminReviewSerializer,
)


class AdminBase:
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAdminUser]
    pagination_class = None


class AdminLoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        username = str(request.data.get("username", "")).strip()
        password = str(request.data.get("password", ""))
        user = authenticate(username=username, password=password)
        if not user or not user.is_staff:
            return Response({"detail": "Wrong admin username or password."},
                            status=status.HTTP_400_BAD_REQUEST)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "username": user.username})


class AdminStatsView(AdminBase, APIView):
    def get(self, request):
        revenue = Booking.objects.filter(
            status__in=[Booking.Status.CONFIRMED, Booking.Status.COMPLETED]
        ).aggregate(total=Sum("total_price"))["total"] or 0
        recent = Booking.objects.select_related("car", "payment_method")[:6]
        return Response({
            "cars": Car.objects.count(),
            "pending": Booking.objects.filter(status=Booking.Status.PENDING).count(),
            "confirmed": Booking.objects.filter(status=Booking.Status.CONFIRMED).count(),
            "customers": User.objects.filter(is_staff=False).count(),
            "unread_messages": ContactMessage.objects.filter(is_read=False).count(),
            "revenue": revenue,
            "recent_bookings": AdminBookingSerializer(recent, many=True).data,
        })


class AdminCarViewSet(AdminBase, viewsets.ModelViewSet):
    queryset = Car.objects.select_related("category").prefetch_related("images")
    serializer_class = AdminCarSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]


class AdminCarImageViewSet(AdminBase, viewsets.ModelViewSet):
    """
    Full CRUD for a single car's photos.
      POST   /api/admin/car-images/            multipart: car=<id>, image=<file>
      GET    /api/admin/car-images/?car=<id>   list a car's photos
      DELETE /api/admin/car-images/<id>/        delete one photo
      POST   /api/admin/car-images/<id>/make-primary/   set as the cover photo
    """
    queryset = CarImage.objects.all()
    serializer_class = AdminCarImageSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filterset_fields = ["car"]

    def perform_create(self, serializer):
        car = serializer.validated_data["car"]
        serializer.save(is_primary=not car.images.exists(), order=car.images.count())

    def perform_destroy(self, instance):
        was_primary = instance.is_primary
        car = instance.car
        instance.image.delete(save=False)  # remove the file from disk too
        instance.delete()
        if was_primary:
            next_image = car.images.first()
            if next_image:
                next_image.is_primary = True
                next_image.save()

    @action(detail=True, methods=["post"], url_path="make-primary")
    def make_primary(self, request, pk=None):
        image = self.get_object()
        image.is_primary = True
        image.save()  # CarImage.save() automatically un-marks the other images
        return Response(self.get_serializer(image).data)


class AdminCategoryViewSet(AdminBase, viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = AdminCategorySerializer

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response({"detail": "Move or delete the cars in this category first."},
                            status=status.HTTP_400_BAD_REQUEST)


class AdminPaymentMethodViewSet(AdminBase, viewsets.ModelViewSet):
    queryset = PaymentMethod.objects.all()
    serializer_class = AdminPaymentMethodSerializer


class AdminBookingViewSet(AdminBase, viewsets.ModelViewSet):
    queryset = Booking.objects.select_related("car", "payment_method")
    serializer_class = AdminBookingSerializer
    http_method_names = ["get", "patch", "delete", "head", "options"]
    filterset_fields = ["status"]


class AdminCustomerViewSet(AdminBase, mixins.ListModelMixin, mixins.DestroyModelMixin,
                           viewsets.GenericViewSet):
    queryset = User.objects.filter(is_staff=False).order_by("-date_joined")
    serializer_class = AdminCustomerSerializer


class AdminMessageViewSet(AdminBase, viewsets.ModelViewSet):
    queryset = ContactMessage.objects.all()
    serializer_class = AdminMessageSerializer
    http_method_names = ["get", "patch", "delete", "head", "options"]


class AdminReviewViewSet(AdminBase, mixins.ListModelMixin, mixins.DestroyModelMixin,
                         viewsets.GenericViewSet):
    """Admins can view and delete public reviews."""
    queryset = Review.objects.all()
    serializer_class = AdminReviewSerializer


class AdminAccountViewSet(AdminBase, mixins.ListModelMixin, mixins.CreateModelMixin,
                          mixins.DestroyModelMixin, viewsets.GenericViewSet):
    queryset = User.objects.filter(is_staff=True).order_by("id")
    serializer_class = AdminAccountSerializer

    def destroy(self, request, *args, **kwargs):
        if self.get_object().pk == request.user.pk:
            return Response({"detail": "You can't delete your own account."}, status=400)
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=["post"], url_path="change-password")
    def change_password(self, request):
        old = str(request.data.get("old", ""))
        new = str(request.data.get("new", ""))
        if not request.user.check_password(old):
            return Response({"detail": "Your current password is wrong."}, status=400)
        if len(new) < 6:
            return Response({"detail": "New password must be at least 6 characters."}, status=400)
        request.user.set_password(new)
        request.user.save()
        return Response({"detail": "Password changed."})
