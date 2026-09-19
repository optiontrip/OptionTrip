import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchAirports } from '../../services/flightService';
import TripDatePicker from '../TripDatePicker/TripDatePicker';
import './HomeBookingSection.css';

const toISO = (date) => date.toISOString().split('T')[0];
const TODAY = toISO(new Date());
const tomorrowDate = new Date();
tomorrowDate.setDate(tomorrowDate.getDate() + 1);
const TOMORROW = toISO(tomorrowDate);
const maxTravelDate = new Date();
maxTravelDate.setDate(maxTravelDate.getDate() + 365);
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

const buildLocationData = (item) => {
  const isNearest = item.entityType === 'nearest-airport' || item.isNearest;
  const isCity = item.entityType === 'city' || item.isCity;
  return {
    entityType: item.entityType || (item.isCountry ? 'country' : 'airport'),
    isCountry: Boolean(item.isCountry),
    isCity,
    isNearest,
    countryCode: item.countryCode || (item.isCountry ? item.iataCode : ''),
    countryName: item.countryName || item.cityName || '',
    countryAirports: item.countryAirports || [],
    cityAirports: item.cityAirports || [],
    requestedPlace: item.requestedPlace || '',
    requestedAddress: item.requestedAddress || '',
    distanceKm: item.distanceKm,
  };
};

const HomeLocationInput = ({ label, placeholder, value, code, onChange, onSelect, error, onExploreAnywhere }) => {
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
    const isNearest = item.entityType === 'nearest-airport' || item.isNearest;
    const display = item.isCountry
      ? `${item.cityName || item.countryName} (${item.iataCode})`
      : isNearest && item.requestedPlace
        ? `${item.requestedPlace} → ${item.cityName || item.name} (${item.iataCode})`
        : `${item.cityName || item.name} (${item.iataCode})`;

    setSuggestions([]);
    setNoResults(false);
    setOpen(false);
    onSelect(item.iataCode, display, buildLocationData(item));
  };

  const chooseAnywhere = (event) => {
    event.preventDefault();
    requestRef.current += 1;
    setSuggestions([]);
    setNoResults(false);
    setOpen(false);
    onExploreAnywhere?.();
  };

  const canShowDropdown = open && !code && (Boolean(onExploreAnywhere) || value.trim().length >= 2);

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
            if (onExploreAnywhere) setOpen(true);
            else if (!code && value.trim().length >= 2) setOpen(true);
          }}
          onChange={(event) => {
            requestRef.current += 1;
            setSuggestions([]);
            setNoResults(false);
            setOpen(Boolean(onExploreAnywhere) || event.target.value.trim().length >= 2);
            onChange(event.target.value);
          }}
        />
        {loading && <span className="hbs-location__spinner" aria-label="Searching locations" />}
        {code && <span className="hbs-location__code">{code === 'ANYWHERE' ? 'ANY' : code}</span>}
      </div>

      {canShowDropdown && (
        <div className="hbs-location__dropdown" role="listbox">
          {onExploreAnywhere && (
            <button
              type="button"
              className="hbs-location__option hbs-location__option--anywhere"
              role="option"
              aria-selected="false"
              onPointerDown={chooseAnywhere}
            >
              <span className="hbs-location__option-main">
                <strong>Explore Anywhere</strong>
                <small>No destination yet - show the cheapest places you can fly</small>
              </span>
              <span className="hbs-location__option-code">ANY</span>
            </button>
          )}
          {loading && suggestions.length === 0 && value.trim().length >= 2 && (
            <div className="hbs-location__status">Searching cities, countries, airports and nearby airports…</div>
          )}
          {!loading && noResults && value.trim().length >= 2 && (
            <div className="hbs-location__status">No matches yet. Try a city, country, landmark or airport code.</div>
          )}
          {suggestions.map((item) => {
            const isNearest = item.entityType === 'nearest-airport' || item.isNearest;
            const isCity = item.entityType === 'city' || item.isCity;
            const detail = item.isCountry
              ? 'Country - all supported airports'
              : isNearest
                ? `${item.name || 'Nearest airport'}${Number.isFinite(item.distanceKm) ? ` · ${item.distanceKm} km away` : ''}`
                : isCity
                  ? `City - all airports${item.countryName ? ` · ${item.countryName}` : ''}`
                  : [item.name !== item.cityName ? item.name : null, item.countryName].filter(Boolean).join(' · ');
            return (
              <button
                key={`${item.entityType || (item.isCountry ? 'country' : 'place')}-${item.iataCode}-${item.requestedPlace || item.cityName || item.name}`}
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
                  <strong>{item.isCountry ? (item.cityName || item.countryName) : (isNearest && item.requestedPlace ? item.requestedPlace : (item.cityName || item.name))}</strong>
                  <small>{detail}</small>
                </span>
                <span className="hbs-location__option-code">{item.iataCode}</span>
              </button>
            );
          })}
        </div>
      )}
      {error && <span className="hbs-location__error">{error}</span>}
    </div>
  );
};

