import assert from 'node:assert/strict';
import { TRAVELPAYOUTS_AVAILABLE_PROGRAMS } from './travelpayoutsAvailablePrograms.js';
import { TRAVELPAYOUTS_PROGRAM_LABELS } from './travelpayoutsProgramLabels.js';

for (const program of TRAVELPAYOUTS_AVAILABLE_PROGRAMS) {
  const provider = program === 'aviasales' ? 'travelpayouts' : program;
  assert.ok(TRAVELPAYOUTS_PROGRAM_LABELS[provider], `Missing display label for ${program}`);
}
