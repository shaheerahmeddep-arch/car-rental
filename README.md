# Shaheer Car Rental System

A car rental platform for **Lahore, Pakistan**, built with a **Django + Django REST Framework** backend
and a **React** frontend. Red-themed, dark/light toggle, multi-image galleries, real-time availability,
and an admin dashboard for managing everything without touching code.

```
shaheer-car-rental/
├── backend/     Django + DRF API, admin dashboard, models
└── frontend/    React app (cars, booking, gallery, theme toggle)
```

## What's implemented

- **Models**: `Category`, `Car`, `CarImage` (multiple images per car), `PaymentMethod`, `Booking`,
  `ContactMessage`
- **REST API** (`/api/...`): categories, cars (search/filter/sort), per-car availability check,
  payment methods (admin-managed, not hard-coded), booking creation with **double-booking prevention**
  and automatic price calculation, contact form submission, and email/password **auth** (register,
  login, logout via token)
- **In-app Admin Panel** (React, at `/admin`): its own staff-only API (`/api/admin/...`) with full
  create/read/update/delete on cars, car photos, categories, payment methods, bookings, customers,
  contact messages, and admin accounts themselves
- **Django admin**: the same data, manageable from Django's built-in generic admin site too —
  useful for bulk edits or raw database access
- **React frontend**: homepage (hero, featured cars, categories, why-us, how-it-works, testimonials,
  Lahore location map, contact form), car listing with search/filter, car detail page with an
  image gallery (lightbox + prev/next), booking form with live availability + cost calculation,
  "My Bookings" lookup by email, working Login/Register with a logged-in navbar state, dark/light
  theme toggle persisted in `localStorage`
- Real-time availability is computed from actual bookings — nothing is hard-coded as "always available"
- Every booking **and** every contact-form submission emails its full details to
  `shaheerahmed.dep@gmail.com`

## Prerequisites

- Python 3.11+
- Node.js 18+ and npm
- (Optional) a virtual environment tool such as `venv`

## 1. Backend setup (Django)

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt

python manage.py makemigrations
python manage.py migrate

# Create an admin login
python manage.py createsuperuser

# Optional: seed sample categories, cars and payment methods
python manage.py seed_data

python manage.py runserver
```

The API is now running at `http://127.0.0.1:8000/api/` and the admin dashboard at
`http://127.0.0.1:8000/admin/`.

### Sample car photos

