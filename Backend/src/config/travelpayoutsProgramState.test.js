import assert from 'node:assert/strict';
import { getTravelpayoutsProgramDashboardState } from './travelpayoutsProgramState.js';

const state = getTravelpayoutsProgramDashboardState();
assert.equal(state.available, 31);
assert.equal(state.unlockMore, 17);
assert.equal(state.transcribedAvailablePrograms, 28);
assert.equal(state.untranscribedAvailablePrograms, 3);
