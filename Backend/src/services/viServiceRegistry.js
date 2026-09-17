// Backend capability map for Vi. This is intentionally provider-neutral: provider
// credentials and affiliate IDs stay in environment/secrets, never in this file.
export const VI_SERVICE_CAPABILITIES = Object.freeze({
  flights: { label: 'Flights', intent: ['flight','fly','airfare','airline','plane'], liveSearch: true, route: '/flights', compare: ['dates','nearby_airports','cabin','stops','baggage','round_trip_vs_one_way'] },
  stays: { label: 'Stays', intent: ['hotel','stay','room','accommodation','resort','hostel'], liveSearch: true, route: '/hotels', compare: ['nightly_price','total_price','rating','location','cancellation'] },
  cars: { label: 'Car Rental', intent: ['car rental','rent a car','rental car','road trip car'], liveSearch: false, route: '/car-rental', compare: ['total_price','one_way','fuel_policy','insurance','deposit'] },
  activities: { label: 'Tours & Activities', intent: ['tour','activity','ticket','attraction','museum','experience'], liveSearch: false, route: '/tours', compare: ['price','duration','rating','cancellation'] },
  trains: { label: 'Trains', intent: ['train','rail','railway'], liveSearch: false, viFallback: true, compare: ['price','duration','changes','station_location'] },
  buses: { label: 'Buses', intent: ['bus','coach'], liveSearch: false, viFallback: true, compare: ['price','duration','station_location'] },
  ferries: { label: 'Ferries', intent: ['ferry','boat crossing'], liveSearch: false, viFallback: true, compare: ['price','duration','vehicle_rules'] },
  transfers: { label: 'Airport Transfers', intent: ['airport transfer','transfer','airport taxi','pickup'], liveSearch: false, viFallback: true, compare: ['price','vehicle','meet_and_greet','cancellation'] },
  esim: { label: 'eSIM', intent: ['esim','sim','mobile data','roaming','internet'], liveSearch: false, route: '/esim', compare: ['data','days','coverage','price'] },
  insurance: { label: 'Travel Insurance', intent: ['insurance','travel insurance','trip protection'], liveSearch: false, viFallback: true, compare: ['coverage','medical','cancellation','deductible','exclusions'] },
  visa: { label: 'Visa & Entry', intent: ['visa','entry requirement','passport requirement','entry rules'], liveSearch: false, viFallback: true, highStakes: true },
  cityPasses: { label: 'City Passes', intent: ['city pass','museum pass','attraction pass'], liveSearch: false, viFallback: true, compare: ['included_attractions','validity','price'] },
  luggage: { label: 'Luggage Storage', intent: ['luggage storage','bag storage','store bags'], liveSearch: false, viFallback: true, compare: ['price','hours','location'] },
  compensation: { label: 'Flight Compensation', intent: ['flight compensation','delay compensation','cancelled flight claim'], liveSearch: false, viFallback: true, highStakes: true },
  localTransit: { label: 'Local Transit', intent: ['metro','subway','tram','local bus','public transport','transit'], liveSearch: false, viFallback: true },
  shopping: { label: 'Local Shopping', intent: ['shopping','market','souvenir','local product','mall'], liveSearch: false, viFallback: true },
  food: { label: 'Food & Local Places', intent: ['restaurant','food','cafe','bar','local food'], liveSearch: false, viFallback: true },
  tripPlanning: { label: 'Trip Planning with Vi', intent: ['plan my trip','itinerary','trip plan'], liveSearch: false, route: '/travel-buddy' }
});

export const getViCapabilitiesForText = (text = '') => {
  const haystack = String(text).toLowerCase();
  return Object.entries(VI_SERVICE_CAPABILITIES)
    .filter(([, capability]) => capability.intent.some(term => haystack.includes(term)))
    .map(([id, capability]) => ({ id, ...capability }));
};

export const formatViCapabilitiesForPrompt = (text = '') => {
  const matches = getViCapabilitiesForText(text);
  if (!matches.length) return '';
  return matches.map(item => {
    const status = item.liveSearch ? 'LIVE SEARCH AVAILABLE' : 'GUIDANCE/ROUTING ONLY - do not claim live availability';
    return `${item.label}: ${status}${item.route ? `; OptionTrip route ${item.route}` : ''}`;
  }).join('\n');
};
