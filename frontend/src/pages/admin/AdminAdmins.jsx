import React, { useState } from 'react';
import adminApi from '../../services/adminApi';
import { useAdminAuth } from '../../context/AdminAuthContext';
import useLoad from './useLoad';
import { useConfirm } from '../../components/ConfirmDialog';

export default function AdminAdmins() {
  const { admin } = useAdminAuth();
  const { data: admins, loading, error, setData } = useLoad(() => adminApi.getAdmins(), []);
  const { confirm, dialog } = useConfirm();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);

  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  const [actionError, setActionError] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    setAddError('');
    setAdding(true);
    try {
      const created = await adminApi.addAdmin({ username, password });
      setData((prev) => [...prev, created]);
      setUsername(''); setPassword('');
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (a) => {
    const ok = await confirm({
      title: `Remove admin "${a.username}"?`,
      message: 'They will immediately lose access to the admin dashboard.',
      confirmLabel: 'Remove admin',
    });
    if (!ok) return;
    setActionError('');
    try {
      await adminApi.deleteAdmin(a.id);
      setData((prev) => prev.filter((x) => x.id !== a.id));
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError(''); setPwMsg('');
    setChangingPw(true);
    try {
      const res = await adminApi.changePassword({ old: oldPw, new: newPw });
      setPwMsg(res.detail || 'Password changed.');
      setOldPw(''); setNewPw('');
    } catch (err) {
      setPwError(err.message);
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div className="grid-2 items-start">
      {dialog}
      <div className="card card-static p-[22px]">
        <h3>Admin accounts</h3>
        {loading && <p>Loading…</p>}
        {error && <p className="field-error">{error}</p>}
        {actionError && <div className="admin-banner admin-banner-error mb-3">{actionError}</div>}
        {!loading && !error && admins.map((a) => (
          <div key={a.id} className="mb-2 flex items-center justify-between text-[0.9rem]">
            <span>
              <strong>{a.username}</strong>
              {a.username === admin?.username && <span className="text-[0.78rem] text-ink-muted"> (you)</span>}
            </span>
            {a.username !== admin?.username && (
              <button className="btn btn-ghost px-3 py-1 text-[0.75rem]" onClick={() => handleDelete(a)}>Remove</button>
            )}
          </div>
        ))}
        <h4 className="mt-[18px] text-[0.9rem]">Add another admin</h4>
        <form onSubmit={handleAdd} className="flex flex-col gap-2">
          <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required />
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (6+ characters)" required minLength={6} />
          <button className="btn btn-primary self-start" disabled={adding}>{adding ? 'Adding…' : 'Add admin'}</button>
        </form>
        {addError && <p className="field-error mt-2">{addError}</p>}
      </div>

      <div className="card card-static p-[22px]">
        <h3>Change my password</h3>
        <form onSubmit={handleChangePassword}>
          <div className="field"><label>Current password</label><input type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} required /></div>
          <div className="field"><label>New password</label><input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={6} /></div>
          <button className="btn btn-primary" disabled={changingPw}>{changingPw ? 'Saving…' : 'Change password'}</button>
        </form>
        {pwMsg && <p className="mt-2.5 text-success">{pwMsg}</p>}
        {pwError && <p className="field-error mt-2.5">{pwError}</p>}
      </div>
    </div>
  );
}
