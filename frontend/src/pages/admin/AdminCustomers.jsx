import React, { useState } from 'react';
import adminApi from '../../services/adminApi';
import useLoad from './useLoad';
import { useConfirm } from '../../components/ConfirmDialog';

export default function AdminCustomers() {
  const { data: customers, loading, error, setData } = useLoad(() => adminApi.getCustomers(), []);
  const { confirm, dialog } = useConfirm();
  const [actionError, setActionError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (c) => {
    const ok = await confirm({
      title: `Delete the account for ${c.full_name}?`,
      message: `${c.email} and their ${c.booking_count} booking${c.booking_count === 1 ? '' : 's'} will be permanently removed.`,
    });
    if (!ok) return;
    setActionError('');
    setDeletingId(c.id);
    try {
      await adminApi.deleteCustomer(c.id);
      setData((prev) => prev.filter((x) => x.id !== c.id));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="field-error">{error}</p>;

  return (
    <div>
      {dialog}
      {actionError && <div className="admin-banner admin-banner-error mb-4">{actionError}</div>}
      {customers.length === 0 ? (
        <p className="text-ink-muted">No customers have registered yet.</p>
      ) : (
        <div className="card card-static overflow-x-auto">
          <table className="w-full border-collapse text-[0.88rem]">
            <thead>
              <tr className="text-left text-[0.75rem] text-ink-muted">
                <th className={th}>Name</th><th className={th}>Email</th><th className={th}>Bookings</th><th className={th}>Joined</th><th className={th}></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className={deletingId === c.id ? 'opacity-50' : undefined}>
                  <td className={td}>{c.full_name}</td>
                  <td className={td}>{c.email}</td>
                  <td className={td}>{c.booking_count}</td>
                  <td className={td}>{new Date(c.date_joined).toLocaleDateString()}</td>
                  <td className={td}>
                    <button className="btn bg-brand-700 px-3 py-[5px] text-[0.75rem] text-white" onClick={() => handleDelete(c)} disabled={deletingId === c.id}>
                      {deletingId === c.id ? 'Deleting…' : 'Delete'}
                    </button>
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
