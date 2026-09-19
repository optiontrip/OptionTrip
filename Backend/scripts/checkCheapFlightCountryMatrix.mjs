import assert from 'node:assert/strict';
import { buildBalancedRoutePairs } from '../src/services/cheapFlightExplorerService.js';
import { findAirportsForCountryCode } from '../src/services/nearbyAirportsService.js';

const codes = records => records.map(item => item.iataCode).filter(Boolean);

const serbia = codes(findAirportsForCountryCode('RS', 60));
const turkey = codes(findAirportsForCountryCode('TR', 60));
assert.ok(serbia.includes('BEG'), 'Serbia country matrix must include Belgrade/BEG');
assert.ok(serbia.includes('INI'), 'Serbia country matrix must include Niš/INI');
assert.ok(turkey.includes('IST'), 'Turkey country matrix must include Istanbul/IST');
assert.ok(turkey.includes('AYT'), 'Turkey country matrix must include Antalya/AYT');

const serbiaTurkey = buildBalancedRoutePairs(serbia, turkey);
assert.equal(
  serbiaTurkey.totalPairs,
  serbia.length * turkey.length,
  'Serbia → Turkey must count every valid airport pair',
);
assert.equal(serbiaTurkey.pairs.length, serbiaTurkey.totalPairs, 'Serbia → Turkey must search the complete airport matrix');
assert.equal(serbiaTurkey.capped, false, 'Serbia → Turkey must not be sampled or truncated');
assert.equal(serbiaTurkey.coveragePercent, 100, 'Serbia → Turkey must report 100% route-matrix coverage');
for (const origin of serbia) {
  for (const destination of turkey) {
    assert.ok(
      serbiaTurkey.pairs.some(pair => pair.origin === origin && pair.destination === destination),
      `Missing country route pair ${origin}-${destination}`,
    );
  }
}

const originSet = [
  'AAA','AAB','AAC','AAD','AAE','AAF','AAG','AAH','AAI','AAJ',
  'AAK','AAL','AAM','AAN','AAO','AAP','AAQ','AAR','AAS','AAT',
];
const destinationSet = [
  'BAA','BAB','BAC','BAD','BAE','BAF','BAG','BAH','BAI','BAJ',
  'BAK','BAL','BAM','BAN','BAO','BAP','BAQ','BAR','BAS','BAT',
];
const large = buildBalancedRoutePairs(originSet, destinationSet);
assert.equal(large.totalPairs, 400, '20×20 country matrix must expose its true 400-pair size');
assert.equal(large.pairs.length, 240, 'Large country matrix must honor the 240-pair provider safety cap');
assert.equal(large.capped, true, 'Large country matrix must report sampling');
assert.equal(large.coveragePercent, 60, '240 of 400 route pairs must report 60% coverage');
assert.deepEqual(
  [...new Set(large.pairs.map(pair => pair.origin))].sort(),
  [...originSet].sort(),
  'Balanced sampling must represent every origin airport before exhausting the cap',
);
assert.deepEqual(
  [...new Set(large.pairs.map(pair => pair.destination))].sort(),
  [...destinationSet].sort(),
  'Balanced sampling must represent every destination airport before exhausting the cap',
);

const overlap = buildBalancedRoutePairs(['LHR', 'LGW'], ['LHR', 'MAN'], 50);
assert.equal(overlap.totalPairs, 3, 'Same-airport origin/destination pairs must be excluded from matrix size');
assert.ok(!overlap.pairs.some(pair => pair.origin === pair.destination), 'Country matrix must never search an airport to itself');

console.log('✅ Country-to-country flight matrix coverage and balanced sampling checks passed');
