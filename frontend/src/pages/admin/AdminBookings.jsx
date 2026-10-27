import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import useLoad from './useLoad';
import { useConfirm } from '../../components/ConfirmDialog';

const STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'];

export default function AdminBookings() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const { data: bookings, loading, error, setData } = useLoad(() => adminApi.getBookings(status), [status]);
  const { confirm, dialog } = useConfirm();
  const [actionError, setActionError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const setStatus = (s) => setParams(s ? { status: s } : {});

  const handleStatusChange = async (booking, newStatus) => {
    setActionError('');
    try {
      await adminApi.updateBookingStatus(booking.id, newStatus);
      setData((prev) => prev.map((b) => (b.id === booking.id ? { ...b, status: newStatus } : b)));
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleDelete = async (booking) => {
    const ok = await confirm({
      title: `Delete booking #${booking.id}?`,
      message: `${booking.customer_name} → ${booking.car_name}. This can't be undone.`,
    });
    if (!ok) return;
    setActionError('');
    setDeletingId(booking.id);
    try {
      await adminApi.deleteBooking(booking.id);
      setData((prev) => prev.filter((b) => b.id !== booking.id));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      {dialog}
      <div className="mb-[18px] flex flex-wrap gap-2">
        <FilterPill label="All" active={!status} onClick={() => setStatus('')} />
        {STATUSES.map((s) => <FilterPill key={s} label={s} active={status === s} onClick={() => setStatus(s)} />)}
      </div>

      {actionError && <div className="admin-banner admin-banner-error mb-4">{actionError}</div>}
      {loading && <p>Loading…</p>}
      {error && <p className="field-error">{error}</p>}
      {!loading && !error && (
        bookings.length === 0 ? <p className="text-ink-muted">No bookings here.</p> : (
          <div className="card card-static overflow-x-auto">
            <table className="w-full border-collapse text-[0.85rem]">
              <thead>
                <tr className="text-left text-[0.72rem] text-ink-muted">
                  <th className={th}>#</th><th className={th}>Car</th><th className={th}>Customer</th><th className={th}>Pickup → Return</th>
                  <th className={th}>Total</th><th className={th}>Payment</th><th className={th}>Status</th><th className={th}></th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className={deletingId === b.id ? 'opacity-50' : undefined}>
                    <td className={td}>{b.id}</td>
                    <td className={td}>{b.car_name}</td>
                    <td className={td}>{b.customer_name}<br /><span className="text-[0.78rem] text-ink-muted">{b.customer_phone}<br />{b.customer_email}</span></td>
                    <td className={td}>{new Date(b.pickup_datetime).toLocaleString()}<br />→ {new Date(b.return_datetime).toLocaleString()}</td>
                    <td className={td}>Rs. {Number(b.total_price).toLocaleString()}</td>
                    <td className={td}>
                      {b.payment_method_name || '—'}
                      {b.transaction_reference && (
                        <><br /><span className="text-[0.78rem] text-ink-muted">Ref: {b.transaction_reference}</span></>
                      )}
                    </td>
                    <td className={td}>
                      <select value={b.status} onChange={(e) => handleStatusChange(b, e.target.value)} className="input w-auto px-2 py-1 text-[0.85rem] capitalize">
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className={td}>
                      <button className="btn bg-brand-700 px-3 py-[5px] text-[0.75rem] text-white" onClick={() => handleDelete(b)} disabled={deletingId === b.id}>
                        {deletingId === b.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}

function FilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-[0.8rem] capitalize transition-colors duration-[180ms] ${
        active ? 'border-accent bg-accent text-white' : 'border-line bg-transparent text-ink hover:border-accent'
      }`}
    >
      {label}
    </button>
  );
}

const th = 'border-b border-line px-3 py-2.5 text-left';
const td = 'border-b border-line px-3 py-2.5 align-top';
