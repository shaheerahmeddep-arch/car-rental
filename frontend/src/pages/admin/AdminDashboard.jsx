import React from 'react';
import { Link } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import useLoad from './useLoad';

const STATUS_STYLES = {
  pending: 'bg-amber-500/15 text-amber-600',
  confirmed: 'bg-success/15 text-success',
  completed: 'bg-sky-500/15 text-sky-600',
  cancelled: 'bg-accent/10 text-accent',
};

export default function AdminDashboard() {
  const { data: stats, loading, error } = useLoad(() => adminApi.stats(), []);

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="field-error">{error}</p>;

  const cards = [
    { label: 'Cars', value: stats.cars, to: '/admin/cars' },
    { label: 'Pending bookings', value: stats.pending, to: '/admin/bookings?status=pending', accent: true },
    { label: 'Confirmed bookings', value: stats.confirmed, to: '/admin/bookings?status=confirmed' },
    { label: 'Customers', value: stats.customers, to: '/admin/customers' },
    { label: 'Unread messages', value: stats.unread_messages, to: '/admin/messages' },
    { label: 'Revenue (confirmed + completed)', value: `Rs. ${Number(stats.revenue).toLocaleString()}` },
  ];

  return (
    <div>
      <div className="mb-7 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
        {cards.map((c) => {
          const Wrap = c.to ? Link : 'div';
          return (
            <Wrap key={c.label} to={c.to} className={`card block p-[18px] ${c.to ? '' : 'card-static'}`}>
              <div className="text-[0.78rem] text-ink-muted">{c.label}</div>
              <div className={`font-display text-[1.5rem] font-bold ${c.accent ? 'text-accent' : 'text-ink'}`}>
                {c.value}
              </div>
            </Wrap>
          );
        })}
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Link className="btn btn-primary" to="/admin/cars/new">+ Add new car</Link>
        <Link className="btn btn-ghost" to="/admin/bookings">View all bookings</Link>
      </div>

      <h2 className="text-[1.1rem]">Recent bookings</h2>
      {stats.recent_bookings.length === 0 ? (
        <p className="text-ink-muted">No bookings yet.</p>
      ) : (
        <div className="card card-static overflow-x-auto">
          <table className="w-full border-collapse text-[0.88rem]">
            <thead>
              <tr className="text-left text-[0.75rem] text-ink-muted">
                <th className={th}>#</th><th className={th}>Car</th><th className={th}>Customer</th><th className={th}>Pickup</th><th className={th}>Total</th><th className={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_bookings.map((b) => (
                <tr key={b.id}>
                  <td className={td}>{b.id}</td>
                  <td className={td}>{b.car_name}</td>
                  <td className={td}>{b.customer_name}</td>
                  <td className={td}>{new Date(b.pickup_datetime).toLocaleString()}</td>
                  <td className={td}>Rs. {Number(b.total_price).toLocaleString()}</td>
                  <td className={td}>
                    <span className={`rounded-full px-2.5 py-1 text-[0.72rem] font-semibold capitalize ${STATUS_STYLES[b.status] || 'text-ink'}`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const th = 'border-b border-line px-3.5 py-2.5 text-left';
const td = 'border-b border-line px-3.5 py-2.5';
