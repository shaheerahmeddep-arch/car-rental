import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import useReveal from './useReveal';

export default function CategoryGrid() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const ref = useReveal();

 useEffect(() => {
  api.getCategories()
    .then((data) => {
      console.log("Categories API response:", data);
      setCategories(data.results || data);
    })
    .catch((error) => {
      console.error("Categories API error:", error);
      setCategories([]);
    })
    .finally(() => setLoading(false));
}, []);

  return (
    <section className="section section-dark">
      <div className="container">
        <div className="section-head">
          <h2>Vehicle categories</h2>
          <p>From compact city cars to rugged pickups — pick the type that suits your trip.</p>
        </div>
        {loading ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-[18px]">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-[110px]" />)}
          </div>
        ) : (
      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-[18px]">
  {categories.map((c) => (
    <Link
      key={c.id}
      to={`/cars?category=${c.slug}`}
      className="card p-[22px] text-center"
    >
      <div className="mb-2 text-[1.8rem]">
        {c.icon ||
          (c.name?.toLowerCase().includes('bike') ? '🏍️' : '🚘')}
      </div>

      <div className="font-semibold">{c.name}</div>

      <div className="mt-1 text-[0.78rem] text-ink-muted">
        {c.car_count} vehicle{c.car_count === 1 ? '' : 's'}
      </div>
    </Link>
  ))}
</div>
        )}
      </div>
    </section>
  );
}
