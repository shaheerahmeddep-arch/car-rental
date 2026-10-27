import io
import os

from django.conf import settings
from django.contrib.auth.models import User
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from rentals.models import Category, Car, CarImage, PaymentMethod

try:
    from PIL import Image, ImageDraw, ImageFont
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

# One accent color per category so placeholder photos are visually distinct.
CATEGORY_COLORS = {
    "Sedan": (200, 16, 46),
    "SUV": (30, 90, 60),
    "Luxury": (35, 30, 60),
    "Pickup Truck": (120, 70, 20),
    "Family Car": (20, 70, 110),
}
ANGLE_LABELS = ["Front View", "Side View", "Rear View", "Interior", "Dashboard"]

# A folder of ready-made car illustrations ships with this project at
# backend/media/cars/seed/ — one image per car per angle, already rendered
# (see the project README). We use those first; PIL generation below is only
# a fallback for cars added through this command that aren't in that set.
SEED_IMAGE_SUBDIR = "cars/seed"


def _load_font(size):
    try:
        return ImageFont.truetype("DejaVuSans-Bold.ttf", size)
    except Exception:
        return ImageFont.load_default()


def make_placeholder_image(car_name, category_name, angle_label):
    """Generates a simple branded placeholder photo (no internet required).

    Used only as a fallback when a bundled illustration isn't found in
    media/cars/seed/ for this car/angle combination.
    """
    base_color = CATEGORY_COLORS.get(category_name, (90, 90, 90))
    width, height = 900, 600
    img = Image.new("RGB", (width, height), base_color)
    draw = ImageDraw.Draw(img)

    lighter = tuple(min(255, c + 35) for c in base_color)
    draw.polygon([(0, height), (width * 0.55, height), (width, 0), (width * 0.75, 0)], fill=lighter)

    title_font = _load_font(46)
    label_font = _load_font(26)
    tag_font = _load_font(20)

    draw.text((36, height - 150), car_name, font=title_font, fill="white")
    draw.text((36, height - 96), angle_label, font=label_font, fill="white")
    draw.text((36, 30), "SHAHEER CAR RENTAL — LAHORE", font=tag_font, fill="white")

    buffer = io.BytesIO()
    img.save(buffer, format="JPEG", quality=85)
    filename = f"{slugify(car_name)}-{slugify(angle_label)}.jpg"
    return ContentFile(buffer.getvalue(), name=filename)


def bundled_seed_image_relpath(car_name, angle_label):
    """Path (relative to MEDIA_ROOT) of the bundled illustration, if any."""
    filename = f"{slugify(car_name)}-{slugify(angle_label)}.jpg"
    return f"{SEED_IMAGE_SUBDIR}/{filename}"


