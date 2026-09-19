import assert from 'node:assert/strict';
import { getProviderReadiness } from '../src/config/travelProviderRegistry.js';
import { getPublicTravelInventoryStatus } from '../src/services/travelInventoryService.js';
import { buildMarketplaceSuggestion } from '../src/services/viMarketplaceRouter.js';

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
  assert.equal(twelveGo?.bookingUrl, 'https://example.com/12go-booking', '12Go must expose the validated booking URL');

  const goCityUnsafe = getProviderReadiness('go_city');
  assert.equal(goCityUnsafe?.configured, false, 'Go City must reject an insecure HTTP booking URL');
  assert.equal(goCityUnsafe?.bookingUrl, null, 'Unsafe Go City URL must never be exposed');

  const radicalInvalid = getProviderReadiness('radical_storage');
  assert.equal(radicalInvalid?.configured, false, 'Malformed affiliate URLs must not mark a provider live');

  let publicStatus = getPublicTravelInventoryStatus();
  const bus = publicStatus.verticals.find(item => item.vertical === 'bus');
  assert.ok(bus?.live, 'Bus vertical must become live when 12Go has a real booking URL');
  assert.ok(bus?.bookingOptions?.some(option => option.provider === 'twelve_go' && option.url === 'https://example.com/12go-booking'), 'Bus inventory must publish the safe 12Go booking option');

  const busSuggestion = buildMarketplaceSuggestion('Нужен автобус из Белграда');
  assert.equal(busSuggestion?.vertical, 'bus', 'Vi must detect the bus marketplace intent');
  assert.equal(busSuggestion?.bookingUrl, 'https://example.com/12go-booking', 'Vi must receive the verified partner booking target');
  assert.equal(busSuggestion?.bookingProvider, 'twelve_go', 'Vi must know which provider owns the booking target');

  process.env.TRAVELPAYOUTS_GO_CITY_AFFILIATE_URL = 'https://example.com/go-city-pass';
  const goCity = getProviderReadiness('go_city');
  assert.equal(goCity?.configured, true, 'Go City must become configured with a valid HTTPS URL');

  publicStatus = getPublicTravelInventoryStatus();
  const cityPasses = publicStatus.verticals.find(item => item.vertical === 'city_passes');
  assert.ok(cityPasses?.bookingOptions?.some(option => option.provider === 'go_city'), 'City passes must expose Go City when configured');

  const cityPassSuggestion = buildMarketplaceSuggestion('Мне нужна туристическая карта');
  assert.equal(cityPassSuggestion?.vertical, 'city_passes', 'Vi must detect city-pass intent');
  assert.equal(cityPassSuggestion?.bookingUrl, 'https://example.com/go-city-pass', 'Vi must receive the verified Go City booking target');

  console.log('✅ Direct partner booking routing regression checks passed');
} finally {
  envKeys.forEach(key => {
    if (previous[key] === undefined) delete process.env[key];
    else process.env[key] = previous[key];
  });
}
