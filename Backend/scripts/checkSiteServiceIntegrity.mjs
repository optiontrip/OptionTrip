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
const bookingMenu = read('Frontend/src/components/Header/BookingServiceMenu.jsx');
const home = read('Frontend/src/pages/Home.jsx');
const mainEntry = read('Frontend/src/main.jsx');
const mobileUx = read('Frontend/src/styles/mobile-first.css');
const mobileHardening = read('Frontend/src/styles/mobile-hardening.css');
const serviceRail = read('Frontend/src/components/TravelServiceRail/TravelServiceRail.jsx');
const serviceRailCss = read('Frontend/src/components/TravelServiceRail/TravelServiceRail.css');
const ecosystem = read('Frontend/src/components/TravelEcosystemSection/TravelEcosystemSection.jsx');
const ecosystemCss = read('Frontend/src/components/TravelEcosystemSection/TravelEcosystemSection.css');
const servicesPage = read('Frontend/src/pages/TravelServicesPage/TravelServicesPage.jsx');
const servicesPageCss = read('Frontend/src/pages/TravelServicesPage/TravelServicesPage.css');
const searchPopup = read('Frontend/src/components/SearchPopup/SearchPopup.jsx');
const viMarketplaceRouter = read('Backend/src/services/viMarketplaceRouter.js');
const cheapFlightsCss = read('Frontend/src/pages/CheapFlightExplorerPage.css');
const hotelCss = read('Frontend/src/pages/HotelSearch.css');
const layout = read('Frontend/src/components/Layout/Layout.jsx');
const partnerWidget = read('Frontend/src/pages/PlannedTripPage/sections/TravelpayoutsWidget.jsx');

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

// Query-string service routing was the old hidden-state implementation. Public
// navigation must now use stable /services/:serviceId URLs. TravelServicesPage
// may still parse an incoming legacy query for backward compatibility, but no
// source should generate a new /services?service= link.
for (const base of ['Frontend/src', 'Backend/src']) {
  for (const file of scanFiles(path.join(root, base))) {
    const source = fs.readFileSync(file, 'utf8');
    if (source.includes('/services?service=')) {
      errors.push(`Legacy query-string service route found in ${path.relative(root, file)}`);
    }
  }
}

if (!services.includes('getTravelServiceRoute') || !services.includes('`/services/${encodeURIComponent(service.id)}`')) {
  errors.push('Travel service catalog must own the canonical /services/:serviceId routing contract.');
}
if (!appRoutes.has('/services/:serviceId')) {
  errors.push('Canonical service marketplace route /services/:serviceId is missing from App.jsx.');
}
if (!searchPopup.includes('getTravelServiceRoute(service, service.group)')) {
  errors.push('Global search must use the canonical travel service route contract.');
}
if (!viMarketplaceRouter.includes('`/services/${encodeURIComponent(service.vertical)}`')) {
  errors.push('Vi marketplace routing must use canonical OptionTrip service URLs.');
}

if (!footer.includes('footer-locale-item--currency')) {
  errors.push('Footer locale markup must keep a stable currency class for desktop preferences.');
}

const hidesWholeMobileLocale = /\.footer-locale-section\s*\{[^}]*display:\s*none/s.test(footerMobile);
const hidesMobileCurrencyOnly = /\.footer-locale-item--currency\s*\{[^}]*display:\s*none/s.test(footerMobile);
if (!hidesWholeMobileLocale && !hidesMobileCurrencyOnly) {
  errors.push('Mobile footer must not repeat the currency selector.');
}

if (!footer.includes('footer-col-toggle') || !footer.includes('openMobileGroup')) {
  errors.push('Mobile footer link groups must use progressive disclosure instead of one long page.');
}
if (!footerMobile.includes('.footer-col--links.is-mobile-open .footer-col-links')) {
  errors.push('Mobile footer accordion styles are missing.');
}

