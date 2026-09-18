import React, { useMemo, useState } from 'react';
import './HotelFilters.css';

export const DEFAULT_HOTEL_FILTERS = Object.freeze({
  sort: 'recommended',
  name: '',
  priceMin: 0,
  priceMax: Infinity,
  stars: [],
  minRating: 0,
  breakfast: false,
  refundable: false,
});

const roomSupports = (hotel, key) => Array.isArray(hotel?.preloadedRooms)
  && hotel.preloadedRooms.some(room => Boolean(room?.[key]));

export const getHotelFilterCapabilities = (hotels = []) => ({
  price: hotels.some(hotel => Number(hotel?.price) > 0),
  stars: hotels.some(hotel => Number(hotel?.stars) > 0),
  rating: hotels.some(hotel => Number(hotel?.rating) > 0),
  breakfast: hotels.some(hotel => roomSupports(hotel, 'breakfast')),
  refundable: hotels.some(hotel => roomSupports(hotel, 'refundable')),
});

export const applyHotelFilters = (hotels = [], filters = DEFAULT_HOTEL_FILTERS) => {
  const filtered = hotels.filter(hotel => {
    const name = String(hotel?.name || '').toLowerCase();
    const query = String(filters.name || '').trim().toLowerCase();
    if (query && !name.includes(query)) return false;

    const price = Number(hotel?.price || 0);
    if (filters.priceMin > 0 && (!price || price < filters.priceMin)) return false;
    if (filters.priceMax < Infinity && (!price || price > filters.priceMax)) return false;

    if (filters.stars.length > 0) {
      const stars = Math.round(Number(hotel?.stars || 0));
      if (!filters.stars.includes(stars)) return false;
    }

    if (filters.minRating > 0 && Number(hotel?.rating || 0) < filters.minRating) return false;
    if (filters.breakfast && !roomSupports(hotel, 'breakfast')) return false;
    if (filters.refundable && !roomSupports(hotel, 'refundable')) return false;

    return true;
  });

  if (filters.sort === 'cheapest') {
    return [...filtered].sort((a, b) => Number(a?.price || Infinity) - Number(b?.price || Infinity));
  }
  if (filters.sort === 'rating') {
    return [...filtered].sort((a, b) => Number(b?.rating || 0) - Number(a?.rating || 0));
  }
  if (filters.sort === 'stars') {
    return [...filtered].sort((a, b) => Number(b?.stars || 0) - Number(a?.stars || 0));
  }

  return filtered;
};

