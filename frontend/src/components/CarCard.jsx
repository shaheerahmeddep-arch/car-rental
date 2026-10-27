import React from 'react';
import { Link } from 'react-router-dom';
import useReveal from './useReveal';

const CONDITION_LABEL = {
  excellent: 'Excellent',
  very_good: 'Very Good',
  good: 'Good',
  fair: 'Fair',
};

export default function CarCard({ car }) {
  const ref = useReveal();

  const features = car.feature_list || [];
  const visibleFeatures = features.slice(0, 3);
  const extraCount = features.length - visibleFeatures.length;

  return (
    <div className="card reveal block group" ref={ref}>
      <Link to={`/cars/${car.id}`} className="relative block aspect-[4/3] overflow-hidden bg-elevated">
        {car.primary_image ? (
          <img
            src={car.primary_image}
            alt={car.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[320ms] ease-smooth group-hover:scale-[1.06]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[0.85rem] text-ink-muted">No image yet</div>
        )}
        <span className={`badge ${car.is_currently_available ? 'badge-available' : 'badge-booked'}`}>
          {car.is_currently_available ? 'Available' : 'Booked'}
        </span>
      </Link>

      <div className="px-5 pt-[18px] pb-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="m-0 text-[1.08rem]">{car.name}</h3>
          <span className="whitespace-nowrap text-[0.72rem] font-semibold text-accent">
            {CONDITION_LABEL[car.condition] || car.condition}
          </span>
        </div>
        <p className="mt-1.5 mb-3 text-[0.85rem] capitalize">
          {car.brand} · {car.category?.name}
        </p>

        <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[0.78rem] text-ink-soft">
          <Spec icon={<TransmissionIcon />} label={car.transmission} />
          <Spec icon={<FuelIcon />} label={car.fuel_type} />
          <Spec icon={<SeatsIcon />} label={`${car.seating_capacity} seats`} />
          {car.air_conditioning && <Spec icon={<AcIcon />} label="AC" />}
        </div>

        {visibleFeatures.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {visibleFeatures.map((f) => (
              <span key={f} className="rounded-full border border-line bg-elevated px-2.5 py-[3px] text-[0.72rem] text-ink-soft">{f}</span>
            ))}
            {extraCount > 0 && (
              <span className="rounded-full border border-line px-2.5 py-[3px] text-[0.72rem] text-ink-muted">+{extraCount} more</span>
            )}
          </div>
        )}

        <div className="mb-4">
          <span className="font-display text-[1.1rem] font-bold text-ink">
            Rs. {Number(car.rental_price_per_day).toLocaleString()}<small className="text-[0.72rem] font-normal text-ink-muted"> /day</small>
          </span>
        </div>

        <div className="flex gap-2">
          <Link to={`/cars/${car.id}`} className="btn btn-ghost flex-1 px-4 py-2.5 text-[0.82rem]">View Details</Link>
          <Link
            to={`/cars/${car.id}`}
            state={{ bookNow: true }}
            className="btn btn-primary flex-1 px-4 py-2.5 text-[0.82rem]"
          >
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
}

function Spec({ icon, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 capitalize">
      <span className="text-ink-muted">{icon}</span>
      {label}
    </span>
  );
}

function TransmissionIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" />
    </svg>
  );
}

function FuelIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" />
      <path d="M3 21h14" />
      <path d="M15 9h1.5a2 2 0 0 1 2 2v5.5a1.5 1.5 0 0 0 3 0V9.8L19 7" />
    </svg>
  );
}

function SeatsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9.5" cy="7.5" r="3.5" />
      <path d="M3 20v-1.5A5.5 5.5 0 0 1 8.5 13h2A5.5 5.5 0 0 1 16 18.5V20" />
      <path d="M15.5 4.6a3.5 3.5 0 0 1 0 5.8M17.8 13.4A5.5 5.5 0 0 1 21 18.5V20" />
    </svg>
  );
}

function AcIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20" />
      <path d="M4.2 6.5l15.6 11M19.8 6.5l-15.6 11" />
      <path d="M12 2 9.8 4.2M12 2l2.2 2.2M12 22l-2.2-2.2M12 22l2.2-2.2" />
    </svg>
  );
}
