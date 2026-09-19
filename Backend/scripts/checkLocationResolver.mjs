import assert from 'node:assert/strict';
import {
  searchAirportDirectory,
  findAirportsForCity,
  findAirportsForCountryCode,
  findCountryDirectoryMatch,
  findAirportsNearCoordinates,
  resolveCountryCode,
} from '../src/services/nearbyAirportsService.js';

const hasCode = (items, code) => items.some(item => item.iataCode === code);

const miami = searchAirportDirectory('Miami', 10);
assert.ok(hasCode(miami, 'MIA'), 'Miami must resolve MIA');
assert.equal(miami.find(item => item.iataCode === 'MIA')?.countryCode, 'US', 'Airport results must expose ISO country codes');

const losAngeles = searchAirportDirectory('Los Angeles', 10);
assert.ok(hasCode(losAngeles, 'LAX'), 'Los Angeles must resolve LAX');

const lax = searchAirportDirectory('LAX', 5);
assert.equal(lax[0]?.iataCode, 'LAX', 'Exact IATA lookup must rank LAX first');

const belgrade = searchAirportDirectory('Belgrade', 10);
assert.ok(hasCode(belgrade, 'BEG'), 'Belgrade must resolve BEG');

const directBelgrade = findAirportsForCity('Belgrade', 'Serbia', 10);
assert.ok(hasCode(directBelgrade, 'BEG'), 'Exact-city lookup must expose BEG for Belgrade');
assert.ok(directBelgrade.every(item => item.cityName === 'Belgrade'), 'Exact-city lookup must not include nearby-city airports');

const sarajevo = searchAirportDirectory('Sarajevo', 10);
assert.ok(hasCode(sarajevo, 'SJJ'), 'Sarajevo must resolve SJJ from supplemental coverage');
assert.equal(sarajevo.find(item => item.iataCode === 'SJJ')?.countryCode, 'BA', 'Sarajevo airport must expose Bosnia and Herzegovina ISO code');

const mostar = findAirportsForCity('Mostar', 'Bosnia and Herzegovina', 10);
assert.ok(hasCode(mostar, 'OMO'), 'Mostar must resolve OMO from supplemental coverage');

const podgorica = searchAirportDirectory('Podgorica', 10);
assert.ok(hasCode(podgorica, 'TGD'), 'Podgorica must resolve TGD');
const tivat = searchAirportDirectory('Tivat', 10);
assert.ok(hasCode(tivat, 'TIV'), 'Tivat must resolve TIV');

const tirana = searchAirportDirectory('Tirana', 10);
assert.ok(hasCode(tirana, 'TIA'), 'Tirana must resolve TIA');
const skopje = searchAirportDirectory('Skopje', 10);
assert.ok(hasCode(skopje, 'SKP'), 'Skopje must resolve SKP');
const pristina = searchAirportDirectory('Pristina', 10);
assert.ok(hasCode(pristina, 'PRN'), 'Pristina must resolve PRN');
assert.equal(pristina.find(item => item.iataCode === 'PRN')?.countryCode, 'XK', 'Kosovo airport records must expose XK in the application country contract');

const directPasadena = findAirportsForCity('Pasadena', 'United States', 10);
assert.equal(directPasadena.length, 0, 'Pasadena must not be treated as having its own indexed airport');

assert.equal(resolveCountryCode('Serbia'), 'RS', 'Serbia must resolve to ISO RS');
assert.equal(resolveCountryCode('Kosovo'), 'XK', 'Kosovo must resolve to the application XK code');
assert.equal(resolveCountryCode('Latvia'), 'LV', 'Country resolver must support countries outside the old manual map');
assert.equal(resolveCountryCode('Czech Republic'), 'CZ', 'Legacy country names must keep resolving to ISO codes');

const serbia = findCountryDirectoryMatch('Serbia', 10);
assert.equal(serbia?.countryName, 'Serbia', 'Serbia must resolve as a country');
assert.equal(serbia?.countryCode, 'RS', 'Country directory matches must expose ISO country code');
assert.ok(serbia?.countryAirports?.some(item => item.iataCode === 'BEG'), 'Serbia must expose BEG');
assert.ok(serbia?.countryAirports?.some(item => item.iataCode === 'INI'), 'Serbia must expose INI');
assert.ok(serbia?.countryAirports?.some(item => item.iataCode === 'KVO'), 'Serbia must expose Morava/KVO');

const serbiaByCode = findAirportsForCountryCode('RS', 10);
assert.ok(hasCode(serbiaByCode, 'BEG'), 'ISO country lookup must expose Belgrade for RS');
assert.ok(hasCode(serbiaByCode, 'INI'), 'ISO country lookup must expose Niš for RS');
assert.ok(hasCode(serbiaByCode, 'KVO'), 'ISO country lookup must expose Kraljevo for RS');
assert.ok(serbiaByCode.every(item => item.countryCode === 'RS'), 'ISO country lookup must return normalized country metadata');

const montenegro = findCountryDirectoryMatch('Montenegro', 10);
assert.ok(montenegro?.countryAirports?.some(item => item.iataCode === 'TGD'), 'Montenegro must expose Podgorica/TGD');
assert.ok(montenegro?.countryAirports?.some(item => item.iataCode === 'TIV'), 'Montenegro must expose Tivat/TIV');

const bosnia = findCountryDirectoryMatch('Bosnia and Herzegovina', 10);
assert.ok(bosnia?.countryAirports?.some(item => item.iataCode === 'SJJ'), 'Bosnia and Herzegovina must expose Sarajevo/SJJ');
assert.ok(bosnia?.countryAirports?.some(item => item.iataCode === 'OMO'), 'Bosnia and Herzegovina must expose Mostar/OMO');
assert.ok(bosnia?.countryAirports?.some(item => item.iataCode === 'TZL'), 'Bosnia and Herzegovina must expose Tuzla/TZL');
assert.ok(bosnia?.countryAirports?.some(item => item.iataCode === 'BNX'), 'Bosnia and Herzegovina must expose Banja Luka/BNX');

const nearestLax = findAirportsNearCoordinates(34.0522, -118.2437, 100, 5);
assert.ok(hasCode(nearestLax, 'LAX'), 'Los Angeles coordinates must include LAX as a nearby airport');
assert.ok(nearestLax.every(item => Number.isFinite(item.distanceKm)), 'Nearest-airport results must include distanceKm');

const nearestPasadena = findAirportsNearCoordinates(34.1478, -118.1445, 100, 5);
assert.ok(nearestPasadena.length > 0, 'Pasadena coordinates must resolve to nearby airports');
assert.ok(nearestPasadena.every(item => item.isNearest), 'Coordinate results must be marked as nearest-airport candidates');

const nearestSubotica = findAirportsNearCoordinates(46.1005, 19.6676, 250, 5);
assert.ok(nearestSubotica.length > 0, 'Subotica coordinates must resolve to regional airports even without an airport in the city');
assert.ok(nearestSubotica.some(item => ['OSI', 'BEG', 'KVO'].includes(item.iataCode)), 'Subotica must surface practical nearby regional airport choices');
assert.ok(nearestSubotica.every(item => item.isNearest), 'Subotica nearest-airport results must be marked as fallback candidates');

console.log('✅ Location resolver regression checks passed');
