import { searchFlights as searchTravelpayoutsFlights } from './travelpayoutsFlightService.js';

const MAX_ORIGINS = 24;
const MAX_DESTINATIONS = 60;
const MAX_ROUTE_PAIRS = 240;
const MAX_EXPLICIT_PAIRS = 180;
const CONCURRENCY = 8;

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

const matrixSize = (origins, destinations) => {
  let total = 0;
  for (const destination of destinations) {
    for (const origin of origins) {
      if (origin !== destination) total += 1;
    }
  }
  return total;
};

// Build a deterministic, balanced country/city airport matrix. When the full
// matrix fits under the safety cap every valid pair is searched. For very large
// matrices, each destination receives one origin before any destination gets a
// second origin, with the origin index rotated each round. This prevents the
// request cap from being consumed by the first origin/city in the list.
export const buildBalancedRoutePairs = (originValues, destinationValues, maxPairs = MAX_ROUTE_PAIRS) => {
  const origins = normalizeCodes(originValues, MAX_ORIGINS);
  const destinations = normalizeCodes(destinationValues, MAX_DESTINATIONS);
  const totalPairs = matrixSize(origins, destinations);
  const limit = Math.max(1, Number(maxPairs) || MAX_ROUTE_PAIRS);

  if (!origins.length || !destinations.length || totalPairs === 0) {
    return { origins, destinations, pairs: [], totalPairs, capped: false, coveragePercent: 0 };
  }

  const pairs = [];
  if (totalPairs <= limit) {
    for (const destination of destinations) {
      for (const origin of origins) {
        if (origin === destination) continue;
        pairs.push({ origin, destination });
      }
    }
  } else {
    const seen = new Set();
    let round = 0;
    while (pairs.length < limit && seen.size < totalPairs) {
      for (let destinationIndex = 0; destinationIndex < destinations.length && pairs.length < limit; destinationIndex += 1) {
        const destination = destinations[destinationIndex];
        for (let attempt = 0; attempt < origins.length; attempt += 1) {
          const originIndex = (destinationIndex + round + attempt) % origins.length;
          const origin = origins[originIndex];
          if (origin === destination) continue;
          const key = `${origin}-${destination}`;
          if (seen.has(key)) continue;
          seen.add(key);
          pairs.push({ origin, destination });
          break;
        }
      }
      round += 1;
      if (round > origins.length + destinations.length) break;
    }
  }

  return {
    origins,
    destinations,
    pairs,
    totalPairs,
    capped: pairs.length < totalPairs,
    coveragePercent: totalPairs > 0 ? Math.round((pairs.length / totalPairs) * 1000) / 10 : 0,
  };
};

const normalizeExplicitPairs = (values) => {
  const input = Array.isArray(values) ? values : String(values || '').split(',');
  const seen = new Set();
  const result = [];
  let validUniquePairs = 0;

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
    validUniquePairs += 1;
    if (result.length < MAX_EXPLICIT_PAIRS) result.push({ origin, destination });
  }

  return { pairs: result, totalPairs: validUniquePairs };
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
  const normalized = normalizeExplicitPairs(pairs);
  const routes = await searchPairs({ pairs: normalized.pairs, month, returnMonth });
  return {
    routes,
    searchedPairs: normalized.pairs.length,
    totalPairs: normalized.totalPairs,
    capped: normalized.pairs.length < normalized.totalPairs,
    coveragePercent: normalized.totalPairs > 0
      ? Math.round((normalized.pairs.length / normalized.totalPairs) * 1000) / 10
      : 0,
  };
};

export const searchCheapestRoutesForMonth = async ({ originAirports, destinationAirports, month, returnMonth = null }) => {
  const matrix = buildBalancedRoutePairs(originAirports, destinationAirports);
  const routes = await searchPairs({ pairs: matrix.pairs, month, returnMonth });

  return {
    routes,
    searchedPairs: matrix.pairs.length,
    totalPairs: matrix.totalPairs,
    originAirports: matrix.origins,
    destinationAirports: matrix.destinations,
    capped: matrix.capped,
    coveragePercent: matrix.coveragePercent,
    matrixMode: matrix.capped ? 'balanced-sample' : 'full',
  };
};
