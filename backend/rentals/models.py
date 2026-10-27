from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone


class Category(models.Model):
    """Vehicle category, e.g. Sedan, SUV, Luxury. Admin can add any category."""
    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=90, unique=True)
    icon = models.CharField(
        max_length=50, blank=True,
        help_text="Optional icon keyword/emoji shown on the category card."
    )
    description = models.CharField(max_length=255, blank=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Car(models.Model):
    CONDITION_CHOICES = [
        ("excellent", "Excellent"),
        ("very_good", "Very Good"),
        ("good", "Good"),
        ("fair", "Fair"),
    ]
    TRANSMISSION_CHOICES = [
        ("automatic", "Automatic"),
        ("manual", "Manual"),
    ]
    FUEL_CHOICES = [
        ("petrol", "Petrol"),
        ("diesel", "Diesel"),
        ("hybrid", "Hybrid"),
        ("electric", "Electric"),
        ("cng", "CNG"),
    ]

    name = models.CharField(max_length=120, help_text="Display name, e.g. 'Honda Civic 2022'")
    brand = models.CharField(max_length=60)
    model = models.CharField(max_length=60, blank=True)
    model_year = models.PositiveIntegerField()
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="cars")

    rental_price_per_day = models.DecimalField(max_digits=10, decimal_places=2)

    description = models.TextField(blank=True)

    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default="good")
    condition_description = models.TextField(
        blank=True,
        help_text="e.g. 'Exterior is in very good condition with minor signs of normal use.'"
    )

    seating_capacity = models.PositiveSmallIntegerField(default=5)
    transmission = models.CharField(max_length=20, choices=TRANSMISSION_CHOICES, default="automatic")
    fuel_type = models.CharField(max_length=20, choices=FUEL_CHOICES, default="petrol")
    air_conditioning = models.BooleanField(
        default=True,
        help_text="Uncheck only if the vehicle has no air conditioning."
    )
    features = models.TextField(
        blank=True,
        help_text="Comma-separated features, e.g. 'AC, Bluetooth, Backup Camera, Sunroof'"
    )

    location = models.CharField(max_length=120, default="Lahore, Pakistan")

    is_active = models.BooleanField(
        default=True,
        help_text="Uncheck to hide this car from the site without deleting it."
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.model_year})"

    @property
    def feature_list(self):
        return [f.strip() for f in self.features.split(",") if f.strip()]

    def is_available_between(self, start_dt, end_dt, exclude_booking_id=None):
        """True if this car has no overlapping CONFIRMED/PENDING booking in the given window."""
        qs = self.bookings.filter(
            status__in=[Booking.Status.PENDING, Booking.Status.CONFIRMED],
            pickup_datetime__lt=end_dt,
            return_datetime__gt=start_dt,
        )
        if exclude_booking_id:
            qs = qs.exclude(pk=exclude_booking_id)
        return not qs.exists()

    @property
    def is_currently_available(self):
        """Storefront availability badge.

        A car counts as "Booked" as soon as it has an active (pending or
        confirmed) reservation that has not ended yet — including upcoming
        ones — so a freshly booked car immediately shows as booked on the
        home/listing pages. It flips back to available on its own once the
        return time passes (or the booking is cancelled/completed).
        """
        if not self.is_active:
            return False
        now = timezone.now()
        return not self.bookings.filter(
            status__in=[Booking.Status.PENDING, Booking.Status.CONFIRMED],
            return_datetime__gt=now,
        ).exists()


class CarImage(models.Model):
    """Multiple images per car (aim for 4-5+). One may be marked as primary/cover."""
    car = models.ForeignKey(Car, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="cars/%Y/%m/")
    caption = models.CharField(max_length=120, blank=True)
    is_primary = models.BooleanField(default=False)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"Image for {self.car.name}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.is_primary:
            # Ensure only one primary image per car
            CarImage.objects.filter(car=self.car).exclude(pk=self.pk).update(is_primary=False)


class PaymentMethod(models.Model):
    """Admin-managed payment options (Cash on Pickup, Bank Transfer, JazzCash, EasyPaisa, ...)."""
    name = models.CharField(max_length=60, unique=True)
    slug = models.SlugField(max_length=70, unique=True)
    instructions = models.CharField(
        max_length=255, blank=True,
        help_text="Shown to the customer at checkout, e.g. account number for Bank Transfer."
    )
    account_holder = models.CharField(
        max_length=120, blank=True,
        help_text="Name shown to the customer, e.g. 'Shaheer Ahmed'."
    )
    account_number = models.CharField(
        max_length=40, blank=True,
        help_text="Account/mobile number the customer sends manual payments to."
    )
    is_enabled = models.BooleanField(default=True)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["order", "name"]

    def __str__(self):
        return self.name


class ContactMessage(models.Model):
    """A message submitted through the site's Contact section."""
    name = models.CharField(max_length=120)
    email = models.EmailField()
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Message from {self.name} <{self.email}>"


class Review(models.Model):
    """A customer review/testimonial shown publicly on the site.
    Anyone can submit one; the admin can delete it from the dashboard."""
    name = models.CharField(max_length=120)
    location = models.CharField(max_length=120, blank=True)
    rating = models.PositiveSmallIntegerField(default=5)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Review by {self.name} ({self.rating}/5)"

    def clean(self):
        if self.rating is not None and not (1 <= self.rating <= 5):
            raise ValidationError({"rating": "Rating must be between 1 and 5."})

    def save(self, *args, **kwargs):
        self.full_clean(exclude=["created_at"])
        super().save(*args, **kwargs)


class Booking(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        CANCELLED = "cancelled", "Cancelled"
        COMPLETED = "completed", "Completed"

    car = models.ForeignKey(Car, on_delete=models.CASCADE, related_name="bookings")

    customer_name = models.CharField(max_length=120)
    customer_phone = models.CharField(max_length=30)
    customer_email = models.EmailField()
    notes = models.TextField(blank=True)

    pickup_datetime = models.DateTimeField()
    return_datetime = models.DateTimeField()

    payment_method = models.ForeignKey(
        PaymentMethod, on_delete=models.SET_NULL, null=True, blank=True, related_name="bookings"
    )
    transaction_reference = models.CharField(
        max_length=120, blank=True,
        help_text="Transaction ID / reference the customer enters for manual payments."
    )

    total_price = models.DecimalField(max_digits=10, decimal_places=2, editable=False, default=0)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Booking #{self.pk} - {self.car.name} for {self.customer_name}"

    def clean(self):
        errors = {}
        if self.pickup_datetime and self.return_datetime:
            if self.return_datetime <= self.pickup_datetime:
                errors["return_datetime"] = "Return date/time must be after pickup date/time."
            elif self.car_id and not self.car.is_available_between(
                self.pickup_datetime, self.return_datetime, exclude_booking_id=self.pk
            ):
                errors["__all__"] = "This car is already booked for part of the selected period."
        if errors:
            raise ValidationError(errors)

    def calculate_total_price(self):
        duration = self.return_datetime - self.pickup_datetime
        days = max(1, -(-duration.total_seconds() // 86400))  # ceil division, min 1 day
        return round(float(self.car.rental_price_per_day) * days, 2)

    def save(self, *args, **kwargs):
        self.full_clean(exclude=[f.name for f in self._meta.fields if f.name not in (
            "pickup_datetime", "return_datetime", "car"
        )])
        self.total_price = self.calculate_total_price()
        super().save(*args, **kwargs)
