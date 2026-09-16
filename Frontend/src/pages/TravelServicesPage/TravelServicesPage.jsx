import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TRAVEL_SERVICE_GROUPS } from '../../config/travelServices';
import { getTravelServiceLabels } from '../../config/travelServiceLabels';
import './TravelServicesPage.css';

const viRoute = service => `/travel-buddy?service=${encodeURIComponent(service.id)}&intent=find-service`;

const COPY = {
  en: { eyebrow:'OPTIONTRIP TRAVEL SERVICES', title:'What do you need for your trip?', intro:'Choose what you want to book or arrange. If a service is not bookable directly yet, Vi will help you find the right option.', plan:'Plan my trip with Vi', trips:'My trips', trustTitle:'Clear booking, no guessing.', trust:'OptionTrip shows direct search where available. For assisted services, Vi helps you choose first instead of sending you to an unclear page.' },
  ru: { eyebrow:'СЕРВИСЫ OPTIONTRIP', title:'Что вам нужно для поездки?', intro:'Выберите, что хотите купить, забронировать или оформить. Если прямого бронирования пока нет, Vi поможет подобрать подходящий вариант.', plan:'Спланировать поездку с Vi', trips:'Мои поездки', trustTitle:'Всё понятно до перехода к бронированию.', trust:'Где доступен прямой поиск, OptionTrip сразу открывает его. Для остальных услуг Vi сначала поможет выбрать подходящий вариант.' },
  uk: { eyebrow:'СЕРВІСИ OPTIONTRIP', title:'Що вам потрібно для подорожі?', intro:'Оберіть, що хочете купити, забронювати або оформити. Якщо прямого бронювання ще немає, Vi допоможе підібрати варіант.', plan:'Спланувати подорож з Vi', trips:'Мої подорожі', trustTitle:'Зрозуміле бронювання без здогадок.', trust:'Де доступний прямий пошук, OptionTrip одразу відкриває його. Для інших послуг Vi спочатку допоможе обрати варіант.' }
};

export default function TravelServicesPage() {
  const { i18n } = useTranslation();
  const language = (i18n.language || 'en').split('-')[0];
  const labels = getTravelServiceLabels(language);
  const copy = COPY[language] || COPY.en;

  return (
    <main className="travel-services-page">
      <section className="travel-services-hero">
        <div className="container">
          <span className="travel-services-eyebrow">{copy.eyebrow}</span>
          <h1>{copy.title}</h1>
          <p>{copy.intro}</p>
          <div className="travel-services-actions">
            <Link className="nir-btn" to="/travel-buddy?intent=plan-trip">{copy.plan}</Link>
            <Link className="travel-services-secondary" to="/my-trips">{copy.trips}</Link>
          </div>
        </div>
      </section>

      <div className="container travel-services-groups">
        {TRAVEL_SERVICE_GROUPS.map(group => (
          <section className="travel-services-group" key={group.id} aria-labelledby={`services-${group.id}`}>
            <h2 id={`services-${group.id}`}>{labels[group.id] || group.label}</h2>
            <div className="travel-services-grid">
              {group.services.map(service => {
                const direct = Boolean(service.live && service.route);
                const route = direct ? service.route : viRoute(service);
                const serviceLabel = labels[service.id] || service.label;
                return (
                  <Link className="travel-service-card" to={route} key={service.id}>
                    <span className="travel-service-icon" aria-hidden="true"><i className={`fa ${service.icon}`} /></span>
                    <span className="travel-service-copy"><strong>{serviceLabel}</strong></span>
                    <span className="travel-service-status">{direct ? labels.open : labels.choose} <i className="fa fa-arrow-right" aria-hidden="true" /></span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <section className="container travel-services-trust">
        <strong>{copy.trustTitle}</strong><span>{copy.trust}</span>
      </section>
    </main>
  );
}
