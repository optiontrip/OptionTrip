import express from 'express';
import { buildMarketplaceSuggestion } from '../services/viMarketplaceRouter.js';
import { buildViConversion } from '../services/viConversionService.js';

const router = express.Router();

const safeString = value => {
  if (typeof value !== 'string') return value;
  return value.slice(0, 200);
};

const sanitizeTripContext = raw => {
  const source = raw && typeof raw === 'object' ? raw : {};
  const trip = source.currentTrip && typeof source.currentTrip === 'object' ? source.currentTrip : null;
  const location = source.currentLocation && typeof source.currentLocation === 'object' ? source.currentLocation : null;
  const preferences = source.preferences && typeof source.preferences === 'object' ? source.preferences : null;

  return {
    currentTrip: trip ? {
      trip_id: safeString(trip.trip_id),
      id: safeString(trip.id),
      destination: trip.destination,
      destination_name: safeString(trip.destination_name),
      origin: trip.origin,
      origin_name: safeString(trip.origin_name),
      route: trip.route,
      dates: trip.dates,
      guests: trip.guests,
      travelers: trip.travelers,
      adults: trip.adults,
      currency: safeString(trip.currency),
    } : null,
    currentLocation: location ? {
      city: safeString(location.city),
      name: safeString(location.name),
      label: safeString(location.label),
      country: safeString(location.country),
    } : null,
    preferences: preferences ? {
      adults: preferences.adults,
      currency: safeString(preferences.currency),
    } : null,
  };
};

router.post('/route', (req, res) => {
  const message = String(req.body?.message || '').trim();
  if (!message) return res.status(400).json({ success: false, error: 'message_required' });

  const context = sanitizeTripContext(req.body?.context);
  const suggestion = buildMarketplaceSuggestion(message);
  const conversion = suggestion ? buildViConversion({ message, context }) : null;

  return res.json({
    success: true,
    matched: Boolean(suggestion),
    suggestion,
    conversion,
  });
});

export default router;
