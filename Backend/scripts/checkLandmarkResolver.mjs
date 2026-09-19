import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { findCuratedLandmark, findCuratedLandmarkInText } from '../src/services/landmarkResolverService.js';
import { findAirportsNearCoordinates } from '../src/services/nearbyAirportsService.js';
import { buildViLandmarkFlightConversion } from '../src/services/viLandmarkFlightConversion.js';
import { buildViConversion } from '../src/services/viConversionService.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '../..');
const controller = readFileSync(join(root, 'Backend/src/controllers/locationController.js'), 'utf8');
const exploreUi = readFileSync(join(root, 'Frontend/src/components/ExploreDestinations/ExploreDestinations.jsx'), 'utf8');
const viConversionService = readFileSync(join(root, 'Backend/src/services/viConversionService.js'), 'utf8');
const hasCode = (items, code) => items.some(item => item.iataCode === code);

const pyramids = findCuratedLandmark('пирамиды');
assert.equal(pyramids?.id, 'giza-pyramids', 'Russian pyramids query must resolve the Giza landmark');
assert.equal(findCuratedLandmark('Pyramids of Giza')?.id, 'giza-pyramids', 'English Giza query must resolve the same landmark');
assert.equal(findCuratedLandmarkInText('Как долететь до пирамид?')?.id, 'giza-pyramids', 'Natural Russian flight phrasing must locate the curated landmark inside text');
assert.equal(findCuratedLandmarkInText('Find a flight to the Eiffel Tower')?.id, 'eiffel-tower', 'Natural English phrasing must locate Eiffel Tower inside text');
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
assert.equal(findCuratedLandmarkInText('I need a flight to some waterfall somewhere'), null, 'Generic landmark categories must not be force-mapped from natural text');

const landmarkConversion = buildViLandmarkFlightConversion({
  message: 'Как долететь до пирамид?',
  tripContext: { origin: 'Belgrade', originCode: 'BEG' },
});
assert.ok(landmarkConversion, 'Vi landmark flight request must produce a conversion');
assert.equal(landmarkConversion.type, 'flight_landmark');
assert.equal(landmarkConversion.vertical, 'flights');
assert.equal(landmarkConversion.context.landmarkId, 'giza-pyramids');
assert.equal(landmarkConversion.context.originCode, 'BEG');
assert.equal(landmarkConversion.context.destinationCode, 'CAI', 'Pyramids handoff must use Cairo as practical nearest airport');
assert.match(landmarkConversion.href, /^\/flights\?/, 'Landmark handoff must stay on the internal Flights route');
assert.match(landmarkConversion.href, /originCode=BEG/);
assert.match(landmarkConversion.href, /destinationCode=CAI/);
assert.match(landmarkConversion.href, /landmarkId=giza-pyramids/);
assert.doesNotMatch(landmarkConversion.href, /https?:\/\//i, 'Landmark CTA must never expose a raw provider URL');

const liveViConversion = buildViConversion({
  message: 'Найди авиабилеты к Красной площади',
  context: { currentTrip: { origin: { name: 'Belgrade' } } },
});
assert.equal(liveViConversion?.type, 'flight_landmark', 'Live Vi routing must prioritize landmark flight handoff before generic marketplace routing');
assert.ok(['SVO', 'DME', 'VKO'].includes(liveViConversion?.context?.destinationCode), 'Red Square Vi handoff must resolve to a Moscow airport');

assert.match(controller, /findCuratedLandmark/, 'Canonical location endpoint must consult the curated landmark resolver');
assert.match(controller, /curated-landmark-nearest-airport/, 'Curated landmarks must flow through the shared nearest-airport result contract');
assert.match(controller, /google-place-nearest-airport/, 'Unknown places must retain Google Places nearest-airport fallback');
assert.match(controller, /matchedLandmark/, 'Location responses must expose matched landmark metadata');
assert.match(viConversionService, /buildViLandmarkFlightConversion/, 'Vi conversion pipeline must include landmark flight routing');
assert.match(exploreUi, /destinationCode/, 'Flights Explore bridge must read destinationCode from internal handoff URLs');
assert.match(exploreUi, /originCode/, 'Flights Explore bridge must restore originCode when Vi supplies trip context');
assert.match(exploreUi, /cleanHandoffIata/, 'Flights handoff must validate IATA values before prefill');
assert.match(exploreUi, /landmarkName/, 'Flights handoff must preserve landmark display context');
assert.match(exploreUi, /handoffParsed/, 'Internal flight handoff must only be applied once');

console.log('✅ Landmark aliases, nearest-airport resolution and Vi-to-Flights handoff checks passed');