if (!headerPrefs.includes('{!mobile && (')) {
  errors.push('Mobile drawer must not render a duplicate currency selector.');
}
if (!bookingMenu.includes('const [openGroup, setOpenGroup] = useState(null)')) {
  errors.push('Mobile Booking menu must start collapsed rather than dumping the service catalog into the drawer.');
}
if (!bookingMenu.includes('fetchTravelInventoryStatus') || !bookingMenu.includes('state.external && state.bookingUrl')) {
  errors.push('Booking menu must know when provider-backed services are live.');
}
if (!bookingMenu.includes('getTravelServiceRoute') || bookingMenu.includes('rel="noopener noreferrer sponsored"')) {
  errors.push('Booking menu must keep partner selection on canonical OptionTrip pages before final provider handoff.');
}
if (bookingMenu.includes('booking-service-menu__vi-link')) {
  errors.push('Booking menu must not duplicate the global Vi entry point.');
}

if (!serviceRail.includes('state.external && state.bookingUrl') || !serviceRail.includes('getTravelServiceRoute(service)')) {
  errors.push('Travel service rail must send services to canonical OptionTrip marketplace pages.');
}
if (serviceRail.includes('rel="noopener noreferrer sponsored"')) {
  errors.push('Travel service rail must not jump directly to an external provider before comparison.');
}

if (!servicesPage.includes('selectedBookingOptions') || !servicesPage.includes('safeBookingOptions')) {
  errors.push('Travel services marketplace must expose all live booking options for the selected partner service.');
}
if (!servicesPage.includes('travel-services-provider-grid') || !servicesPage.includes('rel="noopener noreferrer sponsored"')) {
  errors.push('Final provider handoff must happen from the OptionTrip comparison view using safe sponsored links.');
}
if (!servicesPage.includes('PROVIDER_LABELS') || !servicesPage.includes('providerLabel')) {
  errors.push('Provider comparison must use readable partner names instead of raw registry IDs.');
}
if (!servicesPage.includes('useParams') || !servicesPage.includes('routeServiceId')) {
  errors.push('Travel services marketplace must resolve the selected service from /services/:serviceId.');
}
if (!servicesPage.includes('viRoute(selectedService)')) {
  errors.push('Canonical service pages must own the Vi fallback when no live booking provider is available.');
}
if (!servicesPage.includes('canonicalPath') || !servicesPage.includes('path={canonicalPath}')) {
  errors.push('Canonical service pages must publish service-specific metadata paths.');
}

