import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageMeta from '../../hooks/usePageMeta';
import { TRAVEL_SERVICE_GROUPS, TRAVEL_SERVICES, getTravelServiceDisplayLabel } from '../../config/travelServices';
import { getTravelServiceLabels } from '../../config/travelServiceLabels';
import { fetchTravelInventoryStatus, getInventoryStateForService } from '../../services/travelInventoryService';
import './TravelServicesPage.css';

const viRoute = service => `/travel-buddy?service=${encodeURIComponent(service.id)}&intent=find-service&returnTo=${encodeURIComponent(`/services?service=${service.id}`)}`;
const serviceHubRoute = (service, groupId = service?.group || '') => `/services?service=${encodeURIComponent(service?.id || '')}#${groupId}`;

const COPY = {
  en: {
    eyebrow: 'OPTIONTRIP TRAVEL SERVICES', title: 'What do you need for your trip?', intro: 'Choose one service and continue from the same place. OptionTrip keeps your selection visible and never makes you start the booking flow again.',
    plan: 'Plan my whole trip with Vi', trips: 'My trips', trustTitle: 'One choice. One clear next step.', trust: 'Direct services open their OptionTrip search. Partner services let you compare live booking partners here first, then hand you off only for the final booking step.',
    direct: 'Search & book', partner: 'Compare partners', guided: 'Continue with Vi', checking: 'Checking live partners…', selected: 'You selected', selectedIntro: 'Continue with this service. You will not be sent back to the beginning.', change: 'Choose another service',
    compareTitle: 'Compare live booking partners', compareIntro: 'These partner links are available right now. Choose the provider you want only when you are ready to continue booking.', openPartner: 'Continue to provider',
  },
  ru: {
    eyebrow: 'Сервисы OptionTrip', title: 'Что вам нужно для поездки?', intro: 'Выберите один сервис и продолжайте с этого же места. OptionTrip сохраняет ваш выбор и больше не заставляет начинать бронирование заново.',
    plan: 'Спланировать всю поездку с Vi', trips: 'Мои поездки', trustTitle: 'Один выбор - один понятный следующий шаг.', trust: 'Собственные сервисы открывают поиск OptionTrip. Для партнерских услуг сначала можно сравнить доступные варианты здесь и только затем перейти к партнеру для финального бронирования.',
    direct: 'Найти и забронировать', partner: 'Сравнить партнеров', guided: 'Продолжить с Vi', checking: 'Проверяем доступных партнеров…', selected: 'Вы выбрали', selectedIntro: 'Продолжайте с этой услугой. Возвращаться к началу больше не нужно.', change: 'Выбрать другую услугу',
    compareTitle: 'Сравните доступных партнеров', compareIntro: 'Здесь показаны партнеры, у которых сейчас настроен рабочий переход к бронированию. Выберите нужного только когда будете готовы продолжить.', openPartner: 'Перейти к партнеру',
  },
  uk: {
    eyebrow: 'Сервіси OptionTrip', title: 'Що вам потрібно для подорожі?', intro: 'Оберіть один сервіс і продовжуйте з цього ж місця. OptionTrip зберігає ваш вибір і не змушує починати бронювання знову.',
    plan: 'Спланувати всю подорож з Vi', trips: 'Мої подорожі', trustTitle: 'Один вибір - один зрозумілий наступний крок.', trust: 'Власні сервіси відкривають пошук OptionTrip. Для партнерських послуг спочатку можна порівняти доступні варіанти тут і лише потім перейти до партнера для фінального бронювання.',
    direct: 'Знайти й забронювати', partner: 'Порівняти партнерів', guided: 'Продовжити з Vi', checking: 'Перевіряємо доступних партнерів…', selected: 'Ви обрали', selectedIntro: 'Продовжуйте з цією послугою. Повертатися на початок більше не потрібно.', change: 'Обрати іншу послугу',
    compareTitle: 'Порівняйте доступних партнерів', compareIntro: 'Тут показані партнери, для яких зараз доступний робочий перехід до бронювання. Оберіть потрібного, коли будете готові продовжити.', openPartner: 'Перейти до партнера',
  },
};

