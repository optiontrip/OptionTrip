import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageMeta from '../hooks/usePageMeta';
import useCurrency from '../hooks/useCurrency';
import { searchCheapRoutePairsByMonth, searchCheapRoutesByMonth } from '../services/cheapFlightExplorerService';
import { exploreDestinations, searchAirports, searchFlightsDuffel, searchFlightsTP } from '../services/flightService';
import './CheapFlightExplorerPage.css';

const ANYWHERE_BATCH_SIZE = 36;
const MAX_ANYWHERE_CANDIDATES = 120;

const monthLabel = (value) => {
  if (!/^\d{4}-\d{2}$/.test(String(value || ''))) return value || '';
  const [year, month] = value.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const exactDate = (value) => String(value || '').slice(0, 10);
const codesFromQuery = (value) => String(value || '').split(',').map(v => v.trim().toUpperCase()).filter(v => /^[A-Z]{3}$/.test(v));

const mergeRoutes = (existing = [], incoming = []) => {
  const map = new Map();
  [...existing, ...incoming].forEach(route => {
    if (!route) return;
    const key = `${route.origin}-${route.destination}-${route.departureAt || route.month}-${route.returnAt || route.returnMonth || ''}`;
    const current = map.get(key);
    if (!current || Number(route.price) < Number(current.price)) map.set(key, route);
  });
  return [...map.values()].sort((a, b) => Number(a.price) - Number(b.price));
};

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

  const rawOrigins = params.get('origins') || '';
  const origins = useMemo(() => codesFromQuery(rawOrigins), [rawOrigins]);
  const rawDestinations = params.get('destinations') || '';
  const initialDestinations = useMemo(() => codesFromQuery(rawDestinations), [rawDestinations]);
  const anywhere = rawDestinations === 'ANYWHERE';
  const month = params.get('month') || '';
  const returnMonth = params.get('returnMonth') || '';
  const originLabel = params.get('originLabel') || origins.join(', ');
  const destinationLabel = params.get('destinationLabel') || (anywhere ? 'Anywhere' : initialDestinations.join(', '));

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [candidatePairs, setCandidatePairs] = useState([]);
  const [searchedCandidateCount, setSearchedCandidateCount] = useState(0);
  const [airportNames, setAirportNames] = useState({});
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState('');
  const [liveFlights, setLiveFlights] = useState([]);

  const [scopeFilter, setScopeFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [stopsFilter, setStopsFilter] = useState('any');
  const [airlineFilter, setAirlineFilter] = useState('all');
  const [sortMode, setSortMode] = useState('cheapest');
  const [maxPrice, setMaxPrice] = useState('');

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
      setData(null);
      setCandidatePairs([]);
      setSearchedCandidateCount(0);
      setAirportNames({});
      setCountryFilter('all');
      setScopeFilter('all');
      setStopsFilter('any');
      setAirlineFilter('all');
      setMaxPrice('');

      try {
        if (anywhere) {
          const sourceOrigins = origins.slice(0, 16);
          const candidateMaps = await Promise.all(sourceOrigins.map(async origin => ({ origin, map: await exploreDestinations(origin) })));
          if (!active) return;

          const bestByDestination = new Map();
          candidateMaps.forEach(({ origin, map }) => {
            Object.entries(map || {}).forEach(([rawCode, info]) => {
              const destination = String(rawCode || '').trim().toUpperCase();
              if (!/^[A-Z]{3}$/.test(destination) || sourceOrigins.includes(destination)) return;
              const price = Number(info?.price);
              if (!Number.isFinite(price) || price <= 0) return;
              const current = bestByDestination.get(destination);
              if (!current || price < current.seedPrice) {
                bestByDestination.set(destination, {
                  origin,
                  destination,
                  seedPrice: price,
                  seedCurrency: info?.currency || 'USD',
                });
              }
            });
          });

          const candidates = [...bestByDestination.values()]
            .sort((a, b) => a.seedPrice - b.seedPrice)
            .slice(0, MAX_ANYWHERE_CANDIDATES);

          if (!candidates.length) throw new Error('No priced destinations are available for this search right now.');
          setCandidatePairs(candidates);

          const firstBatch = candidates.slice(0, ANYWHERE_BATCH_SIZE);
          const result = await searchCheapRoutePairsByMonth({
            pairs: firstBatch,
            month,
            returnMonth: returnMonth || null,
          });
          if (!active) return;
          setData(result);
          setSearchedCandidateCount(firstBatch.length);
        } else {
          if (!initialDestinations.length) throw new Error('Choose at least one destination.');
          const result = await searchCheapRoutesByMonth({
            origins,
            destinations: initialDestinations,
            month,
            returnMonth: returnMonth || null,
          });
          if (!active) return;
          setData(result);
        }
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

  const loadMoreAnywhere = async () => {
    if (!anywhere || loadingMore || searchedCandidateCount >= candidatePairs.length) return;
    const nextBatch = candidatePairs.slice(searchedCandidateCount, searchedCandidateCount + ANYWHERE_BATCH_SIZE);
    if (!nextBatch.length) return;

    setLoadingMore(true);
    try {
      const result = await searchCheapRoutePairsByMonth({
        pairs: nextBatch,
        month,
        returnMonth: returnMonth || null,
      });
      setData(previous => ({
        ...(previous || {}),
        ...result,
        routes: mergeRoutes(previous?.routes || [], result?.routes || []),
        searchedPairs: Number(previous?.searchedPairs || 0) + Number(result?.searchedPairs || 0),
      }));
      setSearchedCandidateCount(count => Math.min(candidatePairs.length, count + nextBatch.length));
    } catch (err) {
      setError(err.message || 'Unable to load more destinations right now.');
    } finally {
      setLoadingMore(false);
    }
  };

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
      if (active) setAirportNames(previous => ({ ...previous, ...Object.fromEntries(entries) }));
    });
    return () => { active = false; };
  }, [data]);

  const routes = data?.routes || [];

  const originCountries = useMemo(() => new Set(
    routes.map(route => airportNames[route.origin]?.country).filter(Boolean)
  ), [routes, airportNames]);

  const countryGroups = useMemo(() => {
    const groups = new Map();
    routes.forEach(route => {
      const destination = airportNames[route.destination] || {};
      const country = destination.country || 'Other destinations';
      const current = groups.get(country) || { country, routes: [], cheapest: null };
      current.routes.push(route);
      if (!current.cheapest || Number(route.price) < Number(current.cheapest.price)) current.cheapest = route;
      groups.set(country, current);
    });
    return [...groups.values()].sort((a, b) => Number(a.cheapest?.price || Infinity) - Number(b.cheapest?.price || Infinity));
  }, [routes, airportNames]);

  const airlines = useMemo(() => [...new Set(routes.map(route => route.airline).filter(Boolean))].sort(), [routes]);

  const filteredRoutes = useMemo(() => {
    let result = [...routes];

    if (countryFilter !== 'all') {
      result = result.filter(route => (airportNames[route.destination]?.country || 'Other destinations') === countryFilter);
    }

    if (scopeFilter !== 'all') {
      result = result.filter(route => {
        const originCountry = airportNames[route.origin]?.country || '';
        const destinationCountry = airportNames[route.destination]?.country || '';
        if (!originCountry || !destinationCountry) return false;
        const domestic = originCountry === destinationCountry;
        return scopeFilter === 'domestic' ? domestic : !domestic;
      });
    }

    if (stopsFilter === 'nonstop') result = result.filter(route => Number(route.stops) === 0);
    if (stopsFilter === 'one') result = result.filter(route => Number(route.stops) <= 1);
    if (airlineFilter !== 'all') result = result.filter(route => route.airline === airlineFilter);

    const priceLimit = Number(maxPrice);
    if (maxPrice !== '' && Number.isFinite(priceLimit) && priceLimit > 0) {
      result = result.filter(route => Number(route.price) <= priceLimit);
    }

    result.sort((a, b) => {
      if (sortMode === 'country') {
        const aCountry = airportNames[a.destination]?.country || '';
        const bCountry = airportNames[b.destination]?.country || '';
        return aCountry.localeCompare(bCountry) || Number(a.price) - Number(b.price);
      }
      if (sortMode === 'nonstop') {
        return Number(a.stops || 0) - Number(b.stops || 0) || Number(a.price) - Number(b.price);
      }
      return Number(a.price) - Number(b.price);
    });

    return result;
  }, [routes, airportNames, countryFilter, scopeFilter, stopsFilter, airlineFilter, maxPrice, sortMode]);

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

  return (
    <>
      <PageMeta title="Cheapest Flights by Month" description="Compare the cheapest real flight routes across cities, countries and airports for an entire month." path="/flights/cheap" />
      <section className="cheapx-hero">
        <div className="container">
          <div className="cheapx-kicker">OptionTrip Cheap Flight Explorer</div>
          <h1>{originLabel} → {destinationLabel}</h1>
          <p>
            {monthLabel(month)}{returnMonth ? ` to ${monthLabel(returnMonth)}` : ''} · compare countries, cities and airports by the lowest available discovery fare.
          </p>
        </div>
      </section>

      <section className="cheapx-section">
        <div className="container">
          {loading && <div className="cheapx-state"><div className="cheapx-spinner" /><strong>Comparing routes and monthly prices…</strong><span>Checking multiple destinations instead of stopping at a six-route sample.</span></div>}
          {!loading && error && <div className="cheapx-state cheapx-state--error"><strong>We could not load this monthly search.</strong><span>{error}</span></div>}

          {!loading && !error && routes.length === 0 && (
            <div className="cheapx-state"><strong>No priced routes found for this month.</strong><span>Try another month, nearby airport or broader destination.</span></div>
          )}

          {!loading && routes.length > 0 && (
            <>
              <div className="cheapx-summary">
                <div className="cheapx-summary__numbers">
                  <div><strong>{countryGroups.length}</strong><span>countr{countryGroups.length === 1 ? 'y' : 'ies'}</span></div>
                  <div><strong>{routes.length}</strong><span>priced route{routes.length !== 1 ? 's' : ''}</span></div>
                </div>
                <p>
                  Discovery fares can be cached or indicative. OptionTrip rechecks the selected route before the final booking handoff.
                  {anywhere && candidatePairs.length > 0 ? ` ${searchedCandidateCount} of ${candidatePairs.length} provider-priced destination candidates checked so far.` : ''}
                </p>
              </div>

              {anywhere && countryGroups.length > 0 && (
                <section className="cheapx-countries">
                  <div className="cheapx-section-head">
                    <div><span>Explore by country</span><h2>Cheapest countries from {originLabel}</h2></div>
                    {countryFilter !== 'all' && <button type="button" onClick={() => setCountryFilter('all')}>Show all countries</button>}
                  </div>
                  <div className="cheapx-country-grid">
                    {countryGroups.map(group => {
                      const cheapestDestination = airportNames[group.cheapest?.destination] || { city: group.cheapest?.destination };
                      const domestic = originCountries.has(group.country);
                      return (
                        <button
                          type="button"
                          key={group.country}
                          className={`cheapx-country-card${countryFilter === group.country ? ' is-active' : ''}`}
                          onClick={() => setCountryFilter(group.country)}
                        >
                          <span className="cheapx-country-card__type">{domestic ? 'Domestic' : 'International'}</span>
                          <strong>{group.country}</strong>
                          <small>Cheapest to {cheapestDestination.city || group.cheapest?.destination}</small>
                          <div><span>from</span><b>{formatPriceFromCurrency(group.cheapest?.price, group.cheapest?.currency || 'USD')}</b></div>
                          <em>{group.routes.length} priced route{group.routes.length === 1 ? '' : 's'}</em>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              <div className="cheapx-filters">
                <label>
                  <span>Trip type</span>
                  <select value={scopeFilter} onChange={event => setScopeFilter(event.target.value)}>
                    <option value="all">Domestic + international</option>
                    <option value="international">International only</option>
                    <option value="domestic">Domestic only</option>
                  </select>
                </label>
                <label>
                  <span>Stops</span>
                  <select value={stopsFilter} onChange={event => setStopsFilter(event.target.value)}>
                    <option value="any">Any stops</option>
                    <option value="nonstop">Nonstop only</option>
                    <option value="one">Up to 1 stop</option>
                  </select>
                </label>
                <label>
                  <span>Airline</span>
                  <select value={airlineFilter} onChange={event => setAirlineFilter(event.target.value)}>
                    <option value="all">All airlines</option>
                    {airlines.map(airline => <option value={airline} key={airline}>{airline}</option>)}
                  </select>
                </label>
                <label>
                  <span>Max fare</span>
                  <input type="number" inputMode="numeric" min="1" placeholder="Any price" value={maxPrice} onChange={event => setMaxPrice(event.target.value)} />
                </label>
                <label>
                  <span>Sort</span>
                  <select value={sortMode} onChange={event => setSortMode(event.target.value)}>
                    <option value="cheapest">Cheapest first</option>
                    <option value="country">Country A-Z</option>
                    <option value="nonstop">Fewest stops</option>
                  </select>
                </label>
                <button type="button" className="cheapx-reset" onClick={() => { setScopeFilter('all'); setCountryFilter('all'); setStopsFilter('any'); setAirlineFilter('all'); setMaxPrice(''); setSortMode('cheapest'); }}>Reset</button>
              </div>

              <div className="cheapx-results-head">
                <strong>{filteredRoutes.length} matching route{filteredRoutes.length === 1 ? '' : 's'}</strong>
                {countryFilter !== 'all' && <span>Country: {countryFilter}</span>}
              </div>

              <div className="cheapx-grid">
                {filteredRoutes.map((route, index) => {
                  const origin = airportNames[route.origin] || { city: route.origin };
                  const destination = airportNames[route.destination] || { city: route.destination };
                  const domestic = origin.country && destination.country && origin.country === destination.country;
                  return (
                    <article className="cheapx-card" key={route.id}>
                      <div className="cheapx-card__rank">#{index + 1}</div>
                      <div className="cheapx-card__country">{destination.country || 'Destination'} · {domestic ? 'Domestic' : 'International'}</div>
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

              {anywhere && searchedCandidateCount < candidatePairs.length && (
                <div className="cheapx-more">
                  <button type="button" onClick={loadMoreAnywhere} disabled={loadingMore}>
                    {loadingMore ? 'Checking more destinations…' : `Search more destinations (${candidatePairs.length - searchedCandidateCount} remaining)`}
                  </button>
                  <span>OptionTrip keeps expanding the provider-priced destination set instead of imposing a six-route result limit.</span>
                </div>
              )}
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
