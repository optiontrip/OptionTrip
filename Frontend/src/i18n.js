import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { RTL_LANGUAGE_CODES, SUPPORTED_LANGUAGE_CODES, normalizeLanguageCode } from './config/supportedLanguages';

import enTranslations from './locales/en.json';
import ruTranslations from './locales/ru.json';
import deTranslations from './locales/de.json';
import frTranslations from './locales/fr.json';
import itTranslations from './locales/it.json';
import esTranslations from './locales/es.json';
import plTranslations from './locales/pl.json';
import ukTranslations from './locales/uk.json';
import trTranslations from './locales/tr.json';
import huTranslations from './locales/hu.json';
import svTranslations from './locales/sv.json';
import ptTranslations from './locales/pt.json';
import srTranslations from './locales/sr.json';
import arTranslations from './locales/ar.json';
import zhTranslations from './locales/zh.json';
import jaTranslations from './locales/ja.json';
import viTranslations from './locales/vi.json';
import thTranslations from './locales/th.json';
import koTranslations from './locales/ko.json';
import hiTranslations from './locales/hi.json';
import bnTranslations from './locales/bn.json';
import idTranslations from './locales/id.json';

const setDocumentDirection = lng => {
  const base = normalizeLanguageCode(lng);
  const body = document.body;
  const html = document.documentElement;
  if (RTL_LANGUAGE_CODES.includes(base)) {
    html.setAttribute('dir', 'rtl');
    body.style.direction = 'rtl';
  } else {
    html.setAttribute('dir', 'ltr');
    body.style.direction = 'ltr';
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      ru: { translation: ruTranslations },
      de: { translation: deTranslations },
      fr: { translation: frTranslations },
      it: { translation: itTranslations },
      es: { translation: esTranslations },
      pl: { translation: plTranslations },
      uk: { translation: ukTranslations },
      tr: { translation: trTranslations },
      hu: { translation: huTranslations },
      sv: { translation: svTranslations },
      pt: { translation: ptTranslations },
      sr: { translation: srTranslations },
      ar: { translation: arTranslations },
      zh: { translation: zhTranslations },
      ja: { translation: jaTranslations },
      vi: { translation: viTranslations },
      th: { translation: thTranslations },
      ko: { translation: koTranslations },
      hi: { translation: hiTranslations },
      bn: { translation: bnTranslations },
      id: { translation: idTranslations },
    },
    supportedLngs: SUPPORTED_LANGUAGE_CODES,
    nonExplicitSupportedLngs: true,
    fallbackLng: 'en',
    debug: false,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

setDocumentDirection(i18n.language);

i18n.on('languageChanged', lng => {
  setDocumentDirection(lng);
  localStorage.setItem('i18nextLng', lng);
});

i18n.on('missingKey', (_lngs, ns, key, fallbackValue) => {
  const lang = normalizeLanguageCode(i18n.language);
  if (lang === 'en' || !fallbackValue) return;

  const pendingKey = `__lt_pending__${lang}__${key}`;
  if (sessionStorage.getItem(pendingKey)) return;
  sessionStorage.setItem(pendingKey, '1');

  import('./services/translateService.js').then(({ translateText }) => {
    translateText(String(fallbackValue), lang)
      .then(translated => {
        if (!translated || translated === fallbackValue) return;
        const bundle = i18n.getResourceBundle(lang, ns) || {};
        const parts = key.split('.');
        let node = bundle;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!node[parts[i]]) node[parts[i]] = {};
          node = node[parts[i]];
        }
        node[parts[parts.length - 1]] = translated;
        i18n.addResourceBundle(lang, ns, bundle, true, true);
      })
      .finally(() => sessionStorage.removeItem(pendingKey));
  });
});

export default i18n;
