const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);

const raw = Buffer.concat(chunks).toString('utf8').trim();
if (!raw) {
  console.log('affiliate-status inventory: empty');
  process.exit(0);
}

const data = JSON.parse(raw);
const wanted = new Set(['rail', 'bus', 'ferries', 'transfers', 'city_passes', 'activities']);

for (const item of data.verticals || []) {
  if (!wanted.has(item.vertical)) continue;
  const options = (item.bookingOptions || [])
    .map(option => option.provider)
    .filter(Boolean)
    .join(',') || 'none';
  console.log(`affiliate-status ${item.vertical}: live=${Boolean(item.live)} bookingProviders=${options}`);
}
