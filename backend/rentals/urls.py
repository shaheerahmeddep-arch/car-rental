from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    CategoryViewSet, CarViewSet, PaymentMethodViewSet, BookingViewSet,
    RegisterView, LoginView, MeView, ContactMessageView, ReviewViewSet,
)
from .admin_views import (
    AdminLoginView, AdminStatsView, AdminCarViewSet, AdminCarImageViewSet,
    AdminCategoryViewSet, AdminPaymentMethodViewSet, AdminBookingViewSet,
    AdminCustomerViewSet, AdminMessageViewSet, AdminAccountViewSet,
    AdminReviewViewSet,
)

# ---------------------------------------------------------------------------
# Public / customer-facing API
# ---------------------------------------------------------------------------
router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("cars", CarViewSet, basename="car")
router.register("payment-methods", PaymentMethodViewSet, basename="payment-method")
router.register("bookings", BookingViewSet, basename="booking")
router.register("reviews", ReviewViewSet, basename="review")

# ---------------------------------------------------------------------------
# Staff-only API for the React admin dashboard (all require an admin token)
# Full CRUD: list/retrieve (GET), create (POST), update (PUT/PATCH), delete (DELETE)
# ---------------------------------------------------------------------------
router.register("admin/cars", AdminCarViewSet, basename="admin-car")
router.register("admin/car-images", AdminCarImageViewSet, basename="admin-car-image")
router.register("admin/categories", AdminCategoryViewSet, basename="admin-category")
router.register("admin/payment-methods", AdminPaymentMethodViewSet, basename="admin-payment-method")
router.register("admin/bookings", AdminBookingViewSet, basename="admin-booking")
router.register("admin/customers", AdminCustomerViewSet, basename="admin-customer")
router.register("admin/messages", AdminMessageViewSet, basename="admin-message")
router.register("admin/reviews", AdminReviewViewSet, basename="admin-review")
router.register("admin/accounts", AdminAccountViewSet, basename="admin-account")

urlpatterns = router.urls + [
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/me/", MeView.as_view(), name="auth-me"),
    path("contact/", ContactMessageView.as_view(), name="contact"),
    path("admin/login/", AdminLoginView.as_view(), name="admin-login"),
    path("admin/stats/", AdminStatsView.as_view(), name="admin-stats"),
]
