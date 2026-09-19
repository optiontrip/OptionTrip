import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  calculateRemainingNewsBudget,
  getTravelNewsAutopublishReadiness,
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

const envKeys = [
  'WORDPRESS_USERNAME',
  'WORDPRESS_APP_PASSWORD',
  'OPENAI_API_KEY',
  'NEWS_AUTOPUBLISH_ENABLED',
];
const savedEnv = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));

try {
  for (const key of envKeys) delete process.env[key];
  let readiness = getTravelNewsAutopublishReadiness();
  assert.equal(readiness.enabled, false, 'Missing production credentials must prevent publishing');
  assert.equal(readiness.configured, false, 'Missing production credentials must be reported');
  assert.deepEqual(
    [...readiness.missing].sort(),
    ['OPENAI_API_KEY', 'WORDPRESS_APP_PASSWORD', 'WORDPRESS_USERNAME'].sort(),
    'All required news credentials must be reported when absent',
  );

  process.env.WORDPRESS_USERNAME = 'test-user';
  process.env.WORDPRESS_APP_PASSWORD = 'test-pass';
  process.env.OPENAI_API_KEY = 'test-key';
  readiness = getTravelNewsAutopublishReadiness();
  assert.equal(readiness.enabled, true, 'Configured production news must auto-enable by default');
  assert.equal(readiness.mode, 'auto', 'Missing explicit flag should use automatic mode');

  process.env.NEWS_AUTOPUBLISH_ENABLED = 'false';
  readiness = getTravelNewsAutopublishReadiness();
  assert.equal(readiness.enabled, false, 'Explicit false must remain an emergency kill switch');
  assert.equal(readiness.explicitlyDisabled, true, 'Explicit disable must be observable');
} finally {
  for (const key of envKeys) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverSource = readFileSync(join(__dirname, '../src/server.js'), 'utf8');
const appSource = readFileSync(join(__dirname, '../src/app.js'), 'utf8');
const internalCronSource = readFileSync(join(__dirname, '../src/routes/internalCron.js'), 'utf8');
const runnerSource = readFileSync(join(__dirname, '../src/jobs/travelNewsRunner.js'), 'utf8');
const freshnessSource = readFileSync(join(__dirname, '../src/services/travelNewsFreshness.js'), 'utf8');

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
assert.match(
  serverSource,
  /15 \*\/4 \* \* \*/,
  'Default travel news schedule must check for fresh stories every four hours',
);
assert.match(
  internalCronSource,
  /post\('\/run-news', verifyCronSecret/,
  'Manual travel news trigger must remain protected by the cron secret',
);
assert.match(
  internalCronSource,
  /get\('\/news-status', verifyCronSecret/,
  'Travel news status endpoint must remain protected by the cron secret',
);
assert.match(
  internalCronSource,
  /getTravelNewsFreshness/,
  'Protected news status must include WordPress publication freshness',
);
assert.match(
  internalCronSource,
  /clearTravelNewsFreshnessCache/,
  'Manual publication must invalidate the cached freshness snapshot',
);
assert.match(
  appSource,
  /get\("\/api\/news-health", async/,
  'Public operations health must expose a dedicated news freshness endpoint',
);
assert.match(
  appSource,
  /getTravelNewsFreshness\(\)/,
  'News health endpoint must verify the actual WordPress feed rather than only in-memory runner state',
);
assert.match(
  freshnessSource,
  /DEFAULT_STALE_HOURS\s*=\s*36/,
  'News freshness monitor must have a bounded default stale threshold',
);
assert.match(
  freshnessSource,
  /CACHE_MS\s*=\s*5 \* 60 \* 1000/,
  'WordPress freshness checks must be cached to avoid hammering the blog',
);
assert.match(
  freshnessSource,
  /categories: String\(categoryId\)/,
  'Freshness monitoring must inspect the WordPress News category specifically',
);
assert.match(
  runnerSource,
  /NEWS_CATEGORY_SLUG\s*=\s*'news'/,
  'Rolling publication budget must explicitly target the WordPress News category',
);
assert.match(
  runnerSource,
  /params\.set\('categories', String\(newsCategoryId\)\)/,
  'Recent-post budget checks must filter WordPress posts by the News category when available',
);
assert.match(
  runnerSource,
  /all-posts-fallback/,
  'Budget checks must retain a conservative all-post fallback if the News category cannot be resolved',
);

console.log('✅ Travel news runner and freshness-monitor regression checks passed');
