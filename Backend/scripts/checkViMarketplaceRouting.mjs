import assert from 'node:assert/strict';
import { buildMarketplaceSuggestion, detectMarketplaceIntent, formatMarketplaceForViPrompt } from '../src/services/viMarketplaceRouter.js';
import { inferConversationLanguage } from '../src/services/chatService.js';

const russianBus = buildMarketplaceSuggestion('Мне нужен автобус из Белграда в Сараево');
assert.equal(russianBus?.vertical, 'bus', 'Russian bus request must resolve the bus vertical');
assert.equal(russianBus?.route, '/services/bus', 'Bus requests must use the canonical OptionTrip service route');

const ukrainianInsurance = detectMarketplaceIntent('Потрібне страхування подорожі');
assert.equal(ukrainianInsurance?.vertical, 'insurance', 'Ukrainian insurance request must resolve insurance');

const car = buildMarketplaceSuggestion('I need a rental car in Los Angeles');
assert.equal(car?.vertical, 'cars', 'Car-rental request must resolve cars');
assert.equal(car?.route, '/car-rental', 'Cars must route directly to the live car-rental page');

const tour = buildMarketplaceSuggestion('Хочу экскурсию в Стамбуле');
assert.equal(tour?.vertical, 'activities', 'Russian excursion request must resolve activities');
assert.equal(tour?.route, '/tours', 'Activities must route directly to the live tours page');

const esim = buildMarketplaceSuggestion('Нужен мобильный интернет в Турции');
assert.equal(esim?.vertical, 'esim', 'Russian mobile-data request must resolve eSIM');
assert.equal(esim?.route, '/esim', 'eSIM must route directly to the live eSIM page');

const cityPass = buildMarketplaceSuggestion('Где купить туристическую карту города?');
assert.equal(cityPass?.vertical, 'city_passes', 'Russian city-pass request must resolve city passes');
assert.equal(cityPass?.route, '/services/city_passes', 'City passes must use the canonical OptionTrip service route');

const rail = buildMarketplaceSuggestion('I need a train from Paris to Amsterdam');
assert.equal(rail?.vertical, 'rail', 'English train request must resolve rail');
assert.equal(rail?.route, '/services/rail', 'Rail requests must use the canonical OptionTrip service route');

const transfer = buildMarketplaceSuggestion('Necesito un traslado del aeropuerto en Madrid');
assert.equal(transfer?.vertical, 'transfers', 'Spanish transfer request must resolve transfers');
assert.equal(transfer?.route, '/services/transfers', 'Transfer requests must use the canonical OptionTrip service route');

const germanRail = detectMarketplaceIntent('Ich brauche einen Zug von Berlin nach Prag');
assert.equal(germanRail?.vertical, 'rail', 'German rail request must resolve the rail vertical');

const vietnameseInsurance = detectMarketplaceIntent('Tôi cần bảo hiểm du lịch');
assert.equal(vietnameseInsurance?.vertical, 'insurance', 'Vietnamese insurance request must resolve insurance');

const partnerPrompt = formatMarketplaceForViPrompt('I need travel insurance');
assert.match(partnerPrompt, /keep the traveler inside OptionTrip/i, 'Partner services must stay OptionTrip-first');
assert.match(partnerPrompt, /DO NOT expose or invent a direct partner URL/i, 'Vi must not bypass OptionTrip comparison with a raw affiliate link');
assert.doesNotMatch(partnerPrompt, /https:\/\//i, 'Marketplace prompt must not expose a raw affiliate URL to Vi');
assert.match(partnerPrompt, /\/services\/insurance/, 'Vi must point partner services to a canonical OptionTrip service page');

assert.equal(
  inferConversationLanguage('Найди мне билет из Москвы в Стамбул'),
  'ru',
  'Vi must identify Russian from the latest user message',
);
assert.equal(
  inferConversationLanguage('Потрібен готель у Львові'),
  'uk',
  'Vi must identify Ukrainian from the latest user message',
);
assert.equal(
  inferConversationLanguage('IST', [{ role: 'user', text: 'Найди мне рейс в Стамбул' }]),
  'ru',
  'Language-neutral airport codes must inherit the recent user conversation language',
);
assert.equal(
  inferConversationLanguage('Find me a hotel in Paris'),
  'en',
  'English travel requests must remain English',
);

console.log('✅ Vi marketplace routing, canonical OptionTrip handoff and conversation-language regression checks passed');
