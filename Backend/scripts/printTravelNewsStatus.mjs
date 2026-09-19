import fs from 'node:fs';

const raw = fs.readFileSync(0, 'utf8').trim();
if (!raw) {
  console.log('news-status unavailable: empty health response');
  process.exit(0);
}

let payload;
try {
  payload = JSON.parse(raw);
} catch {
  console.log('news-status unavailable: invalid health JSON');
  process.exit(0);
}

const news = payload?.services?.travelNews;
if (!news) {
  console.log('news-status unavailable: travelNews health block missing');
  process.exit(0);
}

const missing = Array.isArray(news.missing) && news.missing.length
  ? news.missing.join(',')
  : 'none';

console.log([
  'news-status',
  `enabled=${Boolean(news.enabled)}`,
  `configured=${Boolean(news.configured)}`,
  `mode=${news.mode || 'unknown'}`,
  `running=${Boolean(news.running)}`,
  `lastStatus=${news.lastStatus || 'none'}`,
  `lastCompletedAt=${news.lastCompletedAt || 'none'}`,
  `dailyLimit=${news.dailyLimit ?? 'unknown'}`,
  `recentPublished=${news.recentPublishedCount ?? 'unknown'}`,
  `remainingBudget=${news.remainingBudget ?? 'unknown'}`,
  `budgetScope=${news.budgetScope || 'unknown'}`,
  `missing=${missing}`,
].join(' '));

if (!news.configured) {
  console.log(`news-action required: configure ${missing}`);
} else if (!news.enabled) {
  console.log('news-action required: automatic publishing is explicitly disabled');
} else {
  console.log('news-ready: automatic publishing is configured and enabled');
  if (Number(news.dailyLimit) === 1) {
    console.log('news-note: production daily limit is 1; the scheduler can run more often but will publish at most one News item per rolling 24 hours');
  }
}
