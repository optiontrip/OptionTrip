import { getCuratedTranslation } from './curatedTranslations.js';

const GOOGLE_URL = 'https://translate.googleapis.com/translate_a/single';
const LS_KEY = 'ot_translate_cache';
const MAX_CACHE = 3000;

const memCache = new Map();

try {
  const stored = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  for (const [k, v] of Object.entries(stored)) memCache.set(k, v);
} catch {}

const persistCache = () => {
  try {
    const obj = {};
    let n = 0;
    for (const [k, v] of memCache) {
      obj[k] = v;
      if (++n >= MAX_CACHE) break;
    }
    localStorage.setItem(LS_KEY, JSON.stringify(obj));
  } catch {
    try {
      localStorage.removeItem(LS_KEY);
    } catch {}
  }
};

const getBoundaryWhitespace = (text) => {
  const value = String(text ?? '');
  return {
    leading: value.match(/^\s*/)?.[0] || '',
    trailing: value.match(/\s*$/)?.[0] || '',
    core: value.trim(),
  };
};

const WORD_CHAR_RE = /[\p{L}\p{N}]/u;
const LETTER_RE = /\p{L}/u;
const LOWER_LETTER_RE = /\p{Ll}/u;
const UPPER_LETTER_RE = /\p{Lu}/u;
const CAMEL_BRAND_RE = /^\p{Ll}\p{Lu}/u;

const INLINE_CONTEXT_TAGS = new Set([
  'A', 'ABBR', 'B', 'BDI', 'BDO', 'CITE', 'EM', 'I', 'LABEL', 'MARK',
  'Q', 'S', 'SMALL', 'SPAN', 'STRONG', 'SUB', 'SUP', 'TIME', 'U',
]);

const startsWithWordChar = (value) => WORD_CHAR_RE.test(String(value || '').charAt(0));
const endsWithWordChar = (value) => {
  const text = String(value || '');
  return WORD_CHAR_RE.test(text.charAt(text.length - 1));
};

const getParentNode = node => node?.parentElement || node?.parentNode || null;

// Find meaningful text next to a text node, including across an inline wrapper
// such as <strong>, <span> or <a>. Do not climb through block containers, so text
// in separate paragraphs/cards never gets synthetic spacing or case changes.
const getAdjacentMeaningfulText = (node, direction) => {
  if (!node) return '';
  let current = node;

  for (let depth = 0; current && depth < 8; depth += 1) {
    let sibling = direction === 'before' ? current.previousSibling : current.nextSibling;
    while (sibling) {
      const text = String(sibling.textContent || '').trim();
      if (text) return text;
      sibling = direction === 'before' ? sibling.previousSibling : sibling.nextSibling;
    }

    const parent = getParentNode(current);
    if (!parent) break;
    const tagName = String(parent.tagName || '').toUpperCase();
    if (!INLINE_CONTEXT_TAGS.has(tagName)) break;
    current = parent;
  }

  return '';
};

const hasWordSiblingBefore = node => endsWithWordChar(getAdjacentMeaningfulText(node, 'before'));
const hasWordSiblingAfter = node => startsWithWordChar(getAdjacentMeaningfulText(node, 'after'));

const firstLetterIndex = value => String(value || '').search(LETTER_RE);

const lowercaseFirstLetter = (value, locale) => {
  const text = String(value || '');
  const index = firstLetterIndex(text);
  if (index < 0) return text;
  const char = text.charAt(index);
  let lowered = char.toLowerCase();
  try {
    lowered = char.toLocaleLowerCase(locale || undefined);
  } catch {}
  return `${text.slice(0, index)}${lowered}${text.slice(index + char.length)}`;
};

const previousTextEndsSentence = value => /[.!?…][\s"'”’\])}]*$/u.test(String(value || '').trim());

const normalizeContextualCase = (original, translated, node, targetLang) => {
  if (!node) return translated;

  const originalCore = String(original || '').trim();
  const translatedCore = String(translated || '').trim();
  if (!originalCore || !translatedCore || CAMEL_BRAND_RE.test(originalCore)) return translatedCore;

  const originalIndex = firstLetterIndex(originalCore);
  const translatedIndex = firstLetterIndex(translatedCore);
  if (originalIndex < 0 || translatedIndex < 0) return translatedCore;

  const originalFirst = originalCore.charAt(originalIndex);
  const translatedFirst = translatedCore.charAt(translatedIndex);
  if (!LOWER_LETTER_RE.test(originalFirst) || !UPPER_LETTER_RE.test(translatedFirst)) return translatedCore;

  const previousText = getAdjacentMeaningfulText(node, 'before');
  if (!previousText || previousTextEndsSentence(previousText)) return translatedCore;

  // Translation engines often capitalize a fragment because they see an inline
  // text node as a standalone sentence. If the authored English fragment starts
  // lowercase and the DOM context proves it is mid-sentence, restore natural case.
  return lowercaseFirstLetter(translatedCore, targetLang);
};

const restoreBoundaryWhitespace = (original, translated, node = null, targetLang = null) => {
  const { leading, trailing } = getBoundaryWhitespace(original);
  let translatedCore = String(translated ?? '').trim();
  if (!translatedCore) return original;

  translatedCore = normalizeContextualCase(original, translatedCore, node, targetLang);

  let safeLeading = leading;
  let safeTrailing = trailing;

  // Translation happens per DOM text node. When JSX splits a visual sentence
  // across sibling nodes/elements, trimming the translated node can glue two
  // words together. Preserve authored whitespace and defensively add one space
  // only when two word-like boundaries would otherwise touch.
  if (!safeLeading && startsWithWordChar(translatedCore) && hasWordSiblingBefore(node)) {
    safeLeading = ' ';
  }
  if (!safeTrailing && endsWithWordChar(translatedCore) && hasWordSiblingAfter(node)) {
    safeTrailing = ' ';
  }

  return `${safeLeading}${translatedCore}${safeTrailing}`;
};

const curatedFor = (text, targetLang, node = null) => {
  const curated = getCuratedTranslation(text, targetLang);
  return curated ? restoreBoundaryWhitespace(text, curated, node, targetLang) : null;
};

const callGoogle = async (text, source, target) => {
  const url = `${GOOGLE_URL}?client=gtx&sl=${encodeURIComponent(source)}&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google Translate HTTP ${res.status}`);
  const data = await res.json();
  return (data[0] || []).map(item => (item[0] || '')).join('').trim() || text;
};

