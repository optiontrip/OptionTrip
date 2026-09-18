import assert from 'node:assert/strict';
import {
  searchAirportDirectory,
  findCountryDirectoryMatch,
  findAirportsNearCoordinates,
} from '../src/services/nearbyAirportsService.js';

const hasCode = (items, code) => items.some(item => item.iataCode === code);

const miami = searchAirportDirectory('Miami', 10);
assert.ok(hasCode(miami, 'MIA'), 'Miami must resolve MIA');

const losAngeles = searchAirportDirectory('Los Angeles', 10);
assert.ok(hasCode(losAngeles, 'LAX'), 'Los Angeles must resolve LAX');

const lax = searchAirportDirectory('LAX', 5);
assert.equal(lax[0]?.iataCode, 'LAX', 'Exact IATA lookup must rank LAX first');

const belgrade = searchAirportDirectory('Belgrade', 10);
assert.ok(hasCode(belgrade, 'BEG'), 'Belgrade must resolve BEG');

const serbia = findCountryDirectoryMatch('Serbia', 10);
assert.equal(serbia?.countryName, 'Serbia', 'Serbia must resolve as a country');
assert.ok(serbia?.countryAirports?.some(item => item.iataCode === 'BEG'), 'Serbia must expose BEG');
assert.ok(serbia?.countryAirports?.some(item => item.iataCode === 'INI'), 'Serbia must expose INI');

const nearestLax = findAirportsNearCoordinates(34.0522, -118.2437, 100, 5);
assert.ok(hasCode(nearestLax, 'LAX'), 'Los Angeles coordinates must include LAX as a nearby airport');
assert.ok(nearestLax.every(item => Number.isFinite(item.distanceKm)), 'Nearest-airport results must include distanceKm');

console.log('✅ Location resolver regression checks passed');