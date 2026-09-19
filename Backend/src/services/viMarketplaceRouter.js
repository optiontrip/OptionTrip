import { getMarketplaceVertical } from './marketplaceCatalogService.js';

const INTENTS = Object.freeze([
  { vertical: 'cars', terms: ['car rental', 'rental car', 'rent a car', 'hire a car', 'аренда авто', 'аренда машины', 'прокат авто', 'оренда авто', 'mietwagen', 'location de voiture', 'alquiler de coche', 'alquiler de coches', 'noleggio auto', 'aluguel de carro', 'araç kiralama', 'iznajmljivanje auta', 'thuê xe'] },
  { vertical: 'rail', terms: ['train', 'rail', 'railway', 'поезд', 'жд', 'железная дорога', 'потяг', 'поїзд', 'zug', 'train', 'tren', 'treno', 'trem', 'trenler', 'voz', 'vlak', 'tàu hỏa'] },
  { vertical: 'bus', terms: ['bus', 'coach', 'автобус', 'автобуси', 'autobús', 'autobus', 'otobüs', 'busom', 'xe buýt'] },
  { vertical: 'ferries', terms: ['ferry', 'ferries', 'паром', 'пором', 'fähre', 'ferry', 'transbordador', 'traghetto', 'balsa', 'feribot', 'trajekt', 'phà'] },
  { vertical: 'transfers', terms: ['airport transfer', 'transfer', 'taxi from airport', 'pickup from airport', 'трансфер', 'такси из аэропорта', 'трансфер из аэропорта', 'трансфер з аеропорту', 'flughafentransfer', 'transfert aéroport', 'traslado del aeropuerto', 'transfer aeroporto', 'havalimanı transferi', 'aerodromski transfer', 'đưa đón sân bay'] },
  { vertical: 'activities', terms: ['things to do', 'activity', 'activities', 'attraction', 'excursion', 'что посмотреть', 'чем заняться', 'экскурс', 'екскурс', 'активност', 'що подивитися', 'чим зайнятися', 'aktivitäten', 'activités', 'actividades', 'attività', 'atividades', 'aktiviteler', 'aktivnosti', 'hoạt động'] },
  { vertical: 'tours', terms: ['tour', 'guided tour', 'тур', 'туры', 'экскурсионный тур', 'тури', 'führung', 'visite guidée', 'tour guiado', 'visita guidata', 'passeio guiado', 'rehberli tur', 'tura', 'chuyến tham quan'] },
  { vertical: 'city_passes', terms: ['city pass', 'city passes', 'sightseeing pass', 'туристическ', 'городской пасс', 'сити пасс', 'туристичн', 'city-pass', 'pass touristique', 'pase turístico', 'pass turistico', 'passe turístico', 'şehir kartı', 'turistička kartica'] },
  { vertical: 'food', terms: ['food tour', 'food experience', 'culinary experience', 'гастротур', 'гастрономический тур', 'еда', 'ресторан', 'food', 'kulinar', 'gastronom', 'restaurant', 'restaurante', 'ristorante', 'restoran', 'ẩm thực', 'nhà hàng'] },
  { vertical: 'esim', terms: ['esim', 'e-sim', 'travel sim', 'mobile data', 'еsim', 'есим', 'сим карта для путешествий', 'мобильный интернет', 'мобільний інтернет', 'mobile daten', 'données mobiles', 'datos móviles', 'dati mobili', 'dados móveis', 'mobil veri', 'mobilni internet', 'dữ liệu di động'] },
  { vertical: 'insurance', terms: ['travel insurance', 'trip insurance', 'medical insurance', 'страхов', 'страхование путешествий', 'медицинская страховка', 'страхуван', 'reiseversicherung', 'assurance voyage', 'seguro de viaje', 'assicurazione viaggio', 'seguro viagem', 'seyahat sigortası', 'putno osiguranje', 'bảo hiểm du lịch'] },
  { vertical: 'luggage_storage', terms: ['luggage storage', 'bag storage', 'store my luggage', 'камера хранения', 'хранение багажа', 'оставить багаж', 'зберігання багажу', 'gepäckaufbewahrung', 'consigne à bagages', 'consigna de equipaje', 'deposito bagagli', 'guarda-volumes', 'bagaj emaneti', 'čuvanje prtljaga', 'giữ hành lý'] },
  { vertical: 'flight_compensation', terms: ['flight compensation', 'delayed flight compensation', 'cancelled flight compensation', 'компенсация за рейс', 'задержали рейс', 'отменили рейс', 'компенсація за рейс', 'flugentschädigung', 'indemnisation de vol', 'compensación de vuelo', 'rimborso volo', 'indenização de voo', 'uçuş tazminatı', 'naknada za let', 'bồi thường chuyến bay'] },
  { vertical: 'bikes', terms: ['bike rental', 'rent a bike', 'bicycle rental', 'аренда велосипеда', 'велосипед напрокат', 'оренда велосипеда', 'fahrradverleih', 'location de vélo', 'alquiler de bicicletas', 'noleggio bici', 'aluguel de bicicleta', 'bisiklet kiralama', 'iznajmljivanje bicikla', 'thuê xe đạp'] },
  { vertical: 'scooters', terms: ['scooter rental', 'rent a scooter', 'аренда самоката', 'аренда скутера', 'оренда скутера', 'roller mieten', 'location de scooter', 'alquiler de scooter', 'noleggio scooter', 'aluguel de scooter', 'scooter kiralama', 'iznajmljivanje skutera', 'thuê xe tay ga'] },
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
    bookingAvailable: Boolean(service.bookingUrl),
    bookingProvider: service.bookingProvider || null,
    primaryProvider: service.primaryProvider,
    liveProviderCount: service.liveProviderCount || 0,
    executableProviders: service.executableProviders,
  };
};

export const formatMarketplaceForViPrompt = message => {
  const suggestion = buildMarketplaceSuggestion(message);
  if (!suggestion) return '';

  const providerSummary = suggestion.liveProviderCount > 0
    ? ` ${suggestion.liveProviderCount} configured provider${suggestion.liveProviderCount === 1 ? '' : 's'} are currently available for this service.`
    : '';

  const optionTripFirst = ` Keep the traveler inside OptionTrip first. DO NOT expose or invent a direct partner URL in chat. Send the traveler to ${suggestion.route}; any outbound partner checkout is the final step only.`;
  const bookingInstruction = suggestion.bookingAvailable
    ? ' A verified booking handoff exists behind the OptionTrip comparison flow.'
    : '';

  return `\nMARKETPLACE MATCH: The user's message matches OptionTrip service "${suggestion.label}" (${suggestion.vertical}). Current mode: ${suggestion.mode}. Live: ${suggestion.live ? 'yes' : 'no'}. OptionTrip route: ${suggestion.route}.${providerSummary}${bookingInstruction}${optionTripFirst} ${suggestion.live ? 'Proactively offer this OptionTrip service and preserve known trip context.' : 'Do not claim live booking; explain that this service is being connected and continue helping conversationally.'}`;
};
