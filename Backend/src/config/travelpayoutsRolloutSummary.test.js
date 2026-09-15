import assert from 'node:assert/strict';
import { getTravelpayoutsRolloutSummary } from './travelpayoutsRolloutSummary.js';

const summary = getTravelpayoutsRolloutSummary();
assert.equal(summary.knownPrograms, 28);
assert.equal(summary.configuredPrograms + summary.pendingConfiguration, summary.knownPrograms);
assert.equal(summary.programs.length, summary.knownPrograms);