const codesForSearch = (code, locationData) => {
  const groupedAirports = locationData?.isCountry
    ? locationData.countryAirports
    : locationData?.isCity
      ? locationData.cityAirports
      : [];

  if (Array.isArray(groupedAirports) && groupedAirports.length > 0) {
    return [...new Set(groupedAirports
      .map((airport) => String(airport?.iataCode || '').trim().toUpperCase())
      .filter((iata) => /^[A-Z]{3}$/.test(iata)))];
  }

  const normalized = String(code || '').trim().toUpperCase();
  return /^[A-Z]{3}$/.test(normalized) ? [normalized] : [];
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
  const [fMonth, setFMonth] = useState('');
  const [fReturnMonth, setFReturnMonth] = useState('');
  const [fSearchMode, setFSearchMode] = useState('exact');
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
    const isAnywhere = fToCode === 'ANYWHERE';
    if (!fFromCode) nextErrors.from = 'Choose a city, country or airport from the suggestions.';
    if (!fToCode) nextErrors.to = 'Choose a destination or Explore Anywhere.';
    if (!isAnywhere && fFromCode && fToCode && fFromCode === fToCode) nextErrors.to = 'Origin and destination must differ.';

    if (fSearchMode === 'month') {
      if (!fMonth) nextErrors.departureDate = 'Choose a travel month.';
      if (fTripType === 'round-trip' && !fReturnMonth) nextErrors.returnDate = 'Choose a return month.';
    } else {
      if (!fDate) nextErrors.departureDate = 'Choose a departure date.';
      if (fTripType === 'round-trip' && !fReturn) nextErrors.returnDate = 'Choose a return date.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFlightErrors(nextErrors);
      return;
    }

    if (fSearchMode === 'month') {
      const origins = codesForSearch(fFromCode, fFromCountryData);
      const destinations = isAnywhere ? [] : codesForSearch(fToCode, fToCountryData);

      if (!origins.length || (!isAnywhere && !destinations.length)) {
        setFlightErrors({
          ...(origins.length ? {} : { from: 'Choose a departure place with supported airports.' }),
          ...((isAnywhere || destinations.length) ? {} : { to: 'Choose a destination with supported airports.' }),
        });
        return;
      }

      const query = new URLSearchParams({
        origins: origins.join(','),
        destinations: isAnywhere ? 'ANYWHERE' : destinations.join(','),
        month: fMonth,
        originLabel: fFrom,
        destinationLabel: isAnywhere ? 'Anywhere' : fTo,
      });
      if (fTripType === 'round-trip' && fReturnMonth) query.set('returnMonth', fReturnMonth);
      navigate(`/flights/cheap?${query.toString()}`);
      return;
    }

    if (isAnywhere) {
      const origins = codesForSearch(fFromCode, fFromCountryData);
      if (origins.length !== 1) {
        setFlightErrors({ from: 'For exact-date Anywhere search, choose one departure city or airport. Use Whole month for country-wide discovery.' });
        return;
      }
      const query = new URLSearchParams({
        origin: origins[0],
        originDisplay: fFrom,
        departureDate: fDate,
        adults: String(fPassengers),
      });
      if (fTripType === 'round-trip' && fReturn) query.set('returnDate', fReturn);
      navigate(`/flights/explore?${query.toString()}`);
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
        searchMode: 'exact',
      },
    });
  };

  const swapFlightLocations = () => {
    if (fFromCode === 'ANYWHERE' || fToCode === 'ANYWHERE') return;
    const oldFrom = { display: fFrom, code: fFromCode, country: fFromCountryData };
    setFFrom(fTo);
    setFFromCode(fToCode);
    setFFromCountryData(fToCountryData);
    setFTo(oldFrom.display);
    setFToCode(oldFrom.code);
    setFToCountryData(oldFrom.country);
    setFlightErrors({});
  };

  const setFlightTripType = (type) => {
    setFTripType(type);
    if (type === 'one-way') {
      setFReturn('');
      setFReturnMonth('');
    }
    setFlightErrors((previous) => ({ ...previous, returnDate: '' }));
  };

  const setFlightDateMode = (mode) => {
    if (mode === 'month') {
      setFSearchMode('month');
      setFDate('');
      setFReturn('');
    } else {
      setFSearchMode('exact');
      setFMonth('');
      setFReturnMonth('');
    }
    setFlightErrors((previous) => ({ ...previous, departureDate: '', returnDate: '' }));
  };

  const handleFlightDateApply = ({ searchMode, month, returnMonth, startDate, endDate }) => {
    if (searchMode === 'month') {
      setFSearchMode('month');
      setFMonth(month || '');
      setFReturnMonth(fTripType === 'round-trip' ? (returnMonth || '') : '');
      setFDate('');
      setFReturn('');
    } else {
      setFSearchMode('exact');
      setFDate(startDate || '');
      setFReturn(fTripType === 'round-trip' ? (endDate || '') : '');
      setFMonth('');
      setFReturnMonth('');
    }
    setFlightErrors((previous) => ({ ...previous, departureDate: '', returnDate: '' }));
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
                <button key={type} type="button" className={`hbs__pill${fTripType === type ? ' hbs__pill--on' : ''}`} onClick={() => setFlightTripType(type)}>
                  {type === 'one-way' ? 'One way' : 'Round trip'}
                </button>
              ))}
            </div>
            <div className="hbs__trip-type" aria-label="Flight date search mode">
              <span className="hbs__label">When</span>
              <button type="button" className={`hbs__pill${fSearchMode === 'exact' ? ' hbs__pill--on' : ''}`} onClick={() => setFlightDateMode('exact')}>
                Specific dates
              </button>
              <button type="button" className={`hbs__pill${fSearchMode === 'month' ? ' hbs__pill--on' : ''}`} onClick={() => setFlightDateMode('month')}>
                Whole month
              </button>
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
                  onSelect={(code, display, locationData) => {
                    setFFrom(display);
                    setFFromCode(code);
                    setFFromCountryData(locationData);
                    clearFlightError('from');
                  }}
                />
              </div>
              <button
                type="button"
                className="hbs__swap"
                title={fToCode === 'ANYWHERE' ? 'Choose a destination before swapping' : 'Swap origin and destination'}
                onClick={swapFlightLocations}
                disabled={fFromCode === 'ANYWHERE' || fToCode === 'ANYWHERE'}
              ><SwapIcon /></button>
              <div className="hbs__field hbs__field--grow2 hbs__field--location">
                <HomeLocationInput
                  label="To"
                  placeholder="City, country, airport or Anywhere"
                  value={fTo}
                  code={fToCode}
                  error={flightErrors.to}
                  onChange={(display) => {
                    setFTo(display);
                    setFToCode('');
                    setFToCountryData(null);
                    clearFlightError('to');
                  }}
                  onSelect={(code, display, locationData) => {
                    setFTo(display);
                    setFToCode(code);
                    setFToCountryData(locationData);
                    clearFlightError('to');
                  }}
                  onExploreAnywhere={() => {
                    setFTo('Anywhere');
                    setFToCode('ANYWHERE');
                    setFToCountryData(null);
                    clearFlightError('to');
                  }}
                />
              </div>
              <div className="hbs__field hbs__field--date-picker">
                <TripDatePicker
                  mode={fTripType === 'round-trip' ? 'range' : 'single'}
                  startDate={fDate}
                  endDate={fReturn}
                  selectedMonth={fMonth}
                  selectedReturnMonth={fReturnMonth}
                  searchMode={fSearchMode}
                  minDate={TODAY}
                  onApply={handleFlightDateApply}
                  startLabel="Departure"
                  endLabel="Return"
                  startPlaceholder={fSearchMode === 'month' ? 'Choose a whole month' : 'Choose a date or open flexible prices'}
                  endPlaceholder={fSearchMode === 'month' ? 'Choose a return month' : 'Choose a return date'}
                  startError={flightErrors.departureDate}
                  endError={flightErrors.returnDate}
                  origin={/^[A-Z]{3}$/.test(fFromCode) ? fFromCode : undefined}
                  destination={/^[A-Z]{3}$/.test(fToCode) ? fToCode : undefined}
                />
              </div>
              <div className="hbs__field hbs__field--narrow">
                <label className="hbs__label">Passengers</label>
                <Stepper value={fPassengers} onChange={setFPassengers} />
              </div>
              <button type="submit" className="hbs__search-btn"><SearchIcon /> {fSearchMode === 'month' ? 'Find cheapest month fares' : 'Search prices'}</button>
            </div>
            <p className="hbs__date-help">
              <strong>Whole month</strong> is now a direct search mode - choose the month itself, not a day. Open the date picker and use <strong>Flexible dates</strong> when you want to compare available daily prices for a specific route.
            </p>
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
