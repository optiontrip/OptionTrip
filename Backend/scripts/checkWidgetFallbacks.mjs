import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '../..');
const read = relative => readFileSync(join(root, relative), 'utf8');

const widget = read('Frontend/src/pages/PlannedTripPage/sections/TravelpayoutsWidget.jsx');
const css = read('Frontend/src/pages/PlannedTripPage/sections/TravelpayoutsWidget.css');
const toursLanding = read('Frontend/src/pages/Tours.jsx');
const tours = read('Frontend/src/pages/PlannedTripPage/sections/ToursTab.jsx');
const inventoryClient = read('Frontend/src/services/travelInventoryService.js');
const inventoryServer = read('Backend/src/services/travelInventoryService.js');

assert.match(tours, /TravelpayoutsWidget/, 'Tours page must keep the shared live partner widget rather than a page-specific dead-end implementation');
assert.match(tours, /vertical="activities"/, 'Tours must use the shared activities inventory vertical');
assert.match(widget, /fetchTravelInventoryStatus\(\{\s*force:\s*true,\s*refreshPartners:\s*true\s*\}\)/, 'Widget failure must refresh server-side Partner Links before giving up');
assert.match(widget, /inventory\?\.bookingOptions/, 'Widget failover must consume live booking options from the shared inventory contract');
assert.match(widget, /safePartnerUrl/, 'Widget failover must validate every external booking URL');
assert.match(widget, /url\.protocol !== 'https:'/, 'Only HTTPS partner links may be rendered');
assert.match(widget, /url\.username \|\| url\.password/, 'Partner fallback URLs containing embedded credentials must be rejected');
assert.match(widget, /rel="noopener noreferrer sponsored"/, 'Final partner failover links must use safe sponsored external-link attributes');
assert.match(widget, /fallbackOptions\.length > 0/, 'Widget failure UI must expose connected alternatives when they exist');
assert.match(widget, /Ask Vi/, 'Widget failure must retain the internal Vi fallback');
assert.match(widget, /Try again/, 'Widget failure must retain a retry path');
assert.match(widget, /slice\(0, 6\)/, 'Fallback provider list must remain bounded on compact screens');
assert.match(css, /\.ot-partner-widget__fallbacks/, 'Partner fallback grid styling is missing');
assert.match(css, /\.ot-partner-widget__fallback-link/, 'Partner fallback links must have dedicated responsive styling');
assert.match(css, /@media \(max-width: 640px\)[\s\S]*?\.ot-partner-widget__fallbacks[\s\S]*?grid-template-columns: 1fr/s, 'Fallback provider cards must stack on mobile');
assert.match(inventoryClient, /refreshPartners/, 'Frontend inventory client must support on-demand Partner Links refresh');
assert.match(inventoryServer, /bookingOptions/, 'Public travel inventory must expose safe configured booking alternatives');

assert.match(toursLanding, /useSearchParams/, 'Tours landing page must read destination context from canonical handoff URLs');
assert.match(toursLanding, /searchParams\.get\('destination'\)/, 'Tours landing page must accept the Vi destination parameter');
assert.match(toursLanding, /searchParams\.get\('destinationCode'\)/, 'Tours landing page must accept the Vi destination IATA parameter');
assert.match(toursLanding, /\^\[A-Z\]\{3\}\$/, 'Tours landing page must validate destination IATA codes before using them');
assert.match(toursLanding, /<ToursTab tripData=\{handoffTripData\}/, 'Tours landing page must pass normalized handoff context into the existing ToursTab');
assert.match(tours, /destinationCode/, 'ToursTab must preserve destination IATA context from Vi or Planned Trip');
assert.match(tours, /context=\{bookingContext\}/, 'ToursTab must pass normalized destination context into the shared widget/fallback component');
assert.match(widget, /context = null/, 'Shared widget must expose a generic optional booking context contract');
assert.match(widget, /query\.set\('destination', destination\)/, 'Vi fallback must retain the selected destination name');
assert.match(widget, /query\.set\('destinationCode', destinationCode\)/, 'Vi fallback must retain the selected destination IATA code');
assert.match(widget, /Keeping your destination:/, 'Partner widget must visibly confirm preserved destination context');
assert.match(css, /\.ot-partner-widget__context/, 'Destination context must have responsive shared widget styling');
assert.doesNotMatch(widget, /localizedSrc[\s\S]{0,180}destination/i, 'Do not invent an unverified destination parameter on the external Travelpayouts widget URL');

console.log('✅ Shared Travelpayouts widget failover and destination-aware tours handoff checks passed');
