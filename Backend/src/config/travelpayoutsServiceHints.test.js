import assert from 'node:assert/strict';
import { TRAVELPAYOUTS_SERVICE_HINTS } from './travelpayoutsServiceHints.js';

for (const required of ['rail', 'bus', 'cars', 'transfers', 'activities', 'esim', 'insurance', 'luggage_storage', 'compensation']) {
  assert.ok(TRAVELPAYOUTS_SERVICE_HINTS[required], `Missing Vi service hint for ${required}`);
}
