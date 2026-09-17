import { getConfiguredProviders } from '../config/travelProviderRegistry.js';

const ROAD_TRIP_TYPES = ['road trip', 'adventure', 'nature', 'safari', 'countryside'];
const CULTURAL_TYPES  = ['cultural', 'culture', 'adventure', 'city break', 'history', 'sightseeing'];

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const diffMs = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diffMs / 86400000);
};

const hasActivityForDestination = (activities, type, destination) => {
  if (!destination) return activities.some(a => a.type === type);
  const dest = destination.toLowerCase();
  return activities.some(a => {
    if (a.type !== type) return false;
    const md = a.metadata || {};
    const candidate = (md.destination || md.city || '').toLowerCase();
    return candidate.includes(dest) || dest.includes(candidate);
  });
};

const matchesAny = (value, list) => {
  if (!value) return false;
  const v = value.toLowerCase();
  return list.some(t => v.includes(t));
};

const pushLiveSignal = (signals, vertical, signal) => {
  const providers = getConfiguredProviders(vertical);
  if (!providers.length) return;
  signals.push({ ...signal, vertical, providers });
};

export const computeServiceSignals = (user, trip, recentActivities = []) => {
  if (!trip) return [];

  const signals = [];
  const destination = trip.destination?.name || trip.destination?.text || '';
  const daysOut = daysUntil(trip.dates?.start_date);
  const isUpcoming = daysOut !== null && daysOut >= 0;

  if (isUpcoming && daysOut <= 14 && !hasActivityForDestination(recentActivities, 'esim', destination)) {
    pushLiveSignal(signals, 'esim', {
      service: 'esim',
      reason: `trip to ${destination || 'their destination'} in ${daysOut} day(s), no eSIM activity logged`,
      destination,
      url: '/esim'
    });
  }

  const roadTripSignal = matchesAny(trip.trip_type, ROAD_TRIP_TYPES) || (trip.guests?.total || 0) >= 3;
  if (roadTripSignal && !trip.selectedCar?.bookingUrl && !hasActivityForDestination(recentActivities, 'car', destination)) {
    pushLiveSignal(signals, 'cars', {
      service: 'car',
      reason: `trip_type/party size suggests a car (${trip.trip_type || 'n/a'}, ${trip.guests?.total || 0} travelers), none booked`,
      destination,
      url: '/car-rental'
    });
  }

  if (['option_selected', 'itinerary_generated'].includes(trip.status) &&
      !trip.selectedHotel?.bookingUrl &&
      !hasActivityForDestination(recentActivities, 'hotel', destination)) {
    pushLiveSignal(signals, 'hotels', {
      service: 'hotel',
      reason: `trip status is ${trip.status}, no stay selected or searched`,
      destination,
      url: '/hotels'
    });
  }

  const culturalSignal = matchesAny(trip.trip_type, CULTURAL_TYPES) ||
    recentActivities.some(a => ['plan_my_day', 'destination'].includes(a.type) &&
      matchesAny(a.metadata?.vibe || a.metadata?.tripType, CULTURAL_TYPES));
  if (culturalSignal && !hasActivityForDestination(recentActivities, 'tours', destination)) {
    pushLiveSignal(signals, 'activities', {
      service: 'tours',
      reason: `cultural/adventure interest detected, no tours activity for ${destination || 'this destination'}`,
      destination,
      url: '/tours'
    });
  }

  if (trip.status === 'option_selected' && !trip.selectedFlight?.bookingUrl) {
    pushLiveSignal(signals, 'flights', {
      service: 'flight',
      reason: 'trip option selected, no flight booked yet',
      destination,
      url: '/flights'
    });
  }

  return signals;
};

export default { computeServiceSignals };
