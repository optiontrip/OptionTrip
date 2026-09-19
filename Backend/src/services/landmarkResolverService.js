import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const landmarks = JSON.parse(readFileSync(join(__dirname, '../data/landmarks.json'), 'utf8'));

const normalize = value => String(value || '')
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[’'`]/g, '')
  .replace(/[^\p{L}\p{N}]+/gu, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const aliasIndex = new Map();
for (const landmark of landmarks) {
  for (const alias of [landmark.name, ...(landmark.aliases || [])]) {
    const key = normalize(alias);
    if (key && !aliasIndex.has(key)) aliasIndex.set(key, landmark);
  }
}

export const findCuratedLandmark = query => {
  const key = normalize(query);
  if (!key) return null;
  const landmark = aliasIndex.get(key);
  return landmark ? { ...landmark, matchedQuery: String(query || '').trim(), source: 'curated-landmark' } : null;
};

export const listCuratedLandmarks = () => landmarks.map(landmark => ({ ...landmark }));

export default {
  findCuratedLandmark,
  listCuratedLandmarks,
};
