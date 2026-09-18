import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageMeta from '../hooks/usePageMeta';
import useCurrency from '../hooks/useCurrency';
import { searchCheapRoutesByMonth } from '../services/cheapFlightExplorerService';
import { exploreDestinations, searchAirports, searchFlightsDuffel, searchFlightsTP } from '../services/flightService';
import './CheapFlightExplorerPage.css';

const monthLabel = (value) => {
  if (!/^\d{4}-\d{2}$/.test(String(value || ''))) return value || '';
  const [year, month] = value.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const exactDate = (value) => String(value || '').slice(0, 10);
const codesFromQuery = (value) => String(value || '').split(',').map(v => v.trim().toUpperCase()).filter(v => /^[A-Z]{3}$/.test(v));

const normalizeLive = (flight, source, route) => {
  if (source === 'duffel') {
    return {
      id: flight.id,
      airline: flight.airline || 'Airline',
      origin: flight.origin || route.origin,
      destination: flight.destination || route.destination,
      departureAt: flight.departureTime || flight.departureAt,
      returnAt: flight.returnDepartureTime || null,
      price: Number(flight.price),
      currency: flight.currency || 'USD',
      stops: flight.stops,
      duration: flight.duration,
      bookingUrl: flight.bookingUrl || null,
    };
  }
  return {
    id: flight.id,
    airline: flight.airline || 'Airline',
    origin: flight.origin || route.origin,
    destination: flight.destination || route.destination,
    departureAt: flight.departureAt,
    returnAt: flight.returnAt || null,
    price: Number(flight.price),
    currency: flight.currency || 'USD',
    stops: flight.stops,
    duration: flight.duration,
    bookingUrl: flight.bookingUrl || null,
  };
};

const CheapFlightExplorerPage = () => {
  const [params] = useSearchParams();
  const { formatPriceFromCurrency } = useCurrency();

  const origins = useMemo(() => codesFromQuery(params.get('origins')), [params]);
  const rawDestinations = params.get('destinations') || '';
  const initialDestinations = useMemo(() => codesFromQuery(rawDestinations), [rawDestinations]);
  const anywhere = rawDestinations === 'ANYWHERE';
  const month = params.get('month') || '';
  const returnMonth = params.get('returnMonth') || '';
  const originLabel = params.get('originLabel') || origins.join(', ');
  const destinationLabel = params.get('destinationLabel') || (anywhere ? 'Anywhere' : initialDestinations.join(', '));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [airportNames, setAirportNames] = useState({});
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState('');
  const [liveFlights, setLiveFlights] = useState([]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!origins.length || !/^\d{4}-\d{2}$/.test(month)) {
        setError('Choose a valid departure place and travel month.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        let destinations = initialDestinations;
        if (anywhere) {
          const candidateMaps = await Promise.all(origins.slice(0, 3).map(origin => exploreDestinations(origin)));
          const bestByDestination = new Map();
          candidateMaps.forEach(map => {
            Object.entries(map || {}).forEach(([code, info]) => {
              if (!/^[A-Z]{3}$/.test(code)) return;
              const price = Number(info?.price);
              if (!Number.isFinite(price) || price <= 0) return;
              const current = bestByDestination.get(code);
              if (!current || price < current) bestByDestination.set(code, price);
            });
          });
          destinations = [...bestByDestination.entries()].sort((a, b) => a[1] - b[1]).slice(0, 6).map(([code]) => code);
        }

        if (!destinations.length) throw new Error('No priced destinations are available for this search right now.');

        const result = await searchCheapRoutesByMonth({ origins, destinations, month, returnMonth: returnMonth || null });
        if (!active) return;
        setData(result);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Unable to load monthly prices right now.');
        setData(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => { active = false; };
  }, [origins, initialDestinations, anywhere, month, returnMonth]);

  useEffect(() => {
    const codes = [...new Set((data?.routes || []).flatMap(route => [route.origin, route.destination]))];
    if (!codes.length) return;
    let active = true;
    Promise.all(codes.map(async code => {
      try {
        const matches = await searchAirports(code);
        const exact = (matches || []).find(item => item.iataCode === code) || matches?.[0];
        return [code, exact ? { city: exact.cityName || exact.name || code, country: exact.countryName || '' } : { city: code, country: '' }];
      } catch {
        return [code, { city: code, country: '' }];
      }
    })).then(entries => {
      if (active) setAirportNames(Object.fromEntries(entries));
    });
    return () => { active = false; };
  }, [data]);

  const liveRecheck = async (route) => {
    setSelectedRoute(route);
    setLiveLoading(true);
    setLiveError('');
    setLiveFlights([]);

    const departureDate = exactDate(route.departureAt) || `${month}-01`;
    const returnDate = exactDate(route.returnAt) || null;
    try {
      let source = 'tp';
      let flights = [];
      try {
        const tp = await searchFlightsTP({
          origin: route.origin,
          destination: route.destination,
          departureAt: departureDate,
          returnAt: returnDate,
          limit: 20,
        });
        flights = tp?.flights || [];
      } catch {}

      if (!flights.length) {
        source = 'duffel';
        try {
          const duffel = await searchFlightsDuffel({
            originCode: route.origin,
            destinationCode: route.destination,
            departureDate,
            returnDate,
            adults: 1,
          });
          flights = duffel?.flights || [];
        } catch {}
      }

      const normalized = flights
        .map(flight => normalizeLive(flight, source, route))
        .filter(flight => Number.isFinite(flight.price) && flight.price > 0)
        .sort((a, b) => a.price - b.price)
        .slice(0, 8);

      setLiveFlights(normalized);
      if (!normalized.length) setLiveError('No live bookable result was returned for this exact route/date. Try another cheap route or date.');
    } finally {
      setLiveLoading(false);
    }
  };

  const routes = data?.routes || [];

  return (
    <>
      <PageMeta title="Cheapest Flights by Month" description="Compare the cheapest real flight routes across cities and airports for an entire month." path="/flights/cheap" />
      <section className="cheapx-hero">
        <div className="container">
          <div className="cheapx-kicker">OptionTrip Cheap Flight Explorer</div>
          <h1>{originLabel} → {destinationLabel}</h1>
          <p>
            {monthLabel(month)}{returnMonth ? ` to ${monthLabel(returnMonth)}` : ''} · comparing airport combinations and ranking the lowest available discovery fares.
          </p>
        </div>
      </section>

      <section className="cheapx-section">
        <div className="container">
          {loading && <div className="cheapx-state"><div className="cheapx-spinner" /><strong>Comparing routes and monthly prices…</strong></div>}
          {!loading && error && <div className="cheapx-state cheapx-state--error"><strong>We could not load this monthly search.</strong><span>{error}</span></div>}

          {!loading && !error && routes.length === 0 && (
            <div className="cheapx-state"><strong>No priced routes found for this month.</strong><span>Try another month, nearby airport or broader destination.</span></div>
          )}

          {!loading && routes.length > 0 && (
            <>
              <div className="cheapx-summary">
                <div><strong>{routes.length}</strong><span>priced route{routes.length !== 1 ? 's' : ''}</span></div>
                <p>Discovery fares can be cached or indicative. OptionTrip rechecks the selected route before the final booking handoff.</p>
              </div>

              <div className="cheapx-grid">
                {routes.map((route, index) => {
                  const origin = airportNames[route.origin] || { city: route.origin };
                  const destination = airportNames[route.destination] || { city: route.destination };
                  return (
                    <article className="cheapx-card" key={route.id}>
                      <div className="cheapx-card__rank">#{index + 1}</div>
                      <div className="cheapx-card__route">
                        <div><strong>{origin.city}</strong><span>{route.origin}{origin.country ? ` · ${origin.country}` : ''}</span></div>
                        <div className="cheapx-card__arrow">→</div>
                        <div><strong>{destination.city}</strong><span>{route.destination}{destination.country ? ` · ${destination.country}` : ''}</span></div>
                      </div>
                      <div className="cheapx-card__meta">
                        {route.departureAt && <span>{exactDate(route.departureAt)}</span>}
                        {route.airline && <span>{route.airline}</span>}
                        {Number.isFinite(route.stops) && <span>{route.stops === 0 ? 'Nonstop' : `${route.stops} stop${route.stops === 1 ? '' : 's'}`}</span>}
                      </div>
                      <div className="cheapx-card__bottom">
                        <div className="cheapx-price"><small>from</small><strong>{formatPriceFromCurrency(route.price, route.currency || 'USD')}</strong><span>discovery fare</span></div>
                        <button type="button" onClick={() => liveRecheck(route)}>Check live flights</button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}

          {selectedRoute && (
            <section className="cheapx-live" id="live-results">
              <div className="cheapx-live__head">
                <div><span>Live recheck</span><h2>{selectedRoute.origin} → {selectedRoute.destination}</h2></div>
                <button type="button" onClick={() => { setSelectedRoute(null); setLiveFlights([]); setLiveError(''); }}>Close</button>
              </div>
              {liveLoading && <div className="cheapx-state"><div className="cheapx-spinner" /><strong>Rechecking current flight options…</strong></div>}
              {!liveLoading && liveError && <div className="cheapx-state cheapx-state--error"><span>{liveError}</span></div>}
              {!liveLoading && liveFlights.length > 0 && (
                <div className="cheapx-live-list">
                  {liveFlights.map((flight, index) => (
                    <article className="cheapx-live-card" key={flight.id || `${flight.origin}-${flight.destination}-${index}`}>
                      <div><strong>{flight.airline}</strong><span>{flight.origin} → {flight.destination}</span></div>
                      <div><strong>{exactDate(flight.departureAt)}</strong><span>{Number.isFinite(flight.stops) ? (flight.stops === 0 ? 'Nonstop' : `${flight.stops} stops`) : ''}</span></div>
                      <div className="cheapx-live-price"><strong>{formatPriceFromCurrency(flight.price, flight.currency || 'USD')}</strong>{flight.bookingUrl ? <a href={flight.bookingUrl} target="_blank" rel="noopener noreferrer">Book</a> : <span>Booking link unavailable</span>}</div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </section>
    </>
  );
};

export default CheapFlightExplorerPage;
