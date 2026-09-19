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

const directPasadena = findAirportsForCity('Pasadena', 'United States', 10);
assert.equal(directPasadena.length, 0, 'Pasadena must not be treated as having its own indexed airport');

assert.equal(resolveCountryCode('Serbia'), 'RS', 'Serbia must resolve to ISO RS');
assert.equal(resolveCountryCode('Latvia'), 'LV', 'Country resolver must support countries outside the old manual map');
assert.equal(resolveCountryCode('Czech Republic'), 'CZ', 'Legacy country names must keep resolving to ISO codes');

const serbia = findCountryDirectoryMatch('Serbia', 10);
assert.equal(serbia?.countryName, 'Serbia', 'Serbia must resolve as a country');
assert.equal(serbia?.countryCode, 'RS', 'Country directory matches must expose ISO country code');
assert.ok(serbia?.countryAirports?.some(item => item.iataCode === 'BEG'), 'Serbia must expose BEG');
assert.ok(serbia?.countryAirports?.some(item => item.iataCode === 'INI'), 'Serbia must expose INI');

const serbiaByCode = findAirportsForCountryCode('RS', 10);
assert.ok(hasCode(serbiaByCode, 'BEG'), 'ISO country lookup must expose Belgrade for RS');
assert.ok(hasCode(serbiaByCode, 'INI'), 'ISO country lookup must expose Niš for RS');
assert.ok(serbiaByCode.every(item => item.countryCode === 'RS'), 'ISO country lookup must return normalized country metadata');

const nearestLax = findAirportsNearCoordinates(34.0522, -118.2437, 100, 5);
assert.ok(hasCode(nearestLax, 'LAX'), 'Los Angeles coordinates must include LAX as a nearby airport');
assert.ok(nearestLax.every(item => Number.isFinite(item.distanceKm)), 'Nearest-airport results must include distanceKm');

const nearestPasadena = findAirportsNearCoordinates(34.1478, -118.1445, 100, 5);
assert.ok(nearestPasadena.length > 0, 'Pasadena coordinates must resolve to nearby airports');
assert.ok(nearestPasadena.every(item => item.isNearest), 'Coordinate results must be marked as nearest-airport candidates');

console.log('✅ Location resolver regression checks passed');
