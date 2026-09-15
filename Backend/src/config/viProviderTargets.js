export const VI_PROVIDER_TARGETS = Object.freeze({
  flights: ['travelpayouts', 'amadeus', 'duffel'],
  hotels: ['travelpayouts', 'hotelbeds'],
  rail_bus: ['omio'],
  activities: ['tiqets', 'wegotrip', 'viator'],
  esim: ['airalo'],
  transfers: ['gettransfer'],
  evaluate_next: ['rental_cars', 'insurance', 'package_tours', 'cruises', 'ferries', 'lounges', 'parking', 'luggage_services', 'events', 'rv_camping', 'ski'],
});

// This list is a roadmap only. Provider registry/readiness remains authoritative
// for whether a provider can be exposed as live in OptionTrip.
export default VI_PROVIDER_TARGETS;