if (!mainEntry.includes("./styles/mobile-first.css") || !mainEntry.includes("./styles/mobile-hardening.css")) {
  errors.push('Global mobile guardrail styles must be loaded by the frontend entrypoint.');
}
if (!mobileUx.includes('.vi-mobile-suppressed .vi-button')) {
  errors.push('Booking/search surfaces must suppress the floating Vi launcher on mobile.');
}
if (!layout.includes('MOBILE_SEARCH_SURFACES') || !layout.includes('vi-mobile-suppressed')) {
  errors.push('Layout must mark mobile search surfaces so Vi cannot cover booking controls.');
}
if (!/@media\s*\(max-width:\s*1299px\)[\s\S]*?\.tsr__scroll\s*\{\s*display:\s*none/s.test(serviceRailCss)) {
  errors.push('Compact travel-service rail must match the 1299px hamburger breakpoint and hide the clipped desktop carousel.');
}
if (!/@media\s*\(max-width:\s*1299px\)[\s\S]*?\.tsr__vi\s*\{[\s\S]*?width:\s*44px[\s\S]*?height:\s*44px/s.test(serviceRailCss)) {
  errors.push('Compact travel-service controls must keep touch-safe 44px targets.');
}

if (!/h1,[\s\S]*h6\s*\{\s*text-transform:\s*none\s*!important/s.test(mobileUx)) {
  errors.push('Legacy title capitalization must be disabled so translations keep natural casing.');
}
if (!mobileUx.includes('.hbs__date-help') || !/\.hbs__date-help\s*\{\s*display:\s*none\s*!important/s.test(mobileUx)) {
  errors.push('Mobile primary booking form must not show the long Whole Month implementation note.');
}
if (!mobileUx.includes('.banner.pt-10.pb-0') || !mobileUx.includes('.flight-hero') || !mobileUx.includes('.hotel-search-hero')) {
  errors.push('Oversized legacy and search heroes must have mobile-first overrides.');
}
if (!mobileUx.includes('100dvh') || !mobileUx.includes('.auth-page') || !mobileUx.includes('.tmp-page')) {
  errors.push('Mobile keyboard and dynamic-viewport guards are missing for auth/map surfaces.');
}
if (!mobileUx.includes('env(safe-area-inset-bottom)') || !mobileUx.includes('.auth-modal-overlay') || !mobileUx.includes('.wcig-modal')) {
  errors.push('Mobile safe-area guards are missing for fixed controls or overlays.');
}
if (!mobileUx.includes('.planned-trip-share-bar') || !mobileUx.includes('.planned-trip-summary-bar__inner')) {
  errors.push('Planned Trip fixed controls are not protected from mobile overlap.');
}
if (!mobileUx.includes('#back-to-top') || !mobileUx.includes('display: none !important')) {
  errors.push('Mobile floating-control cleanup is missing.');
}
if (!mobileHardening.includes('html:lang(ar)') || !mobileHardening.includes('direction: rtl')) {
  errors.push('Arabic compact navigation must switch to RTL even when legacy dir attributes are absent.');
}
if (!mobileHardening.includes('max-width: 1299px') || !mobileHardening.includes('max-height: 700px')) {
  errors.push('Landscape-phone hardening must cover the compact-header range beyond the classic 767px breakpoint.');
}
if (!mobileHardening.includes('.main_header_area .hamburger') || !mobileHardening.includes('min-width: 44px')) {
  errors.push('Compact hamburger touch target is not protected.');
}

if (!ecosystem.includes('openMobileGroups') || !ecosystem.includes('tes__group--mobile-collapsed')) {
  errors.push('Homepage travel ecosystem must progressively disclose service groups on mobile.');
}
if (!ecosystem.includes('getTravelServiceRoute(service, groupId)')) {
  errors.push('Homepage ecosystem must use canonical OptionTrip service routes.');
}
if (!ecosystemCss.includes('.tes__group--mobile-collapsed .tes__service-grid')) {
  errors.push('Homepage mobile service-group collapse styling is missing.');
}
if (!servicesPage.includes('openMobileGroups') || !servicesPage.includes('travel-services-group--mobile-collapsed')) {
  errors.push('Travel services marketplace must progressively disclose service groups on mobile.');
}
if (!servicesPageCss.includes('.travel-services-group--mobile-collapsed .travel-services-grid')) {
  errors.push('Travel services marketplace mobile collapse styling is missing.');
}
if (!servicesPageCss.includes('.travel-services-provider-grid') || !servicesPageCss.includes('.travel-services-provider')) {
  errors.push('Provider comparison must remain readable and responsive in the service marketplace.');
}
if (!cheapFlightsCss.includes('.cheapx-filters{display:flex') || !cheapFlightsCss.includes('overflow-x:auto')) {
  errors.push('Monthly flight filters must use a compact horizontal mobile filter bar.');
}
if (!/@media\s*\(max-width:\s*768px\)[\s\S]*?\.hs-form__row\s*\{[\s\S]*?flex-direction:\s*column/s.test(hotelCss)) {
  errors.push('Hotel search form must stack into a true single-column mobile form.');
}

if (!partnerWidget.includes('localizeWidgetUrl') || !partnerWidget.includes("url.searchParams.set('locale', locale)")) {
  errors.push('Travelpayouts widgets must inherit the OptionTrip interface language instead of forcing English.');
}
if (!partnerWidget.includes('hasRenderedWidget') || !partnerWidget.includes('MutationObserver')) {
  errors.push('Partner widget readiness must verify rendered booking UI, not only script load.');
}
if (!partnerWidget.includes('Ask Vi') || !partnerWidget.includes('viFallback')) {
  errors.push('Partner widget failures must provide a Vi fallback instead of a dead end.');
}

if (!home.includes('data-season={season}') || !home.includes('home-seasonal-hero--${season}')) {
  errors.push('Homepage seasonal experience is not wired to the current season.');
}

const requiredCoreRoutes = [
  '/', '/flights', '/flights/cheap', '/flights/explore', '/hotels', '/car-rental', '/tours', '/esim',
  '/services', '/services/:serviceId', '/destinations', '/travel-buddy', '/plan-my-day', '/where-can-i-go', '/travel-map',
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

console.log(`✅ Site/service integrity passed: ${serviceRoutes.length} direct service routes, ${serviceVerticals.length} provider verticals, ${requiredCoreRoutes.length} required public routes, canonical OptionTrip marketplace routing and mobile UX guards active.`);
