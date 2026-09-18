import React, { useState, useEffect, useRef } from 'react';
import { searchAirports } from '../../services/flightService';
import TripDatePicker from '../TripDatePicker/TripDatePicker';
import PassengerSelector from '../PassengerSelector/PassengerSelector';
import './FlightSearchForm.css';

const today = new Date().toISOString().split('T')[0];

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const AirportInput = ({ label, placeholder, value, iataCode, onChange, onSelect, error, onExploreAnywhere }) => {
  const [query,       setQuery]       = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [open,        setOpen]        = useState(false);
  const [selected,    setSelected]    = useState(!!iataCode);
  const requestIdRef = useRef(0);
  const wrapRef = useRef(null);
  const debounced = useDebounce(query, 250);

  useEffect(() => {
    setQuery(value || '');
    setSelected(!!iataCode);
  }, [value, iataCode]);

  useEffect(() => {
    if (selected || debounced.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      if (!onExploreAnywhere) setOpen(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    searchAirports(debounced).then(results => {
      if (requestId !== requestIdRef.current) return;
      setSuggestions((results || []).slice(0, 10));
      setOpen(true);
    }).catch(() => {
      if (requestId !== requestIdRef.current) return;
      setSuggestions([]);
      setOpen(true);
    }).finally(() => {
      if (requestId === requestIdRef.current) setLoading(false);
    });
  }, [debounced, selected, onExploreAnywhere]);

  useEffect(() => {
    const handler = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, []);

  const handleChange = (e) => {
    requestIdRef.current += 1;
    setQuery(e.target.value);
    setSelected(false);
    onChange('', e.target.value);
  };

  const handleSelect = (airport) => {
    const display = airport.isCountry
      ? `${airport.cityName} (${airport.iataCode})`
      : `${airport.cityName || airport.name} (${airport.iataCode})`;
    setQuery(display);
    setSelected(true);
    setOpen(false);
    setSuggestions([]);
    onSelect(airport.iataCode, display, airport.isCountry ? {
      isCountry: true,
      countryCode: airport.iataCode,
      countryName: airport.cityName,
      countryAirports: airport.countryAirports || [],
    } : null);
  };

  const handleClear = () => {
    requestIdRef.current += 1;
    setQuery('');
    setSelected(false);
    setSuggestions([]);
    setOpen(false);
    onChange('', '');
  };

  const handleFocus = () => {
    if (onExploreAnywhere || (!selected && suggestions.length > 0)) setOpen(true);
  };

  const showDropdown = open && (onExploreAnywhere || suggestions.length > 0 || (!loading && query.trim().length >= 2));

  return (
    <div className={`fsf-ac-wrap${error ? ' fsf-ac-wrap--error' : ''}`} ref={wrapRef}>
      <label className="fsf-label">{label}</label>
      <div className={`fsf-ac-field${iataCode === 'EXPLORE_ANYWHERE' ? ' fsf-ac-field--explore' : ''}`}>
        <svg className="fsf-ac-icon" viewBox="0 0 24 24" fill="none">
          <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="currentColor"/>
        </svg>
        {iataCode === 'EXPLORE_ANYWHERE' && (
          <span className="fsf-explore-chip" aria-hidden="true">
            <span className="fsf-explore-chip__icon">
              <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="2" />
              </svg>
            </span>
            <span className="fsf-explore-chip__text">Explore Anywhere</span>
          </span>
        )}
        <input className="fsf-input fsf-input--ac" type="text" placeholder={placeholder} value={query}
          onChange={handleChange} onFocus={handleFocus} autoComplete="off" spellCheck={false} />
        {loading && <span className="fsf-ac-spinner" />}
        {query && !loading && <button type="button" className="fsf-ac-clear" onClick={handleClear} tabIndex={-1}>✕</button>}
        {selected && iataCode && iataCode !== 'EXPLORE_ANYWHERE' && <span className="fsf-ac-badge">{iataCode}</span>}
      </div>

      {showDropdown && (
        <ul className="fsf-ac-dropdown">
          {onExploreAnywhere && (
            <li className="fsf-ac-item fsf-ac-item--explore" onPointerDown={(e) => { e.preventDefault(); setOpen(false); onExploreAnywhere?.(); }}>
              <div className="fsf-ac-item__left">
                <svg viewBox="0 0 24 24" fill="none" width="16" height="16" className="fsf-explore-icon">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <div><span className="fsf-ac-item__name fsf-explore-label">Explore Anywhere</span><span className="fsf-ac-item__airport">Discover cheapest destinations</span></div>
              </div>
              <span className="fsf-explore-arrow">→</span>
            </li>
          )}

          {suggestions.map(airport => (
            <li key={airport.iataCode + (airport.isCountry ? '-country' : '')}
              className={`fsf-ac-item${airport.isCountry ? ' fsf-ac-item--country' : ''}`}
              onPointerDown={(e) => { e.preventDefault(); handleSelect(airport); }}>
              <div className="fsf-ac-item__left">
                {airport.isCountry ? (
                  <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><circle cx="12" cy="12" r="10" stroke="#029e9d" strokeWidth="2"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="#029e9d" strokeWidth="2"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="#029e9d"/></svg>
                )}
                <div>
                  <span className="fsf-ac-item__name">{airport.isCountry ? airport.cityName : (airport.cityName || airport.name)}</span>
                  {!airport.isCountry && airport.name !== airport.cityName && airport.name && <span className="fsf-ac-item__airport">{airport.name}</span>}
                  {airport.isCountry ? <span className="fsf-ac-item__airport">All cities & airports</span>
                    : airport.countryName && <span className="fsf-ac-item__country">{airport.countryName}</span>}
                </div>
              </div>
              <span className="fsf-ac-item__iata">{airport.iataCode}</span>
            </li>
          ))}

          {!loading && suggestions.length === 0 && query.trim().length >= 2 && !onExploreAnywhere && (
            <li className="fsf-ac-item" aria-disabled="true"><div className="fsf-ac-item__left"><div><span className="fsf-ac-item__name">No location found</span><span className="fsf-ac-item__airport">Try a city, country, airport name or IATA code</span></div></div></li>
          )}
        </ul>
      )}

      {error && <p className="fsf-error">{error}</p>}
    </div>
  );
};

const FlightSearchForm = ({ onSearch, isLoading, prefillDest, prefillOrigin, originError, onOriginErrorClear, onExploreAnywhere }) => {
  const [tripType,          setTripType]          = useState('one-way');
  const [originCode,        setOriginCode]        = useState('');
  const [originDisplay,     setOriginDisplay]     = useState('');
  const [originCountryData, setOriginCountryData] = useState(null);
  const [isExploreAnywhere, setIsExploreAnywhere] = useState(false);
  const [destCode,          setDestCode]          = useState('');
  const [destDisplay,       setDestDisplay]       = useState('');
  const [destCountryData,   setDestCountryData]   = useState(null);
  const [departureDate,     setDepartureDate]     = useState('');
  const [returnDate,        setReturnDate]        = useState('');
  const [dateSearchMode,    setDateSearchMode]    = useState('exact');
  const [travelMonth,       setTravelMonth]       = useState('');
  const [returnMonth,       setReturnMonth]       = useState('');
  const [adults,            setAdults]            = useState(1);
  const [children,          setChildren]          = useState(0);
  const [errors,            setErrors]            = useState({});
  const [includeNearby,     setIncludeNearby]     = useState(false);
  const [includeHotels,     setIncludeHotels]     = useState(false);

  useEffect(() => {
    if (prefillOrigin?.code && prefillOrigin?.display) {
      setOriginCode(prefillOrigin.code);
      setOriginDisplay(prefillOrigin.display);
      setIsExploreAnywhere(false);
      setErrors(p => ({ ...p, origin: '' }));
    }
  }, [prefillOrigin]);

  useEffect(() => {
    if (prefillDest?.code && prefillDest?.display) {
      setDestCode(prefillDest.code);
      setDestDisplay(prefillDest.display);
      setIsExploreAnywhere(false);
      setErrors(p => ({ ...p, destination: '' }));
    }
  }, [prefillDest]);

  const clearError = (field) => setErrors(p => ({ ...p, [field]: '' }));

  const handleSwap = () => {
    setOriginCode(destCode); setOriginDisplay(destDisplay); setOriginCountryData(destCountryData);
    setIsExploreAnywhere(false);
    setDestCode(originCode); setDestDisplay(originDisplay); setDestCountryData(originCountryData);
  };

  const changeTripType = (type) => {
    setTripType(type);
    if (type === 'one-way') {
      setReturnDate('');
      setReturnMonth('');
      clearError('returnDate');
    }
  };

  const validate = () => {
    const errs = {};
    if (!originCode) errs.origin = 'Select a departure airport, city or country';
    if (!isExploreAnywhere && !destCode) errs.destination = 'Select a destination airport, city or country';
    if (!isExploreAnywhere && originCode && destCode && originCode === destCode) errs.destination = 'Origin and destination must differ';

    if (dateSearchMode === 'month') {
      if (!travelMonth) errs.departureDate = 'Select a travel month';
      if (tripType === 'round-trip' && !returnMonth) errs.returnDate = 'Select a return month';
    } else {
      if (!departureDate) errs.departureDate = 'Select departure date';
      if (tripType === 'round-trip' && !returnDate) errs.returnDate = 'Select return date';
    }
    return errs;
  };

  const buildParams = () => ({
    originCode,
    originDisplay,
    originCountryData,
    destinationCode: destCode,
    destinationDisplay: destDisplay,
    destCountryData,
    departureDate: dateSearchMode === 'exact' ? departureDate : undefined,
    returnDate: dateSearchMode === 'exact' && tripType === 'round-trip' ? returnDate : undefined,
    dateSearchMode,
    travelMonth: dateSearchMode === 'month' ? travelMonth : undefined,
    returnMonth: dateSearchMode === 'month' && tripType === 'round-trip' ? returnMonth : undefined,
    adults: Number(adults),
    children: Number(children),
    includeNearby,
    includeHotels,
    tripType,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const params = buildParams();
    if (isExploreAnywhere) {
      onExploreAnywhere?.({ ...params, exploreAnywhere: true });
      return;
    }
    onSearch(params);
  };

  return (
    <section className="flight-search-section">
      <div className="container">
        <div className="flight-search-card">
          <div className="trip-type-toggle">
            {['one-way', 'round-trip'].map(type => (
              <button key={type} type="button" className={`trip-type-btn${tripType === type ? ' active' : ''}`} onClick={() => changeTripType(type)}>
                {type === 'one-way' ? 'One-way' : 'Round Trip'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="fsf-row">
              <div className="fsf-col fsf-col--airport">
                <AirportInput label="From" placeholder="Airport, city or country" value={originDisplay} iataCode={originCode}
                  onChange={(code, display) => { setOriginCode(code); setOriginDisplay(display); setOriginCountryData(null); setIsExploreAnywhere(false); clearError('origin'); onOriginErrorClear?.(); }}
                  onSelect={(code, display, countryData) => { setOriginCode(code); setOriginDisplay(display); setOriginCountryData(countryData || null); setIsExploreAnywhere(false); clearError('origin'); onOriginErrorClear?.(); }}
                  error={errors.origin || originError} />
              </div>

              <div className="fsf-swap-col">
                <button type="button" className="fsf-swap-btn" onClick={handleSwap} title="Swap origin and destination">
                  <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>

              <div className="fsf-col fsf-col--airport">
                <AirportInput label="To" placeholder="Airport, city, country or Anywhere" value={destDisplay} iataCode={destCode}
                  onChange={(code, display) => { setDestCode(code); setDestDisplay(display); setDestCountryData(null); setIsExploreAnywhere(false); clearError('destination'); }}
                  onSelect={(code, display, countryData) => { setDestCode(code); setDestDisplay(display); setDestCountryData(countryData || null); setIsExploreAnywhere(false); clearError('destination'); }}
                  error={errors.destination}
                  onExploreAnywhere={() => { setDestCode('EXPLORE_ANYWHERE'); setDestDisplay('Explore Anywhere'); setDestCountryData(null); setIsExploreAnywhere(true); clearError('destination'); }} />
              </div>

              <div className={`fsf-col ${tripType === 'round-trip' ? 'fsf-col--datepicker-range' : 'fsf-col--datepicker'}`}>
                <TripDatePicker
                  mode={tripType === 'round-trip' ? 'range' : 'single'}
                  startDate={departureDate}
                  endDate={returnDate}
                  selectedMonth={travelMonth}
                  selectedReturnMonth={returnMonth}
                  searchMode={dateSearchMode}
                  minDate={today}
                  onApply={({ searchMode, startDate, endDate, month, returnMonth: nextReturnMonth }) => {
                    if (searchMode === 'month') {
                      setDateSearchMode('month');
                      setTravelMonth(month || '');
                      setReturnMonth(nextReturnMonth || '');
                      setDepartureDate('');
                      setReturnDate('');
                    } else {
                      setDateSearchMode('exact');
                      setDepartureDate(startDate || '');
                      if (tripType === 'round-trip') setReturnDate(endDate || '');
                      setTravelMonth('');
                      setReturnMonth('');
                    }
                    clearError('departureDate');
                    clearError('returnDate');
                  }}
                  startLabel="Departure"
                  endLabel="Return"
                  startPlaceholder="Date or whole month"
                  endPlaceholder="Date or month"
                  startError={errors.departureDate}
                  endError={errors.returnDate}
                  origin={/^[A-Za-z]{3}$/.test(originCode) ? originCode.toUpperCase() : undefined}
                  destination={/^[A-Za-z]{3}$/.test(destCode) ? destCode.toUpperCase() : undefined}
                />
              </div>

              <div className="fsf-col fsf-col--pax">
                <PassengerSelector
                  passengers={[
                    { key: 'adults', label: 'Adults', subtitle: 'Aged 18+', value: adults, min: 1, max: 9 },
                    { key: 'children', label: 'Children', subtitle: 'Aged 0 to 17', value: children, min: 0, max: 8 },
                  ]}
                  onChange={(key, val) => key === 'adults' ? setAdults(val) : setChildren(val)} onApply={() => {}}
                  label={p => { const a = p.find(x => x.key === 'adults')?.value || 1; const c = p.find(x => x.key === 'children')?.value || 0; return c > 0 ? `${a} Adult${a>1?'s':''}, ${c} Child${c>1?'ren':''}` : `${a} Adult${a>1?'s':''}`; }}
                  note="Your age at time of travel must be valid for the age category booked. Airlines have restrictions on under 18s travelling alone." />
              </div>

              <div className="fsf-col fsf-col--btn">
                <button type="submit" className="fsf-search-btn" disabled={isLoading}>
                  {isLoading ? <><span className="btn-spinner" /> Searching…</> : <><i className="fa fa-search" /> Search Flights</>}
                </button>
              </div>
            </div>

            <div className="fsf-options-row">
              <label className="fsf-nearby-label">
                <input type="checkbox" className="fsf-nearby-checkbox" checked={includeNearby} onChange={e => setIncludeNearby(e.target.checked)} />
                <svg viewBox="0 0 24 24" fill="none" width="14" height="14" className="fsf-nearby-icon"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" fill="currentColor"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                <span>Nearby airports <span className="fsf-nearby-hint">(250 km)</span></span>
              </label>
              <label className="fsf-nearby-label">
                <input type="checkbox" className="fsf-nearby-checkbox" checked={includeHotels} onChange={e => setIncludeHotels(e.target.checked)} />
                <svg viewBox="0 0 24 24" fill="none" width="14" height="14" className="fsf-nearby-icon"><path d="M2 20h20M3 20V8l9-5 9 5v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 20v-6h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span>Add a stay <span className="fsf-nearby-hint">(show stays in destination)</span></span>
              </label>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default FlightSearchForm;
