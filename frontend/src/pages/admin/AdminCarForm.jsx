import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import { useConfirm } from '../../components/ConfirmDialog';

const CONDITIONS = ['excellent', 'very_good', 'good', 'fair'];
const TRANSMISSIONS = ['automatic', 'manual'];
const FUELS = ['petrol', 'diesel', 'hybrid', 'electric', 'cng'];

const blank = {
  name: '', brand: '', model: '', model_year: new Date().getFullYear(),
  category: '', rental_price_per_day: '', description: '', condition: 'good',
  condition_description: '', seating_capacity: 5, transmission: 'automatic',
  fuel_type: 'petrol', air_conditioning: true, features: '',
  location: 'Lahore, Pakistan', is_active: true,
};

export default function AdminCarForm() {
  const { id } = useParams();
  // Static route "cars/new" passes no :id param (undefined), and the dynamic
  // route passes the literal string 'new' — both mean a brand-new car.
  const isNew = !id || id === 'new';
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(blank);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [savedMsg, setSavedMsg] = useState('');
  const { confirm, dialog } = useConfirm();

  useEffect(() => {
    adminApi.getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (isNew) return;
    adminApi.getCar(id)
      .then((car) => {
        setForm({ ...car, air_conditioning: car.air_conditioning ?? true, category: car.category });
        setImages(car.images);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const update = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSavedMsg('');
    setSaving(true);
    try {
      const payload = { ...form, category: Number(form.category), model: (form.model || '').trim() };
      delete payload.images;
      delete payload.category_name;
      if (isNew) {
        const created = await adminApi.createCar(payload);
        navigate(`/admin/cars/${created.id}`, { replace: true });
      } else {
        await adminApi.updateCar(id, payload);
        setSavedMsg('Car saved successfully.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setError('');
    try {
      for (const file of files) {
        const img = await adminApi.uploadImage(id, file);
        setImages((prev) => [...prev, img]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteImage = async (imgId) => {
    const ok = await confirm({
      title: 'Delete this photo?',
      message: 'The image file will be permanently removed from the server.',
      confirmLabel: 'Delete photo',
    });
    if (!ok) return;
    setError('');
    try {
      await adminApi.deleteImage(imgId);
      setImages((prev) => prev.filter((i) => i.id !== imgId));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMakePrimary = async (imgId) => {
    setError('');
    try {
      await adminApi.makeImagePrimary(imgId);
      setImages((prev) => prev.map((i) => ({ ...i, is_primary: i.id === imgId })));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p>Loading…</p>;

  return (
    <div className="max-w-[720px]">
      {dialog}
      <h2>{isNew ? 'Add a new car' : `Edit ${form.name}`}</h2>
      {savedMsg && <div className="admin-banner admin-banner-success mb-4">{savedMsg}</div>}
      <form className="card card-static p-6" onSubmit={handleSubmit}>
        <div className="field"><label>Car name</label>
          <input value={form.name} onChange={update('name')} placeholder="Honda Civic 2023" required /></div>
        <div className="field"><label>Brand</label><input value={form.brand} onChange={update('brand')} placeholder="Toyota, Honda, Suzuki…" required /></div>
        <div className="grid-2">
          <div className="field"><label>Model year</label><input type="number" value={form.model_year} onChange={update('model_year')} required /></div>
          <div className="field"><label>Category</label>
            <select value={form.category} onChange={update('category')} required>
              <option value="">Select a category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid-2">
          <div className="field"><label>Price per day (Rs.)</label><input type="number" value={form.rental_price_per_day} onChange={update('rental_price_per_day')} required /></div>
          <div className="field"><label>Condition</label>
            <select value={form.condition} onChange={update('condition')}>
              {CONDITIONS.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
            </select>
          </div>
        </div>
        <div className="field"><label>Condition details</label>
          <textarea rows={2} value={form.condition_description} onChange={update('condition_description')} /></div>
        <div className="field"><label>Description</label>
          <textarea rows={3} value={form.description} onChange={update('description')} /></div>
        <div className="grid-2">
          <div className="field"><label>Seats</label><input type="number" value={form.seating_capacity} onChange={update('seating_capacity')} /></div>
          <div className="field"><label>Transmission</label>
            <select value={form.transmission} onChange={update('transmission')}>
              {TRANSMISSIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="grid-2">
          <div className="field"><label>Fuel</label>
            <select value={form.fuel_type} onChange={update('fuel_type')}>
              {FUELS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="field"><label>Location</label><input value={form.location} onChange={update('location')} /></div>
        </div>
        <div className="field"><label>Features (comma-separated)</label>
          <input value={form.features} onChange={update('features')} placeholder="AC, Bluetooth, Sunroof" /></div>
        <label className="mb-[18px] flex cursor-pointer items-center gap-2 font-medium text-ink">
          <input type="checkbox" checked={Boolean(form.air_conditioning)} onChange={update('air_conditioning')} className="h-4 w-4 accent-[var(--accent)]" />
          Air conditioning available
        </label>
        <label className="mb-[18px] flex cursor-pointer items-center gap-2 font-medium text-ink">
          <input type="checkbox" checked={form.is_active} onChange={update('is_active')} className="h-4 w-4 accent-[var(--accent)]" />
          Show this car on the website
        </label>

        {isNew && (
          <p className="mb-3.5 text-[0.85rem] text-ink-muted">
            Save the car first — the photo uploader appears right below once it's created.
          </p>
        )}
        {error && <p className="field-error mb-3.5">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? 'Saving…' : isNew ? 'Save car and continue to photos' : 'Save car'}
        </button>
      </form>

      {!isNew && (
        <div className="card card-static mt-5 p-6">
          <h3>Photos</h3>
          {images.length === 0 && (
            <p className="mb-3.5 text-[0.85rem] text-ink-muted">
              No photos yet — add 4 or 5 below so this car shows a gallery on the website.
            </p>
          )}
          {images.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-3">
              {images.map((img) => (
                <div key={img.id} className="w-[130px]">
                  <img src={img.image} alt={img.caption || form.name} className={`h-[90px] w-full rounded-[8px] object-cover ${img.is_primary ? 'border-2 border-accent' : 'border border-line'}`} />
                  <div className="mt-1.5 flex gap-1.5">
                    {!img.is_primary && <button type="button" onClick={() => handleMakePrimary(img.id)} className="btn btn-ghost px-2 py-[3px] text-[0.7rem]">Set cover</button>}
                    <button type="button" onClick={() => handleDeleteImage(img.id)} className="btn bg-brand-700 px-2 py-[3px] text-[0.7rem] text-white">Delete</button>
                  </div>
                  {img.is_primary && <div className="mt-0.5 text-[0.68rem] text-accent">Cover photo</div>}
                </div>
              ))}
            </div>
          )}
          <label className="mb-2 block text-[0.85rem] font-semibold text-ink-soft">Add photos (select several at once — 4 or 5+ works best)</label>
          <input type="file" accept="image/*" multiple onChange={handleUpload} disabled={uploading}
            className="block w-full text-[0.85rem] text-ink-soft file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-accent-strong disabled:opacity-60" />
          {uploading && <p className="mt-2 text-[0.85rem]">Uploading…</p>}
        </div>
      )}
    </div>
  );
}
