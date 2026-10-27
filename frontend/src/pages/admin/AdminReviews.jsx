import React, { useState } from 'react';
import adminApi from '../../services/adminApi';
import useLoad from './useLoad';
import { useConfirm } from '../../components/ConfirmDialog';

const STAR = '#f5a623';

function Stars({ value }) {
  return (
    <span className="text-[0.95rem]" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ color: i <= value ? STAR : 'rgba(128,128,128,0.35)' }}>★</span>
      ))}
    </span>
  );
}

export default function AdminReviews() {
  const { data: reviews, loading, error, setData } = useLoad(() => adminApi.getReviews(), []);
  const { confirm, dialog } = useConfirm();
  const [actionError, setActionError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (r) => {
    const ok = await confirm({
      title: 'Delete this review?',
      message: `Review by ${r.name}. This can't be undone.`,
    });
    if (!ok) return;
    setActionError('');
    setDeletingId(r.id);
    try {
      await adminApi.deleteReview(r.id);
      setData((prev) => prev.filter((x) => x.id !== r.id));
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
      {reviews.length === 0 ? <p className="text-ink-muted">No reviews yet.</p> : (
        <div className="flex flex-col gap-3.5">
          {reviews.map((r) => (
            <div key={r.id} className={`card card-static p-5 ${deletingId === r.id ? 'opacity-50' : ''}`}>
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <strong>{r.name}</strong>{' '}
                  <span className="text-[0.8rem] text-ink-muted">
                    {r.location ? `${r.location} · ` : ''}{new Date(r.created_at).toLocaleString()}
                  </span>
                  <div className="mt-1"><Stars value={r.rating} /></div>
                </div>
                <button
                  className="btn bg-brand-700 px-3 py-[5px] text-[0.75rem] text-white"
                  onClick={() => handleDelete(r)}
                  disabled={deletingId === r.id}
                >
                  {deletingId === r.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
              <p className="mb-0 mt-2.5 whitespace-pre-line">{r.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
