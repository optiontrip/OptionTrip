import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '../..');
const read = relative => readFileSync(join(root, relative), 'utf8');

const widget = read('Frontend/src/pages/PlannedTripPage/sections/TravelpayoutsWidget.jsx');
const css = read('Frontend/src/pages/PlannedTripPage/sections/TravelpayoutsWidget.css');
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

console.log('✅ Shared Travelpayouts widget failover, partner refresh and mobile fallback checks passed');
