import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import useLoad from './useLoad';
import { useConfirm } from '../../components/ConfirmDialog';

export default function AdminCars() {
  const { data: cars, loading, error, setData } = useLoad(() => adminApi.getCars(), []);
  const { confirm, dialog } = useConfirm();
  const [search, setSearch] = useState('');
  const [actionError, setActionError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cars;
    return cars.filter((c) =>
      `${c.name} ${c.brand} ${c.model} ${c.category_name}`.toLowerCase().includes(q)
    );
  }, [cars, search]);

  const handleDelete = async (car) => {
    const ok = await confirm({
      title: `Delete "${car.name}"?`,
      message: 'The car, its photos and its bookings will be permanently removed. This can\'t be undone.',
    });
    if (!ok) return;
    setActionError('');
    setDeletingId(car.id);
    try {
      await adminApi.deleteCar(car.id);
      setData((prev) => prev.filter((c) => c.id !== car.id));
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
      <div className="mb-[18px] flex flex-wrap items-center gap-3">
        <Link className="btn btn-primary" to="/admin/cars/new">+ Add new car</Link>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, brand or category…"
          className="input w-auto min-w-[200px] flex-1"
        />
      </div>
      {actionError && <div className="admin-banner admin-banner-error mb-4">{actionError}</div>}

      <div className="card card-static overflow-x-auto">
        <table className="w-full border-collapse text-[0.88rem]">
          <thead>
            <tr className="text-left text-[0.75rem] text-ink-muted">
              <th className={th}>Car</th><th className={th}>Category</th><th className={th}>Price/day</th>
              <th className={th}>Condition</th><th className={th}>Photos</th><th className={th}>Visible</th><th className={th}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className={deletingId === c.id ? 'opacity-50' : undefined}>
                <td className={td}>{c.name}</td>
                <td className={td}>{c.category_name}</td>
                <td className={td}>Rs. {Number(c.rental_price_per_day).toLocaleString()}</td>
                <td className={td}>{c.condition}</td>
                <td className={td}>{c.images.length}</td>
                <td className={td}>{c.is_active ? 'Yes' : 'Hidden'}</td>
                <td className={`${td} flex gap-2`}>
                  <Link className="btn btn-ghost px-3.5 py-1.5 text-[0.8rem]" to={`/cars/${c.id}`}>View</Link>
                  <Link className="btn btn-ghost px-3.5 py-1.5 text-[0.8rem]" to={`/admin/cars/${c.id}`}>Edit</Link>
                  <button className="btn bg-brand-700 px-3.5 py-1.5 text-[0.8rem] text-white" onClick={() => handleDelete(c)} disabled={deletingId === c.id}>
                    {deletingId === c.id ? 'Deleting…' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td className={td} colSpan={7}>
                {cars.length === 0 ? 'No cars yet.' : 'No cars match your search.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th = 'border-b border-line px-3.5 py-2.5 text-left';
const td = 'border-b border-line px-3.5 py-2.5';
