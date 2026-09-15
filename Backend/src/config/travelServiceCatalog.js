// OptionTrip service taxonomy. A catalog entry means Vi can understand and route the need;
// it does NOT mean that live inventory is available. Live readiness remains in travelProviderRegistry.
export const TRAVEL_SERVICE_CATALOG = Object.freeze([
  { key: 'flights', label: 'Flights', route: '/flights', audiences: ['leisure', 'business', 'family', 'lgbtq', 'accessible'], intents: ['flight', 'airfare', 'plane ticket'] },
  { key: 'stays', label: 'Stays', route: '/hotels', audiences: ['leisure', 'business', 'family', 'lgbtq', 'accessible'], intents: ['hotel', 'hostel', 'apartment', 'stay', 'accommodation'] },
  { key: 'cars', label: 'Car Rental', route: '/car-rental', audiences: ['leisure', 'business', 'family', 'accessible'], intents: ['car rental', 'rent a car'] },
  { key: 'rail', label: 'Trains', route: null, audiences: ['leisure', 'business', 'family', 'accessible'], intents: ['train', 'rail'] },
  { key: 'bus', label: 'Buses', route: null, audiences: ['leisure', 'budget', 'family', 'accessible'], intents: ['bus', 'coach'] },
  { key: 'transfers', label: 'Transfers & Taxis', route: null, audiences: ['leisure', 'business', 'family', 'accessible'], intents: ['transfer', 'airport pickup', 'taxi', 'private driver'] },
  { key: 'activities', label: 'Tours & Activities', route: '/tours', audiences: ['leisure', 'family', 'lgbtq', 'accessible'], intents: ['tour', 'activity', 'attraction', 'experience', 'museum', 'ticket', 'guide'] },
  { key: 'esim', label: 'eSIM & Connectivity', route: '/esim', audiences: ['leisure', 'business', 'family', 'accessible'], intents: ['esim', 'sim', 'mobile data', 'internet abroad'] },
  { key: 'insurance', label: 'Travel Insurance', route: null, audiences: ['leisure', 'business', 'family', 'accessible'], intents: ['travel insurance', 'medical insurance', 'trip protection'] },
  { key: 'luggage_storage', label: 'Luggage Storage', route: null, audiences: ['leisure', 'business', 'accessible'], intents: ['luggage storage', 'bag storage', 'left luggage'] },
  { key: 'flight_compensation', label: 'Flight Compensation', route: null, audiences: ['leisure', 'business', 'family', 'accessible'], intents: ['flight compensation', 'delayed flight', 'cancelled flight', 'canceled flight'] },
  { key: 'events', label: 'Events', route: null, audiences: ['leisure', 'business', 'lgbtq', 'accessible'], intents: ['concert', 'event ticket', 'festival', 'show', 'sports ticket'] },
  { key: 'business_travel', label: 'Business Travel', route: null, audiences: ['business'], intents: ['business trip', 'work trip', 'conference', 'trade show', 'bleisure'] },
  { key: 'accessible_travel', label: 'Accessible Travel', route: null, audiences: ['accessible'], intents: ['wheelchair', 'accessible travel', 'step-free', 'mobility assistance', 'hearing accessibility', 'visual accessibility'] },
  { key: 'lgbtq_travel', label: 'LGBTQ+ Travel', route: null, audiences: ['lgbtq'], intents: ['lgbt', 'lgbtq', 'gay travel', 'lesbian travel', 'pride'] },
]);

export const findTravelServices = text => {
  const normalized = String(text || '').toLowerCase();
  if (!normalized) return [];
  return TRAVEL_SERVICE_CATALOG.filter(service => service.intents.some(intent => normalized.includes(intent)));
};

export const getTravelServiceCatalog = () => TRAVEL_SERVICE_CATALOG.map(service => ({
  ...service,
  audiences: [...service.audiences],
  intents: [...service.intents],
}));