const PROVIDER_LABELS = {
  travelpayouts: 'Travelpayouts',
  travelpayouts_tours_widget: 'Travelpayouts',
  travelpayouts_car_rental_widget: 'Travelpayouts',
  travelpayouts_esim_widget: 'Travelpayouts',
  trip_com: 'Trip.com',
  tiqets_affiliate: 'Tiqets',
  klook: 'Klook',
  go_city: 'Go City',
  wegotrip_affiliate: 'WeGoTrip',
  kkday: 'KKday',
  bikesbooking: 'BikesBooking.com',
  twelve_go: '12Go',
  qeeq: 'QEEQ',
  economybookings: 'EconomyBookings',
  localrent: 'Localrent',
  getrentacar: 'GetRentacar.com',
  autoeurope: 'Auto Europe',
  yesim: 'Yesim',
  airalo_affiliate: 'Airalo',
  drimsim: 'Drimsim',
  saily: 'Saily',
  airhelp: 'AirHelp',
  compensair: 'Compensair',
  insubuy: 'Insubuy',
  radical_storage: 'Radical Storage',
  gettransfer_affiliate: 'GetTransfer.com',
  kiwitaxi: 'Kiwitaxi',
  welcome_pickups: 'Welcome Pickups',
};

const providerLabel = provider => PROVIDER_LABELS[provider] || String(provider || 'Booking partner')
  .replace(/_affiliate|_widget/g, '')
  .split('_')
  .filter(Boolean)
  .map(part => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ');

const statusLabel = (state, copy, loading = false) => {
  if (state?.direct) return copy.direct;
  if (loading) return copy.checking;
  if (state?.external && state?.bookingUrl) return copy.partner;
  return copy.guided;
};

const safeBookingOptions = vertical => Array.isArray(vertical?.bookingOptions)
  ? vertical.bookingOptions.filter(option => /^https:\/\//i.test(String(option?.url || '')))
  : [];

export default function TravelServicesPage() {
  const { i18n } = useTranslation();
  const location = useLocation();
  const language = (i18n.language || 'en').split('-')[0];
  const labels = getTravelServiceLabels(language);
  const copy = COPY[language] || COPY.en;
  const [inventory, setInventory] = useState({});
  const [inventoryLoading, setInventoryLoading] = useState(true);

  const selectedId = useMemo(() => new URLSearchParams(location.search).get('service'), [location.search]);
  const selectedService = TRAVEL_SERVICES.find(service => service.id === selectedId);
  const [openMobileGroups, setOpenMobileGroups] = useState(() => new Set(['book']));

  useEffect(() => {
    let active = true;
    setInventoryLoading(true);
    fetchTravelInventoryStatus({ force: true, refreshPartners: true }).then(data => {
      if (!active) return;
      setInventory(data);
      setInventoryLoading(false);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const requestedGroup = selectedService?.group || (location.hash ? location.hash.slice(1) : null);
    if (requestedGroup && TRAVEL_SERVICE_GROUPS.some(group => group.id === requestedGroup)) {
      setOpenMobileGroups(current => new Set([...current, requestedGroup]));
    }

    if (selectedService) {
      setTimeout(() => document.getElementById('selected-travel-service')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
      return;
    }
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
    }
  }, [location.hash, selectedService]);

  const selectedState = selectedService ? getInventoryStateForService(selectedService, inventory) : null;
  const selectedVertical = selectedService?.inventoryVertical ? inventory[selectedService.inventoryVertical] : null;
  const selectedBookingOptions = safeBookingOptions(selectedVertical);
  const selectedNeedsInventory = Boolean(selectedService?.inventoryVertical && !selectedState?.direct);
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
    <main className="travel-services-page">
      <PageMeta
        title="Travel Services - Flights, Hotels, Cars, Tours and More"
        description="Explore OptionTrip travel services for flights, stays, car rental, tours, eSIM, trains, buses, transfers, insurance, luggage storage, dining and more with Travel Partner Vi."
        keywords="travel services, flights, hotels, car rental, tours, esim, trains, buses, airport transfers, travel insurance, dining, OptionTrip"
        path="/services"
      />

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

      {selectedService && (
        <section id="selected-travel-service" className="container travel-services-selected" aria-live="polite">
          <div className="travel-services-selected__icon"><i className={`fa ${selectedService.icon}`} aria-hidden="true" /></div>
          <div className="travel-services-selected__copy">
            <span>{copy.selected}</span>
            <h2>{serviceLabel(selectedService)}</h2>
            <p>{copy.selectedIntro}</p>
          </div>

          {selectedState?.direct && selectedService.route && (
            <Link to={selectedService.route} className="nir-btn travel-services-selected__cta">
              {copy.direct} <i className="fa fa-arrow-right" aria-hidden="true" />
            </Link>
          )}

          {inventoryLoading && selectedNeedsInventory && (
            <div className="travel-services-selected__checking" role="status">
              <span className="travel-services-selected__spinner" aria-hidden="true" />
              <span>{copy.checking}</span>
            </div>
          )}

          {!inventoryLoading && !selectedState?.direct && selectedBookingOptions.length === 0 && (
            <Link to={viRoute(selectedService)} className="nir-btn travel-services-selected__cta">
              {copy.guided} <i className="fa fa-arrow-right" aria-hidden="true" />
            </Link>
          )}

          {!inventoryLoading && selectedBookingOptions.length > 0 && (
            <div className="travel-services-selected__providers">
              <div className="travel-services-selected__providers-head">
                <strong>{copy.compareTitle}</strong>
                <span>{copy.compareIntro}</span>
              </div>
              <div className="travel-services-provider-grid">
                {selectedBookingOptions.map(option => (
                  <a
                    key={`${option.provider}:${option.url}`}
                    href={option.url}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="travel-services-provider"
                    data-provider={option.provider || undefined}
                  >
                    <span className="travel-services-provider__mark" aria-hidden="true">
                      {providerLabel(option.provider).slice(0, 1)}
                    </span>
                    <span className="travel-services-provider__copy">
                      <strong>{providerLabel(option.provider)}</strong>
                      <small>{copy.openPartner}</small>
                    </span>
                    <i className="fa fa-external-link-alt" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          )}

          <a className="travel-services-selected__change" href="#all-services">{copy.change}</a>
        </section>
      )}

      <div id="all-services" className="container travel-services-groups">
        {TRAVEL_SERVICE_GROUPS.map(group => {
          const isOpenMobile = openMobileGroups.has(group.id);
          return (
            <section
              className={`travel-services-group ${isOpenMobile ? 'travel-services-group--mobile-open' : 'travel-services-group--mobile-collapsed'}`}
              id={group.id}
              key={group.id}
              aria-labelledby={`services-${group.id}`}
            >
              <h2 id={`services-${group.id}`} className="travel-services-group__desktop-title">{labels[group.id] || group.label}</h2>
              <button
                type="button"
                className="travel-services-group__mobile-toggle"
                aria-expanded={isOpenMobile}
                aria-controls={`services-grid-${group.id}`}
                onClick={() => toggleMobileGroup(group.id)}
              >
                <span>{labels[group.id] || group.label}</span>
                <span className="travel-services-group__count">{group.services.length}</span>
                <i className={`fa fa-chevron-down ${isOpenMobile ? 'is-open' : ''}`} aria-hidden="true" />
              </button>

              <div className="travel-services-grid" id={`services-grid-${group.id}`}>
                {group.services.map(service => {
                  const state = getInventoryStateForService(service, inventory);
                  const target = state.direct && service.route ? service.route : serviceHubRoute(service, group.id);
                  const checkingService = inventoryLoading && Boolean(service.inventoryVertical) && !state.direct;
                  return (
                    <Link
                      key={service.id}
                      to={target}
                      className={`travel-service-card${selectedId === service.id ? ' travel-service-card--selected' : ''}`}
                    >
                      <span className="travel-service-icon" aria-hidden="true"><i className={`fa ${service.icon}`} /></span>
                      <span className="travel-service-copy"><strong>{serviceLabel(service)}</strong></span>
                      <span className="travel-service-status">{statusLabel(state, copy, checkingService)} <i className="fa fa-arrow-right" aria-hidden="true" /></span>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <section className="container travel-services-trust">
        <strong>{copy.trustTitle}</strong>
        <span>{copy.trust}</span>
      </section>
    </main>
  );
}
