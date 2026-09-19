const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);

const raw = Buffer.concat(chunks).toString('utf8').trim();
if (!raw) {
  console.log('affiliate-status inventory: empty');
  process.exit(0);
}

const data = JSON.parse(raw);
const verticals = [...(data.verticals || [])]
  .filter(item => item?.vertical)
  .sort((a, b) => String(a.vertical).localeCompare(String(b.vertical)));

if (!verticals.length) {
  console.log('affiliate-status inventory: no verticals');
  process.exit(0);
}

for (const item of verticals) {
  const bookingProviders = (item.bookingOptions || [])
    .map(option => option.provider)
    .filter(Boolean)
    .join(',') || 'none';
  const liveProviders = (item.providers || []).filter(Boolean).join(',') || 'none';
  console.log(
    `affiliate-status ${item.vertical}: live=${Boolean(item.live)} liveProviders=${liveProviders} bookingProviders=${bookingProviders}`
  );
}
