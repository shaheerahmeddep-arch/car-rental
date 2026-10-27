import React, { useState } from 'react';
import api from '../services/api';

export default function MyBookingsPage() {
  const [email, setEmail] = useState('');
  const [bookings, setBookings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.getBookingsByEmail(email);
      setBookings(data.results || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container section">
      <div className="section-head max-w-none">
        <h2>My bookings</h2>
        <p>Enter the email you used when booking to see its status.</p>
      </div>

      <form onSubmit={handleSearch} className="card mb-7 flex flex-wrap items-end gap-3 p-[22px]">
        <div className="field mb-0 min-w-[220px] flex-1">
          <label>Email address</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Searching…' : 'Find bookings'}</button>
      </form>

      {error && <p className="field-error">{error}</p>}

      {bookings && (
        bookings.length === 0 ? (
          <p className="text-ink-muted">No bookings found for that email.</p>
        ) : (
          <div className="flex flex-col gap-3.5">
            {bookings.map((b) => (
              <div key={b.id} className="card flex flex-wrap justify-between gap-3 p-5">
                <div>
                  <strong>{b.car_name}</strong>
                  <div className="text-[0.85rem] text-ink-muted">
                    {new Date(b.pickup_datetime).toLocaleString()} → {new Date(b.return_datetime).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">Rs. {Number(b.total_price).toLocaleString()}</div>
                  <span className={`text-[0.75rem] font-bold capitalize ${b.status === 'cancelled' ? 'text-accent' : 'text-success'}`}>{b.status}</span>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
