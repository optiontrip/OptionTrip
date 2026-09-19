import { useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { translateBatch, getCached, ensureSafeTextBoundary } from '../../services/translateService';
import './AutoTranslate.css';

const CHUNK_SIZE = 40;

const SKIP_TAGS = new Set([
  'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT',
  'SELECT', 'CODE', 'PRE', 'SVG', 'MATH',
]);

const SKIP_CLASS_HINTS = [
  'notranslate', 'language-switcher', 'currency-switcher',
  'country-switcher', 'header-lang',
];

const TRANSLATABLE_ATTRS = ['placeholder', 'title', 'aria-label'];

const shouldSkipNode = (node) => {
  let el = node.parentElement;
  while (el && el !== document.body) {
    if (SKIP_TAGS.has(el.tagName)) return true;
    if (el.hasAttribute('data-notranslate')) return true;
    const cls = el.className;
    if (typeof cls === 'string' && SKIP_CLASS_HINTS.some(h => cls.includes(h))) return true;
    el = el.parentElement;
  }
  return false;
};

const isTranslatableText = (text) => {
  const t = text?.trim();
  if (!t || t.length < 2) return false;
  if (/^[\d\s.,+\-$€£¥%:/()\[\]{}@#!?*&^~`|\\<>=]+$/.test(t)) return false;
  return true;
};

const collectTextNodes = (root) => {
  const nodes = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (!isTranslatableText(node.textContent)) continue;
    if (shouldSkipNode(node)) continue;
    nodes.push(node);
  }
  return nodes;
};

const collectAttrElements = (root) => {
  const results = [];
  const all = root.querySelectorAll(
    TRANSLATABLE_ATTRS.map(a => `[${a}]`).join(',')
  );
  all.forEach(el => {
    const attrMap = {};
    TRANSLATABLE_ATTRS.forEach(attr => {
      const val = el.getAttribute(attr);
      if (val && isTranslatableText(val)) attrMap[attr] = val;
    });
    if (Object.keys(attrMap).length > 0) results.push({ el, attrMap });
  });
  return results;
};

const makeDebounced = (fn, delay, maxWait) => {
  let timer = null;
  let firstAt = null;
  return () => {
    const now = Date.now();
    if (!firstAt) firstAt = now;
    clearTimeout(timer);
    if (now - firstAt >= maxWait) {
      firstAt = null; fn();
    } else {
      timer = setTimeout(() => { firstAt = null; fn(); }, delay);
    }
  };
};

const markTranslatedNode = node => node?.parentElement?.setAttribute('data-ot-translated', 'true');
const markTranslatedElement = el => el?.setAttribute?.('data-ot-translated', 'true');

const AutoTranslate = () => {
  const { i18n } = useTranslation();

  const nodeOriginals  = useRef(new WeakMap());
  const attrOriginals  = useRef(new WeakMap());
  const localCache     = useRef(new Map());
  const versionRef     = useRef(0);
  const observerRef    = useRef(null);
  const followUpTimers = useRef([]);
  const currentLangRef = useRef('en');
  const debouncedFnRef = useRef(null);

  const applyCached = useCallback((lang, nodes, attrEls) => {
    if (lang === 'en') return;

    nodes.forEach(node => {
      const orig = nodeOriginals.current.get(node);
      if (!orig) return;
      const key = `${lang}:${orig}`;
      const cached = localCache.current.get(key) ?? getCached(orig, lang);
      if (cached) {
        localCache.current.set(key, cached);
        const result = ensureSafeTextBoundary(orig, cached, node, lang);
        markTranslatedNode(node);
        if (result !== node.textContent) node.textContent = result;
      }
    });

    attrEls.forEach(({ el, attrMap }) => {
      const origMap = attrOriginals.current.get(el) || {};
      Object.keys(attrMap).forEach(attr => {
        const orig = origMap[attr] || attrMap[attr];
        const key  = `${lang}:${orig}`;
        const result = localCache.current.get(key) ?? getCached(orig, lang);
        if (result) {
          localCache.current.set(key, result);
          markTranslatedElement(el);
          if (el.getAttribute(attr) !== result) el.setAttribute(attr, result);
        }
      });
    });
  }, []);

  const translateDOM = useCallback(async (lang) => {
    const myVersion = ++versionRef.current;

    try {
      const nodes   = collectTextNodes(document.body);
      const attrEls = collectAttrElements(document.body);

      if (lang === 'en') {
        nodes.forEach(node => {
          const orig = nodeOriginals.current.get(node);
          if (orig && node.textContent !== orig) node.textContent = orig;
        });
        attrEls.forEach(({ el }) => {
          const origMap = attrOriginals.current.get(el);
          if (!origMap) return;
          Object.entries(origMap).forEach(([attr, orig]) => {
            if (el.getAttribute(attr) !== orig) el.setAttribute(attr, orig);
          });
        });
        document.querySelectorAll('[data-ot-translated="true"]').forEach(el => {
          el.removeAttribute('data-ot-translated');
        });
        return;
      }

      nodes.forEach(node => {
        if (!nodeOriginals.current.has(node)) {
          nodeOriginals.current.set(node, node.textContent);
        }
      });
      attrEls.forEach(({ el, attrMap }) => {
        if (!attrOriginals.current.has(el)) {
          const origMap = {};
          Object.keys(attrMap).forEach(attr => {
            origMap[attr] = el.getAttribute(attr);
          });
          attrOriginals.current.set(el, origMap);
        }
      });

      applyCached(lang, nodes, attrEls);
      if (versionRef.current !== myVersion) return;

      const seen     = new Set();
      const uncached = [];

      const maybeAdd = (text) => {
        if (!text || !isTranslatableText(text)) return;
        if (!localCache.current.has(`${lang}:${text}`) && !seen.has(text)) {
          seen.add(text);
          uncached.push(text);
        }
      };

      nodes.forEach(node => maybeAdd(nodeOriginals.current.get(node)));
      attrEls.forEach(({ el }) => {
        const origMap = attrOriginals.current.get(el) || {};
        Object.values(origMap).forEach(maybeAdd);
      });

      for (let i = 0; i < uncached.length; i += CHUNK_SIZE) {
        if (versionRef.current !== myVersion) return;
        const chunk   = uncached.slice(i, i + CHUNK_SIZE);
        const results = await translateBatch(chunk, lang);
        if (versionRef.current !== myVersion) return;
        chunk.forEach((text, idx) => {
          if (results[idx]) localCache.current.set(`${lang}:${text}`, results[idx]);
        });
      }

      if (versionRef.current !== myVersion) return;

      const freshNodes   = collectTextNodes(document.body);
      const freshAttrEls = collectAttrElements(document.body);

      freshNodes.forEach(node => {
        if (!nodeOriginals.current.has(node)) {
          nodeOriginals.current.set(node, node.textContent);
        }
        const orig   = nodeOriginals.current.get(node);
        const cached = orig && localCache.current.get(`${lang}:${orig}`);
        const result = cached && ensureSafeTextBoundary(orig, cached, node, lang);
        if (result) markTranslatedNode(node);
        if (result && result !== node.textContent) node.textContent = result;
      });

      freshAttrEls.forEach(({ el, attrMap }) => {
        if (!attrOriginals.current.has(el)) {
          const origMap = {};
          Object.keys(attrMap).forEach(attr => { origMap[attr] = el.getAttribute(attr); });
          attrOriginals.current.set(el, origMap);
        }
        const origMap = attrOriginals.current.get(el);
        Object.keys(origMap).forEach(attr => {
          const orig   = origMap[attr];
          const result = orig && localCache.current.get(`${lang}:${orig}`);
          if (result) markTranslatedElement(el);
          if (result && el.getAttribute(attr) !== result) el.setAttribute(attr, result);
        });
      });

    } catch (err) {
      console.warn('[AutoTranslate]', err.message);
    }
  }, [applyCached]);

  const startObserver = useCallback(() => {
    if (observerRef.current) return;

    debouncedFnRef.current = makeDebounced(
      () => translateDOM(currentLangRef.current),
      350,
      1500
    );

    observerRef.current = new MutationObserver((mutations) => {
      const lang = currentLangRef.current;
      if (lang === 'en') return;

      let shouldRetranslate = false;

      mutations.forEach(mutation => {
        if (mutation.type === 'characterData') {
          const node = mutation.target;
          if (!isTranslatableText(node.textContent) || shouldSkipNode(node)) return;

          const original = nodeOriginals.current.get(node);
          if (original) {
            const key = `${lang}:${original}`;
            const cached = localCache.current.get(key) ?? getCached(original, lang);
            const expected = cached && ensureSafeTextBoundary(original, cached, node, lang);

            // Ignore the characterData mutation caused by our own translated
            // write. If React reused this text node with genuinely new source
            // text, promote that new value to the original before translating.
            if (expected && node.textContent === expected) return;
          }

          nodeOriginals.current.set(node, node.textContent);
          shouldRetranslate = true;
          return;
        }

        if (mutation.type === 'childList') {
          const hasNew = [...mutation.addedNodes].some(node =>
            node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE
          );
          if (hasNew) shouldRetranslate = true;
        }
      });

      if (shouldRetranslate) debouncedFnRef.current?.();
    });

    observerRef.current.observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }, [translateDOM]);

  const stopObserver = useCallback(() => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    debouncedFnRef.current = null;
  }, []);

  const clearFollowUps = useCallback(() => {
    followUpTimers.current.forEach(clearTimeout);
    followUpTimers.current = [];
  }, []);

  useEffect(() => {
    const handleLanguageChange = async (lng) => {
      const lang = (lng || 'en').split('-')[0];
      currentLangRef.current = lang;
      document.documentElement.lang = lang;
      document.documentElement.setAttribute('data-ot-lang', lang);

      stopObserver();
      clearFollowUps();

      await translateDOM(lang);
      if (lang === 'en') return;

      [1000, 3000].forEach(delay => {
        const t = setTimeout(() => translateDOM(lang), delay);
        followUpTimers.current.push(t);
      });

      startObserver();
    };

    handleLanguageChange(i18n.language);

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
      stopObserver();
      clearFollowUps();
    };
  }, [i18n, translateDOM, startObserver, stopObserver, clearFollowUps]);

  return null;
};

export default AutoTranslate;
