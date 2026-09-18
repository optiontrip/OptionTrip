import { searchFlights as searchTravelpayoutsFlights } from './travelpayoutsFlightService.js';

const MAX_AIRPORTS_PER_SIDE = 6;
const MAX_ROUTE_PAIRS = 24;
const CONCURRENCY = 4;

const normalizeCodes = (values) => {
  const input = Array.isArray(values) ? values : String(values || '').split(',');
  const seen = new Set();
  const result = [];
  for (const value of input) {
    const code = String(value || '').trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(code) || seen.has(code)) continue;
    seen.add(code);
    result.push(code);
    if (result.length >= MAX_AIRPORTS_PER_SIDE) break;
  }
  return result;
};

const buildPairs = (origins, destinations) => {
  const pairs = [];
  for (const origin of origins) {
    for (const destination of destinations) {
      if (origin === destination) continue;
      pairs.push({ origin, destination });
      if (pairs.length >= MAX_ROUTE_PAIRS) return pairs;
    }
  }
  return pairs;
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

export const searchCheapestRoutesForMonth = async ({ originAirports, destinationAirports, month, returnMonth = null }) => {
  const origins = normalizeCodes(originAirports);
  const destinations = normalizeCodes(destinationAirports);
  const pairs = buildPairs(origins, destinations);
  const routes = [];

  for (let offset = 0; offset < pairs.length; offset += CONCURRENCY) {
    const batch = pairs.slice(offset, offset + CONCURRENCY);
    const settled = await Promise.allSettled(batch.map(pair => searchPair({ ...pair, month, returnMonth })));
    for (const result of settled) {
      if (result.status === 'fulfilled' && result.value) routes.push(result.value);
    }
  }

  routes.sort((a, b) => a.price - b.price || a.origin.localeCompare(b.origin) || a.destination.localeCompare(b.destination));

  return {
    routes,
    searchedPairs: pairs.length,
    originAirports: origins,
    destinationAirports: destinations,
    capped: pairs.length >= MAX_ROUTE_PAIRS,
  };
};
