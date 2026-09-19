import { getMarketplaceVertical } from './marketplaceCatalogService.js';

const INTENTS = Object.freeze([
  { vertical: 'cars', terms: ['car rental', 'rental car', 'rent a car', 'hire a car', 'аренда авто', 'аренда машины', 'прокат авто', 'оренда авто'] },
  { vertical: 'rail', terms: ['train', 'rail', 'railway', 'поезд', 'жд', 'железная дорога', 'потяг', 'поїзд', 'voz', 'vlak'] },
  { vertical: 'bus', terms: ['bus', 'coach', 'автобус', 'автобуси', 'busom'] },
  { vertical: 'ferries', terms: ['ferry', 'ferries', 'паром', 'пором', 'trajekt'] },
  { vertical: 'transfers', terms: ['airport transfer', 'transfer', 'taxi from airport', 'pickup from airport', 'трансфер', 'такси из аэропорта', 'трансфер из аэропорта', 'трансфер з аеропорту'] },
  { vertical: 'activities', terms: ['things to do', 'activity', 'activities', 'attraction', 'excursion', 'что посмотреть', 'чем заняться', 'экскурс', 'екскурс', 'активност', 'що подивитися', 'чим зайнятися'] },
  { vertical: 'tours', terms: ['tour', 'guided tour', 'тур', 'туры', 'экскурсионный тур', 'тури', 'tura'] },
  { vertical: 'city_passes', terms: ['city pass', 'city passes', 'sightseeing pass', 'туристическ', 'городской пасс', 'сити пасс', 'туристичн'] },
  { vertical: 'food', terms: ['food tour', 'food experience', 'culinary experience', 'гастротур', 'гастрономический тур', 'еда', 'ресторан', 'food'] },
  { vertical: 'esim', terms: ['esim', 'e-sim', 'travel sim', 'mobile data', 'еsim', 'есим', 'сим карта для путешествий', 'мобильный интернет', 'мобільний інтернет'] },
  { vertical: 'insurance', terms: ['travel insurance', 'trip insurance', 'medical insurance', 'страхов', 'страхование путешествий', 'медицинская страховка', 'страхуван'] },
  { vertical: 'luggage_storage', terms: ['luggage storage', 'bag storage', 'store my luggage', 'камера хранения', 'хранение багажа', 'оставить багаж', 'зберігання багажу'] },
  { vertical: 'flight_compensation', terms: ['flight compensation', 'delayed flight compensation', 'cancelled flight compensation', 'компенсация за рейс', 'задержали рейс', 'отменили рейс', 'компенсація за рейс'] },
  { vertical: 'bikes', terms: ['bike rental', 'rent a bike', 'bicycle rental', 'аренда велосипеда', 'велосипед напрокат', 'оренда велосипеда'] },
  { vertical: 'scooters', terms: ['scooter rental', 'rent a scooter', 'аренда самоката', 'аренда скутера', 'оренда скутера'] },
]);

const DIRECT_ROUTES = Object.freeze({
  cars: '/car-rental',
  activities: '/tours',
  tours: '/tours',
  esim: '/esim',
});

const normalize = value => String(value || '')
  .toLowerCase()
  .replace(/[ё]/g, 'е')
  .replace(/\s+/g, ' ')
  .trim();

const tokenize = value => normalize(value).split(/[^\p{L}\p{N}+-]+/u).filter(Boolean);

const matchesTerm = (text, rawTerm) => {
  const term = normalize(rawTerm);
  if (!term) return false;

  // Very short keywords such as "tour" / "тур" / "bus" must match a full
  // token only. Otherwise "тур" incorrectly matches "туристическая карта".
  if (!term.includes(' ') && term.length <= 4) {
    return tokenize(text).includes(term);
  }

  return text.includes(term);
};

export const detectMarketplaceIntent = message => {
  const text = normalize(message);
  if (!text) return null;
  const match = INTENTS.find(intent => intent.terms.some(term => matchesTerm(text, term)));
  if (!match) return null;
  return getMarketplaceVertical(match.vertical);
};

const routeForService = service => {
  if (DIRECT_ROUTES[service.vertical]) return DIRECT_ROUTES[service.vertical];
  return `/services?service=${encodeURIComponent(service.vertical)}`;
};

export const buildMarketplaceSuggestion = message => {
  const service = detectMarketplaceIntent(message);
  if (!service) return null;

  const route = routeForService(service);
  return {
    vertical: service.vertical,
    label: service.label,
    mode: service.mode,
    live: service.live,
    route,
    bookingUrl: service.bookingUrl || null,
    bookingProvider: service.bookingProvider || null,
    primaryProvider: service.primaryProvider,
    executableProviders: service.executableProviders,
  };
};

export const formatMarketplaceForViPrompt = message => {
  const suggestion = buildMarketplaceSuggestion(message);
  if (!suggestion) return '';

  const partnerInstruction = suggestion.bookingUrl
    ? ` A verified partner booking target is available from ${suggestion.bookingProvider || suggestion.primaryProvider || 'a configured partner'}: ${suggestion.bookingUrl}. You may offer this booking target directly while preserving the OptionTrip service route ${suggestion.route}.`
    : '';

  return `\nMARKETPLACE MATCH: The user's message matches OptionTrip service "${suggestion.label}" (${suggestion.vertical}). Current mode: ${suggestion.mode}. Live: ${suggestion.live ? 'yes' : 'no'}. Route: ${suggestion.route}.${partnerInstruction} ${suggestion.live ? 'Proactively offer this OptionTrip service and preserve known trip context.' : 'Do not claim live booking; explain that this service is being connected and continue helping conversationally.'}`;
};