const HotelFilters = ({ hotels, filters, onChange, resultCount }) => {
  const [open, setOpen] = useState(false);
  const capabilities = useMemo(() => getHotelFilterCapabilities(hotels), [hotels]);
  const prices = useMemo(() => hotels.map(h => Number(h?.price || 0)).filter(Boolean), [hotels]);
  const minPrice = prices.length ? Math.floor(Math.min(...prices)) : 0;
  const maxPrice = prices.length ? Math.ceil(Math.max(...prices)) : 0;

  const set = (key, value) => onChange({ ...filters, [key]: value });
  const toggleStar = (value) => {
    const next = filters.stars.includes(value)
      ? filters.stars.filter(item => item !== value)
      : [...filters.stars, value];
    set('stars', next);
  };

  const activeCount = [
    Boolean(filters.name),
    filters.priceMin > 0 || filters.priceMax < Infinity,
    filters.stars.length > 0,
    filters.minRating > 0,
    filters.breakfast,
    filters.refundable,
    filters.sort !== 'recommended',
  ].filter(Boolean).length;

  const reset = () => onChange({ ...DEFAULT_HOTEL_FILTERS });

  return (
    <aside className="hf-aside">
      <button type="button" className="hf-mobile-toggle" onClick={() => setOpen(true)}>
        <i className="fa fa-sliders-h" aria-hidden="true" />
        Filters & sort
        {activeCount > 0 && <span className="hf-badge">{activeCount}</span>}
      </button>

      {open && <button type="button" className="hf-backdrop" aria-label="Close filters" onClick={() => setOpen(false)} />}

      <div className={`hf-panel${open ? ' hf-panel--open' : ''}`}>
        <div className="hf-header">
          <strong>Filters & sort</strong>
          <div className="hf-header-actions">
            {activeCount > 0 && <button type="button" onClick={reset}>Reset</button>}
            <button type="button" className="hf-close" aria-label="Close filters" onClick={() => setOpen(false)}>×</button>
          </div>
        </div>

        <div className="hf-section">
          <label className="hf-label" htmlFor="hf-sort">Sort</label>
          <select id="hf-sort" className="hf-select" value={filters.sort} onChange={e => set('sort', e.target.value)}>
            <option value="recommended">Recommended</option>
            {capabilities.price && <option value="cheapest">Cheapest first</option>}
            {capabilities.rating && <option value="rating">Best rated</option>}
            {capabilities.stars && <option value="stars">Highest stars</option>}
          </select>
        </div>

        <div className="hf-section">
          <label className="hf-label" htmlFor="hf-name">Property name</label>
          <input id="hf-name" className="hf-input" type="search" placeholder="Search within results" value={filters.name} onChange={e => set('name', e.target.value)} />
        </div>

        {capabilities.price && (
          <div className="hf-section">
            <div className="hf-label">Price per night</div>
            <div className="hf-price-row">
              <input className="hf-input" type="number" min="0" placeholder={minPrice ? `Min ${minPrice}` : 'Min'} value={filters.priceMin || ''} onChange={e => set('priceMin', e.target.value ? Number(e.target.value) : 0)} />
              <span>to</span>
              <input className="hf-input" type="number" min="0" placeholder={maxPrice ? `Max ${maxPrice}` : 'Max'} value={filters.priceMax < Infinity ? filters.priceMax : ''} onChange={e => set('priceMax', e.target.value ? Number(e.target.value) : Infinity)} />
            </div>
          </div>
        )}

        {capabilities.stars && (
          <div className="hf-section">
            <div className="hf-label">Property class</div>
            <div className="hf-pills">
              {[5, 4, 3, 2, 1].map(value => (
                <button key={value} type="button" className={`hf-pill${filters.stars.includes(value) ? ' hf-pill--active' : ''}`} onClick={() => toggleStar(value)}>
                  {value}★
                </button>
              ))}
            </div>
          </div>
        )}

        {capabilities.rating && (
          <div className="hf-section">
            <div className="hf-label">Guest rating</div>
            <div className="hf-pills">
              {[0, 7, 8, 9].map(value => (
                <button key={value} type="button" className={`hf-pill${filters.minRating === value ? ' hf-pill--active' : ''}`} onClick={() => set('minRating', value)}>
                  {value === 0 ? 'Any' : `${value}+`}
                </button>
              ))}
            </div>
          </div>
        )}

        {(capabilities.breakfast || capabilities.refundable) && (
          <div className="hf-section">
            <div className="hf-label">Booking conditions</div>
            {capabilities.breakfast && (
              <label className="hf-check">
                <input type="checkbox" checked={filters.breakfast} onChange={e => set('breakfast', e.target.checked)} />
                <span>Breakfast available</span>
              </label>
            )}
            {capabilities.refundable && (
              <label className="hf-check">
                <input type="checkbox" checked={filters.refundable} onChange={e => set('refundable', e.target.checked)} />
                <span>Free cancellation available</span>
              </label>
            )}
          </div>
        )}

        <p className="hf-capability-note">Only filters supported by the current live results are shown.</p>

        <div className="hf-mobile-footer">
          <button type="button" onClick={() => setOpen(false)}>Show {resultCount} stay{resultCount === 1 ? '' : 's'}</button>
        </div>
      </div>
    </aside>
  );
};

export default HotelFilters;
