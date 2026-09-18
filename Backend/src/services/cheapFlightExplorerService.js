import { searchFlights as searchTravelpayoutsFlights } from './travelpayoutsFlightService.js';

const MAX_ORIGINS = 16;
const MAX_DESTINATIONS = 48;
const MAX_ROUTE_PAIRS = 96;
const MAX_EXPLICIT_PAIRS = 120;
const CONCURRENCY = 6;

const normalizeCodes = (values, limit) => {
  const input = Array.isArray(values) ? values : String(values || '').split(',');
  const seen = new Set();
  const result = [];
  for (const value of input) {
    const code = String(value || '').trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(code) || seen.has(code)) continue;
    seen.add(code);
    result.push(code);
    if (limit && result.length >= limit) break;
  }
  return result;
};

const buildPairs = (origins, destinations) => {
  const pairs = [];
  // Destination-first ordering avoids exhausting the cap on one origin when
  // the departure side represents an entire country.
  for (const destination of destinations) {
    for (const origin of origins) {
      if (origin === destination) continue;
      pairs.push({ origin, destination });
      if (pairs.length >= MAX_ROUTE_PAIRS) return pairs;
    }
  }
  return pairs;
};

const normalizeExplicitPairs = (values) => {
  const input = Array.isArray(values) ? values : String(values || '').split(',');
  const seen = new Set();
  const result = [];

  for (const value of input) {
    let origin = '';
    let destination = '';
    if (typeof value === 'string') {
      const [o, d] = value.split('-');
      origin = String(o || '').trim().toUpperCase();
      destination = String(d || '').trim().toUpperCase();
    } else if (value && typeof value === 'object') {
      origin = String(value.origin || '').trim().toUpperCase();
      destination = String(value.destination || '').trim().toUpperCase();
    }

    if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination) || origin === destination) continue;
    const key = `${origin}-${destination}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ origin, destination });
    if (result.length >= MAX_EXPLICIT_PAIRS) break;
  }

  return result;
};

const chooseCheapest = (flights = []) => flights
  .filter(item => Number.isFinite(Number(item?.price)) && Number(item.price) > 0)
  .reduce((best, item) => (!best || Number(item.price) < Number(best.price) ? item : best), null);

const searchPair = async ({ origin, destination, month, returnMonth }) => {
  const flights = await searchTravelpayoutsFlights({
    origin,
    destination,
    departureAt: month,
    returnAt: returnMonth || null,
    limit: 30,
    currency: 'usd',
  });

  const best = chooseCheapest(flights);
  if (!best) return null;

  return {
    id: `${origin}-${destination}-${month}-${returnMonth || 'one'}`,
    origin,
    destination,
    month,
    returnMonth: returnMonth || null,
    price: Number(best.price),
    currency: String(best.currency || 'USD').toUpperCase(),
    airline: best.airline || null,
    stops: Number.isFinite(Number(best.stops)) ? Number(best.stops) : null,
    duration: best.duration || null,
    departureAt: best.departureAt || null,
    returnAt: best.returnAt || null,
    bookingUrl: best.bookingUrl || null,
    priceMeta: best.priceMeta || null,
    discoveryFare: true,
    requiresLiveRecheck: true,
  };
};

const searchPairs = async ({ pairs, month, returnMonth }) => {
  const routes = [];
  for (let offset = 0; offset < pairs.length; offset += CONCURRENCY) {
    const batch = pairs.slice(offset, offset + CONCURRENCY);
    const settled = await Promise.allSettled(batch.map(pair => searchPair({ ...pair, month, returnMonth })));
    for (const result of settled) {
      if (result.status === 'fulfilled' && result.value) routes.push(result.value);
    }
  }

  routes.sort((a, b) => a.price - b.price || a.origin.localeCompare(b.origin) || a.destination.localeCompare(b.destination));
  return routes;
};

export const searchCheapestRoutePairsForMonth = async ({ pairs, month, returnMonth = null }) => {
  const normalizedPairs = normalizeExplicitPairs(pairs);
  const routes = await searchPairs({ pairs: normalizedPairs, month, returnMonth });
  return {
    routes,
    searchedPairs: normalizedPairs.length,
    capped: normalizedPairs.length >= MAX_EXPLICIT_PAIRS,
  };
};

export const searchCheapestRoutesForMonth = async ({ originAirports, destinationAirports, month, returnMonth = null }) => {
  const origins = normalizeCodes(originAirports, MAX_ORIGINS);
  const destinations = normalizeCodes(destinationAirports, MAX_DESTINATIONS);
  const pairs = buildPairs(origins, destinations);
  const routes = await searchPairs({ pairs, month, returnMonth });

  return {
    routes,
    searchedPairs: pairs.length,
    originAirports: origins,
    destinationAirports: destinations,
    capped: pairs.length >= MAX_ROUTE_PAIRS,
  };
};
