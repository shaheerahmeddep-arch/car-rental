from django.contrib import admin
from django.utils.html import format_html
from .models import Category, Car, CarImage, PaymentMethod, Booking, ContactMessage, Review


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "car_count")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name",)

    def car_count(self, obj):
        return obj.cars.count()
    car_count.short_description = "Cars"


class CarImageInline(admin.TabularInline):
    """Lets the admin upload/replace/delete multiple images directly on the Car page."""
    model = CarImage
    extra = 3  # start with 3 empty image slots, admin can add more (4-5+)
    fields = ("image", "preview", "caption", "is_primary", "order")
    readonly_fields = ("preview",)

    def preview(self, obj):
        if obj.pk and obj.image:
            return format_html('<img src="{}" style="height:60px;border-radius:6px;" />', obj.image.url)
        return "(no image yet)"
    preview.short_description = "Preview"


@admin.register(Car)
class CarAdmin(admin.ModelAdmin):
    list_display = (
        "name", "brand", "category", "model_year", "rental_price_per_day",
        "condition", "is_active", "current_availability",
    )
    list_filter = ("category", "condition", "transmission", "fuel_type", "is_active", "brand")
    search_fields = ("name", "brand", "model")
    inlines = [CarImageInline]
    list_editable = ("is_active",)
    fieldsets = (
        ("Basic Info", {
            "fields": ("name", "brand", "model", "model_year", "category", "location", "is_active")
        }),
        ("Pricing", {
            "fields": ("rental_price_per_day",)
        }),
        ("Condition & Description", {
            "fields": ("condition", "condition_description", "description")
        }),
        ("Specifications", {
            "fields": ("seating_capacity", "transmission", "fuel_type", "features")
        }),
    )

    def current_availability(self, obj):
        return "Available now" if obj.is_currently_available else "Booked"
    current_availability.short_description = "Right now"


@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ("name", "is_enabled", "order")
    list_editable = ("is_enabled", "order")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = (
        "id", "car", "customer_name", "customer_phone", "pickup_datetime",
        "return_datetime", "total_price", "status", "payment_method",
    )
    list_filter = ("status", "payment_method", "car__category")
    search_fields = ("customer_name", "customer_email", "customer_phone", "car__name", "transaction_reference")
    list_editable = ("status",)
    date_hierarchy = "pickup_datetime"
    readonly_fields = ("total_price", "created_at", "updated_at")
    actions = ["mark_confirmed", "mark_cancelled", "mark_completed"]

    def mark_confirmed(self, request, queryset):
        queryset.update(status=Booking.Status.CONFIRMED)
    mark_confirmed.short_description = "Mark selected bookings as Confirmed"

    def mark_cancelled(self, request, queryset):
        queryset.update(status=Booking.Status.CANCELLED)
    mark_cancelled.short_description = "Mark selected bookings as Cancelled"

    def mark_completed(self, request, queryset):
        queryset.update(status=Booking.Status.COMPLETED)
    mark_completed.short_description = "Mark selected bookings as Completed"


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "created_at", "is_read")
    list_editable = ("is_read",)
    search_fields = ("name", "email", "message")
    readonly_fields = ("created_at",)


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("name", "rating", "location", "created_at")
    list_filter = ("rating",)
    search_fields = ("name", "text", "location")
    readonly_fields = ("created_at",)


admin.site.site_header = "Shaheer Car Rental System — Admin"
admin.site.site_title = "Shaheer Car Rental Admin"
admin.site.index_title = "Manage Cars, Bookings & Payments"
