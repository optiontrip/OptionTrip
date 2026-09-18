import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchAirports } from '../../services/flightService';
import './HomeBookingSection.css';

const toISO = (date) => date.toISOString().split('T')[0];
const TODAY = toISO(new Date());
const tomorrowDate = new Date();
tomorrowDate.setDate(tomorrowDate.getDate() + 1);
const TOMORROW = toISO(tomorrowDate);
const maxTravelDate = new Date();
maxTravelDate.setFullYear(maxTravelDate.getFullYear() + 1);
const MAX_TRAVEL_DATE = toISO(maxTravelDate);

const TABS = [
  { id: 'flights', label: 'Flights', icon: <i className="fa fa-plane" aria-hidden="true" /> },
  { id: 'hotels', label: 'Stays', icon: <i className="fa fa-bed" aria-hidden="true" /> },
  { id: 'cars', label: 'Car Rental', icon: <i className="fa fa-car" aria-hidden="true" /> },
  { id: 'esim', label: 'eSIM', icon: <i className="fa fa-sim-card" aria-hidden="true" /> },
];

const SearchIcon = () => <i className="fa fa-search" aria-hidden="true" />;
const SwapIcon = () => <i className="fa fa-exchange" aria-hidden="true" />;

const Stepper = ({ value, min = 1, max = 9, onChange }) => (
  <div className="hbs-stepper">
    <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>−</button>
    <span>{value}</span>
    <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>+</button>
  </div>
);

