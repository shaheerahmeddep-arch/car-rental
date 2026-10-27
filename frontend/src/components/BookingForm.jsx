import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const initialForm = {
  pickupDate: '',
  pickupTime: '10:00',
  returnDate: '',
  returnTime: '10:00',
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  notes: '',
  paymentMethod: '',
  transactionReference: '',
};

export default function BookingForm({ car }) {
  const [form, setForm] = useState(initialForm);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [availability, setAvailability] = useState(null); // { available, estimated_total, estimated_days }
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    api.getPaymentMethods()
      .then((data) => {
        setPaymentMethods(data.results || data);
      })
      .catch(() => setPaymentMethods([]));
  }, []);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const [copied, setCopied] = useState(false);
  const selectedMethod = paymentMethods.find((p) => p.id === Number(form.paymentMethod));

  // A copied-number confirmation belongs to one method only — reset it when
  // the customer picks a different one.
  useEffect(() => {
    setCopied(false);
  }, [form.paymentMethod]);

  const handleCopyNumber = async () => {
    if (!selectedMethod?.account_number) return;
    const text = selectedMethod.account_number;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard API can be unavailable (non-HTTPS/insecure context) — fall
      // back to a temporary textarea + execCommand.
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* nothing else we can do */ }
      ta.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const toIso = (date, time) => (date && time ? new Date(`${date}T${time}:00`).toISOString() : null);

  const runAvailabilityCheck = useCallback(async () => {
    const pickup = toIso(form.pickupDate, form.pickupTime);
    const ret = toIso(form.returnDate, form.returnTime);
    if (!pickup || !ret) return;
    setChecking(true);
    setError('');
    try {
      const result = await api.checkAvailability({
        car: car.id,
        pickup_datetime: pickup,
        return_datetime: ret,
      });
      setAvailability(result);
    } catch (err) {
      setAvailability(null);
      setError(err.message);
    } finally {
      setChecking(false);
    }
  }, [form.pickupDate, form.pickupTime, form.returnDate, form.returnTime, car.id]);

  useEffect(() => {
    if (form.pickupDate && form.returnDate) {
      runAvailabilityCheck();
    } else {
      setAvailability(null);
    }
  }, [form.pickupDate, form.pickupTime, form.returnDate, form.returnTime, runAvailabilityCheck]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!availability?.available) {
      setError('This car is not available for the selected dates. Please choose a different period.');
      return;
    }
    setSubmitting(true);
    try {
      const booking = await api.createBooking({
        car: car.id,
        customer_name: form.customerName,
        customer_phone: form.customerPhone,
        customer_email: form.customerEmail,
        notes: form.notes,
        pickup_datetime: toIso(form.pickupDate, form.pickupTime),
        return_datetime: toIso(form.returnDate, form.returnTime),
        payment_method: form.paymentMethod || null,
        transaction_reference: form.transactionReference || '',
      });
      setSuccess(booking);
      setForm(initialForm);
      setAvailability(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="card p-[26px]">
        <h3 className="mb-[18px]">Book this vehicle</h3>
        <p>
          You need to be logged in to book a car. Please log in to your account (or register a new
          one) to continue with your booking.
        </p>
        <Link
          to="/login"
          state={{ from: location.pathname }}
          className="btn btn-primary mt-[18px] w-full"
        >
          Login / Register to book
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="card p-7">
        <h3 className="text-success">Booking received!</h3>
        <p>
          Thanks, {success.customer_name}. Your booking for <strong>{car.name}</strong> is
          <strong> {success.status}</strong> pending confirmation from our team.
        </p>
        <p className="text-[0.9rem]">
          Total estimated cost: <strong>Rs. {Number(success.total_price).toLocaleString()}</strong><br />
          We'll contact you at {success.customer_phone} / {success.customer_email} to confirm.
        </p>
        <button className="btn btn-primary" onClick={() => setSuccess(null)}>Book another period</button>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <form className="card p-[26px]" onSubmit={handleSubmit}>
      <h3 className="mb-[18px]">Book this vehicle</h3>

      <div className="grid-2">
        <DateTimeField
          label="Pickup date"
          type="date"
          icon={<CalendarIcon />}
          min={today}
          required
          value={form.pickupDate}
          onChange={update('pickupDate')}
        />
        <DateTimeField
          label="Pickup time"
          type="time"
          icon={<ClockIcon />}
          required
          value={form.pickupTime}
          onChange={update('pickupTime')}
        />
        <DateTimeField
          label="Return date"
          type="date"
          icon={<CalendarIcon />}
          min={form.pickupDate || today}
          required
          value={form.returnDate}
          onChange={update('returnDate')}
        />
        <DateTimeField
          label="Return time"
          type="time"
          icon={<ClockIcon />}
          required
          value={form.returnTime}
          onChange={update('returnTime')}
        />
      </div>

      {checking && <p className="text-[0.85rem]">Checking availability…</p>}
      {!checking && availability && (
        <div
          className={`mb-4 rounded-[10px] px-3.5 py-3 text-[0.9rem] ${
            availability.available ? 'bg-success/10 text-success' : 'bg-accent/10 text-accent'
          }`}
        >
          {availability.available ? (
            <>Available for your dates — estimated total: <strong>Rs. {Number(availability.estimated_total).toLocaleString()}</strong> ({availability.estimated_days} day{availability.estimated_days > 1 ? 's' : ''})</>
          ) : (
            'This car is already booked for part of that period. Please pick different dates.'
          )}
        </div>
      )}

      <div className="field">
        <label>Full name</label>
        <input type="text" required value={form.customerName} onChange={update('customerName')} placeholder="Your full name" />
      </div>
      <div className="grid-2">
        <div className="field">
          <label>Phone number</label>
          <input type="tel" required value={form.customerPhone} onChange={update('customerPhone')} placeholder="03xx-xxxxxxx" />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" required value={form.customerEmail} onChange={update('customerEmail')} placeholder="you@example.com" />
        </div>
      </div>

      <div className="field">
        <label>Payment method</label>
        <select required value={form.paymentMethod} onChange={update('paymentMethod')}>
          <option value="" disabled>Select a payment method</option>
          {paymentMethods.length === 0 && <option value="">No payment methods available</option>}
          {paymentMethods.map((pm) => (
            <option key={pm.id} value={pm.id}>{pm.name}</option>
          ))}
        </select>
      </div>

      {selectedMethod && (selectedMethod.account_number || selectedMethod.instructions) && (
        <div key={selectedMethod.id} className="mb-4 animate-pop-in rounded-[12px] border border-line bg-elevated p-4">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <strong className="text-[0.92rem]">{selectedMethod.name}</strong>
            <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide text-accent">Manual payment</span>
          </div>
          {selectedMethod.account_holder && (
            <p className="mb-1.5 text-[0.85rem]">Account holder: <strong>{selectedMethod.account_holder}</strong></p>
          )}
          {selectedMethod.account_number && (
            <div className="flex items-stretch gap-2">
              <code className="flex flex-1 items-center overflow-x-auto rounded-[8px] border border-line bg-bg px-3 py-2 font-mono text-[0.95rem] tracking-wider whitespace-nowrap">
                {selectedMethod.account_number}
              </code>
              <button type="button" className="btn btn-ghost px-4 py-2 text-[0.8rem]" onClick={handleCopyNumber}>
                {copied ? 'Copied!' : 'Copy number'}
              </button>
            </div>
          )}
          {selectedMethod.instructions && (
            <p className="mb-0 mt-2.5 text-[0.82rem] text-ink-muted">{selectedMethod.instructions}</p>
          )}
          <p className="mb-0 mt-2.5 text-[0.78rem] text-ink-muted">
            Send the payment yourself, then submit the booking below — it stays{' '}
            <strong>pending</strong> until our team verifies your payment.
          </p>
        </div>
      )}

      <div className="field">
        <label>Transaction reference (optional)</label>
        <input
          type="text"
          value={form.transactionReference}
          onChange={update('transactionReference')}
          placeholder="e.g. TXN ID / reference after sending payment"
        />
      </div>

      <div className="field">
        <label>Additional notes (optional)</label>
        <textarea rows={3} value={form.notes} onChange={update('notes')} placeholder="Any special requests..." />
      </div>

      {error && <p className="field-error mb-3.5">{error}</p>}

      <button className="btn btn-primary w-full" type="submit" disabled={submitting || (availability && !availability.available)}>
        {submitting ? 'Submitting…' : 'Confirm Booking'}
      </button>
    </form>
  );
}

function DateTimeField({ label, type, icon, ...inputProps }) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="dt-control">
        <span className="dt-icon" aria-hidden="true">{icon}</span>
        <input type={type} className="dt-input" {...inputProps} />
      </div>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="3" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}