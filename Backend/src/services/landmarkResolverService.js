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

const aliasesByLength = [...aliasIndex.entries()]
  .filter(([alias]) => alias.length >= 4)
  .sort((a, b) => b[0].length - a[0].length);

const tokenEquivalent = (left, right) => {
  if (left === right) return true;
  if (left.length < 5 || right.length < 5) return false;
  return left.slice(0, 5) === right.slice(0, 5);
};

const containsAliasTokens = (normalizedText, alias) => {
  const textTokens = normalizedText.split(' ').filter(Boolean);
  const aliasTokens = alias.split(' ').filter(Boolean);
  if (!aliasTokens.length || aliasTokens.length > textTokens.length) return false;

  for (let start = 0; start <= textTokens.length - aliasTokens.length; start += 1) {
    let matches = true;
    for (let offset = 0; offset < aliasTokens.length; offset += 1) {
      if (!tokenEquivalent(textTokens[start + offset], aliasTokens[offset])) {
        matches = false;
        break;
      }
    }
    if (matches) return true;
  }
  return false;
};

export const findCuratedLandmark = query => {
  const key = normalize(query);
  if (!key) return null;
  const landmark = aliasIndex.get(key);
  return landmark ? { ...landmark, matchedQuery: String(query || '').trim(), source: 'curated-landmark' } : null;
};

export const findCuratedLandmarkInText = text => {
  const normalizedText = normalize(text);
  if (!normalizedText) return null;
  const padded = ` ${normalizedText} `;

  for (const [alias, landmark] of aliasesByLength) {
    const exactBoundaryMatch = padded.includes(` ${alias} `);
    const inflectedTokenMatch = !exactBoundaryMatch && containsAliasTokens(normalizedText, alias);
    if (!exactBoundaryMatch && !inflectedTokenMatch) continue;

    return {
      ...landmark,
      matchedQuery: String(text || '').trim(),
      matchedAlias: alias,
      matchMode: exactBoundaryMatch ? 'exact' : 'inflected-token-prefix',
      source: 'curated-landmark-text',
    };
  }
  return null;
};

export const listCuratedLandmarks = () => landmarks.map(landmark => ({ ...landmark }));

export default {
  findCuratedLandmark,
  findCuratedLandmarkInText,
  listCuratedLandmarks,
};
