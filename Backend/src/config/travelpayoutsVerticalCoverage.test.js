import assert from 'node:assert/strict';
import { getTravelpayoutsVerticalCoverage } from './travelpayoutsVerticalCoverage.js';

const coverage = getTravelpayoutsVerticalCoverage();
for (const required of ['flights', 'hotels', 'rail', 'bus', 'cars', 'activities', 'esim', 'insurance', 'transfers', 'luggage_storage', 'compensation']) {
  assert.ok(coverage.some(item => item.vertical === required), `Missing ${required} coverage`);
}
