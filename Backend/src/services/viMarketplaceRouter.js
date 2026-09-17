import { getMarketplaceVertical } from './marketplaceCatalogService.js';

const INTENTS = Object.freeze([
  { vertical: 'cars', terms: ['car rental', 'rental car', 'rent a car', 'hire a car'] },
  { vertical: 'rail', terms: ['train', 'rail', 'railway'] },
  { vertical: 'bus', terms: ['bus', 'coach'] },
  { vertical: 'ferries', terms: ['ferry', 'ferries'] },
  { vertical: 'transfers', terms: ['airport transfer', 'transfer', 'taxi from airport', 'pickup from airport'] },
  { vertical: 'activities', terms: ['things to do', 'activity', 'activities', 'attraction', 'excursion'] },
  { vertical: 'tours', terms: ['tour', 'guided tour'] },
  { vertical: 'city_passes', terms: ['city pass', 'sightseeing pass'] },
  { vertical: 'food', terms: ['food tour', 'food experience', 'culinary experience'] },
  { vertical: 'esim', terms: ['esim', 'e-sim', 'travel sim', 'mobile data'] },
  { vertical: 'insurance', terms: ['travel insurance', 'trip insurance', 'medical insurance'] },
  { vertical: 'luggage_storage', terms: ['luggage storage', 'bag storage', 'store my luggage'] },
  { vertical: 'flight_compensation', terms: ['flight compensation', 'delayed flight compensation', 'cancelled flight compensation'] },
  { vertical: 'bikes', terms: ['bike rental', 'rent a bike', 'bicycle rental'] },
  { vertical: 'scooters', terms: ['scooter rental', 'rent a scooter'] },
]);

const normalize = value => String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();

export const detectMarketplaceIntent = message => {
  const text = normalize(message);
  if (!text) return null;
  const match = INTENTS.find(intent => intent.terms.some(term => text.includes(term)));
  if (!match) return null;
  return getMarketplaceVertical(match.vertical);
};

export const buildMarketplaceSuggestion = message => {
  const service = detectMarketplaceIntent(message);
  if (!service) return null;

  const route = service.mode === 'search' ? `/search/${service.vertical}` : `/services/${service.vertical}`;
  return {
    vertical: service.vertical,
    label: service.label,
    mode: service.mode,
    live: service.live,
    route,
    primaryProvider: service.primaryProvider,
    executableProviders: service.executableProviders,
  };
};

export const formatMarketplaceForViPrompt = message => {
  const suggestion = buildMarketplaceSuggestion(message);
  if (!suggestion) return '';
  return `\nMARKETPLACE MATCH: The user's message matches OptionTrip service "${suggestion.label}" (${suggestion.vertical}). Current mode: ${suggestion.mode}. Live: ${suggestion.live ? 'yes' : 'no'}. Route: ${suggestion.route}. ${suggestion.live ? 'Proactively offer this OptionTrip service and preserve known trip context.' : 'Do not claim live booking; explain that this service is being connected and continue helping conversationally.'}`;
};
