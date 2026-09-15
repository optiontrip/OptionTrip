import assert from 'node:assert/strict';
import { getTravelpayoutsProgramExposure } from './travelpayoutsProgramPolicy.js';

const result = getTravelpayoutsProgramExposure('radicalstorage');
assert.equal(result.provider, 'radicalstorage');
assert.equal(result.canExposeLive, Boolean(process.env.TRAVELPAYOUTS_RADICAL_STORAGE_URL));
assert.ok(['configured', 'available_not_configured'].includes(result.state));
