import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { findCuratedLandmark } from '../src/services/landmarkResolverService.js';
import { findAirportsNearCoordinates } from '../src/services/nearbyAirportsService.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '../..');
const controller = readFileSync(join(root, 'Backend/src/controllers/locationController.js'), 'utf8');
const hasCode = (items, code) => items.some(item => item.iataCode === code);

const pyramids = findCuratedLandmark('пирамиды');
assert.equal(pyramids?.id, 'giza-pyramids', 'Russian pyramids query must resolve the Giza landmark');
assert.equal(findCuratedLandmark('Pyramids of Giza')?.id, 'giza-pyramids', 'English Giza query must resolve the same landmark');
const pyramidAirports = findAirportsNearCoordinates(pyramids.lat, pyramids.lng, 300, 5);
assert.ok(hasCode(pyramidAirports, 'CAI'), 'Pyramids of Giza must surface Cairo/CAI among nearby airports');

const redSquare = findCuratedLandmark('Красная площадь');
assert.equal(redSquare?.id, 'red-square', 'Russian Red Square query must resolve the Moscow landmark');
const redSquareAirports = findAirportsNearCoordinates(redSquare.lat, redSquare.lng, 300, 5);
assert.ok(redSquareAirports.some(item => ['SVO', 'DME', 'VKO'].includes(item.iataCode)), 'Red Square must surface a Moscow airport');

const eiffel = findCuratedLandmark('Eiffel Tower');
assert.equal(eiffel?.city, 'Paris', 'Eiffel Tower must resolve to Paris');
const parisAirports = findAirportsNearCoordinates(eiffel.lat, eiffel.lng, 300, 5);
assert.ok(parisAirports.some(item => ['CDG', 'ORY'].includes(item.iataCode)), 'Eiffel Tower must surface a Paris airport');

assert.equal(findCuratedLandmark('waterfall'), null, 'Ambiguous generic landmark words must not be force-mapped to a curated destination');
assert.equal(findCuratedLandmark('airport'), null, 'Generic travel terms must not collide with the landmark index');

assert.match(controller, /findCuratedLandmark/, 'Canonical location endpoint must consult the curated landmark resolver');
assert.match(controller, /curated-landmark-nearest-airport/, 'Curated landmarks must flow through the shared nearest-airport result contract');
assert.match(controller, /google-place-nearest-airport/, 'Unknown places must retain Google Places nearest-airport fallback');
assert.match(controller, /matchedLandmark/, 'Location responses must expose matched landmark metadata');

console.log('✅ Landmark aliases and nearest-airport fallback regression checks passed');
