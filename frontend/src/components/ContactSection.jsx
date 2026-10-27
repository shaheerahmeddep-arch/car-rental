import React, { useState } from 'react';
import api from '../services/api';

const initialForm = { name: '', email: '', message: '' };

export default function ContactSection() {
  const [form, setForm] = useState(initialForm);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.sendContactMessage(form);
      setSent(true);
      setForm(initialForm);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section">
      <div className="container max-w-[640px]">
        <div className="section-head">
          <h2>Get in touch</h2>
          <p>
            Questions about a vehicle or a booking? Send us a message and we'll reply by email.
          </p>
        </div>
        {sent ? (
          <div className="card p-6 text-success">
            Thanks for reaching out — we'll get back to you by email soon.
            <div>
              <button className="btn btn-ghost mt-4" onClick={() => setSent(false)}>
                Send another message
              </button>
            </div>
          </div>
        ) : (
          <form className="card p-6" onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="field">
                <label>Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={update('name')}
                  placeholder="Your name"
                />
              </div>
              <div className="field">
                <label>Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={update('email')}
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div className="field">
              <label>Message</label>
              <textarea
                rows={4}
                required
                value={form.message}
                onChange={update('message')}
                placeholder="How can we help?"
              />
            </div>

            {error && <p className="field-error mb-3.5">{error}</p>}

            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send Message'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
