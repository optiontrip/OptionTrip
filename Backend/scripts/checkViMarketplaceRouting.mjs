import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildMarketplaceSuggestion, detectMarketplaceIntent, formatMarketplaceForViPrompt } from '../src/services/viMarketplaceRouter.js';
import { buildViConversion, buildViTripContext } from '../src/services/viConversionService.js';
import { inferConversationLanguage } from '../src/services/chatService.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

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

const tripContext = buildViTripContext({
  currentTrip: {
    trip_id: 'trip_test_1',
    origin: { name: 'Los Angeles' },
    destination: { name: 'Las Vegas' },
    dates: { start_date: '2026-10-10', end_date: '2026-10-13' },
    guests: { adults: 2 },
  },
  preferences: { currency: 'USD' },
});
assert.equal(tripContext.origin, 'Los Angeles', 'Vi conversion must normalize structured trip origins into text');
assert.equal(tripContext.originCode, 'LAX', 'Vi conversion must preserve a trusted origin IATA code');
assert.equal(tripContext.destination, 'Las Vegas', 'Vi conversion must normalize structured trip destinations into text');
assert.equal(tripContext.destinationCode, 'LAS', 'Vi conversion must preserve a trusted destination IATA code');
assert.equal(tripContext.tripId, 'trip_test_1', 'Vi conversion must prefer the public trip_id over Mongo object identifiers');

const busConversion = buildViConversion({
  message: 'I need a bus for this trip',
  context: {
    currentTrip: {
      trip_id: 'trip_test_1',
      origin: { name: 'Los Angeles' },
      destination: { name: 'Las Vegas' },
      dates: { start_date: '2026-10-10', end_date: '2026-10-13' },
    },
  },
});
assert.equal(busConversion?.vertical, 'bus', 'Vi conversion must match the requested marketplace vertical');
assert.match(busConversion?.href || '', /^\/services\/bus\?/, 'Vi conversion must keep the user on the canonical OptionTrip bus page');
assert.match(busConversion?.href || '', /originCode=LAX/, 'Vi conversion URL must carry the known origin IATA code');
assert.match(busConversion?.href || '', /destinationCode=LAS/, 'Vi conversion URL must carry the known destination IATA code');
assert.doesNotMatch(busConversion?.href || '', /%5Bobject\+Object%5D|%5Bobject%20Object%5D/, 'Structured trip locations must never leak as [object Object] in handoff URLs');

const transferConversion = buildViConversion({
  message: 'I need an airport transfer',
  context: {
    currentTrip: {
      trip_id: 'trip_belgrade',
      destination: { name: 'Belgrade' },
    },
  },
});
assert.equal(transferConversion?.vertical, 'transfers', 'Vi conversion must match airport-transfer intent');
assert.match(transferConversion?.href || '', /^\/services\/transfers\?/, 'Transfers must stay on the canonical OptionTrip transfer page');
assert.match(transferConversion?.href || '', /destinationCode=BEG/, 'Transfer handoff must preserve the known destination code');

const serviceSearchSource = read('Frontend/src/components/ServiceRouteSearch/ServiceRouteSearch.jsx');
assert.match(serviceSearchSource, /params\.get\('originCode'\)/, 'Canonical service search must consume originCode from handoff URLs');
assert.match(serviceSearchSource, /params\.get\('destinationCode'\)/, 'Canonical service search must consume destinationCode from handoff URLs');
assert.match(serviceSearchSource, /setDestination\(\{[\s\S]*resolvedCode: destinationCode/, 'Destination handoffs must preselect the trusted IATA code instead of asking again');

const viBridgeSource = read('Frontend/src/components/ViAssistant/ViRouteIntentBridge.jsx');
const layoutSource = read('Frontend/src/components/Layout/Layout.jsx');
assert.match(viBridgeSource, /intent'\) !== 'find-service'/, 'Vi bridge must only auto-open for explicit service fallback intents');
assert.match(viBridgeSource, /new CustomEvent\('vi:open'/, 'Service fallback intents must open the existing Vi assistant');
assert.match(layoutSource, /<ViRouteIntentBridge \/>/, 'Global layout must mount the Vi service-intent bridge');

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

console.log('✅ Vi marketplace routing, structured trip handoff, service fallback bridge and conversation-language regression checks passed');
