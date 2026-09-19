import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildViConversion } from '../src/services/viConversionService.js';
import { buildViCountryMonthFlightConversion } from '../src/services/viFlightDiscoveryConversion.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '../..');
const read = relative => readFileSync(join(root, relative), 'utf8');
const fixedNow = new Date('2026-09-19T12:00:00Z');

const conversion = buildViConversion({
  message: 'Мне нужен автобус до Сараево',
  context: {
    currentTrip: {
      trip_id: 'trip-regression',
      origin: { name: 'Belgrade' },
      destination: { name: 'Sarajevo' },
      dates: { start_date: '2026-10-10', end_date: '2026-10-15' },
      guests: { adults: 2 },
    },
  },
  now: fixedNow,
});

assert.ok(conversion, 'Marketplace intent must build a Vi conversion object');
assert.equal(conversion.vertical, 'bus', 'Bus message must preserve the bus vertical');
assert.match(conversion.href, /^\/services\/bus\?/, 'Conversion must stay on the canonical internal OptionTrip service route');
assert.match(conversion.href, /originCode=BEG/, 'Known trip origin must carry BEG into the handoff');
assert.match(conversion.href, /destinationCode=SJJ/, 'Known trip destination must carry SJJ into the handoff');
assert.doesNotMatch(conversion.href, /^\/\//, 'Conversion must never produce a protocol-relative external link');
assert.doesNotMatch(conversion.href, /https?:\/\//i, 'Conversion must never expose a raw external provider URL');

const discoveryCases = [
  ['Show me the cheapest flights from Serbia to Turkey in October', 'RS', 'TR'],
  ['Покажи самые дешевые авиабилеты из Сербии в Турцию на октябрь', 'RS', 'TR'],
  ['Покажи найдешевші авіаквитки з України до Туреччини на жовтень', 'UA', 'TR'],
  ['Pokaži najjeftinije avionske karte iz Srbije u Tursku u oktobru', 'RS', 'TR'],
];

for (const [message, originCountry, destinationCountry] of discoveryCases) {
  const result = buildViConversion({ message, context: {}, now: fixedNow });
  assert.ok(result, `Vi must create a Whole Month CTA for: ${message}`);
  assert.equal(result.type, 'flight_whole_month', `Whole Month request must use the flight discovery conversion for: ${message}`);
  assert.equal(result.vertical, 'flights');
  assert.equal(result.context.originCountry, originCountry, `Origin country must resolve for: ${message}`);
  assert.equal(result.context.destinationCountry, destinationCountry, `Destination country must resolve for: ${message}`);
  assert.equal(result.context.month, '2026-10', `October must resolve relative to the fixed September 2026 test date for: ${message}`);
  assert.match(result.href, /^\/flights\/cheap\?/, 'Flight discovery CTA must stay on the internal Cheapest Explorer route');
  assert.match(result.href, new RegExp(`originCountry=${originCountry}`));
  assert.match(result.href, new RegExp(`destinationCountry=${destinationCountry}`));
  assert.match(result.href, /month=2026-10/);
  assert.doesNotMatch(result.href, /https?:\/\//i, 'Flight discovery conversion must never expose an external URL');
}

const codeCase = buildViConversion({
  message: 'Find cheapest flights from RS to TR in October',
  context: {},
  now: fixedNow,
});
assert.equal(codeCase?.context?.originCountry, 'RS', 'Two-letter country codes must be accepted by Vi discovery');
assert.equal(codeCase?.context?.destinationCountry, 'TR', 'Destination country code must be preserved');

const tooFar = buildViCountryMonthFlightConversion({
  message: 'Find cheapest flights from Serbia to Turkey in October 2028',
  context: {},
  now: fixedNow,
});
assert.equal(tooFar, null, 'Whole Month CTA must not be created beyond the 365-day search horizon');

const incomplete = buildViCountryMonthFlightConversion({
  message: 'Find cheapest flights from Serbia in October',
  context: {},
  now: fixedNow,
});
assert.equal(incomplete, null, 'Country-to-country CTA requires two distinct countries');

const conversationModel = read('Backend/src/models/Conversation.js');
const chatController = read('Backend/src/controllers/chatController.js');
const viAssistant = read('Frontend/src/components/ViAssistant/ViAssistant.jsx');
const conversionCard = read('Frontend/src/components/ViAssistant/ViConversionCard.jsx');
const conversionCss = read('Frontend/src/components/ViAssistant/ViConversionCard.css');
const conversionService = read('Backend/src/services/viConversionService.js');

assert.match(conversationModel, /conversion:\s*\{[\s\S]*?mongoose\.Schema\.Types\.Mixed/, 'Conversation messages must persist conversion metadata');
assert.match(chatController, /buildViConversion/, 'Chat controller must build marketplace conversion metadata');
assert.match(chatController, /conversion:\s*conversion\s*\|\|\s*undefined/, 'Stored assistant messages must persist the conversion object');
assert.match(chatController, /conversion:\s*conversion\s*\|\|\s*null/, 'REST/SSE responses must expose conversion metadata');
assert.match(viAssistant, /conversion:\s*m\.conversion/, 'Conversation reload must restore persisted conversion metadata');
assert.match(viAssistant, /conversion:\s*event\.conversion/, 'Streaming completion must attach the final conversion object');
assert.match(viAssistant, /<ViConversionCard\s+conversion=\{message\.conversion\}/, 'Vi messages must render the reusable conversion card');
assert.match(conversionService, /buildViCountryMonthFlightConversion/, 'Live Vi conversion routing must invoke deterministic country-month flight discovery before generic marketplace routing');
assert.match(conversionCard, /safeInternalHref/, 'Conversion card must validate internal navigation before rendering');
assert.match(conversionCard, /href\.startsWith\('\/'\)/, 'Conversion card must require a root-relative OptionTrip path');
assert.match(conversionCard, /href\.startsWith\('\/\/'\)/, 'Conversion card must reject protocol-relative external links');
assert.match(conversionCard, /flight_whole_month/, 'Conversion card must distinguish Whole Month flight discovery');
assert.match(conversionCss, /@media\s*\(max-width:\s*640px\)/, 'Conversion CTA must keep a dedicated mobile layout');

console.log('✅ Vi live marketplace conversion and multilingual country-to-country Whole Month handoff checks passed');
