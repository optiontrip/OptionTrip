import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const app = read('Frontend/src/App.jsx');
const services = read('Frontend/src/config/travelServices.js');
const registry = read('Backend/src/config/travelProviderRegistry.js');
const footer = read('Frontend/src/components/Footer/Footer.jsx');
const footerMobile = read('Frontend/src/components/Footer/Footer.mobile.css');
const headerPrefs = read('Frontend/src/components/Header/HeaderTravelPreferences.jsx');
const home = read('Frontend/src/pages/Home.jsx');

const errors = [];
const unique = values => [...new Set(values)];

const appRoutes = new Set([...app.matchAll(/<Route\s+path="([^"]+)"/g)].map(match => match[1]));
const serviceRoutes = unique([...services.matchAll(/route:\s*'([^']+)'/g)].map(match => match[1]));
for (const route of serviceRoutes) {
  if (!appRoutes.has(route)) errors.push(`Travel service route is missing from App.jsx: ${route}`);
}

const serviceVerticals = unique([...services.matchAll(/inventoryVertical:\s*'([^']+)'/g)].map(match => match[1]));
const registryVerticals = new Set();
for (const match of registry.matchAll(/verticals:\s*\[([^\]]+)\]/g)) {
  for (const quoted of match[1].matchAll(/'([^']+)'/g)) registryVerticals.add(quoted[1]);
}
for (const vertical of serviceVerticals) {
  if (!registryVerticals.has(vertical)) errors.push(`User-facing service has no backend provider vertical: ${vertical}`);
}

const scanFiles = (directory, output = []) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.git'].includes(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) scanFiles(full, output);
    else if (/\.(js|jsx|mjs)$/.test(entry.name)) output.push(full);
  }
  return output;
};

// Match only absolute application route literals such as '/services/bus'.
// Do not confuse relative source imports such as '../services/flightService'
// with browser routes.
const deadServiceRouteLiteral = /(['"`])\/services\/[a-z0-9_-]+\1/i;
for (const base of ['Frontend/src', 'Backend/src']) {
  for (const file of scanFiles(path.join(root, base))) {
    const source = fs.readFileSync(file, 'utf8');
    const deadServicePath = source.match(deadServiceRouteLiteral);
    if (deadServicePath) {
      errors.push(`Dead legacy service route ${deadServicePath[0]} found in ${path.relative(root, file)}`);
    }
  }
}

if (!footer.includes('footer-locale-item--currency')) {
  errors.push('Footer currency control is missing its responsive deduplication class.');
}
if (!/\.footer-locale-item--currency\s*\{[^}]*display:\s*none/s.test(footerMobile)) {
  errors.push('Mobile footer must hide the duplicate currency selector.');
}
if (!headerPrefs.includes('{!mobile && (')) {
  errors.push('Mobile drawer must not render a duplicate currency selector.');
}

if (!home.includes('data-season={season}') || !home.includes('home-seasonal-hero--${season}')) {
  errors.push('Homepage seasonal experience is not wired to the current season.');
}

const requiredCoreRoutes = [
  '/', '/flights', '/flights/cheap', '/flights/explore', '/hotels', '/car-rental', '/tours', '/esim',
  '/services', '/destinations', '/travel-buddy', '/plan-my-day', '/where-can-i-go', '/travel-map',
  '/trip-ideas', '/popular-routes', '/travel-tips', '/help-center', '/contact',
];
for (const route of requiredCoreRoutes) {
  if (!appRoutes.has(route)) errors.push(`Required public route missing: ${route}`);
}

const requiredServiceIds = [
  'flights', 'stays', 'cars', 'activities', 'esim', 'food', 'rail', 'bus', 'ferries', 'transfers',
  'bikes', 'insurance', 'visa', 'city_passes', 'luggage_storage', 'flight_compensation',
  'plan_day', 'where_go', 'destinations',
];
for (const id of requiredServiceIds) {
  if (!new RegExp(`id:\\s*'${id}'`).test(services)) errors.push(`Required travel service missing from catalog: ${id}`);
}

if (!app.includes('NotFoundPage') || !app.includes('<Route path="*" element={<NotFoundPage />} />')) {
  errors.push('Public route tree must end in a useful NotFoundPage instead of an empty layout.');
}

if (errors.length) {
  console.error('❌ Site/service integrity audit failed:');
  errors.forEach(error => console.error(` - ${error}`));
  process.exit(1);
}

console.log(`✅ Site/service integrity passed: ${serviceRoutes.length} direct service routes, ${serviceVerticals.length} provider verticals, ${requiredCoreRoutes.length} required public routes.`);
