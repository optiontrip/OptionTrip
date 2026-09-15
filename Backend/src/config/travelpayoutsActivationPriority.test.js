import assert from 'node:assert/strict';
import { TRAVELPAYOUTS_ACTIVATION_PRIORITY } from './travelpayoutsActivationPriority.js';
import { TRAVEL_PROVIDER_REGISTRY } from './travelProviderRegistry.js';

for (const item of TRAVELPAYOUTS_ACTIVATION_PRIORITY) {
  assert.ok(item.providers.length > 0, `${item.need} must have at least one provider`);
  for (const provider of item.providers) assert.ok(TRAVEL_PROVIDER_REGISTRY[provider], `Unknown provider ${provider}`);
}
