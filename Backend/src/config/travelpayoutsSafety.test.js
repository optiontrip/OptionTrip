import assert from 'node:assert/strict';
import { TRAVELPAYOUTS_SAFETY_INVARIANTS } from './travelpayoutsSafety.js';

assert.ok(TRAVELPAYOUTS_SAFETY_INVARIANTS.length >= 5);
assert.ok(TRAVELPAYOUTS_SAFETY_INVARIANTS.some(rule => rule.includes('Never fabricate')));
assert.ok(TRAVELPAYOUTS_SAFETY_INVARIANTS.some(rule => rule.includes('Unlock More')));
