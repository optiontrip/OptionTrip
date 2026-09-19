import assert from 'node:assert/strict';
import { getProviderReadiness } from '../src/config/travelProviderRegistry.js';
import { getPublicTravelInventoryStatus } from '../src/services/travelInventoryService.js';
import { buildMarketplaceSuggestion, formatMarketplaceForViPrompt } from '../src/services/viMarketplaceRouter.js';
import {
  buildRouteAwarePartnerTarget,
  isRouteAwareService,
} from '../src/services/travelPartnerDeepLinkService.js';
import { isAllowedTravelpayoutsProviderTarget } from '../src/services/travelpayoutsPartnerLinks.js';

const envKeys = [
  'TRAVELPAYOUTS_12GO_AFFILIATE_URL',
  'TRAVELPAYOUTS_GO_CITY_AFFILIATE_URL',
  'TRAVELPAYOUTS_RADICAL_STORAGE_AFFILIATE_URL',
];

const previous = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));

try {
  process.env.TRAVELPAYOUTS_12GO_AFFILIATE_URL = 'https://example.com/12go-booking';
  process.env.TRAVELPAYOUTS_GO_CITY_AFFILIATE_URL = 'http://insecure.example.com/city-pass';
  process.env.TRAVELPAYOUTS_RADICAL_STORAGE_AFFILIATE_URL = 'not-a-url';

  const twelveGo = getProviderReadiness('twelve_go');
  assert.equal(twelveGo?.configured, true, '12Go must become configured when a valid HTTPS booking URL exists');
  assert.equal(twelveGo?.bookingUrl, 'https://example.com/12go-booking', '12Go registry must retain the validated booking URL for final handoff');

  const goCityUnsafe = getProviderReadiness('go_city');
  assert.equal(goCityUnsafe?.configured, false, 'Go City must reject an insecure HTTP booking URL');
  assert.equal(goCityUnsafe?.bookingUrl, null, 'Unsafe Go City URL must never be exposed');

  const radicalInvalid = getProviderReadiness('radical_storage');
  assert.equal(radicalInvalid?.configured, false, 'Malformed affiliate URLs must not mark a provider live');

  let publicStatus = getPublicTravelInventoryStatus();
  const bus = publicStatus.verticals.find(item => item.vertical === 'bus');
  assert.ok(bus?.live, 'Bus vertical must become live when 12Go has a real booking URL');
  assert.ok(bus?.bookingOptions?.some(option => option.provider === 'twelve_go' && option.url === 'https://example.com/12go-booking'), 'Bus inventory must publish the safe 12Go booking option for the OptionTrip comparison UI');

  const busSuggestion = buildMarketplaceSuggestion('Нужен автобус из Белграда');
  assert.equal(busSuggestion?.vertical, 'bus', 'Vi must detect the bus marketplace intent');
  assert.equal(busSuggestion?.bookingAvailable, true, 'Vi may know that a verified final booking handoff exists');
  assert.equal(busSuggestion?.bookingProvider, 'twelve_go', 'Vi may know which provider owns the final handoff');
  assert.equal(busSuggestion?.bookingUrl, undefined, 'Vi marketplace suggestion must not expose the raw affiliate URL');
  assert.equal(busSuggestion?.route, '/services/bus', 'Bus suggestions must use the canonical OptionTrip service page');
  const busPrompt = formatMarketplaceForViPrompt('Нужен автобус из Белграда');
  assert.match(busPrompt, /OptionTrip route: \/services\/bus/, 'Vi must route bus requests into the canonical OptionTrip service page first');
  assert.doesNotMatch(busPrompt, /https:\/\//i, 'Vi prompt must not contain a raw partner URL');

  process.env.TRAVELPAYOUTS_GO_CITY_AFFILIATE_URL = 'https://example.com/go-city-pass';
  const goCity = getProviderReadiness('go_city');
  assert.equal(goCity?.configured, true, 'Go City must become configured with a valid HTTPS URL');

  publicStatus = getPublicTravelInventoryStatus();
  const cityPasses = publicStatus.verticals.find(item => item.vertical === 'city_passes');
  assert.ok(cityPasses?.bookingOptions?.some(option => option.provider === 'go_city'), 'City passes must expose Go City to the OptionTrip comparison UI when configured');

  const cityPassSuggestion = buildMarketplaceSuggestion('Мне нужна туристическая карта');
  assert.equal(cityPassSuggestion?.vertical, 'city_passes', 'Vi must detect city-pass intent');
  assert.equal(cityPassSuggestion?.bookingAvailable, true, 'Vi must know a verified city-pass handoff exists');
  assert.equal(cityPassSuggestion?.bookingUrl, undefined, 'Vi must not receive the verified Go City URL directly');
  assert.equal(cityPassSuggestion?.route, '/services/city_passes', 'City-pass suggestions must use the canonical OptionTrip service page');

  assert.equal(isRouteAwareService('rail'), true, 'Rail must support route-aware partner handoff');
  assert.equal(isRouteAwareService('bus'), true, 'Bus must support route-aware partner handoff');
  assert.equal(isRouteAwareService('ferries'), true, 'Ferries must support route-aware partner handoff');
  assert.equal(isRouteAwareService('insurance'), false, 'Non-route marketplace services must not accept route deep-link requests');

  const busRoute = buildRouteAwarePartnerTarget({ serviceId: 'bus', originCode: 'LAX', destinationCode: 'LAS' });
  assert.equal(busRoute?.provider, 'twelve_go', 'Bus route handoff must stay on the configured 12Go provider');
  assert.equal(busRoute?.origin?.city, 'Los Angeles', 'Route handoff must resolve the canonical origin city from the trusted airport index');
  assert.equal(busRoute?.destination?.city, 'Las Vegas', 'Route handoff must resolve the canonical destination city from the trusted airport index');
  assert.equal(busRoute?.sourceUrl, 'https://12go.asia/en/bus/los-angeles/las-vegas', 'Bus handoff must build the route-specific 12Go page');

  const railRoute = buildRouteAwarePartnerTarget({ serviceId: 'rail', originCode: 'LHR', destinationCode: 'MAN' });
  assert.equal(railRoute?.sourceUrl, 'https://12go.asia/en/train/london/manchester', 'Rail handoff must build the route-specific 12Go page');

  const sameCityRoute = buildRouteAwarePartnerTarget({ serviceId: 'rail', originCode: 'LHR', destinationCode: 'LGW' });
  assert.equal(sameCityRoute, null, 'Two airports in the same city must not create a meaningless city-to-same-city route');

  assert.equal(
    isAllowedTravelpayoutsProviderTarget('twelve_go', 'https://12go.asia/en/bus/los-angeles/las-vegas'),
    true,
    'Dynamic handoff must allow HTTPS route pages on the configured provider host',
  );
  assert.equal(
    isAllowedTravelpayoutsProviderTarget('twelve_go', 'https://checkout.12go.asia/en/bus/los-angeles/las-vegas'),
    true,
    'Dynamic handoff may use a legitimate subdomain of the configured provider host',
  );
  assert.equal(
    isAllowedTravelpayoutsProviderTarget('twelve_go', 'https://evil.example/12go.asia/en/bus/los-angeles/las-vegas'),
    false,
    'Dynamic handoff must reject an arbitrary external host even if the provider hostname appears in the path',
  );
  assert.equal(
    isAllowedTravelpayoutsProviderTarget('twelve_go', 'http://12go.asia/en/bus/los-angeles/las-vegas'),
    false,
    'Dynamic handoff must reject non-HTTPS provider targets',
  );

  console.log('✅ Partner booking registry, canonical comparison, route-aware deep links and Vi handoff regression checks passed');
} finally {
  envKeys.forEach(key => {
    if (previous[key] === undefined) delete process.env[key];
    else process.env[key] = previous[key];
  });
}
