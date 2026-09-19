import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TRAVEL_SERVICE_GROUPS, getTravelServiceDisplayLabel } from '../../config/travelServices';
import { getTravelServiceLabels } from '../../config/travelServiceLabels';
import { fetchTravelInventoryStatus, getInventoryStateForService } from '../../services/travelInventoryService';
import './TravelEcosystemSection.css';

const COPY = {
  en: {
    eyebrow: 'One trip. One connected place.',
    title: 'Book your trip without starting over',
    intro: 'Choose a service once. OptionTrip keeps your choice visible while you search, compare real booking options and continue to the final provider only when you are ready.',
    all: 'Explore all travel services',
    group: {
      book: 'Search and book the core parts of your trip.',
      move: 'Connect airports, cities, stations and the last mile.',
      prepare: 'Handle the practical things that make travel easier.',
      help: 'Use Vi and OptionTrip tools before, during and after the trip.',
    },
    direct: 'Search & book',
    compare: 'Compare booking options',
    guided: 'Continue in OptionTrip',
    viLead: 'Need help planning the whole trip?',
    viCopy: 'Use Vi for planning. For a specific booking, choose the service above and OptionTrip will keep you in that flow.',
    viButton: 'Plan with Vi',
  },
  ru: {
    eyebrow: 'Одна поездка. Все в одном месте.',
    title: 'Бронируйте поездку, не начиная каждый раз заново',
    intro: 'Выберите услугу один раз. OptionTrip сохраняет ваш выбор, помогает искать и сравнивать реальные варианты, а к партнеру переводит только на финальном шаге бронирования.',
    all: 'Все сервисы для путешествий',
    group: {
      book: 'Найдите и забронируйте основные части поездки.',
      move: 'Соедините аэропорты, города, вокзалы и последний участок пути.',
      prepare: 'Подготовьте все практические детали поездки.',
      help: 'Используйте Vi и инструменты OptionTrip до, во время и после поездки.',
    },
    direct: 'Найти и забронировать',
    compare: 'Сравнить варианты бронирования',
    guided: 'Продолжить в OptionTrip',
    viLead: 'Нужна помощь со всей поездкой?',
    viCopy: 'Используйте Vi для планирования. Для конкретного бронирования выберите сервис выше, и OptionTrip сохранит контекст поездки.',
    viButton: 'Спланировать с Vi',
  },
  uk: {
    eyebrow: 'Одна подорож. Усе в одному місці.',
    title: 'Бронюйте подорож, не починаючи щоразу спочатку',
    intro: 'Оберіть послугу один раз. OptionTrip зберігає ваш вибір, допомагає шукати й порівнювати реальні варіанти та переводить до партнера лише на фінальному кроці бронювання.',
    all: 'Усі сервіси для подорожей',
    group: {
      book: 'Знайдіть і забронюйте основні частини подорожі.',
      move: 'Поєднайте аеропорти, міста, вокзали та останню ділянку маршруту.',
      prepare: 'Підготуйте практичні деталі подорожі.',
      help: 'Використовуйте Vi та інструменти OptionTrip до, під час і після подорожі.',
    },
    direct: 'Знайти й забронювати',
    compare: 'Порівняти варіанти бронювання',
    guided: 'Продовжити в OptionTrip',
    viLead: 'Потрібна допомога з усією подорожжю?',
    viCopy: 'Використовуйте Vi для планування. Для конкретного бронювання оберіть сервіс вище, і OptionTrip збереже контекст подорожі.',
    viButton: 'Спланувати з Vi',
  },
};

const statusCopy = (state, copy) => {
  if (state.direct) return copy.direct;
  if (state.external && state.bookingUrl) return copy.compare;
  return copy.guided;
};

const serviceHubRoute = (service, groupId) =>
  `/services?service=${encodeURIComponent(service.id)}#${groupId}`;

