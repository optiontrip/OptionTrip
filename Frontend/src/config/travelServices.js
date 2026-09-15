// Central user-facing travel service catalog.
// Keep navigation, Vi, booking discovery and future mobile apps aligned to one taxonomy.
export const TRAVEL_SERVICE_GROUPS = Object.freeze([
  { id: 'book', label: 'Book', services: [
    { id: 'flights', label: 'Flights', route: '/flights', icon: 'fa-plane', live: true },
    { id: 'stays', label: 'Stays', route: '/hotels', icon: 'fa-building', live: true },
    { id: 'cars', label: 'Car Rental', route: '/car-rental', icon: 'fa-car', live: true },
    { id: 'activities', label: 'Tours & Activities', route: '/tours', icon: 'fa-ticket', live: true },
    { id: 'esim', label: 'eSIM', route: '/esim', icon: 'fa-wifi', live: true },
  ]},
  { id: 'move', label: 'Get Around', services: [
    { id: 'rail', label: 'Trains', icon: 'fa-train' },
    { id: 'bus', label: 'Buses', icon: 'fa-bus' },
    { id: 'ferries', label: 'Ferries', icon: 'fa-ship' },
    { id: 'transfers', label: 'Airport Transfers', icon: 'fa-taxi' },
    { id: 'bikes', label: 'Bikes & Scooters', icon: 'fa-bicycle' },
  ]},
  { id: 'prepare', label: 'Prepare', services: [
    { id: 'insurance', label: 'Travel Insurance', icon: 'fa-shield' },
    { id: 'visa', label: 'Visa & Entry', icon: 'fa-passport' },
    { id: 'city_passes', label: 'City Passes', icon: 'fa-id-card' },
    { id: 'luggage_storage', label: 'Luggage Storage', icon: 'fa-suitcase' },
  ]},
  { id: 'help', label: 'Travel Help', services: [
    { id: 'flight_compensation', label: 'Flight Compensation', icon: 'fa-life-ring' },
    { id: 'plan_day', label: 'Plan My Day', route: '/plan-my-day', icon: 'fa-calendar', live: true },
    { id: 'where_go', label: 'Where Can I Go?', route: '/where-can-i-go', icon: 'fa-compass', live: true },
    { id: 'destinations', label: 'Destinations', route: '/destinations', icon: 'fa-map-marker', live: true },
  ]},
]);

export const TRAVEL_SERVICES = Object.freeze(TRAVEL_SERVICE_GROUPS.flatMap(group =>
  group.services.map(service => ({ ...service, group: group.id, groupLabel: group.label }))
));

export const getTravelService = id => TRAVEL_SERVICES.find(service => service.id === id);
export const getLiveTravelServices = () => TRAVEL_SERVICES.filter(service => service.live && service.route);
