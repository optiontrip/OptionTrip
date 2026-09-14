const clean = (value) => (value === null || value === undefined ? '' : String(value));

const segment = ({
  id = '',
  origin = '',
  destination = '',
  departureAt = '',
  arrivalAt = '',
  carrier = '',
  flightNumber = '',
  durationMinutes = null,
  departureTerminal = '',
  arrivalTerminal = '',
  aircraft = '',
  journeyId = ''
} = {}) => ({
  id: clean(id),
  origin: clean(origin).toUpperCase(),
  destination: clean(destination).toUpperCase(),
  departureAt: clean(departureAt),
  arrivalAt: clean(arrivalAt),
  carrier: clean(carrier),
  flightNumber: clean(flightNumber),
  aircraft: clean(aircraft),
  durationMinutes: Number.isFinite(Number(durationMinutes)) ? Number(durationMinutes) : null,
  departureTerminal: clean(departureTerminal),
  arrivalTerminal: clean(arrivalTerminal),
  journeyId: clean(journeyId)
});

export const normalizeDuffelSegments = (segments = [], journeyId = '') => segments.map((item, index) => segment({
  id: item.id || `duffel-${index}`,
  origin: item.origin?.iata_code,
  destination: item.destination?.iata_code,
  departureAt: item.departing_at,
  arrivalAt: item.arriving_at,
  carrier: item.marketing_carrier?.iata_code || item.marketing_carrier?.name,
  flightNumber: `${item.marketing_carrier?.iata_code || ''}${item.marketing_carrier_flight_number || ''}`,
  aircraft: item.aircraft?.name || item.aircraft?.iata_code,
  departureTerminal: item.origin_terminal,
  arrivalTerminal: item.destination_terminal,
  journeyId
})).filter((item) => item.origin && item.destination && item.departureAt && item.arrivalAt);

export const normalizeGoogleSegments = (segments = [], journeyId = '') => segments.map((item, index) => segment({
  id: item.id || `google-${index}`,
  origin: item.departure_airport?.airport_code,
  destination: item.arrival_airport?.airport_code,
  departureAt: item.departure_airport?.time,
  arrivalAt: item.arrival_airport?.time,
  carrier: item.airline,
  flightNumber: item.flight_number,
  aircraft: item.aircraft,
  durationMinutes: item.duration,
  departureTerminal: item.departure_airport?.terminal,
  arrivalTerminal: item.arrival_airport?.terminal,
  journeyId
})).filter((item) => item.origin && item.destination && item.departureAt && item.arrivalAt);

export const normalizeAmadeusSegments = (segments = [], journeyId = '') => segments.map((item, index) => segment({
  id: item.id || `amadeus-${index}`,
  origin: item.departure?.iataCode,
  destination: item.arrival?.iataCode,
  departureAt: item.departure?.at || item.departure?.time,
  arrivalAt: item.arrival?.at || item.arrival?.time,
  carrier: item.carrierCode,
  flightNumber: `${item.carrierCode || ''}${item.number || item.flightNumber || ''}`,
  aircraft: item.aircraft?.code || item.aircraft?.name,
  departureTerminal: item.departure?.terminal,
  arrivalTerminal: item.arrival?.terminal,
  journeyId
})).filter((item) => item.origin && item.destination && item.departureAt && item.arrivalAt);

export const combineFlightSegments = (...groups) => groups.flat().filter(Boolean);

export default { normalizeDuffelSegments, normalizeGoogleSegments, normalizeAmadeusSegments, combineFlightSegments };
