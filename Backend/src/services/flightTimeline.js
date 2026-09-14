const toIso = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const normalizeAirport = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return value.iataCode || value.code || value.airport || value.name || null;
};

const normalizeSegment = (segment = {}, index = 0) => {
  const departure = segment.departure || {};
  const arrival = segment.arrival || {};

  const departureAt = toIso(
    segment.departureAt || departure.at || departure.time || segment.start
  );
  const arrivalAt = toIso(
    segment.arrivalAt || arrival.at || arrival.time || segment.end
  );

  if (!departureAt || !arrivalAt) return null;

  const origin = normalizeAirport(
    segment.origin || segment.from || departure.iataCode || departure.code || departure.airport
  );
  const destination = normalizeAirport(
    segment.destination || segment.to || arrival.iataCode || arrival.code || arrival.airport
  );

  const carrier = segment.carrierCode || segment.airline || segment.carrier || null;
  const number = segment.flightNumber || segment.number || null;

  return {
    id: segment.id || `flight-segment-${index + 1}`,
    origin,
    destination,
    departureAt,
    arrivalAt,
    carrier,
    flightNumber: carrier && number && !String(number).startsWith(String(carrier))
      ? `${carrier}${number}`
      : (number || null),
    terminalDeparture: departure.terminal || segment.departureTerminal || null,
    terminalArrival: arrival.terminal || segment.arrivalTerminal || null
  };
};

export const normalizeFlightSegments = (selectedFlight = {}) => {
  const directSegments = Array.isArray(selectedFlight.segments) ? selectedFlight.segments : [];
  const itinerarySegments = Array.isArray(selectedFlight.itineraries)
    ? selectedFlight.itineraries.flatMap((itinerary) => itinerary?.segments || [])
    : [];

  const source = directSegments.length ? directSegments : itinerarySegments;
  return source
    .map(normalizeSegment)
    .filter(Boolean)
    .sort((a, b) => new Date(a.departureAt) - new Date(b.departureAt));
};

export const buildFlightTimelineEvents = (selectedFlight = {}) => {
  const segments = normalizeFlightSegments(selectedFlight);
  if (!segments.length) return [];

  return segments.map((segment, index) => ({
    id: segment.id,
    type: 'flight',
    title: segment.flightNumber
      ? `Flight ${segment.flightNumber}`
      : `Flight ${segment.origin || ''}${segment.origin && segment.destination ? ' to ' : ''}${segment.destination || ''}`.trim(),
    start: segment.departureAt,
    end: segment.arrivalAt,
    location: segment.destination || segment.origin || null,
    metadata: {
      source: 'selectedFlight',
      segmentIndex: index,
      origin: segment.origin,
      destination: segment.destination,
      carrier: segment.carrier,
      flightNumber: segment.flightNumber,
      terminalDeparture: segment.terminalDeparture,
      terminalArrival: segment.terminalArrival
    }
  }));
};

export default {
  normalizeFlightSegments,
  buildFlightTimelineEvents
};
