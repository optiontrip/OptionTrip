import { buildMarketplaceSuggestion } from './viMarketplaceRouter.js';
import { findAirportByCityName, getAirportInfo } from './nearbyAirportsService.js';
import { buildViCountryMonthFlightConversion } from './viFlightDiscoveryConversion.js';
import { buildViLandmarkFlightConversion } from './viLandmarkFlightConversion.js';

const first = (...values) => values.find(value => value !== undefined && value !== null && value !== '');

const placeName = value => {
  if (!value) return null;
  if (typeof value === 'string') return value.trim() || null;
  if (typeof value === 'object') {
    return first(
      value.name,
      value.city,
      value.cityName,
      value.label,
      value.destination,
      value.origin
    ) || null;
  }
  return null;
};

const destinationFromTrip = trip => first(
  placeName(trip?.destination),
  placeName(trip?.destination_name),
  placeName(trip?.location?.destination),
  placeName(trip?.route?.destination),
  placeName(trip?.places?.[0])
);

const originFromContext = context => first(
  placeName(context?.currentTrip?.origin),
  placeName(context?.currentTrip?.origin_name),
  placeName(context?.currentTrip?.route?.origin),
  placeName(context?.currentLocation?.city),
  placeName(context?.currentLocation?.name),
  placeName(context?.currentLocation?.label)
);

const datesFromTrip = trip => ({
  startDate: first(trip?.dates?.start_date, trip?.start_date, trip?.startDate),
  endDate: first(trip?.dates?.end_date, trip?.end_date, trip?.endDate),
});

const resolveContextIata = place => {
  const value = String(place || '').trim();
  if (!value) return null;
  if (/^[A-Za-z]{3}$/.test(value) && getAirportInfo(value.toUpperCase())) return value.toUpperCase();
  return findAirportByCityName(value)?.iata || null;
};

export const buildViTripContext = context => {
  const trip = context?.currentTrip || null;
  const dates = datesFromTrip(trip);
  const origin = originFromContext(context);
  const destination = destinationFromTrip(trip);
  return {
    tripId: first(trip?.trip_id, trip?.id, trip?._id),
    origin,
    originCode: resolveContextIata(origin),
    destination,
    destinationCode: resolveContextIata(destination),
    startDate: dates.startDate,
    endDate: dates.endDate,
    adults: first(trip?.travelers?.adults, trip?.guests?.adults, trip?.adults, context?.preferences?.adults),
    currency: first(context?.preferences?.currency, trip?.currency),
  };
};

const compact = object => Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined && value !== null && value !== ''));

export const buildViConversion = ({ message, context, now }) => {
  const flightDiscovery = buildViCountryMonthFlightConversion({ message, context, now: now || new Date() });
  if (flightDiscovery) return flightDiscovery;

  const tripContext = compact(buildViTripContext(context));
  const landmarkFlight = buildViLandmarkFlightConversion({ message, tripContext });
  if (landmarkFlight) return landmarkFlight;

  const service = buildMarketplaceSuggestion(message);
  if (!service) return null;

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(tripContext)) query.set(key, String(value));

  const href = `${service.route}${query.size ? `?${query.toString()}` : ''}`;
  const actionable = service.live && service.mode !== 'coming_soon';

  return {
    type: 'marketplace_service',
    vertical: service.vertical,
    label: service.label,
    mode: service.mode,
    live: service.live,
    actionable,
    href,
    context: tripContext,
    cta: actionable ? `Continue with ${service.label}` : `Explore ${service.label}`,
    primaryProvider: service.primaryProvider || null,
  };
};