export const translateText = async (text, targetLang, sourceLang = 'en', node = null) => {
  const { core: t } = getBoundaryWhitespace(text);
  if (!t) return text;
  const target = (targetLang || 'en').split('-')[0];
  if (target === sourceLang || target === 'en') return text;

  const curated = curatedFor(text, target, node);
  if (curated) return curated;

  const key = `${sourceLang}:${target}:${t}`;
  if (memCache.has(key)) return restoreBoundaryWhitespace(text, memCache.get(key), node, target);

  try {
    const translated = await callGoogle(t, sourceLang, target);
    memCache.set(key, translated);
    persistCache();
    return restoreBoundaryWhitespace(text, translated, node, target);
  } catch {
    return text;
  }
};

export const translateBatch = async (texts, targetLang, sourceLang = 'en') => {
  if (!texts?.length) return texts;
  const target = (targetLang || 'en').split('-')[0];
  if (target === sourceLang || target === 'en') return texts;

  const results = new Array(texts.length);
  const toFetch = [];

  for (let i = 0; i < texts.length; i++) {
    const curated = curatedFor(texts[i], target);
    if (curated) {
      results[i] = curated;
      continue;
    }

    const { core: t } = getBoundaryWhitespace(texts[i]);
    const key = `${sourceLang}:${target}:${t}`;
    if (memCache.has(key)) {
      results[i] = restoreBoundaryWhitespace(texts[i], memCache.get(key), null, target);
    } else {
      toFetch.push({ idx: i, text: t, original: texts[i] });
    }
  }

  if (toFetch.length > 0) {
    await Promise.all(
      toFetch.map(async ({ idx, text, original }) => {
        try {
          const translated = await callGoogle(text, sourceLang, target);
          const key = `${sourceLang}:${target}:${text}`;
          memCache.set(key, translated);
          results[idx] = restoreBoundaryWhitespace(original, translated, null, target);
        } catch {
          results[idx] = original;
        }
      })
    );
    persistCache();
  }

  return results;
};

export const getCached = (text, targetLang, sourceLang = 'en', node = null) => {
  const { core: t } = getBoundaryWhitespace(text);
  if (!t) return null;
  const target = (targetLang || 'en').split('-')[0];

  const curated = curatedFor(text, target, node);
  if (curated) return curated;

  const key = `${sourceLang}:${target}:${t}`;
  return memCache.has(key) ? restoreBoundaryWhitespace(text, memCache.get(key), node, target) : null;
};

export const ensureSafeTextBoundary = (original, translated, node, targetLang = null) =>
  restoreBoundaryWhitespace(original, translated, node, targetLang);

export const isFullyCached = (texts, targetLang, sourceLang = 'en') => {
  const target = (targetLang || 'en').split('-')[0];
  return texts.every(t =>
    Boolean(getCuratedTranslation(t, target)) || memCache.has(`${sourceLang}:${target}:${t?.trim()}`)
  );
};

export const translateMissingKeys = async (enBundle, targetBundle, targetLang) => {
  const target = (targetLang || 'en').split('-')[0];
  if (target === 'en') return {};

  const flatten = (obj, prefix = '') =>
    Object.entries(obj).reduce((acc, [k, v]) => {
      const full = prefix ? `${prefix}.${k}` : k;
      if (typeof v === 'object' && v !== null) Object.assign(acc, flatten(v, full));
      else acc[full] = String(v);
      return acc;
    }, {});

  const flatEn = flatten(enBundle);
  const flatTarget = flatten(targetBundle);
  const missingKeys = Object.keys(flatEn).filter(k => !flatTarget[k] || flatTarget[k] === flatEn[k]);
  if (!missingKeys.length) return {};

  const translated = await translateBatch(missingKeys.map(k => flatEn[k]), target);
  const result = {};
  missingKeys.forEach((k, i) => { result[k] = translated[i]; });
  return result;
};
