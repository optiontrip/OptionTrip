import assert from 'node:assert/strict';
import { getTravelpayoutsCatalogIntegrity } from './travelpayoutsCatalogIntegrity.js';

const integrity = getTravelpayoutsCatalogIntegrity();
assert.equal(integrity.dashboard.available, 31);
assert.equal(integrity.completeTranscription, false);
assert.ok(integrity.verticalCount >= 11);
