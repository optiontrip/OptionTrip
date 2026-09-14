import { searchFlightsDuffel } from './duffelService.js';
import { searchFlightsGoogle } from './googleFlightsService.js';
import { searchFlights as searchFlightsAmadeus } from './amadeusService.js';
import { searchFlights as searchFlightsTravelpayouts } from './travelpayoutsFlightService.js';
import { normalizeAmadeusSegments } from './flightSegmentNormalizer.js';

const PROVIDER_TIMEOUT_MS = 8000;
const TOP_N = 6;

const withTimeout = (promise, ms, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms))
  ]);

const statusFor = (reason) =>
  /timed out/.test(reason?.message || '') ? 'timeout' : 'error';

const extractTime = (iso) => {
  if (!iso) return '';
  const m = String(iso).match(/T(\d{2}:\d{2})/);
  return m ? m[1] : '';
};

const normalizeDuffel = (flights) =>
  (flights || []).map(f => ({
    id: `duffel-${f.id}`,
    source: 'duffel',
    origin: f.origin,
    destination: f.destination,
    departureTime: f.departureTime || '',
    arrivalTime: f.arrivalTime || '',
    duration: f.duration || '',
    stops: f.stops ?? 0,
    airline: f.airline || '',
    airlineLogo: f.airlineLogo || '',
    flightNumber: f.flightNumber || '',
    cabinClass: f.cabinClass || '',
    price: Number(f.price) || 0,
    currency: f.currency || 'USD',
    bookingUrl: f.bookingUrl,
    segments: f.segments || [],
    outboundSegments: f.outboundSegments || [],
    returnSegments: f.returnSegments || [],
    isRoundTrip: !!f.isRoundTrip,
    returnDepartureTime: f.returnDepartureTime || '',
    returnArrivalTime: f.returnArrivalTime || '',
    returnDuration: f.returnDuration || ''
  }));

const normalizeGoogle = (flights) =>
  (flights || []).map(f => ({
    id: `google-${f.id}`,
    source: 'google_flights',
    origin: f.origin,
    destination: f.destination,
    departureTime: f.departureTime || '',
    arrivalTime: f.arrivalTime || '',
    duration: f.duration || '',
    stops: f.stops ?? 0,
    airline: f.airline || '',
    airlineLogo: f.airlineLogo || '',
    flightNumber: f.flightNumber || '',
    cabinClass: '',
    price: Number(f.price) || 0,
    currency: f.currency || 'USD',
    bookingUrl: f.bookingUrl,
    segments: f.segments || [],
    outboundSegments: f.outboundSegments || [],
    returnSegments: f.returnSegments || [],
    isRoundTrip: !!f.isRoundTrip,
    returnDepartureTime: f.returnDepartureTime || '',
    returnArrivalTime: f.returnArrivalTime || '',
    returnDuration: f.returnDuration || ''
  }));

const normalizeAmadeus = (offers, { originCode, destinationCode }) =>
  (offers || []).map(offer => {
    const itineraries = offer.itineraries || [];
    const itin = itineraries[0];
    const segs = itin?.segments || [];
    const first = segs[0];
    const last = segs[segs.length - 1] || first;
    const segmentGroups = itineraries.map((item) => normalizeAmadeusSegments(item?.segments || []));
    const segments = segmentGroups.flat();
    return {
      id: `amadeus-${offer.id}`,
      source: 'amadeus',
      origin: first?.departure?.iataCode || originCode,
      destination: last?.arrival?.iataCode || destinationCode,
      departureTime: extractTime(first?.departure?.time || first?.departure?.at),
      arrivalTime: extractTime(last?.arrival?.time || last?.arrival?.at),
      duration: itin?.totalDuration || '',
      stops: offer.numberOfStops ?? Math.max(0, segs.length - 1),
      airline: offer.validatingCarrier || '',
      airlineLogo: '',
      flightNumber: first ? `${first.carrierCode || ''}${first.flightNumber || first.number || ''}` : '',
      cabinClass: '',
      price: Number(offer.price) || 0,
      currency: offer.currency || 'USD',
      bookingUrl: offer.bookingUrl,
      segments,
      outboundSegments: segmentGroups[0] || [],
      returnSegments: segmentGroups[1] || [],
      isRoundTrip: itineraries.length > 1,
      returnDepartureTime: '',
      returnArrivalTime: '',
      returnDuration: ''
    };
  });

