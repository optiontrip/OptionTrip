import { registerProviderAdapter } from '../providerExecution.js';
import { getProviderPlan } from '../providerOrchestrator.js';
import { getTravelpayoutsProjectIdentity } from '../travelpayoutsPartnerLinks.js';

let registered = false;

const normalizeRequest = request => {
  const pickupLocation = String(
    request.pickupLocation
    || request.pickup
    || request.origin
    || request.destination
    || ''
  ).trim();
  const dropoffLocation = String(
    request.dropoffLocation
    || request.dropoff
    || request.destination
    || pickupLocation
  ).trim();

  return {
    pickupLocation,
    dropoffLocation,
    pickupDate: String(request.pickupDate || request.startDate || request.departureDate || '').slice(0, 10),
    returnDate: String(request.returnDate || request.endDate || '').slice(0, 10),
    driverAge: Number(request.driverAge || 30),
    countryCode: String(request.countryCode || '').trim().toUpperCase(),
    locale: String(request.locale || 'en').trim(),
  };
};

const liveBookingOptions = () => getProviderPlan('cars')
  .filter(item => item.configured && item.integration === 'affiliate' && item.bookingUrl)
  .map(item => ({
    provider: item.provider,
    bookingUrl: item.bookingUrl,
    integration: item.integration,
  }));

export const registerCarProviderAdapters = () => {
  if (registered) return;
  registered = true;

  registerProviderAdapter('travelpayouts_car_rental_widget', 'cars', async request => {
    const search = normalizeRequest(request);
    if (!search.pickupLocation) throw new Error('pickup_location_required');

    const identity = getTravelpayoutsProjectIdentity();
    return {
      mode: 'widget_handoff',
      search,
      widget: {
        provider: 'travelpayouts_car_rental_widget',
        promoId: 4480,
        campaignId: 10,
        trs: identity.trs,
        marker: identity.marker,
      },
      bookingOptions: liveBookingOptions(),
    };
  });
};
