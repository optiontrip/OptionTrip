import { executeTravelSearch } from '../services/providerExecution.js';
import { registerFlightProviderAdapters } from '../services/providerAdapters/flights.js';
import { registerHotelProviderAdapters } from '../services/providerAdapters/hotels.js';
import { registerCarProviderAdapters } from '../services/providerAdapters/cars.js';

registerFlightProviderAdapters();
registerHotelProviderAdapters();
registerCarProviderAdapters();

const supported = new Set(['flights', 'hotels', 'cars']);

export const unifiedTravelSearch = async (req, res) => {
  const vertical = String(req.params.vertical || '').toLowerCase();
  if (!supported.has(vertical)) {
    return res.status(400).json({ success: false, error: 'vertical_not_executable_yet' });
  }

  const request = { ...req.query, ...req.body };
  if (vertical === 'flights' && (!request.origin || !request.destination || !(request.departureAt || request.departureDate))) {
    return res.status(400).json({ success: false, error: 'origin_destination_departure_required' });
  }
  if (vertical === 'hotels' && (!(request.destinationCode || request.destId || request.cityName) || !request.checkIn || !request.checkOut)) {
    return res.status(400).json({ success: false, error: 'destination_checkin_checkout_required' });
  }
  if (vertical === 'cars' && !(request.pickupLocation || request.pickup || request.origin || request.destination)) {
    return res.status(400).json({ success: false, error: 'pickup_location_required' });
  }

  const execution = await executeTravelSearch({ vertical, request });
  if (!execution.success) {
    return res.status(502).json({ success: false, vertical, ...execution });
  }

  return res.json({
    success: true,
    vertical,
    provider: execution.provider,
    results: execution.result,
    attempts: execution.attempts,
  });
};