const ServiceCard = ({ service, state, groupId, label, copy }) => {
  const content = (
    <>
      <span className="tes__service-icon" aria-hidden="true">
        <i className={`fa ${service.icon}`} />
      </span>
      <span className="tes__service-copy">
        <strong>{label}</strong>
        <small>{statusCopy(state, copy)}</small>
      </span>
      <i className="fa fa-chevron-right tes__chevron" aria-hidden="true" />
    </>
  );

  if (state.direct && service.route) {
    return <Link to={service.route} className="tes__service">{content}</Link>;
  }

  // Partner-backed services stay inside OptionTrip first. The service hub shows
  // every currently configured booking provider, so the traveler can compare
  // the real handoff options instead of being thrown to the first affiliate.
  return (
    <Link
      to={serviceHubRoute(service, groupId)}
      className={`tes__service${state.external && state.bookingUrl ? ' tes__service--partner' : ''}`}
      data-provider={state.primaryProvider || undefined}
    >
      {content}
    </Link>
  );
};

const TravelEcosystemSection = () => {
  const { i18n } = useTranslation();
  const language = (i18n.language || 'en').split('-')[0];
  const labels = getTravelServiceLabels(language);
  const copy = COPY[language] || COPY.en;
  const [inventory, setInventory] = useState({});
  const [openMobileGroups, setOpenMobileGroups] = useState(() => new Set(['book']));

  useEffect(() => {
    let active = true;
    fetchTravelInventoryStatus({ force: true }).then(data => {
      if (active) setInventory(data);
    });
    return () => { active = false; };
  }, []);

  const serviceLabel = service => getTravelServiceDisplayLabel(service, language, labels);
  const toggleMobileGroup = groupId => {
    setOpenMobileGroups(current => {
      const next = new Set(current);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  return (
    <section className="tes" aria-labelledby="tes-title">
      <div className="container">
        <div className="tes__hero">
          <div>
            <span className="tes__eyebrow">{copy.eyebrow}</span>
            <h2 id="tes-title">{copy.title}</h2>
            <p>{copy.intro}</p>
          </div>
          <Link to="/services" className="tes__all-link">
            {labels.all || copy.all} <i className="fa fa-arrow-right" aria-hidden="true" />
          </Link>
        </div>

        <div className="tes__groups">
          {TRAVEL_SERVICE_GROUPS.map(group => {
            const isOpenMobile = openMobileGroups.has(group.id);
            return (
              <section
                className={`tes__group ${isOpenMobile ? 'tes__group--mobile-open' : 'tes__group--mobile-collapsed'}`}
                key={group.id}
                id={`home-services-${group.id}`}
              >
                <div className="tes__group-head">
                  <button
                    type="button"
                    className="tes__group-toggle"
                    aria-expanded={isOpenMobile}
                    aria-controls={`tes-services-${group.id}`}
                    onClick={() => toggleMobileGroup(group.id)}
                  >
                    <span className="tes__group-toggle-copy">
                      <span className="tes__group-title">{labels[group.id] || group.label}</span>
                      <span className="tes__group-summary">{copy.group[group.id] || copy.guided}</span>
                    </span>
                    <i className={`fa fa-chevron-down ${isOpenMobile ? 'is-open' : ''}`} aria-hidden="true" />
                  </button>

                  <div className="tes__group-head-desktop">
                    <div>
                      <h3>{labels[group.id] || group.label}</h3>
                      <p>{copy.group[group.id] || copy.guided}</p>
                    </div>
                    <Link to={`/services#${group.id}`} className="tes__group-link" aria-label={`${copy.all}: ${labels[group.id] || group.label}`}>
                      <i className="fa fa-arrow-right" aria-hidden="true" />
                    </Link>
                  </div>
                </div>

                <div id={`tes-services-${group.id}`} className="tes__service-grid">
                  {group.services.map(service => {
                    const state = getInventoryStateForService(service, inventory);
                    return (
                      <ServiceCard
                        key={service.id}
                        service={service}
                        state={state}
                        groupId={group.id}
                        label={serviceLabel(service)}
                        copy={copy}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <div className="tes__vi-card">
          <div className="tes__vi-icon" aria-hidden="true"><i className="fa fa-comments" /></div>
          <div className="tes__vi-copy">
            <span>{copy.viLead}</span>
            <strong>{copy.viCopy}</strong>
          </div>
          <Link to="/travel-buddy?intent=plan-trip" className="tes__vi-button">{copy.viButton}</Link>
        </div>
      </div>
    </section>
  );
};

export default TravelEcosystemSection;