const normalizeTravelpayouts = (flights) =>
  (flights || []).map(f => ({
    id: `tp-${f.id}`,
    source: 'travelpayouts',
    origin: f.origin,
    destination: f.destination,
    departureTime: extractTime(f.departureAt),
    arrivalTime: '',
    duration: f.duration || '',
    stops: f.stops ?? 0,
    airline: f.airline || '',
    airlineLogo: '',
    flightNumber: f.flightNumber || '',
    cabinClass: '',
    price: Number(f.price) || 0,
    currency: f.currency || 'USD',
    bookingUrl: f.bookingUrl,
    segments: Array.isArray(f.segments) ? f.segments : [],
    outboundSegments: Array.isArray(f.outboundSegments) ? f.outboundSegments : [],
    returnSegments: Array.isArray(f.returnSegments) ? f.returnSegments : [],
    isRoundTrip: !!f.isRoundTrip,
    returnDepartureTime: f.returnDepartureTime || '',
    returnArrivalTime: '',
    returnDuration: ''
  }));

export const aggregateFlightSearch = async ({
  origin, destination, departureDate, returnDate = null, adults = 1, travelClass = 'economy'
}) => {
  const o = origin.toUpperCase();
  const d = destination.toUpperCase();

  const [duffelR, googleR, amadeusR, tpR] = await Promise.allSettled([
    withTimeout(
      searchFlightsDuffel({ origin: o, destination: d, departureDate, returnDate, adults, travelClass }),
      PROVIDER_TIMEOUT_MS, 'duffel'
    ),
    withTimeout(
      searchFlightsGoogle({ origin: o, destination: d, departureDate, returnDate, adults, travelClass: travelClass.toUpperCase() }),
      PROVIDER_TIMEOUT_MS, 'googleFlights'
    ),
    withTimeout(
      searchFlightsAmadeus({ originCode: o, destinationCode: d, departureDate, returnDate, adults }),
      PROVIDER_TIMEOUT_MS, 'amadeus'
    ),
    withTimeout(
      searchFlightsTravelpayouts({ origin: o, destination: d, departureAt: departureDate, returnAt: returnDate }),
      PROVIDER_TIMEOUT_MS, 'travelpayouts'
    ),
  ]);

  const providerStatus = {};
  const normalized = [];

  if (duffelR.status === 'fulfilled') {
    providerStatus.duffel = duffelR.value.length ? 'ok' : 'no_results';
    normalized.push(...normalizeDuffel(duffelR.value));
  } else {
    providerStatus.duffel = statusFor(duffelR.reason);
  }

  if (googleR.status === 'fulfilled') {
    const flat = [...(googleR.value.topFlights || []), ...(googleR.value.otherFlights || [])];
    providerStatus.googleFlights = flat.length ? 'ok' : 'no_results';
    normalized.push(...normalizeGoogle(flat));
  } else {
    providerStatus.googleFlights = statusFor(googleR.reason);
  }

  if (amadeusR.status === 'fulfilled') {
    providerStatus.amadeus = amadeusR.value.length ? 'ok' : 'no_results';
    normalized.push(...normalizeAmadeus(amadeusR.value, { originCode: o, destinationCode: d }));
  } else {
    providerStatus.amadeus = statusFor(amadeusR.reason);
  }

  if (tpR.status === 'fulfilled') {
    providerStatus.travelpayouts = tpR.value.length ? 'ok' : 'no_results';
    normalized.push(...normalizeTravelpayouts(tpR.value));
  } else {
    providerStatus.travelpayouts = statusFor(tpR.reason);
  }

  const results = normalized
    .filter(f => f.price > 0)
    .sort((a, b) => a.price - b.price)
    .slice(0, TOP_N);

  return {
    results,
    providerStatus,
    searchParams: { origin: o, destination: d, departureDate, returnDate, adults, travelClass }
  };
};

export default { aggregateFlightSearch };
