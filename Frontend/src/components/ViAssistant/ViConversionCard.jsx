import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './ViConversionCard.css';

const COPY = {
  en: { eyebrow: 'OptionTrip service', continue: 'Continue in OptionTrip', explore: 'Explore in OptionTrip' },
  ru: { eyebrow: 'Сервис OptionTrip', continue: 'Продолжить в OptionTrip', explore: 'Открыть в OptionTrip' },
  uk: { eyebrow: 'Сервіс OptionTrip', continue: 'Продовжити в OptionTrip', explore: 'Відкрити в OptionTrip' },
};

const ICONS = Object.freeze({
  rail: 'fa-train',
  bus: 'fa-bus',
  ferries: 'fa-ship',
  transfers: 'fa-taxi',
  city_passes: 'fa-ticket',
  insurance: 'fa-shield-halved',
  luggage_storage: 'fa-suitcase',
  food: 'fa-utensils',
  flight_compensation: 'fa-plane-circle-exclamation',
  cars: 'fa-car',
  activities: 'fa-map-location-dot',
  tours: 'fa-map-location-dot',
  esim: 'fa-sim-card',
});

const safeInternalHref = value => {
  const href = String(value || '').trim();
  if (!href.startsWith('/') || href.startsWith('//') || /[\r\n]/.test(href)) return null;
  return href;
};

const routeContext = conversion => {
  const origin = conversion?.context?.origin;
  const destination = conversion?.context?.destination;
  if (origin && destination) return `${origin} → ${destination}`;
  return destination || origin || '';
};

export default function ViConversionCard({ conversion }) {
  const { i18n } = useTranslation();
  const language = String(i18n.language || 'en').split('-')[0];
  const copy = COPY[language] || COPY.en;
  const href = safeInternalHref(conversion?.href);
  if (!conversion || !href) return null;

  const context = routeContext(conversion);
  const icon = ICONS[conversion.vertical] || 'fa-compass';
  const buttonLabel = conversion.actionable ? copy.continue : copy.explore;

  return (
    <aside className="vi-conversion-card" aria-label={conversion.label || copy.eyebrow}>
      <div className="vi-conversion-card__icon" aria-hidden="true">
        <i className={`fas ${icon}`} />
      </div>
      <div className="vi-conversion-card__body">
        <span className="vi-conversion-card__eyebrow">{copy.eyebrow}</span>
        <strong>{conversion.label || 'Travel service'}</strong>
        {context && <small>{context}</small>}
      </div>
      <Link className="vi-conversion-card__cta" to={href}>
        <span>{buttonLabel}</span>
        <i className="fas fa-arrow-right" aria-hidden="true" />
      </Link>
    </aside>
  );
}
