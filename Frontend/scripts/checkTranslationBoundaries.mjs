import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ensureSafeTextBoundary } from '../src/services/translateService.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const textNode = (
  textContent,
  previousSibling = null,
  nextSibling = null,
  parentElement = null,
) => ({
  textContent,
  previousSibling,
  nextSibling,
  parentElement,
  parentNode: parentElement,
});

const inlineElement = (
  tagName,
  textContent = '',
  previousSibling = null,
  nextSibling = null,
  parentElement = null,
) => ({
  tagName,
  textContent,
  previousSibling,
  nextSibling,
  parentElement,
  parentNode: parentElement,
});

const beforeWord = textNode('Hello');
const translatedAfterWord = textNode('', beforeWord, null);
assert.equal(
  ensureSafeTextBoundary('world', 'мир', translatedAfterWord, 'ru'),
  ' мир',
  'Translated inline text must gain a safe leading space when the previous sibling ends with a word character',
);

const afterWord = textNode('world');
const translatedBeforeWord = textNode('', null, afterWord);
assert.equal(
  ensureSafeTextBoundary('Hello', 'Привет', translatedBeforeWord, 'ru'),
  'Привет ',
  'Translated inline text must gain a safe trailing space when the next sibling starts with a word character',
);

const authoredSpaces = textNode('');
assert.equal(
  ensureSafeTextBoundary('  Hello ', ' Привет ', authoredSpaces, 'ru'),
  '  Привет ',
  'Authored leading and trailing whitespace must survive translation',
);

const noSibling = textNode('');
assert.equal(
  ensureSafeTextBoundary('Hello', 'Привет', noSibling, 'ru'),
  'Привет',
  'Standalone translated text must not receive synthetic whitespace',
);

// Inline wrappers are the common source of both glued words and false capital
// letters. The translator sees "trip" alone and may return "Путешествие", but
// the DOM proves that this fragment continues the sentence after "Plan".
const planText = textNode('Plan');
const strongWrapper = inlineElement('STRONG', 'trip', planText, null);
const nestedTripText = textNode('', null, null, strongWrapper);
assert.equal(
  ensureSafeTextBoundary('trip', 'Путешествие', nestedTripText, 'ru'),
  ' путешествие',
  'Nested mid-sentence translations must keep word spacing and restore lowercase casing',
);

const sentenceText = textNode('Ready.');
const sentenceWrapper = inlineElement('SPAN', 'next', sentenceText, null);
const sentenceStartText = textNode('', null, null, sentenceWrapper);
assert.equal(
  ensureSafeTextBoundary('next', 'Дальше', sentenceStartText, 'ru'),
  'Дальше',
  'A translated fragment after sentence-ending punctuation must keep its legitimate capital letter',
);

const camelWrapper = inlineElement('SPAN', 'iPhone', planText, null);
const camelText = textNode('', null, null, camelWrapper);
assert.equal(
  ensureSafeTextBoundary('iPhone', 'IPhone', camelText, 'ru'),
  ' IPhone',
  'Camel-case brand-like source text must not be force-lowercased',
);

const autoTranslatePath = join(__dirname, '../src/components/AutoTranslate/AutoTranslate.jsx');
const autoTranslateSource = readFileSync(autoTranslatePath, 'utf8');
const autoTranslateCssPath = join(__dirname, '../src/components/AutoTranslate/AutoTranslate.css');
const autoTranslateCss = readFileSync(autoTranslateCssPath, 'utf8');

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
assert.match(
  autoTranslateSource,
  /data-ot-translated/,
  'Translated elements must be marked so legacy theme capitalization can be neutralized safely',
);
assert.match(
  autoTranslateSource,
  /data-ot-lang/,
  'The active translated language must be exposed on the root element',
);
assert.match(
  autoTranslateCss,
  /text-transform:\s*none\s*!important/,
  'Translated content must override legacy capitalize/uppercase theme rules',
);

console.log('✅ Dynamic translation spacing and casing regression checks passed');
