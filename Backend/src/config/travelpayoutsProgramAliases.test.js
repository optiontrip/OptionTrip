import assert from 'node:assert/strict';
import { normalizeTravelpayoutsProgramName } from './travelpayoutsProgramAliases.js';

assert.equal(normalizeTravelpayoutsProgramName('12Go'), 'twelvego');
assert.equal(normalizeTravelpayoutsProgramName('Trip.com'), 'tripcom');
assert.equal(normalizeTravelpayoutsProgramName('Radical Storage'), 'radicalstorage');
assert.equal(normalizeTravelpayoutsProgramName('Intui.travel'), 'intuitravel');
