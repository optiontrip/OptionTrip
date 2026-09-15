import assert from 'node:assert/strict';
import { TRAVELPAYOUTS_AVAILABLE_PROGRAMS, getTravelpayoutsProgramDashboardState } from './travelpayoutsRollout.js';

assert.equal(TRAVELPAYOUTS_AVAILABLE_PROGRAMS.length, 28);
assert.equal(getTravelpayoutsProgramDashboardState().available, 31);
