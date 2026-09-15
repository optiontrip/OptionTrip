import assert from 'node:assert/strict';
import { TRAVELPAYOUTS_CATALOG_VERSION, getTravelpayoutsCatalogIntegrity } from './travelpayoutsCatalog.js';

assert.equal(TRAVELPAYOUTS_CATALOG_VERSION.observedAvailableCount, 31);
assert.equal(getTravelpayoutsCatalogIntegrity().dashboard.unlockMore, 17);
