import React, { useState } from 'react';
import adminApi from '../../services/adminApi';
import useLoad from './useLoad';
import { useConfirm } from '../../components/ConfirmDialog';

export default function AdminSettings() {
  const { confirm, dialog } = useConfirm();

  return (
    <div className="grid-2 items-start">
      {dialog}
      <CategoriesPanel confirm={confirm} />
      <PaymentMethodsPanel confirm={confirm} />
    </div>
  );
}

function CategoriesPanel({ confirm }) {
  const { data: categories, loading, error, setData } = useLoad(() => adminApi.getCategories(), []);
  const [name, setName] = useState('');
  const [formError, setFormError] = useState('');
  const [actionError, setActionError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const created = await adminApi.createCategory({ name });
      setData((prev) => [...prev, created]);
      setName('');
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat) => {
    const ok = await confirm({
      title: `Delete category "${cat.name}"?`,
      message: cat.car_count > 0
        ? `${cat.car_count} car${cat.car_count === 1 ? ' uses' : 's use'} this category — reassign them first, or the delete will fail.`
        : 'This can\'t be undone.',
    });
    if (!ok) return;
    setActionError('');
    try {
      await adminApi.deleteCategory(cat.id);
      setData((prev) => prev.filter((c) => c.id !== cat.id));
    } catch (err) {
      setActionError(err.message);
    }
  };

  return (
    <div className="card card-static p-[22px]">
      <h3>Categories</h3>
      {loading && <p>Loading…</p>}
      {error && <p className="field-error">{error}</p>}
      {actionError && <div className="admin-banner admin-banner-error mb-3">{actionError}</div>}
      {!loading && !error && categories.map((c) => (
        <div key={c.id} className="mb-2 flex items-center justify-between gap-2 text-[0.9rem]">
          <span>{c.name} <span className="text-[0.78rem] text-ink-muted">({c.car_count} car{c.car_count === 1 ? '' : 's'})</span></span>
          <button className="btn btn-ghost px-3 py-1 text-[0.75rem]" onClick={() => handleDelete(c)}>Delete</button>
        </div>
      ))}
      <form onSubmit={handleAdd} className="mt-3.5 flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New category name" required className="input flex-1" />
        <button className="btn btn-primary px-[18px] py-2.5" disabled={saving}>Add</button>
      </form>
      {formError && <p className="field-error mt-2">{formError}</p>}
    </div>
  );
}

