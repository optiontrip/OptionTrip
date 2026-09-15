import assert from 'node:assert/strict';
import { TRAVELPAYOUTS_PROGRAM_GROUPS } from './travelpayoutsProgramGroups.js';
import { TRAVEL_PROVIDER_REGISTRY } from './travelProviderRegistry.js';

for (const [group, providers] of Object.entries(TRAVELPAYOUTS_PROGRAM_GROUPS)) {
  assert.ok(providers.length > 0, `${group} must contain providers`);
  for (const provider of providers) {
    assert.ok(TRAVEL_PROVIDER_REGISTRY[provider], `${group} references unknown provider ${provider}`);
  }
}