class Command(BaseCommand):
    help = "Seed the database with sample categories, cars and payment methods for Shaheer Car Rental System."

    def add_arguments(self, parser):
        parser.add_argument(
            "--admin-username", default="admin",
            help="Username for the admin account created on first run (default: admin).",
        )
        parser.add_argument(
            "--admin-password", default="admin123",
            help="Password for the admin account created on first run (default: admin123).",
        )
        parser.add_argument(
            "--admin-email", default="shaheerahmed.dep@gmail.com",
            help="Email for the admin account created on first run.",
        )

    def handle(self, *args, **options):
        categories_data = [
            ("Sedan", "🚗", "Comfortable everyday sedans."),
            ("SUV", "🚙", "Spacious SUVs for family trips."),
            ("Luxury", "✨", "Premium vehicles for special occasions."),
            ("Pickup Truck", "🛻", "Heavy-duty trucks for cargo and work."),
            ("Family Car", "👨‍👩‍👧‍👦", "Roomy, practical cars for families."),
        ]
        categories = {}
        for name, icon, desc in categories_data:
            cat, _ = Category.objects.get_or_create(
                slug=slugify(name), defaults={"name": name, "icon": icon, "description": desc}
            )
            categories[name] = cat
        self.stdout.write(self.style.SUCCESS(f"Categories ready: {len(categories)}"))

        cars_data = [
            dict(name="Honda Civic 2023", brand="Honda", model="Civic", model_year=2023,
                 category="Sedan", price=8500, condition="excellent", seats=5,
                 transmission="automatic", fuel="petrol",
                 features="AC, Bluetooth, Backup Camera, Cruise Control, Alloy Wheels",
                 desc="A sporty and fuel-efficient sedan, perfect for city driving around Lahore."),
            dict(name="Toyota Corolla 2022", brand="Toyota", model="Corolla", model_year=2022,
                 category="Sedan", price=7500, condition="very_good", seats=5,
                 transmission="automatic", fuel="petrol",
                 features="AC, Bluetooth, Power Windows, USB Charging",
                 desc="Reliable and economical — one of our most popular rentals."),
            dict(name="Toyota Land Cruiser 2021", brand="Toyota", model="Land Cruiser", model_year=2021,
                 category="Luxury", price=25000, condition="excellent", seats=7,
                 transmission="automatic", fuel="diesel",
                 features="4x4, Leather Seats, Sunroof, Premium Audio, Climate Control",
                 desc="Premium 4x4 SUV for long trips and off-road comfort."),
            dict(name="Toyota Hilux Revo 2022", brand="Toyota", model="Hilux", model_year=2022,
                 category="Pickup Truck", price=15000, condition="good", seats=5,
                 transmission="manual", fuel="diesel",
                 features="4x4, Tow Hitch, AC, Rugged Suspension",
                 desc="Tough and dependable pickup, ideal for cargo and rough terrain."),
            dict(name="Suzuki Alto 2023", brand="Suzuki", model="Alto", model_year=2023,
                 category="Family Car", price=4500, condition="excellent", seats=4,
                 transmission="manual", fuel="petrol",
                 features="AC, Power Steering, Compact Size",
                 desc="Compact, easy to drive, and budget-friendly for short family trips."),
            dict(name="Honda BR-V 2022", brand="Honda", model="BR-V", model_year=2022,
                 category="SUV", price=11000, condition="very_good", seats=7,
                 transmission="automatic", fuel="petrol",
                 features="AC, 7-Seater, Roof Rails, Touchscreen Infotainment",
                 desc="Spacious 7-seater SUV great for family outings and picnics."),
        ]

        created = 0
        for c in cars_data:
            car, was_created = Car.objects.get_or_create(
                name=c["name"],
                defaults=dict(
                    brand=c["brand"], model=c["model"], model_year=c["model_year"],
                    category=categories[c["category"]], rental_price_per_day=c["price"],
                    description=c["desc"], condition=c["condition"],
                    condition_description=(
                        "Exterior is in very good condition with minor signs of normal use. "
                        "Interior is clean and well maintained."
                    ),
                    seating_capacity=c["seats"], transmission=c["transmission"],
                    fuel_type=c["fuel"], features=c["features"], location="Lahore, Pakistan",
                )
            )
            if was_created:
                created += 1

            # Attach photos so the gallery isn't empty out of the box. If this
            # car already has image rows from an earlier run of this command
            # (from before this fix), check whether the files actually exist
            # on disk — older versions of this command created rows that
            # pointed at files that were never written. Repair those instead
            # of silently leaving them broken.
            existing_images = list(car.images.all())
            has_broken_images = any(
                not img.image or not os.path.exists(os.path.join(settings.MEDIA_ROOT, img.image.name))
                for img in existing_images
            )
            if not existing_images or has_broken_images:
                if existing_images:
                    car.images.all().delete()
                for i, angle in enumerate(ANGLE_LABELS):
                    rel_path = bundled_seed_image_relpath(car.name, angle)
                    abs_path = os.path.join(settings.MEDIA_ROOT, rel_path)
                    car_image = CarImage(car=car, caption=angle, is_primary=(i == 0), order=i)

                    if os.path.exists(abs_path):
                        # The illustration already lives inside MEDIA_ROOT
                        # (shipped in backend/media/cars/seed/), so we just
                        # point the field at it — no re-saving of bytes needed.
                        car_image.image.name = rel_path
                        car_image.save()
                    elif PIL_AVAILABLE:
                        # Fallback for any car not covered by the bundled set.
                        # NOTE: must use .image.save(name, content, save=True)
                        # here — assigning a ContentFile via objects.create()
                        # only records a filename and never writes the bytes,
                        # which is what caused broken images previously.
                        image_file = make_placeholder_image(car.name, c["category"], angle)
                        car_image.image.save(image_file.name, image_file, save=True)

        self.stdout.write(self.style.SUCCESS(f"Cars created: {created} (total in DB may be higher if re-run)"))
        if not PIL_AVAILABLE:
            self.stdout.write(self.style.WARNING(
                "Pillow isn't installed, so placeholder images were skipped. "
                "Run `pip install -r requirements.txt` and re-run this command."
            ))

        payment_data = [
            ("Cash on Pickup", "Pay in cash when you collect the vehicle."),
            ("Bank Transfer", "Transfer to our bank account; bring the receipt on pickup."),
            ("JazzCash", "Send payment to our registered JazzCash number."),
            ("EasyPaisa", "Send payment to our registered EasyPaisa number."),
        ]
        for i, (name, instr) in enumerate(payment_data):
            PaymentMethod.objects.get_or_create(
                slug=slugify(name), defaults={"name": name, "instructions": instr, "order": i}
            )
        self.stdout.write(self.style.SUCCESS("Payment methods ready."))
        self.stdout.write(self.style.SUCCESS(
            "Each car now has 5 bundled illustrations (Front/Side/Rear/Interior/Dashboard) from "
            "backend/media/cars/seed/. Replace them with real vehicle photos any time via /admin/."
        ))
        if not User.objects.filter(is_superuser=True).exists():
            username = options["admin_username"]
            password = options["admin_password"]
            email = options["admin_email"]
            User.objects.create_superuser(username, email, password)
            self.stdout.write(self.style.SUCCESS(
                f"Created admin account -> username: {username}  password: {password}  "
                "(change it in the Admins tab of the admin panel!)"))
        self.stdout.write(self.style.SUCCESS("Seeding complete!"))
