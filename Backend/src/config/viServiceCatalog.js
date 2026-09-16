// Vi-facing capability map. This mirrors the customer travel-service taxonomy
// without claiming that every category has live inventory. Keep truthful:
// live_search means Vi may describe current search results; guide means Vi
// should advise/collect context and route the traveler to the appropriate flow.
export const VI_SERVICE_CATALOG = Object.freeze([
  { id: 'flights', label: 'Flights', capability: 'live_search', route: '/flights' },
  { id: 'stays', label: 'Stays', capability: 'live_search', route: '/hotels' },
  { id: 'cars', label: 'Car Rental', capability: 'booking_flow', route: '/car-rental' },
  { id: 'activities', label: 'Tours & Activities', capability: 'booking_flow', route: '/tours' },
  { id: 'esim', label: 'eSIM', capability: 'booking_flow', route: '/esim' },
  { id: 'rail', label: 'Trains', capability: 'guide' },
  { id: 'bus', label: 'Buses', capability: 'guide' },
  { id: 'ferries', label: 'Ferries', capability: 'guide' },
  { id: 'transfers', label: 'Airport Transfers', capability: 'guide' },
  { id: 'bikes', label: 'Bikes & Scooters', capability: 'guide' },
  { id: 'insurance', label: 'Travel Insurance', capability: 'guide' },
  { id: 'visa', label: 'Visa & Entry', capability: 'guide' },
  { id: 'city_passes', label: 'City Passes', capability: 'guide' },
  { id: 'luggage_storage', label: 'Luggage Storage', capability: 'guide' },
  { id: 'flight_compensation', label: 'Flight Compensation', capability: 'guide' },
]);

export const formatViServiceCatalogForPrompt = () => VI_SERVICE_CATALOG
  .map(service => `- ${service.label}: ${service.capability}${service.route ? ` (${service.route})` : ''}`)
  .join('\n');
