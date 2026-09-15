import assert from 'node:assert/strict';
import { TRAVELPAYOUTS_AVAILABLE_PROGRAMS } from './travelpayoutsAvailablePrograms.js';
import { TRAVEL_PROVIDER_REGISTRY } from './travelProviderRegistry.js';

const aliases = { aviasales: 'travelpayouts' };

for (const program of TRAVELPAYOUTS_AVAILABLE_PROGRAMS) {
  const providerName = aliases[program] || program;
  assert.ok(TRAVEL_PROVIDER_REGISTRY[providerName], `Missing provider registry entry for ${program}`);
}

assert.equal(
  new Set(TRAVELPAYOUTS_AVAILABLE_PROGRAMS).size,
  TRAVELPAYOUTS_AVAILABLE_PROGRAMS.length,
  'Travelpayouts available program list must not contain duplicates'
);
