import { findCuratedLandmarkInText } from './landmarkResolverService.js';
import { findAirportsNearCoordinates } from './nearbyAirportsService.js';

const normalize = value => String(value || '')
  .normalize('NFKC')
  .toLowerCase()
  .replace(/[’'`]/g, '')
  .replace(/[^\p{L}\p{N}\s-]+/gu, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const FLIGHT_HINTS = [
  'flight', 'flights', 'fly', 'airfare', 'plane', 'air ticket', 'plane ticket',
  'авиабилет', 'авиабилеты', 'самолет', 'самолёт', 'лететь', 'долететь', 'перелет', 'перелёт',
  'авіаквит', 'літак', 'летіти', 'долетіти', 'квиток',
  'avion', 'avionsk', 'let', 'letovi', 'karta', 'karte',
];

const hasFlightIntent = message => {
  const text = ` ${normalize(message)} `;
  return FLIGHT_HINTS.some(term => {
    const normalizedTerm = normalize(term);
    return normalizedTerm.length <= 3
      ? text.includes(` ${normalizedTerm} `)
      : text.includes(normalizedTerm);
  });
};

const nearestAirportsForLandmark = landmark => {
  let airports = findAirportsNearCoordinates(Number(landmark.lat), Number(landmark.lng), 300, 5);
  if (!airports.length) airports = findAirportsNearCoordinates(Number(landmark.lat), Number(landmark.lng), 800, 5);
  return airports;
};

export const buildViLandmarkFlightConversion = ({ message, tripContext = {} }) => {
  if (!hasFlightIntent(message)) return null;
  const landmark = findCuratedLandmarkInText(message);
  if (!landmark) return null;

  const airports = nearestAirportsForLandmark(landmark);
  const destinationAirport = airports[0];
  if (!destinationAirport?.iataCode) return null;

  const query = new URLSearchParams({
    destinationCode: destinationAirport.iataCode,
    destinationDisplay: `${landmark.name} → ${destinationAirport.cityName || destinationAirport.name} (${destinationAirport.iataCode})`,
    landmarkId: landmark.id,
    landmarkName: landmark.name,
  });

  if (tripContext.originCode) query.set('originCode', tripContext.originCode);
  if (tripContext.origin) query.set('originDisplay', tripContext.origin);

  return {
    type: 'flight_landmark',
    vertical: 'flights',
    label: `Flights to ${landmark.name}`,
    mode: 'search',
    live: true,
    actionable: true,
    href: `/flights?${query.toString()}`,
    context: {
      ...(tripContext.origin ? { origin: tripContext.origin } : {}),
      ...(tripContext.originCode ? { originCode: tripContext.originCode } : {}),
      destination: landmark.name,
      destinationCode: destinationAirport.iataCode,
      destinationCity: destinationAirport.cityName || null,
      landmarkId: landmark.id,
      landmarkName: landmark.name,
      landmarkCountry: landmark.country,
      nearbyAirports: airports.map(item => ({
        iataCode: item.iataCode,
        cityName: item.cityName,
        distanceKm: item.distanceKm,
      })),
    },
    cta: `Search flights to ${landmark.name}`,
    primaryProvider: null,
  };
};

export default { buildViLandmarkFlightConversion };