const HomeLocationInput = ({ label, placeholder, value, code, onChange, onSelect, error }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const wrapRef = useRef(null);
  const requestRef = useRef(0);

  useEffect(() => {
    if (code || !value || value.trim().length < 2) {
      setSuggestions([]);
      setNoResults(false);
      return undefined;
    }

    const requestId = ++requestRef.current;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setNoResults(false);
      try {
        const results = await searchAirports(value.trim());
        if (requestRef.current !== requestId) return;
        const next = Array.isArray(results) ? results.slice(0, 10) : [];
        setSuggestions(next);
        setNoResults(next.length === 0);
        setOpen(true);
      } finally {
        if (requestRef.current === requestId) setLoading(false);
      }
    }, 220);

    return () => window.clearTimeout(timer);
  }, [value, code]);

  useEffect(() => {
    const close = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  const choose = (item) => {
    const display = item.isCountry
      ? `${item.cityName || item.countryName} (${item.iataCode})`
      : `${item.cityName || item.name} (${item.iataCode})`;
    const countryData = item.isCountry ? {
      isCountry: true,
      countryCode: item.iataCode,
      countryName: item.cityName || item.countryName,
      countryAirports: item.countryAirports || [],
    } : null;
    setSuggestions([]);
    setNoResults(false);
    setOpen(false);
    onSelect(item.iataCode, display, countryData);
  };

  return (
    <div className={`hbs-location${error ? ' hbs-location--error' : ''}`} ref={wrapRef}>
      <label className="hbs__label">{label}</label>
      <div className="hbs-location__field">
        <input
          className="hbs__input"
          placeholder={placeholder}
          value={value}
          autoComplete="off"
          spellCheck={false}
          onFocus={() => {
            if (!code && value.trim().length >= 2) setOpen(true);
          }}
          onChange={(event) => {
            requestRef.current += 1;
            setSuggestions([]);
            setNoResults(false);
            setOpen(event.target.value.trim().length >= 2);
            onChange(event.target.value);
          }}
        />
        {loading && <span className="hbs-location__spinner" aria-label="Searching locations" />}
        {code && <span className="hbs-location__code">{code}</span>}
      </div>

      {open && !code && value.trim().length >= 2 && (
        <div className="hbs-location__dropdown" role="listbox">
          {loading && suggestions.length === 0 && (
            <div className="hbs-location__status">Searching cities, countries and airports…</div>
          )}
          {!loading && noResults && (
            <div className="hbs-location__status">No matches yet. Try a city, country or airport code.</div>
          )}
          {suggestions.map((item) => (
            <button
              key={`${item.isCountry ? 'country' : 'place'}-${item.iataCode}-${item.cityName || item.name}`}
              type="button"
              className="hbs-location__option"
              role="option"
              aria-selected="false"
              onPointerDown={(event) => {
                event.preventDefault();
                choose(item);
              }}
            >
              <span className="hbs-location__option-main">
                <strong>{item.isCountry ? (item.cityName || item.countryName) : (item.cityName || item.name)}</strong>
                <small>
                  {item.isCountry
                    ? 'Country - all supported airports'
                    : [item.name !== item.cityName ? item.name : null, item.countryName].filter(Boolean).join(' · ')}
                </small>
              </span>
              <span className="hbs-location__option-code">{item.iataCode}</span>
            </button>
          ))}
        </div>
      )}
      {error && <span className="hbs-location__error">{error}</span>}
    </div>
  );
};

const HomeBookingSection = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('flights');

  const [fFrom, setFFrom] = useState('');
  const [fFromCode, setFFromCode] = useState('');
  const [fFromCountryData, setFFromCountryData] = useState(null);
  const [fTo, setFTo] = useState('');
  const [fToCode, setFToCode] = useState('');
  const [fToCountryData, setFToCountryData] = useState(null);
  const [fDate, setFDate] = useState('');
  const [fReturn, setFReturn] = useState('');
  const [fTripType, setFTripType] = useState('one-way');
  const [fPassengers, setFPassengers] = useState(1);
  const [flightErrors, setFlightErrors] = useState({});

  const [hCity, setHCity] = useState('');
  const [hCheckIn, setHCheckIn] = useState(TODAY);
  const [hCheckOut, setHCheckOut] = useState(TOMORROW);
  const [hGuests, setHGuests] = useState(1);
  const [hRooms, setHRooms] = useState(1);

  const [cPickup, setCPickup] = useState('');
  const [cDropoff, setCDropoff] = useState('');
  const [cPickupDate, setCPickupDate] = useState('');
  const [cReturnDate, setCReturnDate] = useState('');

  const clearFlightError = (field) => setFlightErrors((previous) => ({ ...previous, [field]: '' }));

  const handleFlightSearch = (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!fFromCode) nextErrors.from = 'Choose a city, country or airport from the suggestions.';
    if (!fToCode) nextErrors.to = 'Choose a city, country or airport from the suggestions.';
    if (fFromCode && fToCode && fFromCode === fToCode) nextErrors.to = 'Origin and destination must differ.';
    if (Object.keys(nextErrors).length > 0) {
      setFlightErrors(nextErrors);
      return;
    }

    navigate('/flights', {
      state: {
        autoFill: true,
        fromCode: fFromCode,
        fromDisplay: fFrom,
        fromCountryData: fFromCountryData,
        toCode: fToCode,
        toDisplay: fTo,
        toCountryData: fToCountryData,
        departureDate: fDate,
        returnDate: fTripType === 'round-trip' ? fReturn : '',
        adults: fPassengers,
        tripType: fTripType,
      },
    });
  };

  const swapFlightLocations = () => {
    const oldFrom = { display: fFrom, code: fFromCode, country: fFromCountryData };
    setFFrom(fTo);
    setFFromCode(fToCode);
    setFFromCountryData(fToCountryData);
    setFTo(oldFrom.display);
    setFToCode(oldFrom.code);
    setFToCountryData(oldFrom.country);
    setFlightErrors({});
  };

  const handleHotelSearch = (event) => {
    event.preventDefault();
    navigate('/hotels', { state: { autoFill: true, cityQuery: hCity, checkIn: hCheckIn, checkOut: hCheckOut, adults: hGuests, rooms: hRooms } });
  };

  const handleCarSearch = (event) => {
    event.preventDefault();
    navigate('/car-rental', { state: { autoFill: true, pickupLocation: cPickup, dropoffLocation: cDropoff || cPickup, pickupDate: cPickupDate, returnDate: cReturnDate } });
  };

  const handleEsimGo = (event) => {
    event.preventDefault();
    navigate('/esim');
  };

  return (
    <section className="hbs" aria-label="Search and compare travel prices">
      <div className="hbs__card">
        <div className="hbs__tabs" role="tablist">
          {TABS.map((item) => (
            <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} className={`hbs__tab${tab === item.id ? ' hbs__tab--active' : ''}`} onClick={() => setTab(item.id)}>
              <span className="hbs__tab-icon">{item.icon}</span>
              <span className="hbs__tab-label">{item.label}</span>
            </button>
          ))}
        </div>

        {tab === 'flights' && (
          <form className="hbs__form" onSubmit={handleFlightSearch}>
            <div className="hbs__trip-type">
              {['one-way', 'round-trip'].map((type) => (
                <button key={type} type="button" className={`hbs__pill${fTripType === type ? ' hbs__pill--on' : ''}`} onClick={() => setFTripType(type)}>
                  {type === 'one-way' ? 'One way' : 'Round trip'}
                </button>
              ))}
            </div>
            <div className="hbs__row">
              <div className="hbs__field hbs__field--grow2 hbs__field--location">
                <HomeLocationInput
                  label="From"
                  placeholder="City, country or airport"
                  value={fFrom}
                  code={fFromCode}
                  error={flightErrors.from}
                  onChange={(display) => {
                    setFFrom(display);
                    setFFromCode('');
                    setFFromCountryData(null);
                    clearFlightError('from');
                  }}
                  onSelect={(code, display, countryData) => {
                    setFFrom(display);
                    setFFromCode(code);
                    setFFromCountryData(countryData);
                    clearFlightError('from');
                  }}
                />
              </div>
              <button type="button" className="hbs__swap" title="Swap origin and destination" onClick={swapFlightLocations}><SwapIcon /></button>
              <div className="hbs__field hbs__field--grow2 hbs__field--location">
                <HomeLocationInput
                  label="To"
                  placeholder="City, country or airport"
                  value={fTo}
                  code={fToCode}
                  error={flightErrors.to}
                  onChange={(display) => {
                    setFTo(display);
                    setFToCode('');
                    setFToCountryData(null);
                    clearFlightError('to');
                  }}
                  onSelect={(code, display, countryData) => {
                    setFTo(display);
                    setFToCode(code);
                    setFToCountryData(countryData);
                    clearFlightError('to');
                  }}
                />
              </div>
              <div className="hbs__field">
                <label className="hbs__label">Depart</label>
                <input className="hbs__input" type="date" value={fDate} min={TODAY} max={MAX_TRAVEL_DATE} onChange={(event) => setFDate(event.target.value)} required />
              </div>
              {fTripType === 'round-trip' && (
                <div className="hbs__field">
                  <label className="hbs__label">Return</label>
                  <input className="hbs__input" type="date" value={fReturn} min={fDate || TODAY} max={MAX_TRAVEL_DATE} onChange={(event) => setFReturn(event.target.value)} required />
                </div>
              )}
              <div className="hbs__field hbs__field--narrow">
                <label className="hbs__label">Passengers</label>
                <Stepper value={fPassengers} onChange={setFPassengers} />
              </div>
              <button type="submit" className="hbs__search-btn"><SearchIcon /> Search prices</button>
            </div>
          </form>
        )}

        {tab === 'hotels' && (
          <form className="hbs__form" onSubmit={handleHotelSearch}>
            <div className="hbs__row">
              <div className="hbs__field hbs__field--grow3">
                <label className="hbs__label">Destination</label>
                <input className="hbs__input" placeholder="City, region, or property" value={hCity} onChange={(event) => setHCity(event.target.value)} required />
              </div>
              <div className="hbs__field">
                <label className="hbs__label">Check in</label>
                <input className="hbs__input" type="date" value={hCheckIn} min={TODAY} max={MAX_TRAVEL_DATE} onChange={(event) => setHCheckIn(event.target.value)} required />
              </div>
              <div className="hbs__field">
                <label className="hbs__label">Check out</label>
                <input className="hbs__input" type="date" value={hCheckOut} min={hCheckIn || TODAY} max={MAX_TRAVEL_DATE} onChange={(event) => setHCheckOut(event.target.value)} required />
              </div>
              <div className="hbs__field hbs__field--narrow"><label className="hbs__label">Guests</label><Stepper value={hGuests} max={8} onChange={setHGuests} /></div>
              <div className="hbs__field hbs__field--narrow"><label className="hbs__label">Rooms</label><Stepper value={hRooms} max={4} onChange={setHRooms} /></div>
              <button type="submit" className="hbs__search-btn"><SearchIcon /> Search prices</button>
            </div>
          </form>
        )}

        {tab === 'cars' && (
          <form className="hbs__form" onSubmit={handleCarSearch}>
            <div className="hbs__row">
              <div className="hbs__field hbs__field--grow2"><label className="hbs__label">Pick-up location</label><input className="hbs__input" placeholder="City, airport, or hotel" value={cPickup} onChange={(event) => setCPickup(event.target.value)} required /></div>
              <div className="hbs__field hbs__field--grow2"><label className="hbs__label">Drop-off location</label><input className="hbs__input" placeholder="Same as pick-up" value={cDropoff} onChange={(event) => setCDropoff(event.target.value)} /></div>
              <div className="hbs__field"><label className="hbs__label">Pick-up date</label><input className="hbs__input" type="date" value={cPickupDate} min={TODAY} max={MAX_TRAVEL_DATE} onChange={(event) => setCPickupDate(event.target.value)} required /></div>
              <div className="hbs__field"><label className="hbs__label">Return date</label><input className="hbs__input" type="date" value={cReturnDate} min={cPickupDate || TODAY} max={MAX_TRAVEL_DATE} onChange={(event) => setCReturnDate(event.target.value)} required /></div>
              <button type="submit" className="hbs__search-btn"><SearchIcon /> Search prices</button>
            </div>
          </form>
        )}

        {tab === 'esim' && (
          <form className="hbs__form" onSubmit={handleEsimGo}>
            <div className="hbs__esim-promo">
              <p className="hbs__esim-promo__text">Travel data plans for 200+ destinations. Compare plans before you buy.</p>
              <button type="submit" className="hbs__search-btn"><SearchIcon /> Compare eSIM plans</button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};

export default HomeBookingSection;
