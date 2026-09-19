import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildViConversion } from '../src/services/viConversionService.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '../..');
const read = relative => readFileSync(join(root, relative), 'utf8');

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
});

assert.ok(conversion, 'Marketplace intent must build a Vi conversion object');
assert.equal(conversion.vertical, 'bus', 'Bus message must preserve the bus vertical');
assert.match(conversion.href, /^\/services\/bus\?/, 'Conversion must stay on the canonical internal OptionTrip service route');
assert.match(conversion.href, /originCode=BEG/, 'Known trip origin must carry BEG into the handoff');
assert.match(conversion.href, /destinationCode=SJJ/, 'Known trip destination must carry SJJ into the handoff');
assert.doesNotMatch(conversion.href, /^\/\//, 'Conversion must never produce a protocol-relative external link');
assert.doesNotMatch(conversion.href, /https?:\/\//i, 'Conversion must never expose a raw external provider URL');

const conversationModel = read('Backend/src/models/Conversation.js');
const chatController = read('Backend/src/controllers/chatController.js');
const viAssistant = read('Frontend/src/components/ViAssistant/ViAssistant.jsx');
const conversionCard = read('Frontend/src/components/ViAssistant/ViConversionCard.jsx');
const conversionCss = read('Frontend/src/components/ViAssistant/ViConversionCard.css');

assert.match(conversationModel, /conversion:\s*\{[\s\S]*?mongoose\.Schema\.Types\.Mixed/, 'Conversation messages must persist conversion metadata');
assert.match(chatController, /buildViConversion/, 'Chat controller must build marketplace conversion metadata');
assert.match(chatController, /conversion:\s*conversion\s*\|\|\s*undefined/, 'Stored assistant messages must persist the conversion object');
assert.match(chatController, /conversion:\s*conversion\s*\|\|\s*null/, 'REST/SSE responses must expose conversion metadata');
assert.match(viAssistant, /conversion:\s*m\.conversion/, 'Conversation reload must restore persisted conversion metadata');
assert.match(viAssistant, /conversion:\s*event\.conversion/, 'Streaming completion must attach the final conversion object');
assert.match(viAssistant, /<ViConversionCard\s+conversion=\{message\.conversion\}/, 'Vi messages must render the reusable conversion card');
assert.match(conversionCard, /safeInternalHref/, 'Conversion card must validate internal navigation before rendering');
assert.match(conversionCard, /href\.startsWith\('\/'\)/, 'Conversion card must require a root-relative OptionTrip path');
assert.match(conversionCard, /href\.startsWith\('\/\/'\)/, 'Conversion card must reject protocol-relative external links');
assert.match(conversionCss, /@media\s*\(max-width:\s*640px\)/, 'Conversion CTA must keep a dedicated mobile layout');

console.log('✅ Vi live marketplace conversion persistence, streaming and UI handoff checks passed');
