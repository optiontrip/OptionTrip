import assert from 'node:assert/strict';
import { TRAVELPAYOUTS_RUNTIME_CONTRACT } from './travelpayoutsRuntimeContract.js';

assert.equal(TRAVELPAYOUTS_RUNTIME_CONTRACT.catalogAvailabilityIsLiveInventory, false);
assert.equal(TRAVELPAYOUTS_RUNTIME_CONTRACT.requireConfiguredProviderForLiveExposure, true);
assert.equal(TRAVELPAYOUTS_RUNTIME_CONTRACT.allowGuessedAffiliateUrls, false);
assert.equal(TRAVELPAYOUTS_RUNTIME_CONTRACT.allowSecretsInRepository, false);