This project ships a ready-made folder of car illustrations at
`backend/media/cars/seed/` (30 images — 5 angles × 6 sample cars: Front/Side/Rear/Interior/
Dashboard, styled in the site's red theme). `seed_data` links each seeded car straight to these
files, so photos show up immediately — **no image generation or download needed**. Replace them
with real vehicle photos any time from the Car edit page in `/admin/` (inline uploader with a
live preview); anything you add that way is stored under `backend/media/cars/<year>/<month>/`
alongside the bundled set.

### Get booking & contact emails in your inbox

Every new booking, and every message submitted through the site's Contact form, is emailed to
`shaheerahmed.dep@gmail.com` (configurable via the `ADMIN_NOTIFICATION_EMAIL` env var). By default
emails just print to the terminal running `runserver` — nothing to configure, useful for testing.
To have them actually land in Gmail:

1. Turn on 2-Step Verification on the Google account, then create an **App Password** at
   `https://myaccount.google.com/apppasswords`.
2. Set these environment variables before running `runserver` (e.g. in a `.env` file loaded by
   your shell, or `export` them directly):

```bash
export DJANGO_EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
export EMAIL_HOST_USER=your.gmail.address@gmail.com
export EMAIL_HOST_PASSWORD=your-16-character-app-password
export ADMIN_NOTIFICATION_EMAIL=shaheerahmed.dep@gmail.com
```

3. Restart `python manage.py runserver`. New bookings will now email the car, customer name,
   phone, email, pickup/return date & time, payment method, total price and notes; contact-form
   submissions will email the sender's name, email and message.

## 2. Frontend setup (React)

In a new terminal:

```bash
cd frontend
cp .env.example .env    # points the app at http://127.0.0.1:8000/api by default
npm install
npm start
```

The site opens at `http://localhost:3000`.

### Login / Register

The Login/Register page is fully wired to the backend: registering creates a real Django `User`
and logs you in immediately (an auth token is stored in `localStorage`); the navbar then shows
"Hi, \<name\>" with a Logout button instead of the Login/Register link. If the backend isn't
running, or `python manage.py migrate` hasn't been run yet, you'll see a clear error message on
the form rather than a silent failure — start the backend and try again.

## 3. Using the admin panel

There are two ways to administer the site — use whichever fits:

### A. The in-app Admin Panel (recommended for day-to-day use)

Click **Admin** in the site's navbar (or go to `http://localhost:3000/admin`). This is a full
React dashboard backed by its own staff-only API (`/api/admin/...`), separate from Django's
built-in admin — no need to touch `http://127.0.0.1:8000` at all.

**First login:** `python manage.py seed_data` creates a default account — username `admin`,
password `admin123`. Log in, then immediately go to the **Admins** tab and change it.

To set your own username/password instead of the default (only takes effect the first time you
run it, before any admin account exists yet):

```bash
python manage.py seed_data --admin-username myname --admin-password "a-strong-password"
```

What each tab does — every action here creates, updates, or deletes real data through the API:

| Tab | What you can do |
|---|---|
| **Dashboard** | Car/booking/customer/message counts, total revenue, recent bookings |
| **Cars** | Add, edit, delete cars; the edit page uploads several photos at once, deletes single photos, and sets the cover photo |
| **Bookings** | Filter by status, change status (pending/confirmed/cancelled/completed), delete |
| **Customers** | See everyone who registered and how many bookings they've made; delete accounts |
| **Categories & Payments** | Add/delete categories; add, enable/disable, or delete payment methods — the booking form reads these live |
| **Messages** | Read Contact-form submissions, mark as read, delete |
| **Admins** | Add more admin accounts, remove them, change your own password |

Only a logged-in admin token can reach any `/api/admin/...` endpoint — everyone else gets a 403.

### B. Django's built-in admin (for direct database access / debugging)

Go to `http://127.0.0.1:8000/admin/` and log in with the superuser you created with
`createsuperuser`. This is Django's own generic admin site — useful for bulk edits, raw database
inspection, or anything the panel above doesn't cover yet. Both admins manage the exact same
database, so changes in one show up in the other immediately.

## Notes & next steps for production

- `SECRET_KEY` in `backend/carrental/settings.py` is a placeholder — replace it and set `DEBUG = False`
  before deploying, and configure `ALLOWED_HOSTS` / `CORS_ALLOWED_ORIGINS` for your real domain.
- The default database is SQLite for zero-config local development; swap the `DATABASES` setting
  for Postgres/MySQL in production.
- Auth uses DRF's built-in token authentication (simple and works out of the box). For a
  production app, consider adding password-reset, email verification, and token expiry
  (e.g. via `djangorestframework-simplejwt`).

## Troubleshooting

**If you're upgrading from an earlier copy of this project** (rather than starting fresh), a few
things need to be re-run — the auth system, the contact form, and the photo fix all added new
database tables/columns, and none of that appears automatically:

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt   # picks up anything new in requirements.txt
python manage.py makemigrations   # generates migrations for ContactMessage, etc.
python manage.py migrate          # creates the authtoken table + any new columns
python manage.py seed_data        # now self-repairs any car photos that were broken before
python manage.py runserver
```

Then, separately:

```bash
cd frontend
npm start   # restart it even if it's already running, so it picks up the new pages/components
```

**"Images still aren't showing."** If you ran `seed_data` with an older copy of this project
before, the database already has `CarImage` rows pointing at files that were never actually
written to disk (that was the original bug). Simply re-running `seed_data` now fixes this
automatically — it checks whether each car's image files really exist on disk, and if not,
deletes the broken rows and re-links them to the bundled illustrations in
`backend/media/cars/seed/`. No need to flush the database.

**"Login/Register still doesn't work."** This is almost always one of:
1. `python manage.py migrate` hasn't been (re-)run since pulling this update — the auth token
   table (`rest_framework.authtoken`) and `ContactMessage` table won't exist yet, and every
   request will fail with a 500 error.
2. The Django server (`runserver`) isn't running, or isn't reachable at
   `http://127.0.0.1:8000` — check `frontend/.env`'s `REACT_APP_API_BASE`.
3. The React dev server is still serving an old build — stop it (Ctrl+C) and run `npm start` again.

To see the *real* error, open your browser's DevTools → Network tab, try registering/logging in,
and click the failed `register/` or `login/` request — the response body will say exactly what
went wrong (e.g. "no such table", a validation error, or a connection failure). If it still
doesn't work after a full migrate + restart, share that error message and it can be pinned down
precisely.
