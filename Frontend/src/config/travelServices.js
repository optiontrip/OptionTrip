// Central user-facing travel service catalog.
// Keep navigation, Vi, booking discovery and future mobile apps aligned to one taxonomy.
// inventoryVertical links a user-facing service to backend provider readiness without
// exposing provider credentials in the browser.
export const TRAVEL_SERVICE_GROUPS = Object.freeze([
  { id: 'book', label: 'Book', services: [
    { id: 'flights', label: 'Flights', route: '/flights', icon: 'fa-plane', live: true, inventoryVertical: 'flights' },
    { id: 'stays', label: 'Stays', route: '/hotels', icon: 'fa-building', live: true, inventoryVertical: 'hotels' },
    { id: 'cars', label: 'Car Rental', route: '/car-rental', icon: 'fa-car', live: true, inventoryVertical: 'cars' },
    { id: 'activities', label: 'Tours & Activities', route: '/tours', icon: 'fa-ticket', live: true, inventoryVertical: 'activities' },
    { id: 'esim', label: 'eSIM', route: '/esim', icon: 'fa-wifi', live: true, inventoryVertical: 'esim' },
    {
      id: 'food',
      label: 'Food & dining',
      icon: 'fa-utensils',
      inventoryVertical: 'food',
      labels: {
        en: 'Food & dining', ru: 'Еда и рестораны', uk: 'Їжа та ресторани', de: 'Essen & Restaurants', fr: 'Gastronomie & restaurants', es: 'Gastronomía y restaurantes',
        it: 'Cibo e ristoranti', pt: 'Gastronomia e restaurantes', pl: 'Jedzenie i restauracje', tr: 'Yeme içme ve restoranlar', sr: 'Hrana i restorani', ar: 'الطعام والمطاعم',
        zh: '美食与餐厅', ja: 'グルメ・レストラン', ko: '음식 및 레스토랑', id: 'Kuliner & restoran', vi: 'Ẩm thực & nhà hàng', th: 'อาหารและร้านอาหาร',
        hi: 'भोजन और रेस्तरां', bn: 'খাবার ও রেস্তোরাঁ', hu: 'Ételek és éttermek', sv: 'Mat och restauranger'
      }
    },
  ]},
  { id: 'move', label: 'Get Around', services: [
    { id: 'rail', label: 'Trains', icon: 'fa-train', inventoryVertical: 'rail' },
    { id: 'bus', label: 'Buses', icon: 'fa-bus', inventoryVertical: 'bus' },
    { id: 'ferries', label: 'Ferries', icon: 'fa-ship', inventoryVertical: 'ferries' },
    { id: 'transfers', label: 'Airport Transfers', icon: 'fa-taxi', inventoryVertical: 'transfers' },
    { id: 'bikes', label: 'Bikes & Scooters', icon: 'fa-bicycle', inventoryVertical: 'bikes' },
  ]},
  { id: 'prepare', label: 'Prepare', services: [
    { id: 'insurance', label: 'Travel Insurance', icon: 'fa-shield', inventoryVertical: 'insurance' },
    { id: 'visa', label: 'Visa & Entry', icon: 'fa-passport' },
    { id: 'city_passes', label: 'City Passes', icon: 'fa-id-card', inventoryVertical: 'city_passes' },
    { id: 'luggage_storage', label: 'Luggage Storage', icon: 'fa-suitcase', inventoryVertical: 'luggage_storage' },
  ]},
  { id: 'help', label: 'Travel Help', services: [
    { id: 'flight_compensation', label: 'Flight Compensation', icon: 'fa-life-ring', inventoryVertical: 'flight_compensation' },
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

export const getTravelServiceDisplayLabel = (service, language, labels = {}) => {
  if (!service) return '';
  if (labels[service.id]) return labels[service.id];
  const languageCode = (language || 'en').split('-')[0];
  return service.labels?.[languageCode] || service.labels?.en || service.label;
};
