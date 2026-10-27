import React, { useState } from 'react';
import adminApi from '../../services/adminApi';
import useLoad from './useLoad';
import { useConfirm } from '../../components/ConfirmDialog';

export default function AdminMessages() {
  const { data: messages, loading, error, setData } = useLoad(() => adminApi.getMessages(), []);
  const { confirm, dialog } = useConfirm();
  const [actionError, setActionError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const handleRead = async (m) => {
    setActionError('');
    try {
      const updated = await adminApi.markMessageRead(m.id);
      setData((prev) => prev.map((x) => (x.id === m.id ? updated : x)));
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleDelete = async (m) => {
    const ok = await confirm({
      title: 'Delete this message?',
      message: `From ${m.name} (${m.email}). This can't be undone.`,
    });
    if (!ok) return;
    setActionError('');
    setDeletingId(m.id);
    try {
      await adminApi.deleteMessage(m.id);
      setData((prev) => prev.filter((x) => x.id !== m.id));
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
      {messages.length === 0 ? <p className="text-ink-muted">No messages yet.</p> : (
        <div className="flex flex-col gap-3.5">
          {messages.map((m) => (
            <div key={m.id} className={`card card-static p-5 ${deletingId === m.id ? 'opacity-50' : ''}`}>
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <strong>{m.name}</strong>{' '}
                  <span className="text-[0.8rem] text-ink-muted">{m.email} · {new Date(m.created_at).toLocaleString()}</span>
                  {!m.is_read && <span className="ml-2 text-[0.72rem] font-bold text-accent">NEW</span>}
                </div>
                <div className="flex gap-1.5">
                  {!m.is_read && <button className="btn btn-ghost px-3 py-[5px] text-[0.75rem]" onClick={() => handleRead(m)}>Mark as read</button>}
                  <button className="btn bg-brand-700 px-3 py-[5px] text-[0.75rem] text-white" onClick={() => handleDelete(m)} disabled={deletingId === m.id}>
                    {deletingId === m.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
              <p className="mb-0 mt-2.5 whitespace-pre-line">{m.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
