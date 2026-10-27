import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import CarCard from '../components/CarCard';
import SearchFilterBar from '../components/SearchFilterBar';
import api from '../services/api';

export default function CarsPage() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    category__slug: searchParams.get('category') || '',
  });
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api.getCars(filters)
      .then((data) => setCars(data.results || data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filters]);

  return (
    <section className="section">
      <div className="container">
        <div className="section-head max-w-none">
          <h2>Browse our fleet</h2>
          <p>Search, filter and compare vehicles available in Lahore.</p>
        </div>

        <SearchFilterBar filters={filters} onChange={setFilters} />

        {error && <p className="field-error">{error}</p>}

        {loading ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-6 ">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-[220px]" />)}
          </div>
        ) : cars.length === 0 ? (
          <div className="card p-10 text-center text-ink-muted">
            No cars match those filters right now. Try widening your search.
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-6">
            {cars.map((car) => <CarCard key={car.id} car={car} />)}
          </div>
        )}
      </div>
    </section>
  );
}
