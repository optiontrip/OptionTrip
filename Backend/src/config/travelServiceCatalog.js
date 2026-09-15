// Central travel-service taxonomy used by Vi and the inventory layer.
// Provider availability remains controlled by travelProviderRegistry; this file never implies live inventory.
export const TRAVEL_SERVICE_CATALOG = Object.freeze([
  { key: 'flights', label: 'Flights', intents: ['flight', 'airfare', 'plane ticket'], providers: ['travelpayouts', 'amadeus', 'duffel'] },
  { key: 'hotels', label: 'Stays', intents: ['hotel', 'hostel', 'apartment', 'stay', 'accommodation'], providers: ['travelpayouts', 'hotelbeds'] },
  { key: 'rail', label: 'Trains', intents: ['train', 'rail'], providers: ['omio', '12go'] },
  { key: 'bus', label: 'Buses', intents: ['bus', 'coach'], providers: ['omio', '12go', 'busbud'] },
  { key: 'cars', label: 'Car rental', intents: ['car rental', 'rent a car'], providers: ['discovercars', 'getrentacar', 'localrent', 'autoeurope'] },
  { key: 'transfers', label: 'Airport transfers', intents: ['transfer', 'airport pickup', 'taxi'], providers: ['gettransfer', 'welcome_pickups', 'kiwitaxi', 'intui'] },
  { key: 'activities', label: 'Tours & activities', intents: ['tour', 'activity', 'attraction', 'ticket', 'experience', 'guide'], providers: ['viator', 'tiqets', 'wegotrip', 'klook', 'go_city', 'tripadvisor_experiences'] },
  { key: 'esim', label: 'eSIM & connectivity', intents: ['esim', 'sim', 'mobile data', 'internet abroad'], providers: ['airalo', 'yesim', 'gigsky', 'drimsim'] },
  { key: 'insurance', label: 'Travel insurance', intents: ['travel insurance', 'medical insurance'], providers: ['visitorscoverage'] },
  { key: 'luggage_storage', label: 'Luggage storage', intents: ['luggage storage', 'bag storage', 'left luggage'], providers: ['radical_storage'] },
  { key: 'flight_compensation', label: 'Flight compensation', intents: ['flight compensation', 'delayed flight', 'cancelled flight', 'canceled flight'], providers: ['airhelp', 'compensair'] },
  { key: 'events', label: 'Events', intents: ['event ticket', 'concert', 'show', 'sports ticket'], providers: ['ticketmaster'] },
  { key: 'bikes', label: 'Bike & motorcycle rental', intents: ['bike rental', 'motorcycle rental', 'scooter rental'], providers: ['bikesbooking'] },
]);

export const findTravelServices = text => {
  const normalized = String(text || '').toLowerCase();
  if (!normalized) return [];
  return TRAVEL_SERVICE_CATALOG.filter(service => service.intents.some(intent => normalized.includes(intent)));
};

export const getTravelServiceCatalog = () => TRAVEL_SERVICE_CATALOG.map(service => ({
  ...service,
  intents: [...service.intents],
  providers: [...service.providers],
}));
