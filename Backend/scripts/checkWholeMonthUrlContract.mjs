import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  buildWholeMonthExplorerUrl,
  countryCodeForLocation,
  searchableAirportCodes,
} from '../../Frontend/src/utils/wholeMonthFlightSearch.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '../..');
const read = relative => readFileSync(join(root, relative), 'utf8');

const serbia = {
  isCountry: true,
  countryCode: 'RS',
  countryAirports: [{ iataCode: 'BEG' }, { iataCode: 'INI' }, { iataCode: 'KVO' }],
};
const turkey = {
  isCountry: true,
  countryCode: 'TR',
  countryAirports: [{ iataCode: 'IST' }, { iataCode: 'SAW' }, { iataCode: 'AYT' }],
};

assert.equal(countryCodeForLocation('RS', serbia), 'RS', 'Country selections must keep the canonical ISO code');
assert.deepEqual(searchableAirportCodes('RS', serbia), ['BEG', 'INI', 'KVO'], 'Country selections must still expose airport groups when an airport matrix is needed');

const countryUrl = buildWholeMonthExplorerUrl({
  originCode: 'RS',
  originDisplay: 'Serbia (RS)',
  originLocationData: serbia,
  destinationCode: 'TR',
  destinationDisplay: 'Turkey (TR)',
  destinationLocationData: turkey,
  month: '2026-10',
});
assert.equal(countryUrl.mode, 'country-to-country', 'Two countries must use the canonical country-to-country contract');
assert.ok(countryUrl.url, 'Country-to-country search must produce an explorer URL');
assert.match(countryUrl.url, /originCountry=RS/, 'Country URL must carry originCountry=RS');
assert.match(countryUrl.url, /destinationCountry=TR/, 'Country URL must carry destinationCountry=TR');
assert.doesNotMatch(countryUrl.url, /origins=/, 'Country URL must not duplicate the origin airport list');
assert.doesNotMatch(countryUrl.url, /destinations=/, 'Country URL must not duplicate the destination airport list');

const cityUrl = buildWholeMonthExplorerUrl({
  originCode: 'BEG',
  originDisplay: 'Belgrade (BEG)',
  originLocationData: { isCity: true, cityAirports: [{ iataCode: 'BEG' }] },
  destinationCode: 'LON',
  destinationDisplay: 'London (LON)',
  destinationLocationData: { isCity: true, cityAirports: [{ iataCode: 'LHR' }, { iataCode: 'LGW' }] },
  month: '2026-11',
});
assert.equal(cityUrl.mode, 'airport-matrix', 'City searches must remain airport-matrix searches');
assert.match(cityUrl.url, /origins=BEG/, 'City search must carry searchable origin airports');
assert.match(cityUrl.url, /destinations=LHR%2CLGW/, 'City search must carry all indexed destination airports');

const anywhereUrl = buildWholeMonthExplorerUrl({
  originCode: 'RS',
  originDisplay: 'Serbia (RS)',
  originLocationData: serbia,
  destinationCode: 'ANYWHERE',
  destinationDisplay: 'Anywhere',
  month: '2026-12',
  anywhere: true,
});
assert.equal(anywhereUrl.mode, 'anywhere', 'Anywhere must keep its dedicated explorer mode');
assert.match(anywhereUrl.url, /origins=BEG%2CINI%2CKVO/, 'Country-wide Anywhere must preserve all indexed origin airports');
assert.match(anywhereUrl.url, /destinations=ANYWHERE/, 'Anywhere URL must preserve the ANYWHERE contract');

const form = read('Frontend/src/components/FlightSearchForm/FlightSearchForm.jsx');
const home = read('Frontend/src/components/HomeBookingSection/HomeBookingSection.jsx');
const explorer = read('Frontend/src/pages/CheapFlightExplorerPage.jsx');
const service = read('Frontend/src/services/cheapFlightExplorerService.js');

assert.match(form, /buildWholeMonthExplorerUrl/, 'Main Flights form must use the shared Whole Month URL builder');
assert.match(home, /buildWholeMonthExplorerUrl/, 'Homepage must use the shared Whole Month URL builder');
assert.match(explorer, /originCountry/, 'Cheap Flight Explorer must read canonical country query parameters');
assert.match(explorer, /searchCheapCountryRoutesByMonth/, 'Cheap Flight Explorer must route country URLs through the country API');
assert.match(explorer, /coveragePercent/, 'Explorer must expose matrix coverage to the traveler');
assert.match(service, /cheap-country-routes/, 'Frontend flight explorer service must keep the country API client');

console.log('✅ Whole Month country/city/Anywhere URL contract checks passed');
