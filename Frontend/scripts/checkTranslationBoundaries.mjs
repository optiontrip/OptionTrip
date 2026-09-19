import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ensureSafeTextBoundary } from '../src/services/translateService.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const textNode = (textContent, previousSibling = null, nextSibling = null) => ({
  textContent,
  previousSibling,
  nextSibling,
});

const beforeWord = textNode('Hello');
const translatedAfterWord = textNode('', beforeWord, null);
assert.equal(
  ensureSafeTextBoundary('world', 'мир', translatedAfterWord),
  ' мир',
  'Translated inline text must gain a safe leading space when the previous sibling ends with a word character',
);

const afterWord = textNode('world');
const translatedBeforeWord = textNode('', null, afterWord);
assert.equal(
  ensureSafeTextBoundary('Hello', 'Привет', translatedBeforeWord),
  'Привет ',
  'Translated inline text must gain a safe trailing space when the next sibling starts with a word character',
);

const authoredSpaces = textNode('');
assert.equal(
  ensureSafeTextBoundary('  Hello ', ' Привет ', authoredSpaces),
  '  Привет ',
  'Authored leading and trailing whitespace must survive translation',
);

const noSibling = textNode('');
assert.equal(
  ensureSafeTextBoundary('Hello', 'Привет', noSibling),
  'Привет',
  'Standalone translated text must not receive synthetic whitespace',
);

const autoTranslatePath = join(__dirname, '../src/components/AutoTranslate/AutoTranslate.jsx');
const autoTranslateSource = readFileSync(autoTranslatePath, 'utf8');

assert.match(
  autoTranslateSource,
  /characterData:\s*true/,
  'AutoTranslate must observe characterData so reused dynamic text nodes are translated',
);
assert.match(
  autoTranslateSource,
  /nodeOriginals\.current\.set\(node, node\.textContent\)/,
  'AutoTranslate must promote genuinely changed dynamic text to the new source original',
);
assert.match(
  autoTranslateSource,
  /node\.textContent === expected/,
  'AutoTranslate must ignore its own translated characterData mutations to avoid feedback loops',
);

console.log('✅ Dynamic translation boundary regression checks passed');
