const clean = (value) => (value === null || value === undefined ? '' : String(value));

const segment = ({ id = '', origin = '', destination = '', departureAt = '', arrivalAt = '', airline = '', flightNumber = '', durationMinutes = null, terminal = '', arrivalTerminal = '' } = {}) => ({
  id: clean(id),
  origin: clean(origin).toUpperCase(),
  destination: clean(destination).toUpperCase(),
  departureAt: clean(departureAt),
  arrivalAt: clean(arrivalAt),
  airline: clean(airline),
  flightNumber: clean(flightNumber),
  durationMinutes: Number.isFinite(Number(durationMinutes)) ? Number(durationMinutes) : null,
  terminal: clean(terminal),
  arrivalTerminal: clean(arrivalTerminal)
});

export const normalizeDuffelSegments = (segments = []) => segments.map((item, index) => segment({
  id: item.id || `duffel-${index}`,
  origin: item.origin?.iata_code,
  destination: item.destination?.iata_code,
  departureAt: item.departing_at,
  arrivalAt: item.arriving_at,
  airline: item.marketing_carrier?.name || item.marketing_carrier?.iata_code,
  flightNumber: `${item.marketing_carrier?.iata_code || ''}${item.marketing_carrier_flight_number || ''}`,
  terminal: item.origin_terminal,
  arrivalTerminal: item.destination_terminal
})).filter((item) => item.origin && item.destination && item.departureAt && item.arrivalAt);

export const normalizeGoogleSegments = (segments = []) => segments.map((item, index) => segment({
  id: item.id || `google-${index}`,
  origin: item.departure_airport?.airport_code,
  destination: item.arrival_airport?.airport_code,
  departureAt: item.departure_airport?.time,
  arrivalAt: item.arrival_airport?.time,
  airline: item.airline,
  flightNumber: item.flight_number,
  durationMinutes: item.duration,
  terminal: item.departure_airport?.terminal,
  arrivalTerminal: item.arrival_airport?.terminal
})).filter((item) => item.origin && item.destination && item.departureAt && item.arrivalAt);

export const normalizeAmadeusSegments = (segments = []) => segments.map((item, index) => segment({
  id: item.id || `amadeus-${index}`,
  origin: item.departure?.iataCode,
  destination: item.arrival?.iataCode,
  departureAt: item.departure?.at || item.departure?.time,
  arrivalAt: item.arrival?.at || item.arrival?.time,
  airline: item.carrierCode,
  flightNumber: `${item.carrierCode || ''}${item.number || item.flightNumber || ''}`,
  terminal: item.departure?.terminal,
  arrivalTerminal: item.arrival?.terminal
})).filter((item) => item.origin && item.destination && item.departureAt && item.arrivalAt);

export const combineFlightSegments = (...groups) => groups.flat().filter(Boolean);

export default { normalizeDuffelSegments, normalizeGoogleSegments, normalizeAmadeusSegments, combineFlightSegments };
