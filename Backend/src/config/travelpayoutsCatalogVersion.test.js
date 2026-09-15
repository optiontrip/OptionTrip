import assert from 'node:assert/strict';
import { TRAVELPAYOUTS_CATALOG_VERSION } from './travelpayoutsCatalogVersion.js';
import { TRAVELPAYOUTS_AVAILABLE_PROGRAMS } from './travelpayoutsAvailablePrograms.js';

assert.equal(TRAVELPAYOUTS_CATALOG_VERSION.observedAvailableCount, 31);
assert.equal(TRAVELPAYOUTS_CATALOG_VERSION.observedUnlockMoreCount, 17);
assert.equal(TRAVELPAYOUTS_CATALOG_VERSION.transcribedProgramCount, TRAVELPAYOUTS_AVAILABLE_PROGRAMS.length);
assert.ok(TRAVELPAYOUTS_CATALOG_VERSION.transcribedProgramCount <= TRAVELPAYOUTS_CATALOG_VERSION.observedAvailableCount);
