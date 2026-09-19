import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const SERVICE_NAMES = Object.freeze({
  en: {
    rail: 'train tickets', bus: 'bus tickets', ferries: 'ferries', transfers: 'airport transfers',
    city_passes: 'city passes', insurance: 'travel insurance', luggage_storage: 'luggage storage',
    flight_compensation: 'flight compensation', bikes: 'bike rental', scooters: 'scooter rental',
    food: 'food and dining experiences', visa: 'visa help', activities: 'activities and tours',
  },
  ru: {
    rail: 'билеты на поезд', bus: 'автобусные билеты', ferries: 'паромы', transfers: 'трансфер из аэропорта',
    city_passes: 'туристические карты города', insurance: 'страхование путешествия', luggage_storage: 'хранение багажа',
    flight_compensation: 'компенсацию за задержку или отмену рейса', bikes: 'аренду велосипеда', scooters: 'аренду скутера',
    food: 'гастрономические впечатления и рестораны', visa: 'визовые вопросы', activities: 'экскурсии и развлечения',
  },
  uk: {
    rail: 'квитки на потяг', bus: 'автобусні квитки', ferries: 'пороми', transfers: 'трансфер з аеропорту',
    city_passes: 'туристичні картки міста', insurance: 'страхування подорожі', luggage_storage: 'зберігання багажу',
    flight_compensation: 'компенсацію за затримку або скасування рейсу', bikes: 'оренду велосипеда', scooters: 'оренду скутера',
    food: 'гастрономічні враження та ресторани', visa: 'візові питання', activities: 'екскурсії та розваги',
  },
});

const buildPrompt = (service, language) => {
  const locale = SERVICE_NAMES[language] ? language : 'en';
  const label = SERVICE_NAMES[locale][service] || service.replace(/_/g, ' ');
  if (locale === 'ru') return `Помоги мне найти ${label} для моей текущей поездки.`;
  if (locale === 'uk') return `Допоможи мені знайти ${label} для моєї поточної подорожі.`;
  return `Help me find ${label} for my current trip.`;
};

export default function ViRouteIntentBridge() {
  const location = useLocation();
  const { i18n } = useTranslation();
  const lastIntentRef = useRef('');

  useEffect(() => {
    if (location.pathname !== '/travel-buddy') return undefined;

    const params = new URLSearchParams(location.search);
    if (params.get('intent') !== 'find-service') return undefined;

    const service = String(params.get('service') || '').trim();
    if (!service) return undefined;

    const signature = `${service}:${location.search}`;
    if (lastIntentRef.current === signature) return undefined;
    lastIntentRef.current = signature;

    const language = (i18n.language || 'en').split('-')[0];
    const message = buildPrompt(service, language);
    const timer = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('vi:open', {
        detail: {
          message,
          service,
          returnTo: params.get('returnTo') || null,
          source: 'service-fallback',
        },
      }));
    }, 80);

    return () => window.clearTimeout(timer);
  }, [location.pathname, location.search, i18n.language]);

  return null;
}
