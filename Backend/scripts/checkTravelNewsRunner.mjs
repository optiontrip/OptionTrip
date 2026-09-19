import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  calculateRemainingNewsBudget,
  normalizeNewsDailyLimit,
} from '../src/jobs/travelNewsRunner.js';

assert.equal(normalizeNewsDailyLimit(undefined), 5, 'Missing news limit must default to five');
assert.equal(normalizeNewsDailyLimit(10), 5, 'News limit must never exceed five');
assert.equal(normalizeNewsDailyLimit(0), 1, 'Configured news limit must never drop below one');
assert.equal(normalizeNewsDailyLimit(3), 3, 'Valid news limits must be preserved');

assert.equal(calculateRemainingNewsBudget(0, 5), 5, 'Empty rolling window must allow the full daily budget');
assert.equal(calculateRemainingNewsBudget(2, 5), 3, 'Recent posts must reduce the remaining automation budget');
assert.equal(calculateRemainingNewsBudget(5, 5), 0, 'Five recent posts must stop additional publication');
assert.equal(calculateRemainingNewsBudget(8, 5), 0, 'Budget must never become negative');

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverSource = readFileSync(join(__dirname, '../src/server.js'), 'utf8');

assert.match(
  serverSource,
  /runTravelNewsAutomationWithBudget\(\{ trigger: 'cron' \}\)/,
  'Scheduled news publishing must use the daily-budget runner',
);
assert.match(
  serverSource,
  /runTravelNewsAutomationWithBudget\(\{ trigger: 'startup' \}\)/,
  'Server startup must trigger a budget-protected catch-up run',
);
assert.match(
  serverSource,
  /NEWS_STARTUP_DELAY_MS/,
  'Startup catch-up delay must remain configurable',
);

console.log('✅ Travel news runner regression checks passed');