function PaymentMethodsPanel({ confirm }) {
  const { data: methods, loading, error, setData } = useLoad(() => adminApi.getPaymentMethods(), []);
  const [form, setForm] = useState({ name: '', instructions: '', account_holder: '', account_number: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ instructions: '', account_holder: '', account_number: '' });
  const [formError, setFormError] = useState('');
  const [editError, setEditError] = useState('');
  const [actionError, setActionError] = useState('');
  const [saving, setSaving] = useState(false);

  const updateForm = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const updateEdit = (field) => (e) => setEditForm((f) => ({ ...f, [field]: e.target.value }));

  const handleAdd = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const created = await adminApi.createPaymentMethod(form);
      setData((prev) => [...prev, created]);
      setForm({ name: '', instructions: '', account_holder: '', account_number: '' });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (m) => {
    setEditError('');
    setEditingId(m.id);
    setEditForm({
      instructions: m.instructions || '',
      account_holder: m.account_holder || '',
      account_number: m.account_number || '',
    });
  };

  const handleEditSave = async (e, m) => {
    e.preventDefault();
    setEditError('');
    setSaving(true);
    try {
      const updated = await adminApi.updatePaymentMethod(m.id, editForm);
      setData((prev) => prev.map((x) => (x.id === m.id ? updated : x)));
      setEditingId(null);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (m) => {
    setActionError('');
    try {
      const updated = await adminApi.updatePaymentMethod(m.id, { is_enabled: !m.is_enabled });
      setData((prev) => prev.map((x) => (x.id === m.id ? updated : x)));
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleDelete = async (m) => {
    const ok = await confirm({
      title: `Delete payment method "${m.name}"?`,
      message: 'Customers will no longer see it as an option at checkout. This can\'t be undone.',
    });
    if (!ok) return;
    setActionError('');
    try {
      await adminApi.deletePaymentMethod(m.id);
      setData((prev) => prev.filter((x) => x.id !== m.id));
      if (editingId === m.id) setEditingId(null);
    } catch (err) {
      setActionError(err.message);
    }
  };

  return (
    <div className="card card-static p-[22px]">
      <h3>Payment methods</h3>
      <p className="mb-3.5 text-[0.82rem] text-ink-muted">
        Set the account holder, account number and instructions a customer sees when they pick this
        method. The same number can be used on several methods.
      </p>
      {loading && <p>Loading…</p>}
      {error && <p className="field-error">{error}</p>}
      {actionError && <div className="admin-banner admin-banner-error mb-3">{actionError}</div>}
      {!loading && !error && methods.map((m) => (
        <div key={m.id} className="mb-2.5 rounded-[10px] border border-line p-3">
          <div className="flex items-center justify-between gap-2 text-[0.9rem]">
            <span>
              <strong>{m.name}</strong>{' '}
              <span className={`ml-1 rounded-full px-2 py-0.5 text-[0.7rem] font-bold ${m.is_enabled ? 'bg-success/15 text-success' : 'bg-accent/10 text-accent'}`}>{m.is_enabled ? 'ON' : 'OFF'}</span>
            </span>
            <span className="flex gap-1.5">
              {editingId === m.id ? (
                <button className="btn btn-ghost px-3 py-1 text-[0.75rem]" onClick={() => setEditingId(null)}>Close</button>
              ) : (
                <button className="btn btn-ghost px-3 py-1 text-[0.75rem]" onClick={() => startEdit(m)}>Edit</button>
              )}
              <button className="btn btn-ghost px-3 py-1 text-[0.75rem]" onClick={() => handleToggle(m)}>{m.is_enabled ? 'Disable' : 'Enable'}</button>
              <button className="btn btn-ghost px-3 py-1 text-[0.75rem]" onClick={() => handleDelete(m)}>Delete</button>
            </span>
          </div>
          {(m.account_holder || m.account_number) ? (
            <div className="mt-1.5 text-[0.8rem] text-ink-muted">
              {m.account_holder && <>Holder: <strong className="text-ink-soft">{m.account_holder}</strong></>}
              {m.account_holder && m.account_number && ' · '}
              {m.account_number && <>No: <strong className="text-ink-soft">{m.account_number}</strong></>}
            </div>
          ) : (
            <div className="mt-1.5 text-[0.8rem] text-ink-muted">No account details configured.</div>
          )}
          {editingId === m.id && (
            <form onSubmit={(e) => handleEditSave(e, m)} className="mt-2.5 flex flex-col gap-2">
              <input value={editForm.account_holder} onChange={updateEdit('account_holder')} placeholder="Account holder name" className="input" />
              <input value={editForm.account_number} onChange={updateEdit('account_number')} placeholder="Account / mobile number" className="input" />
              <input value={editForm.instructions} onChange={updateEdit('instructions')} placeholder="Instructions shown to customer" className="input" />
              <div className="flex gap-2">
                <button className="btn btn-primary px-[18px] py-2 text-[0.82rem]" disabled={saving}>Save details</button>
                <button type="button" className="btn btn-ghost px-[18px] py-2 text-[0.82rem]" onClick={() => setEditingId(null)}>Cancel</button>
              </div>
              {editError && <p className="field-error">{editError}</p>}
            </form>
          )}
        </div>
      ))}
      <form onSubmit={handleAdd} className="mt-3.5 flex flex-col gap-2 border-t border-line pt-3.5">
        <label className="text-[0.82rem] font-semibold text-ink-soft">Add a new payment method</label>
        <input value={form.name} onChange={updateForm('name')} placeholder="Method name, e.g. EasyPaisa" required className="input" />
        <input value={form.account_holder} onChange={updateForm('account_holder')} placeholder="Account holder name (optional)" className="input" />
        <input value={form.account_number} onChange={updateForm('account_number')} placeholder="Account / mobile number (optional)" className="input" />
        <input value={form.instructions} onChange={updateForm('instructions')} placeholder="Instructions shown to customer" className="input" />
        <button className="btn btn-primary self-start" disabled={saving}>Add payment method</button>
      </form>
      {formError && <p className="field-error mt-2">{formError}</p>}
    </div>
  );
}
