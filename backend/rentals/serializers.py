import logging
import re

from rest_framework import serializers
from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.utils import timezone
from .models import Category, Car, CarImage, PaymentMethod, Booking, ContactMessage, Review

logger = logging.getLogger(__name__)


def notify_admin_by_email(subject, message):
    """Emails ADMIN_NOTIFICATION_EMAIL. Never raises — a broken/unconfigured
    email backend should not block bookings or contact messages from saving.
    """
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.ADMIN_NOTIFICATION_EMAIL],
            fail_silently=False,
        )
    except Exception:
        logger.exception("Failed to send notification email: %s", subject)


class CategorySerializer(serializers.ModelSerializer):
    car_count = serializers.IntegerField(source="cars.count", read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "icon", "description", "car_count"]


class CarImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarImage
        fields = ["id", "image", "caption", "is_primary", "order"]


class CarListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for grid/listing views."""
    category = CategorySerializer(read_only=True)
    primary_image = serializers.SerializerMethodField()
    is_currently_available = serializers.SerializerMethodField()
    feature_list = serializers.ReadOnlyField()

    class Meta:
        model = Car
        fields = [
            "id", "name", "brand", "model", "model_year", "category",
            "rental_price_per_day", "condition", "seating_capacity",
            "transmission", "fuel_type", "air_conditioning", "features",
            "feature_list", "location", "primary_image",
            "is_currently_available",
        ]

    def get_primary_image(self, obj):
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        if img and img.image:
            request = self.context.get("request")
            url = img.image.url
            return request.build_absolute_uri(url) if request else url
        return None

    def get_is_currently_available(self, obj):
        return obj.is_currently_available


class CarDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    images = CarImageSerializer(many=True, read_only=True)
    feature_list = serializers.ReadOnlyField()
    is_currently_available = serializers.SerializerMethodField()

    class Meta:
        model = Car
        fields = [
            "id", "name", "brand", "model", "model_year", "category",
            "rental_price_per_day", "description", "condition",
            "condition_description", "seating_capacity", "transmission",
            "fuel_type", "air_conditioning", "features", "feature_list",
            "location", "images", "is_currently_available",
        ]

    def get_is_currently_available(self, obj):
        return obj.is_currently_available


class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = ["id", "name", "slug", "instructions", "account_holder", "account_number"]


class BookingSerializer(serializers.ModelSerializer):
    car_name = serializers.CharField(source="car.name", read_only=True)
    payment_method_name = serializers.CharField(source="payment_method.name", read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id", "car", "car_name", "customer_name", "customer_phone",
            "customer_email", "notes", "pickup_datetime", "return_datetime",
            "payment_method", "payment_method_name", "transaction_reference",
            "total_price", "status", "created_at",
        ]
        read_only_fields = ["total_price", "status", "created_at"]

    def validate(self, attrs):
        pickup = attrs.get("pickup_datetime")
        ret = attrs.get("return_datetime")
        car = attrs.get("car")

        if pickup and pickup < timezone.now():
            raise serializers.ValidationError({"pickup_datetime": "Pickup date/time cannot be in the past."})
        if pickup and ret and ret <= pickup:
            raise serializers.ValidationError({"return_datetime": "Return date/time must be after pickup date/time."})
        if car and pickup and ret and not car.is_available_between(pickup, ret):
            raise serializers.ValidationError(
                {"car": "This car is already booked for part of the selected period. Please choose different dates."}
            )
        payment_method = attrs.get("payment_method")
        if payment_method and not payment_method.is_enabled:
            raise serializers.ValidationError({"payment_method": "This payment method is currently unavailable."})
        return attrs

    def create(self, validated_data):
        booking = Booking(**validated_data)
        booking.save()  # total_price computed in model.save()
        self._notify_admin_by_email(booking)
        return booking

    @staticmethod
    def _notify_admin_by_email(booking):
        """Emails the full booking details to ADMIN_NOTIFICATION_EMAIL."""
        subject = f"New Booking #{booking.id} — {booking.car.name}"
        message = (
            "A new booking has been made on Shaheer Car Rental System.\n\n"
            f"Car: {booking.car.name} ({booking.car.brand} {booking.car.model}, {booking.car.model_year})\n"
            f"Category: {booking.car.category.name}\n\n"
            f"Customer name: {booking.customer_name}\n"
            f"Customer phone: {booking.customer_phone}\n"
            f"Customer email: {booking.customer_email}\n\n"
            f"Pickup: {booking.pickup_datetime.strftime('%d %b %Y, %I:%M %p')}\n"
            f"Return: {booking.return_datetime.strftime('%d %b %Y, %I:%M %p')}\n"
            f"Payment method: {booking.payment_method.name if booking.payment_method else 'Not specified'}\n"
            f"Transaction reference: {booking.transaction_reference or '-'}\n"
            f"Total price: Rs. {booking.total_price}\n"
            f"Status: {booking.get_status_display()}\n\n"
            f"Notes: {booking.notes or '-'}\n\n"
            f"Booking ID: {booking.id} (view/manage it in /admin/rentals/booking/{booking.id}/change/)"
        )
        notify_admin_by_email(subject, message)


class AvailabilityCheckSerializer(serializers.Serializer):
    car = serializers.PrimaryKeyRelatedField(queryset=Car.objects.all())
    pickup_datetime = serializers.DateTimeField()
    return_datetime = serializers.DateTimeField()

    def validate(self, attrs):
        if attrs["return_datetime"] <= attrs["pickup_datetime"]:
            raise serializers.ValidationError("Return date/time must be after pickup date/time.")
        return attrs


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ["id", "name", "email", "message", "created_at"]
        read_only_fields = ["created_at"]

    def create(self, validated_data):
        contact = ContactMessage.objects.create(**validated_data)
        subject = f"New website message from {contact.name}"
        message = (
            "You have a new message from the Shaheer Car Rental System contact form.\n\n"
            f"Name: {contact.name}\n"
            f"Email: {contact.email}\n\n"
            f"Message:\n{contact.message}\n"
        )
        notify_admin_by_email(subject, message)
        return contact


class ReviewSerializer(serializers.ModelSerializer):
    """Public review: anyone can submit (POST) and everyone can read (GET)."""

    class Meta:
        model = Review
        fields = ["id", "name", "location", "rating", "text", "created_at"]
        read_only_fields = ["created_at"]

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value


class RegisterSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(write_only=True, max_length=150)
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ["full_name", "email", "password"]

    def validate_email(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def create(self, validated_data):
        full_name = validated_data.pop("full_name").strip()
        password = validated_data.pop("password")
        first_name, _, last_name = full_name.partition(" ")

        user = User(
            username=validated_data["email"],
            email=validated_data["email"],
            first_name=first_name,
            last_name=last_name,
        )
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    # "email" may hold either an email address or a username (e.g. "admin").
    email = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        identifier = attrs["email"].strip()
        user = authenticate(username=identifier, password=attrs["password"])
        if not user:
            match = User.objects.filter(email__iexact=identifier).first()
            if match:
                user = authenticate(username=match.username, password=attrs["password"])
        if not user:
            raise serializers.ValidationError("Invalid username/email or password.")
        if not user.is_active:
            raise serializers.ValidationError("This account has been disabled.")
        attrs["user"] = user
        return attrs


# ---------------------------------------------------------------------------
# Admin-panel serializers (used only by the staff-only /api/admin/ endpoints)
# ---------------------------------------------------------------------------
from django.utils.text import slugify  # noqa: E402


class AdminCarSerializer(serializers.ModelSerializer):
    images = CarImageSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Car
        fields = [
            "id", "name", "brand", "model", "model_year", "category", "category_name",
            "rental_price_per_day", "description", "condition", "condition_description",
            "seating_capacity", "transmission", "fuel_type", "air_conditioning",
            "features", "location", "is_active", "images",
        ]


class AdminCarImageSerializer(serializers.ModelSerializer):
    """Used by the admin's own image upload/delete endpoints (separate from the
    read-only `images` list nested inside AdminCarSerializer above)."""

    class Meta:
        model = CarImage
        fields = ["id", "car", "image", "caption", "is_primary", "order"]
        read_only_fields = ["is_primary", "order"]


_ADMIN_BOOKING_FIELDS = [
    "id", "car", "car_name", "customer_name", "customer_phone", "customer_email", "notes",
    "pickup_datetime", "return_datetime", "payment_method", "payment_method_name",
    "transaction_reference", "total_price", "status", "created_at",
]


class AdminBookingSerializer(serializers.ModelSerializer):
    car_name = serializers.CharField(source="car.name", read_only=True)
    payment_method_name = serializers.CharField(source="payment_method.name", read_only=True)

    class Meta:
        model = Booking
        fields = _ADMIN_BOOKING_FIELDS
        # The admin can only change the status; everything else is read-only.
        read_only_fields = [f for f in _ADMIN_BOOKING_FIELDS if f != "status"]


class _SlugFromNameMixin:
    """Lets the admin skip the slug field: it is built from the name."""
    slug_model = None

    def validate(self, attrs):
        name = attrs.get("name") or (self.instance.name if self.instance else "")
        slug = attrs.get("slug") or (slugify(attrs["name"]) if "name" in attrs else "")
        if slug:
            clash = self.slug_model.objects.filter(slug=slug)
            if self.instance:
                clash = clash.exclude(pk=self.instance.pk)
            if clash.exists():
                raise serializers.ValidationError({"name": f'"{name}" already exists.'})
            attrs["slug"] = slug
        return attrs


class AdminCategorySerializer(_SlugFromNameMixin, serializers.ModelSerializer):
    slug_model = Category
    car_count = serializers.IntegerField(source="cars.count", read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "icon", "description", "car_count"]
        extra_kwargs = {"slug": {"required": False, "validators": []},
                        "name": {"validators": []}}


class AdminPaymentMethodSerializer(_SlugFromNameMixin, serializers.ModelSerializer):
    slug_model = PaymentMethod

    class Meta:
        model = PaymentMethod
        fields = ["id", "name", "slug", "instructions", "account_holder",
                  "account_number", "is_enabled", "order"]
        extra_kwargs = {"slug": {"required": False, "validators": []},
                        "name": {"validators": []}}

    def validate_account_number(self, value):
        value = (value or "").strip()
        if value and not re.fullmatch(r"[0-9+\-() ]{5,25}", value):
            raise serializers.ValidationError(
                "Account number must be 5–25 characters: digits with optional spaces, +, -, or brackets."
            )
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)
        # A number without a holder name would leave the customer guessing who
        # owns the account, so require both together (also on partial updates).
        number = attrs.get("account_number")
        if number is None:
            number = self.instance.account_number if self.instance else ""
        holder = attrs.get("account_holder")
        if holder is None:
            holder = self.instance.account_holder if self.instance else ""
        if number and not holder.strip():
            raise serializers.ValidationError(
                {"account_holder": "Account holder name is required when an account number is set."}
            )
        return attrs


class AdminMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ["id", "name", "email", "message", "created_at", "is_read"]
        read_only_fields = ["name", "email", "message", "created_at"]


class AdminReviewSerializer(serializers.ModelSerializer):
    """Admin view of reviews — read-only; the admin can only delete them."""

    class Meta:
        model = Review
        fields = ["id", "name", "location", "rating", "text", "created_at"]
        read_only_fields = ["id", "name", "location", "rating", "text", "created_at"]


class AdminCustomerSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    booking_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "full_name", "date_joined", "booking_count"]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.email

    def get_booking_count(self, obj):
        return Booking.objects.filter(customer_email__iexact=obj.email).count()


class AdminAccountSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6, required=False)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "is_superuser", "date_joined"]
        read_only_fields = ["is_superuser", "date_joined"]

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        if not password:
            raise serializers.ValidationError({"password": "A password is required."})
        user = User(is_staff=True, **validated_data)
        user.set_password(password)
        user.save()
        return user
