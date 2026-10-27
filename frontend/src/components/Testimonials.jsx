import React, { useEffect, useState } from 'react';
import api from '../services/api';
import useReveal from './useReveal';

const STAR = '#f5a623';

function Stars({ value, size = '1rem' }) {
  return (
    <span className="inline-flex align-middle" style={{ fontSize: size }} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ color: i <= value ? STAR : 'rgba(128,128,128,0.35)' }}>★</span>
      ))}
    </span>
  );
}

function RatingInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          aria-label={`${i} star${i > 1 ? 's' : ''}`}
          className="cursor-pointer bg-transparent p-0 text-[1.6rem] leading-none transition-transform duration-[120ms] hover:scale-110"
          style={{ color: i <= shown ? STAR : 'rgba(128,128,128,0.35)', border: 'none' }}
        >
          ★
        </button>
      ))}
      <span className="ml-2 text-[0.85rem] text-ink-muted">{value ? `${value}/5` : 'Select a rating'}</span>
    </div>
  );
}

const emptyForm = { name: '', location: '', rating: 5, text: '' };

function ReviewForm({ onCreated }) {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.rating) { setError('Please choose a star rating.'); return; }
    setSubmitting(true);
    try {
      const created = await api.createReview(form);
      onCreated(created);
      setForm(emptyForm);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="card card-static p-6" onSubmit={handleSubmit}>
      <h3 className="mb-4 text-[1.1rem]">Write a review</h3>
      <div className="field">
        <label>Your rating</label>
        <RatingInput value={form.rating} onChange={(r) => setForm((f) => ({ ...f, rating: r }))} />
      </div>
      <div className="grid-2">
        <div className="field">
          <label>Name</label>
          <input type="text" required value={form.name} onChange={update('name')} placeholder="Your name" />
        </div>
        <div className="field">
          <label>City (optional)</label>
          <input type="text" value={form.location} onChange={update('location')} placeholder="e.g. Lahore" />
        </div>
      </div>
      <div className="field">
        <label>Your review</label>
        <textarea rows={4} required value={form.text} onChange={update('text')} placeholder="Tell others about your experience…" />
      </div>
      {error && <p className="field-error mb-3.5">{error}</p>}
      <button className="btn btn-primary" type="submit" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit Review'}
      </button>
    </form>
  );
}

function ReviewCard({ review }) {
  const ref = useReveal();
  return (
    <div ref={ref} className="card reveal p-6">
      <div className="mb-3"><Stars value={review.rating} /></div>
      <p className="mb-4 italic">&ldquo;{review.text}&rdquo;</p>
      <strong className="text-[0.9rem]">{review.name}</strong>
      {review.location && <div className="text-[0.8rem] text-ink-muted">{review.location}</div>}
    </div>
  );
}

export default function Testimonials() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    api.getReviews()
      .then((data) => setReviews(data.results || data))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCreated = (review) => {
    setReviews((prev) => [review, ...prev]);
    setShowForm(false);
  };

  return (
    <section className="section">
      <div className="container">
        <div className="section-head flex max-w-none flex-wrap items-end justify-between gap-3">
          <div>
            <h2>What customers say</h2>
            <p>Real feedback from renters across Lahore and nearby cities.</p>
          </div>
          <button className="btn btn-ghost" onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Close' : 'Write a review'}
          </button>
        </div>

        {showForm && (
          <div className="mb-[26px] max-w-[640px]">
            <ReviewForm onCreated={handleCreated} />
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[22px]">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-[180px]" />)}
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-ink-muted">No reviews yet — be the first to share your experience.</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[22px]">
            {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
          </div>
        )}
      </div>
    </section>
  );
}
