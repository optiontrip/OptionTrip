import React, { useMemo, useState } from 'react';
import './FlightFilters.css';

export const DEFAULT_FILTERS = {
  stops: 'all',
  priceMin: 0,
  priceMax: Infinity,
  airlines: [],
  depTimes: [],
  arrTimes: [],
  maxDuration: null,
  sortBy: 'recommended',
};

const TIME_SLOTS = [
  { id: 'morning', label: 'Morning', sub: '6 - 12', hourMin: 6, hourMax: 12 },
  { id: 'afternoon', label: 'Afternoon', sub: '12 - 18', hourMin: 12, hourMax: 18 },
  { id: 'evening', label: 'Evening', sub: '18 - 24', hourMin: 18, hourMax: 24 },
  { id: 'night', label: 'Night', sub: '0 - 6', hourMin: 0, hourMax: 6 },
];

const getHour = (flight, kind) => {
  const dateValue = kind === 'departure'
    ? (flight.departureAt || flight.departureDateTime)
    : (flight.arrivalAt || flight.arrivalDateTime);
  if (dateValue) {
    const parsed = new Date(dateValue);
    if (!Number.isNaN(parsed.getTime())) return parsed.getHours();
  }
  const timeValue = kind === 'departure' ? flight.departureTime : flight.arrivalTime;
  if (timeValue) {
    const match = String(timeValue).match(/(?:T|^)(\d{1,2}):/);
    if (match) return Number(match[1]);
  }
  return null;
};

const inTimeSlots = (hour, selected) => {
  if (!selected.length || hour === null) return true;
  return selected.some(slotId => {
    const slot = TIME_SLOTS.find(item => item.id === slotId);
    if (!slot) return false;
    return hour >= slot.hourMin && hour < slot.hourMax;
  });
};

const durationValue = (flight) => {
  const direct = Number(flight.durationMinutes);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const text = String(flight.duration || '');
  const hours = Number(text.match(/(\d+)\s*h/i)?.[1] || 0);
  const minutes = Number(text.match(/(\d+)\s*m/i)?.[1] || 0);
  const total = hours * 60 + minutes;
  return total > 0 ? total : null;
};

export function applyFilters(flights, filters = DEFAULT_FILTERS) {
  const filtered = flights.filter(f => {
    if (filters.stops !== 'all') {
      const s = Number(f.stops ?? 0);
      if (filters.stops === '0' && s !== 0) return false;
      if (filters.stops === '1' && s !== 1) return false;
      if (filters.stops === '2+' && s < 2) return false;
    }

    const price = Number(f.price ?? 0);
    if (filters.priceMin > 0 && price < filters.priceMin) return false;
    if (filters.priceMax < Infinity && price > filters.priceMax) return false;

    if (filters.airlines.length > 0) {
      const airline = (f.airline || '').split('|')[0].trim();
      if (!filters.airlines.includes(airline)) return false;
    }

    if (!inTimeSlots(getHour(f, 'departure'), filters.depTimes || [])) return false;
    if (!inTimeSlots(getHour(f, 'arrival'), filters.arrTimes || [])) return false;

    if (filters.maxDuration !== null) {
      const duration = durationValue(f);
      if (duration !== null && duration > filters.maxDuration) return false;
    }
    return true;
  });

  const sorted = [...filtered];
  if (filters.sortBy === 'cheapest') {
    sorted.sort((a, b) => Number(a.price || Infinity) - Number(b.price || Infinity));
  } else if (filters.sortBy === 'fastest') {
    sorted.sort((a, b) => (durationValue(a) ?? Infinity) - (durationValue(b) ?? Infinity) || Number(a.price || Infinity) - Number(b.price || Infinity));
  } else if (filters.sortBy === 'fewest-stops') {
    sorted.sort((a, b) => Number(a.stops ?? Infinity) - Number(b.stops ?? Infinity) || Number(a.price || Infinity) - Number(b.price || Infinity));
  }
  return sorted;
}

