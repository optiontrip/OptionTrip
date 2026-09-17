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

const hasRecent = (activities, types, destination) =>
  types.some(type => hasActivityForDestination(activities, type, destination));

export const computeServiceSignals = (user, trip, recentActivities = []) => {
  if (!trip) return [];

  const signals = [];
  const destination = trip.destination?.name || trip.destination?.text || '';
  const daysOut = daysUntil(trip.dates?.start_date);
  const isUpcoming = daysOut !== null && daysOut >= 0;
  const tripReady = ['option_selected', 'itinerary_generated', 'confirmed', 'booked'].includes(trip.status);
  const hasFlight = Boolean(trip.selectedFlight?.bookingUrl || trip.selectedFlight?.airline);
  const hasStay = Boolean(trip.selectedHotel?.bookingUrl || trip.selectedHotel?.name);

  if (trip.status === 'option_selected' && !trip.selectedFlight?.bookingUrl) {
    pushLiveSignal(signals, 'flights', {
      service: 'flight',
      priority: 100,
      reason: 'trip option selected, no flight booked yet',
      destination,
      url: '/flights'
    });
  }

  if (tripReady && !hasStay && !hasRecent(recentActivities, ['hotel', 'stay'], destination)) {
    pushLiveSignal(signals, 'hotels', {
      service: 'hotel',
      priority: 95,
      reason: `trip is already taking shape but no stay is selected for ${destination || 'the destination'}`,
      destination,
      url: '/hotels'
    });
  }

  const roadTripSignal = matchesAny(trip.trip_type, ROAD_TRIP_TYPES) || (trip.guests?.total || 0) >= 3;
  if (roadTripSignal && !trip.selectedCar?.bookingUrl && !hasRecent(recentActivities, ['car', 'car_rental'], destination)) {
    pushLiveSignal(signals, 'cars', {
      service: 'car',
      priority: 78,
      reason: `trip style or party size makes a rental car worth comparing (${trip.trip_type || 'trip'}, ${trip.guests?.total || 1} traveler(s))`,
      destination,
      url: '/car-rental'
    });
  }

  if (isUpcoming && daysOut <= 14 && !hasRecent(recentActivities, ['esim'], destination)) {
    pushLiveSignal(signals, 'esim', {
      service: 'esim',
      priority: daysOut <= 3 ? 90 : 72,
      reason: `trip to ${destination || 'the destination'} is in ${daysOut} day(s), with no eSIM activity logged`,
      destination,
      url: '/esim'
    });
  }

  if (isUpcoming && daysOut <= 30 && !hasRecent(recentActivities, ['insurance', 'travel_insurance'], destination)) {
    pushLiveSignal(signals, 'insurance', {
      service: 'insurance',
      priority: daysOut <= 7 ? 82 : 62,
      reason: `upcoming trip is ${daysOut} day(s) away and no travel-insurance activity is logged`,
      destination,
      url: '/travel-buddy?service=insurance&intent=compare'
    });
  }

  if (isUpcoming && daysOut <= 10 && hasFlight && !hasRecent(recentActivities, ['transfer', 'airport_transfer'], destination)) {
    pushLiveSignal(signals, 'transfers', {
      service: 'transfer',
      priority: daysOut <= 3 ? 86 : 68,
      reason: `flight context exists for an upcoming arrival in ${destination || 'the destination'}, but no airport transfer activity is logged`,
      destination,
      url: '/travel-buddy?service=transfers&intent=arrival-transfer'
    });
  }

  const culturalSignal = matchesAny(trip.trip_type, CULTURAL_TYPES) ||
    recentActivities.some(a => ['plan_my_day', 'destination'].includes(a.type) &&
      matchesAny(a.metadata?.vibe || a.metadata?.tripType, CULTURAL_TYPES));
  if (culturalSignal && !hasRecent(recentActivities, ['tours', 'activities'], destination)) {
    pushLiveSignal(signals, 'activities', {
      service: 'tours',
      priority: 60,
      reason: `cultural or sightseeing interest is visible, with no activity search logged for ${destination || 'this destination'}`,
      destination,
      url: '/tours'
    });
  }

  if (isUpcoming && daysOut <= 5 && !hasRecent(recentActivities, ['luggage_storage'], destination)) {
    pushLiveSignal(signals, 'luggage_storage', {
      service: 'luggage_storage',
      priority: 42,
      reason: `trip starts soon; luggage storage can be useful when arrival and check-in or check-out and departure do not line up`,
      destination,
      url: '/travel-buddy?service=luggage_storage&intent=trip-timing'
    });
  }

  return signals
    .sort((a, b) => (b.priority || 0) - (a.priority || 0))
    .slice(0, 4);
};

export default { computeServiceSignals };
