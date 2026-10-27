import React, { useEffect, useRef, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import CarGallery from '../components/CarGallery';
import BookingForm from '../components/BookingForm';
import api from '../services/api';

const CONDITION_LABEL = {
  excellent: 'Excellent',
  very_good: 'Very Good',
  good: 'Good',
  fair: 'Fair',
};

export default function CarDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const bookingRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    api.getCar(id)
      .then(setCar)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // "Book Now" on car cards lands here with state.bookNow — scroll straight to
  // the booking form so the customer doesn't have to hunt for it.
  useEffect(() => {
    if (location.state?.bookNow && bookingRef.current) {
      bookingRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.state, loading]);

  if (loading) {
    return (
      <div className="container section">
        <div className="skeleton mb-6 h-[210px] sm:h-[300px] lg:h-[360px]" />
        <div className="skeleton h-10 w-3/5" />
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="container section">
        <p className="field-error">{error || 'Car not found.'}</p>
        <Link to="/cars" className="btn btn-ghost">← Back to all cars</Link>
      </div>
    );
  }

  return (
    <div className="container section grid grid-cols-1 items-start gap-10 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <Link to="/cars" className="text-[0.85rem] text-ink-muted">← Back to all cars</Link>
        <CarGallery images={car.images} carName={car.name} />

        <div className="mt-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="mb-1 text-[1.8rem]">{car.name}</h1>
              <p className="m-0">{car.category?.name} · {car.location}</p>
            </div>
            <span className={`inline-block rounded-full px-3 py-[5px] text-[0.72rem] font-bold ${car.is_currently_available ? 'bg-success text-white' : 'bg-accent text-white'}`}>
              {car.is_currently_available ? 'Available' : 'Booked'}
            </span>
          </div>

          <p className="mt-4.5">{car.description}</p>

          <h3 className="mt-7 text-[1.05rem]">Vehicle condition — {CONDITION_LABEL[car.condition]}</h3>
          <p>{car.condition_description}</p>

          <h3 className="mt-7 text-[1.05rem]">Specifications</h3>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3.5">
            <Spec label="Brand" value={car.brand} />
            {car.model && <Spec label="Model" value={car.model} />}
            <Spec label="Year" value={car.model_year} />
            <Spec label="Seats" value={car.seating_capacity} />
            <Spec label="Transmission" value={car.transmission} />
            <Spec label="Fuel type" value={car.fuel_type} />
            <Spec label="Air conditioning" value={car.air_conditioning ? 'Yes' : 'No'} />
            <Spec label="Price / day" value={`Rs. ${Number(car.rental_price_per_day).toLocaleString()}`} />
          </div>

          {car.feature_list?.length > 0 && (
            <>
              <h3 className="mt-7 text-[1.05rem]">Features</h3>
              <div className="flex flex-wrap gap-2">
                {car.feature_list.map((f) => (
                  <span key={f} className="rounded-full border border-line bg-elevated px-3.5 py-1.5 text-[0.82rem]">{f}</span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="lg:sticky lg:top-[92px]" ref={bookingRef}>
        <BookingForm car={car} />
      </div>
    </div>
  );
}

function Spec({ label, value }) {
  return (
    <div>
      <div className="text-[0.75rem] text-ink-muted capitalize">{label}</div>
      <div className="font-semibold capitalize">{value}</div>
    </div>
  );
}
