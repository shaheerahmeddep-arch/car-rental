import React, { useEffect, useRef, useState } from 'react';
import api from '../services/api';

export default function SearchFilterBar({ filters, onChange }) {
  const [categories, setCategories] = useState([]);
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const searchTimer = useRef(null);

  useEffect(() => {
    api
      .getCategories()
      .then((data) => setCategories(data.results || data))
      .catch(() => setCategories([]));
  }, []);

  // 3 seconds debounce for search
  const handleSearch = (e) => {
    const value = e.target.value;

    setSearchValue(value);

    clearTimeout(searchTimer.current);

    searchTimer.current = setTimeout(() => {
      onChange({
        ...filters,
        search: value,
      });
    }, 1000);
  };

  const set = (field) => (e) =>
    onChange({
      ...filters,
      [field]: e.target.value,
    });

  return (
    <div className="card mb-8 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3.5 p-5">

      {/* Search */}
      <div className="field mb-0">
        <label>Search</label>

        <input
          type="text"
          placeholder="Car name, brand or city"
          value={searchValue}
          onChange={handleSearch}
        />
      </div>

      {/* Category */}
      <div className="field mb-0">
        <label>Category</label>

        <select
          value={filters.category__slug || ''}
          onChange={set('category__slug')}
        >
          <option value="">All categories</option>

          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Minimum Price */}
      <div className="field mb-0">
        <label>Min price / day</label>

        <input
          type="number"
          min="0"
          placeholder="Rs. 0"
          value={filters.rental_price_per_day__gte || ''}
          onChange={set('rental_price_per_day__gte')}
        />
      </div>

      {/* Maximum Price */}
      <div className="field mb-0">
        <label>Max price / day</label>

        <input
          type="number"
          min="0"
          placeholder="No limit"
          value={filters.rental_price_per_day__lte || ''}
          onChange={set('rental_price_per_day__lte')}
        />
      </div>

      {/* Sorting */}
      <div className="field mb-0">
        <label>Sort by</label>

        <select
          value={filters.ordering || ''}
          onChange={set('ordering')}
        >
          <option value="">Newest first</option>

          <option value="rental_price_per_day">
            Price: Low to High
          </option>

          <option value="-rental_price_per_day">
            Price: High to Low
          </option>

          <option value="-model_year">
            Newest model year
          </option>
        </select>
      </div>

    </div>
  );
}