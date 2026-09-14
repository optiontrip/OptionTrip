import Trip from '../models/Trip.js';
import { aggregateFlightSearch } from '../services/chatFlightAggregatorService.js';

const normalizeProvider = (value = '') => {
  const provider = String(value || '').toLowerCase();
  if (['gf', 'google', 'google_flights'].includes(provider)) return 'google_flights';
  if (['tp', 'travelpayouts'].includes(provider)) return 'travelpayouts';
  return provider;
};

const normalizeCode = (value = '') => String(value || '').trim().toUpperCase();
const normalizeNumber = (value = '') => String(value || '').replace(/\s+/g, '').toUpperCase();

const hasSegments = (flight = {}) =>
  (Array.isArray(flight.segments) && flight.segments.length > 0)
  || (Array.isArray(flight.outboundSegments) && flight.outboundSegments.length > 0)
  || (Array.isArray(flight.returnSegments) && flight.returnSegments.length > 0);

const persistedSegments = (flight = {}) => {
  const outbound = Array.isArray(flight.outboundSegments) ? flight.outboundSegments : [];
  const returning = Array.isArray(flight.returnSegments) ? flight.returnSegments : [];
  if (outbound.length || returning.length) return [...outbound, ...returning];
  return Array.isArray(flight.segments) ? flight.segments : [];
};

const matchScore = (selected = {}, candidate = {}) => {
  let score = 0;
  const selectedProvider = normalizeProvider(selected.provider);
  const candidateProvider = normalizeProvider(candidate.source || candidate.provider);

  if (selectedProvider && candidateProvider && selectedProvider === candidateProvider) score += 4;
  if (normalizeCode(selected.departure) && normalizeCode(selected.departure) === normalizeCode(candidate.origin)) score += 2;
  if (normalizeCode(selected.arrival) && normalizeCode(selected.arrival) === normalizeCode(candidate.destination)) score += 2;

  const selectedFlightNumber = normalizeNumber(selected.flightNumber);
  const candidateFlightNumber = normalizeNumber(candidate.flightNumber);
  if (selectedFlightNumber && candidateFlightNumber && selectedFlightNumber === candidateFlightNumber) score += 4;

  const selectedPrice = Number(selected.price);
  const candidatePrice = Number(candidate.price);
  if (Number.isFinite(selectedPrice) && Number.isFinite(candidatePrice) && Math.abs(selectedPrice - candidatePrice) < 1) score += 2;

  if (selected.bookingUrl && candidate.bookingUrl && selected.bookingUrl === candidate.bookingUrl) score += 5;
  return score;
};

const withTimeout = (promise, ms = 5000) => Promise.race([
  promise,
  new Promise((resolve) => setTimeout(() => resolve(null), ms))
]);

export const hydrateFlightSelection = async (req, _res, next) => {
  try {
    const selectedFlight = req.body?.selectedFlight;
    if (!selectedFlight || hasSegments(selectedFlight)) return next();

    const tripId = req.params?.tripId;
    const userId = req.user?._id?.toString();
    if (!tripId || !userId) return next();

    const trip = await Trip.findOne({ trip_id: tripId, deleted: { $ne: true } }).lean();
    if (!trip) return next();
    if (trip.user_id && String(trip.user_id) !== userId) return next();

    const origin = normalizeCode(selectedFlight.departure);
    const destination = normalizeCode(selectedFlight.arrival);
    const departureDate = trip.dates?.start_date;
    const returnDate = trip.dates?.end_date || null;
    if (!origin || !destination || !departureDate) return next();

    const result = await withTimeout(aggregateFlightSearch({
      origin,
      destination,
      departureDate,
      returnDate,
      adults: Math.max(1, Number(trip.guests?.adults || 1)),
      travelClass: 'economy'
    }));

    const candidates = result?.results || [];
    const ranked = candidates
      .map((candidate) => ({ candidate, score: matchScore(selectedFlight, candidate) }))
      .sort((a, b) => b.score - a.score);

    const best = ranked[0];
    const segments = best ? persistedSegments(best.candidate) : [];
    if (!best || best.score < 6 || !segments.length) return next();

    req.body.selectedFlight = {
      ...selectedFlight,
      segments
    };
  } catch {
    // Hydration is best-effort. Never block a user's explicit selection save.
  }

  return next();
};

export default hydrateFlightSelection;
