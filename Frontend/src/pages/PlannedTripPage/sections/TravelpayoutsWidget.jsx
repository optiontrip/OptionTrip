import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchTravelInventoryStatus } from '../../../services/travelInventoryService';
import './TravelpayoutsWidget.css';

const LOAD_TIMEOUT_MS = 10000;

const FRIENDLY_PROVIDER_NAMES = Object.freeze({
  travelpayouts_car_rental_widget: 'Live car rental partner',
  travelpayouts_tours_widget: 'Live tours partner',
  travelpayouts_esim_widget: 'Live eSIM partner',
});

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
    .replace(/_affiliate$/, '')
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

const safePartnerUrl = value => {
  try {
    const url = new URL(String(value || '').trim());
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
};

const hasRenderedWidget = container => {
  if (!container) return false;
  if (container.querySelector('iframe')) return true;
  return [...container.children].some(child => {
    if (child.tagName === 'SCRIPT' || child.tagName === 'STYLE') return false;
    return child.getBoundingClientRect().height > 0 || child.childElementCount > 0;
  });
};

const TravelpayoutsWidget = ({ src, title, vertical }) => {
  const { i18n } = useTranslation();
  const containerRef = useRef(null);
  const [status, setStatus] = useState('loading');
  const [attempt, setAttempt] = useState(0);
  const [inventory, setInventory] = useState(null);
  const [fallbackRefreshing, setFallbackRefreshing] = useState(false);
  const localizedSrc = useMemo(() => localizeWidgetUrl(src, i18n.language), [src, i18n.language]);
  const viFallback = `/travel-buddy?service=${encodeURIComponent(vertical || 'travel')}&intent=find-service`;

  useEffect(() => {
    if (!vertical) return undefined;
    let active = true;
    fetchTravelInventoryStatus().then(data => {
      if (active) setInventory(data?.[vertical] || null);
    });
    return () => { active = false; };
  }, [vertical]);

  useEffect(() => {
    if (status !== 'error' || !vertical) return undefined;
    let active = true;
    setFallbackRefreshing(true);
    fetchTravelInventoryStatus({ force: true, refreshPartners: true }).then(data => {
      if (active) setInventory(data?.[vertical] || null);
    }).finally(() => {
      if (active) setFallbackRefreshing(false);
    });
    return () => { active = false; };
  }, [status, vertical]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    setStatus('loading');
    container.innerHTML = '';

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
    const inspect = () => {
      if (!settled && hasRenderedWidget(container)) markReady();
    };

    const observer = new MutationObserver(inspect);
    observer.observe(container, { childList: true, subtree: true });

    const script = document.createElement('script');
    script.src = localizedSrc;
    script.async = true;
    script.charset = 'utf-8';
    script.setAttribute('data-optiontrip-widget', 'travelpayouts');
    script.addEventListener('load', inspect);
    script.addEventListener('error', markError, { once: true });
    container.appendChild(script);

    const followUpId = window.setTimeout(inspect, 800);
    const timeoutId = window.setTimeout(() => {
      inspect();
      if (!settled) markError();
    }, LOAD_TIMEOUT_MS);

    return () => {
      observer.disconnect();
      window.clearTimeout(followUpId);
      window.clearTimeout(timeoutId);
      script.removeEventListener('load', inspect);
      script.removeEventListener('error', markError);
      container.innerHTML = '';
    };
  }, [localizedSrc, attempt]);

  const providerLabels = useMemo(
    () => (inventory?.providers || []).map(friendlyProviderName),
    [inventory?.providers],
  );

  const fallbackOptions = useMemo(() => {
    const options = Array.isArray(inventory?.bookingOptions) ? inventory.bookingOptions : [];
    const seen = new Set();
    return options
      .map(option => ({
        provider: String(option?.provider || '').trim(),
        url: safePartnerUrl(option?.url),
      }))
      .filter(option => option.provider && option.url)
      .filter(option => {
        if (seen.has(option.provider)) return false;
        seen.add(option.provider);
        return true;
      })
      .slice(0, 6);
  }, [inventory?.bookingOptions]);

  return (
    <div className="cr-tp-widget ot-partner-widget" data-widget-status={status}>
      {title && <h3 className="cr-tp-widget__title">{title}</h3>}

      <div className="ot-partner-widget__trust" aria-label="Live booking source status">
        <span className={`ot-partner-widget__live${status === 'error' ? ' ot-partner-widget__live--error' : ''}`}>
          <span className="ot-partner-widget__dot" />
          {status === 'error' ? 'Partner search unavailable' : status === 'ready' ? 'Live partner search' : 'Connecting to live search'}
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
          <span className="ot-partner-widget__spinner" aria-hidden="true" />
          <span>Loading live booking options...</span>
        </div>
      )}

      {status === 'error' && (
        <div className="cr-tp-widget__state cr-tp-widget__state--error ot-partner-widget__state ot-partner-widget__state--error" role="alert">
          <strong>Live widget did not load.</strong>
          <span>
            {fallbackOptions.length > 0
              ? 'Compare another connected booking source below, retry the live search, or continue with Vi.'
              : fallbackRefreshing
                ? 'Checking connected partner alternatives now...'
                : 'Check your connection or try again. You can also continue with Vi instead of getting stuck here.'}
          </span>

          {fallbackOptions.length > 0 && (
            <div className="ot-partner-widget__fallbacks" aria-label="Connected booking alternatives">
              {fallbackOptions.map(option => (
                <a
                  key={option.provider}
                  href={option.url}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="ot-partner-widget__fallback-link"
                >
                  <span>{friendlyProviderName(option.provider)}</span>
                  <i className="fas fa-arrow-up-right-from-square" aria-hidden="true" />
                </a>
              ))}
            </div>
          )}

          <div className="ot-partner-widget__error-actions">
            <button type="button" onClick={() => setAttempt(value => value + 1)}>Try again</button>
            <Link to={viFallback}>Ask Vi</Link>
          </div>
        </div>
      )}

      {status === 'ready' && (
        <div className="ot-partner-widget__footnote">
          Prices and availability come from the live booking partner and can change before checkout.
        </div>
      )}
    </div>
  );
};

export default TravelpayoutsWidget;