const FlightFilters = ({ flights, filters, onChange }) => {
  const [open, setOpen] = useState(false);
  const [showAllAirlines, setShowAllAirlines] = useState(false);

  const stats = useMemo(() => {
    if (!flights.length) return { minPrice: 0, maxPrice: 1000, airlines: [], maxDur: null, hasArrivalTimes: false };
    const prices = flights.map(f => Number(f.price)).filter(v => Number.isFinite(v) && v > 0);
    const durations = flights.map(durationValue).filter(v => v !== null);
    const airlineSet = new Set();
    flights.forEach(f => {
      const airline = (f.airline || '').split('|')[0].trim();
      if (airline) airlineSet.add(airline);
    });
    return {
      minPrice: prices.length ? Math.min(...prices) : 0,
      maxPrice: prices.length ? Math.max(...prices) : 9999,
      airlines: [...airlineSet].sort(),
      maxDur: durations.length ? Math.max(...durations) : null,
      hasArrivalTimes: flights.some(f => getHour(f, 'arrival') !== null),
    };
  }, [flights]);

  const filteredCount = useMemo(() => applyFilters(flights, filters).length, [flights, filters]);
  const set = (key, value) => onChange({ ...filters, [key]: value });

  const toggleListValue = (key, value) => {
    const current = filters[key] || [];
    set(key, current.includes(value) ? current.filter(item => item !== value) : [...current, value]);
  };

  const activeCount = [
    filters.stops !== 'all',
    filters.priceMin > 0 || filters.priceMax < Infinity,
    filters.airlines.length > 0,
    filters.depTimes.length > 0,
    (filters.arrTimes || []).length > 0,
    filters.maxDuration !== null,
    filters.sortBy !== 'recommended',
  ].filter(Boolean).length;

  const resetAll = () => onChange({ ...DEFAULT_FILTERS });
  const maxDurHours = stats.maxDur ? Math.ceil(stats.maxDur / 60) : 24;
  const sliderMax = Math.max(maxDurHours, 1) * 60;
  const visibleAirlines = showAllAirlines ? stats.airlines : stats.airlines.slice(0, 8);

  return (
    <aside className="flf-aside">
      <button className="flf-mobile-toggle" onClick={() => setOpen(true)} type="button">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M6 12h12M9 18h6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
        Filters & sort
        {activeCount > 0 && <span className="flf-badge">{activeCount}</span>}
        <span className="flf-mobile-count">{filteredCount} results</span>
      </button>

      {open && <button className="flf-backdrop" type="button" aria-label="Close filters" onClick={() => setOpen(false)} />}

      <div className={`flf-panel${open ? ' flf-panel--open' : ''}`}>
        <div className="flf-header">
          <div>
            <span className="flf-header__title">Filters & sort</span>
            <span className="flf-header__count">{filteredCount} of {flights.length} results</span>
          </div>
          <div className="flf-header__actions">
            {activeCount > 0 && <button className="flf-reset" onClick={resetAll} type="button">Reset all</button>}
            <button className="flf-close" type="button" onClick={() => setOpen(false)} aria-label="Close filters">×</button>
          </div>
        </div>

        <div className="flf-section flf-section--sort">
          <div className="flf-section__label">Sort by</div>
          <div className="flf-sort-grid">
            {[
              ['recommended', 'Recommended'],
              ['cheapest', 'Cheapest'],
              ['fastest', 'Fastest'],
              ['fewest-stops', 'Fewest stops'],
            ].map(([value, label]) => (
              <button key={value} className={`flf-sort-pill${filters.sortBy === value ? ' flf-sort-pill--active' : ''}`} onClick={() => set('sortBy', value)} type="button">{label}</button>
            ))}
          </div>
        </div>

        <div className="flf-section">
          <div className="flf-section__label">Stops</div>
          <div className="flf-stops">
            {[
              ['all', 'Any'], ['0', 'Non-stop'], ['1', '1 stop'], ['2+', '2+ stops'],
            ].map(([value, label]) => (
              <button key={value} className={`flf-stop-pill${filters.stops === value ? ' flf-stop-pill--active' : ''}`} onClick={() => set('stops', value)} type="button">{label}</button>
            ))}
          </div>
        </div>

        <div className="flf-section">
          <div className="flf-section__label">Price</div>
          <div className="flf-price-row">
            <div className="flf-price-field">
              <label className="flf-price-label">Min</label>
              <input className="flf-price-input" type="number" min={0} max={filters.priceMax < Infinity ? filters.priceMax : undefined}
                placeholder={`${stats.minPrice}`} value={filters.priceMin > 0 ? filters.priceMin : ''}
                onChange={e => set('priceMin', e.target.value ? Number(e.target.value) : 0)} />
            </div>
            <span className="flf-price-dash">-</span>
            <div className="flf-price-field">
              <label className="flf-price-label">Max</label>
              <input className="flf-price-input" type="number" min={filters.priceMin} placeholder={`${stats.maxPrice}`}
                value={filters.priceMax < Infinity ? filters.priceMax : ''}
                onChange={e => set('priceMax', e.target.value ? Number(e.target.value) : Infinity)} />
            </div>
          </div>
        </div>

        {stats.airlines.length > 0 && (
          <div className="flf-section">
            <div className="flf-section__label">Airlines</div>
            <div className="flf-airlines">
              {visibleAirlines.map(airline => (
                <label key={airline} className="flf-checkbox-row">
                  <input type="checkbox" className="flf-checkbox" checked={filters.airlines.includes(airline)} onChange={() => toggleListValue('airlines', airline)} />
                  <span className="flf-checkbox-label">{airline}</span>
                </label>
              ))}
            </div>
            {stats.airlines.length > 8 && (
              <button className="flf-show-more" type="button" onClick={() => setShowAllAirlines(v => !v)}>{showAllAirlines ? 'Show fewer airlines' : `Show all ${stats.airlines.length} airlines`}</button>
            )}
          </div>
        )}

        <div className="flf-section">
          <div className="flf-section__label">Departure time</div>
          <div className="flf-time-grid">
            {TIME_SLOTS.map(slot => (
              <button key={slot.id} className={`flf-time-pill${filters.depTimes.includes(slot.id) ? ' flf-time-pill--active' : ''}`} onClick={() => toggleListValue('depTimes', slot.id)} type="button">
                <span className="flf-time-pill__name">{slot.label}</span><span className="flf-time-pill__sub">{slot.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {stats.hasArrivalTimes && (
          <div className="flf-section">
            <div className="flf-section__label">Arrival time</div>
            <div className="flf-time-grid">
              {TIME_SLOTS.map(slot => (
                <button key={slot.id} className={`flf-time-pill${(filters.arrTimes || []).includes(slot.id) ? ' flf-time-pill--active' : ''}`} onClick={() => toggleListValue('arrTimes', slot.id)} type="button">
                  <span className="flf-time-pill__name">{slot.label}</span><span className="flf-time-pill__sub">{slot.sub}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {stats.maxDur && (
          <div className="flf-section">
            <div className="flf-section__label">Max duration {filters.maxDuration !== null ? `- ${Math.floor(filters.maxDuration / 60)}h ${filters.maxDuration % 60}m` : '- Any'}</div>
            <input className="flf-slider" type="range" min={60} max={sliderMax} step={30} value={filters.maxDuration ?? sliderMax}
              onChange={e => { const val = Number(e.target.value); set('maxDuration', val >= sliderMax ? null : val); }} />
            <div className="flf-slider-labels"><span>1h</span><span>{Math.ceil(sliderMax / 60)}h</span></div>
          </div>
        )}

        <div className="flf-mobile-footer">
          <button type="button" onClick={() => setOpen(false)}>Show {filteredCount} flight{filteredCount === 1 ? '' : 's'}</button>
        </div>
      </div>
    </aside>
  );
};

export default FlightFilters;
