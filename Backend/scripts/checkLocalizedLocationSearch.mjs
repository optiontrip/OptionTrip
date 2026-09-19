import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '../..');
const read = relative => readFileSync(join(root, relative), 'utf8');

const frontend = read('Frontend/src/services/flightService.js');
const controller = read('Backend/src/controllers/locationController.js');
const google = read('Backend/src/services/googlePlacesService.js');
const i18n = read('Frontend/src/i18n.js');

assert.match(i18n, /lookupLocalStorage:\s*'i18nextLng'/, 'i18n must keep selected language in the canonical localStorage key');
assert.match(frontend, /localStorage\?\.getItem\('i18nextLng'\)/, 'Location autocomplete must prefer the selected OptionTrip language');
assert.match(frontend, /locale:\s*getPreferredLocale\(\)/, 'Selected language must be sent to the canonical location endpoint');
assert.match(controller, /searchTravelpayoutsLocations\(keyword, locale\)/, 'Travelpayouts autocomplete must receive the normalized selected locale');
assert.match(controller, /searchGooglePlace\(keyword, locale\)/, 'Google Places fallback must receive the same normalized selected locale');
assert.match(google, /searchGooglePlace\s*=\s*async\s*\(placeName, languageCode = 'en'\)/, 'Google Places search must accept a locale argument');
assert.match(google, /languageCode:\s*preferredLanguage/, 'Google Places request must use the normalized preferred language');
assert.doesNotMatch(google, /languageCode:\s*'en'/, 'Google Places location search must not hardcode English');
assert.match(google, /normalizeGoogleLanguageCode/, 'Google Places locale must be normalized before sending it upstream');

console.log('✅ Selected-language location autocomplete and Google Places locale checks passed');
