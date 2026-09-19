import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchTravelInventoryStatus } from '../../../services/travelInventoryService';
import './TravelpayoutsWidget.css';

const LOAD_TIMEOUT_MS = 10000;

const FRIENDLY_PROVIDER_NAMES = Object.freeze({
  travelpayouts_car_rental_widget: 'Live car rental partner',
  travelpayouts_tours_widget: 'Live tours partner',
  travelpayouts_esim_widget: 'Live eSIM partner',
});

// Travelpayouts supports a broad set of ISO language codes. Keep the embedded
// booking surface in the same language as OptionTrip whenever the provider can
// honor it, and fall back to English only for unsupported app languages.
const TRAVELPAYOUTS_LOCALES = new Map([
  ['ar', 'ar'], ['de', 'de'], ['en', 'en'], ['es', 'es'], ['fr', 'fr'],
  ['hi', 'hi'], ['hu', 'hu'], ['id', 'id'], ['it', 'it'], ['ja', 'ja'],
  ['ko', 'ko'], ['pl', 'pl'], ['pt', 'pt'], ['ru', 'ru'], ['sr', 'sr'],
  ['sv', 'sv'], ['th', 'th'], ['tr', 'tr'], ['uk', 'uk'], ['vi', 'vi'],
  ['zh', 'zh-Hans'],
]);

const friendlyProviderName = provider => FRIENDLY_PROVIDER_NAMES[provider]
  || String(provider || '')
    .replace(/^travelpayouts_/, '')
    .replace(/_widget$/, '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, char => char.toUpperCase());

const localizeWidgetUrl = (src, language) => {
  try {
    const url = new URL(src);
    const normalizedLanguage = String(language || 'en').toLowerCase().split('-')[0];
    const locale = TRAVELPAYOUTS_LOCALES.get(normalizedLanguage) || 'en';
    url.searchParams.set('locale', locale);
    return url.toString();
  } catch {
    return src;
  }
};

const TravelpayoutsWidget = ({ src, title, vertical }) => {
  const { i18n } = useTranslation();
  const containerRef = useRef(null);
  const [status, setStatus] = useState('loading');
  const [attempt, setAttempt] = useState(0);
  const [inventory, setInventory] = useState(null);
  const localizedSrc = useMemo(() => localizeWidgetUrl(src, i18n.language), [src, i18n.language]);

  useEffect(() => {
    if (!vertical) return undefined;
    let active = true;
    fetchTravelInventoryStatus().then(data => {
      if (active) setInventory(data?.[vertical] || null);
    });
    return () => { active = false; };
  }, [vertical]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    setStatus('loading');
    container.innerHTML = '';

    const script = document.createElement('script');
    script.src = localizedSrc;
    script.async = true;
    script.charset = 'utf-8';
    script.setAttribute('data-optiontrip-widget', 'travelpayouts');

    let settled = false;
    const markReady = () => {
      if (settled) return;
      settled = true;
      setStatus('ready');
    };
    const markError = () => {
      if (settled) return;
      settled = true;
      setStatus('error');
    };

    script.addEventListener('load', markReady, { once: true });
    script.addEventListener('error', markError, { once: true });
    container.appendChild(script);

    const timeoutId = window.setTimeout(() => {
      if (!settled && container.childElementCount <= 1) markError();
      else markReady();
    }, LOAD_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timeoutId);
      script.removeEventListener('load', markReady);
      script.removeEventListener('error', markError);
      container.innerHTML = '';
    };
  }, [localizedSrc, attempt]);

  const providerLabels = useMemo(
    () => (inventory?.providers || []).map(friendlyProviderName),
    [inventory?.providers],
  );

  return (
    <div className="cr-tp-widget ot-partner-widget" data-widget-status={status}>
      {title && <h3 className="cr-tp-widget__title">{title}</h3>}

      <div className="ot-partner-widget__trust" aria-label="Live booking source status">
        <span className={`ot-partner-widget__live${status === 'error' ? ' ot-partner-widget__live--error' : ''}`}>
          <span className="ot-partner-widget__dot" />
          {status === 'error' ? 'Partner search unavailable' : 'Live partner search'}
        </span>
        {providerLabels.length > 0 && (
          <span className="ot-partner-widget__providers">
            {providerLabels.length} connected source{providerLabels.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      <div
        ref={containerRef}
        className="cr-tp-widget__slot ot-partner-widget__slot"
        aria-busy={status === 'loading'}
        aria-label={title || 'Travel booking options'}
      />

      {status === 'loading' && (
        <div className="cr-tp-widget__state ot-partner-widget__state" role="status">
          Loading live booking options...
        </div>
      )}

      {status === 'error' && (
        <div className="cr-tp-widget__state cr-tp-widget__state--error ot-partner-widget__state ot-partner-widget__state--error" role="alert">
          <strong>Booking options did not load.</strong>
          <span>Check your connection or try again. Your OptionTrip page and trip data are still safe.</span>
          <button type="button" onClick={() => setAttempt(value => value + 1)}>Try again</button>
        </div>
      )}

      {status === 'ready' && (
        <div className="ot-partner-widget__footnote">
          Search and refine inside the live provider results. OptionTrip does not show duplicate filters unless the current integration returns normalized filter data we can honor.
        </div>
      )}
    </div>
  );
};

export default TravelpayoutsWidget;
