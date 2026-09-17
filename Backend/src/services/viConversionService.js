import { buildMarketplaceSuggestion } from './viMarketplaceRouter.js';

const first = (...values) => values.find(value => value !== undefined && value !== null && value !== '');

const destinationFromTrip = trip => first(
  trip?.destination,
  trip?.destination_name,
  trip?.location?.destination,
  trip?.route?.destination,
  trip?.places?.[0]?.name
);

const originFromContext = context => first(
  context?.currentTrip?.origin,
  context?.currentTrip?.origin_name,
  context?.currentTrip?.route?.origin,
  context?.currentLocation?.city,
  context?.currentLocation?.name
);

const datesFromTrip = trip => ({
  startDate: first(trip?.dates?.start_date, trip?.start_date, trip?.startDate),
  endDate: first(trip?.dates?.end_date, trip?.end_date, trip?.endDate),
});

export const buildViTripContext = context => {
  const trip = context?.currentTrip || null;
  const dates = datesFromTrip(trip);
  return {
    tripId: first(trip?._id, trip?.id, trip?.trip_id),
    origin: originFromContext(context),
    destination: destinationFromTrip(trip),
    startDate: dates.startDate,
    endDate: dates.endDate,
    adults: first(trip?.travelers?.adults, trip?.adults, context?.preferences?.adults),
    currency: first(context?.preferences?.currency, trip?.currency),
  };
};

const compact = object => Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined && value !== null && value !== ''));

export const buildViConversion = ({ message, context }) => {
  const service = buildMarketplaceSuggestion(message);
  if (!service) return null;

  const tripContext = compact(buildViTripContext(context));
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
