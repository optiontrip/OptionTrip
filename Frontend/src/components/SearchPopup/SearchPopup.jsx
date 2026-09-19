import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PRIMARY_HEADER_NAV } from '../../config/headerNav';
import { TRAVEL_SERVICES, getTravelServiceDisplayLabel, getTravelServiceRoute } from '../../config/travelServices';
import { getHeaderUiLabels } from '../../config/headerUiLabels';
import { getTravelServiceLabels } from '../../config/travelServiceLabels';
import './SearchPopup.css';

const KEYWORDS = {
  flights: ['flight', 'flights', 'airfare', 'air ticket', 'plane', 'авиа', 'авиабилет', 'рейс'],
  stays: ['hotel', 'hotels', 'stay', 'stays', 'accommodation', 'отель', 'гостиниц'],
  cars: ['car', 'cars', 'rental car', 'car rental', 'rent a car', 'авто', 'машин'],
  activities: ['tour', 'tours', 'activity', 'activities', 'ticket', 'tickets', 'экскурс', 'тур'],
  esim: ['esim', 'sim', 'mobile data', 'internet', 'интернет', 'сим'],
  food: ['food', 'dining', 'restaurant', 'restaurants', 'eat', 'where to eat', 'еда', 'ресторан', 'кафе'],
  rail: ['train', 'trains', 'rail', 'поезд'],
  bus: ['bus', 'buses', 'coach', 'автобус'],
  ferries: ['ferry', 'ferries', 'ship', 'паром'],
  transfers: ['transfer', 'airport transfer', 'taxi', 'shuttle', 'трансфер'],
  bikes: ['bike', 'bikes', 'bicycle', 'scooter', 'велосипед', 'самокат'],
  insurance: ['insurance', 'travel insurance', 'страхов'],
  visa: ['visa', 'entry', 'passport', 'виз', 'въезд', 'паспорт'],
  city_passes: ['city pass', 'city passes', 'tourist card', 'проездн', 'туристическ'],
  luggage_storage: ['luggage', 'storage', 'bag storage', 'багаж', 'камер'],
  flight_compensation: ['compensation', 'flight delay', 'cancelled flight', 'компенсац'],
  plan_day: ['plan my day', 'day plan', 'itinerary', 'маршрут на день', 'спланировать день'],
  where_go: ['where can i go', 'where to go', 'куда поехать', 'куда можно'],
  destinations: ['destination', 'destinations', 'places', 'ideas', 'направлен', 'куда'],
};

const normalize = value => (value || '').trim().toLocaleLowerCase();

const SearchPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const languageCode = (i18n.language || 'en').split('-')[0];
  const uiLabels = getHeaderUiLabels(languageCode);
  const serviceLabels = getTravelServiceLabels(languageCode);

  const searchItems = useMemo(() => {
    const primary = PRIMARY_HEADER_NAV.map(item => ({
      id: item.id,
      label: item.serviceLabel ? (serviceLabels[item.serviceLabel] || item.fallback) : (uiLabels[item.headerLabel || item.id] || item.fallback),
      route: item.to || item.href,
      icon: item.id === 'blog' ? 'fa-newspaper' : item.id === 'about' ? 'fa-circle-info' : item.id === 'home' ? 'fa-house' : 'fa-compass',
      external: Boolean(item.href),
      keywords: [],
    }));

    const services = TRAVEL_SERVICES.map(service => ({
      id: service.id,
      label: getTravelServiceDisplayLabel(service, languageCode, serviceLabels),
      route: getTravelServiceRoute(service, service.group),
      icon: service.icon,
      external: false,
      keywords: KEYWORDS[service.id] || [],
    }));

    return [...primary, ...services].filter((item, index, all) =>
      all.findIndex(other => other.route === item.route && other.label === item.label) === index
    );
  }, [languageCode, serviceLabels, uiLabels]);

  const matches = useMemo(() => {
    const q = normalize(searchQuery);
    if (!q) return searchItems.slice(0, 8);
    return searchItems
      .map(item => {
        const label = normalize(item.label);
        const keywordHit = item.keywords.some(keyword => q.includes(normalize(keyword)) || normalize(keyword).includes(q));
        const score = label === q ? 100 : label.startsWith(q) ? 80 : label.includes(q) ? 60 : keywordHit ? 50 : 0;
        return { ...item, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [searchItems, searchQuery]);

  useEffect(() => {
    const handleClick = event => {
      if (event.target.closest('a[href="#search1"]')) {
        event.preventDefault();
        setIsOpen(true);
      } else if (event.target.closest('#search1 button.close') || (event.target.id === 'search1' && event.target === event.currentTarget)) {
        setIsOpen(false);
      }
    };

    const handleKeyUp = event => {
      if (event.key === 'Escape' && isOpen) setIsOpen(false);
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 40);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const goTo = item => {
    setIsOpen(false);
    setSearchQuery('');
    if (item.external) {
      window.open(item.route, '_blank', 'noopener,noreferrer');
      return;
    }
    navigate(item.route);
  };

  const askVi = query => {
    setIsOpen(false);
    setSearchQuery('');

    const viButton = document.querySelector('.vi-button');
    if (viButton && !viButton.classList.contains('active')) viButton.click();

    window.setTimeout(() => {
      const textarea = document.querySelector('.vi-input');
      if (!textarea) {
        navigate(`/travel-buddy?query=${encodeURIComponent(query)}`);
        return;
      }

      const descriptor = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value');
      descriptor?.set?.call(textarea, query);
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.focus();

      window.setTimeout(() => {
        const sendButton = document.querySelector('.vi-send-btn');
        if (sendButton && !sendButton.disabled) sendButton.click();
      }, 80);
    }, 120);
  };

  const handleSubmit = event => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    const exact = matches[0];
    if (exact && exact.score >= 50) {
      goTo(exact);
      return;
    }

    askVi(query);
  };

  return (
    <div id="search1" className={isOpen ? 'open' : ''} role="dialog" aria-modal="true" aria-label={uiLabels.search}>
      <button type="button" className="close" aria-label={uiLabels.close}>×</button>
      <div className="global-search-shell">
        <form onSubmit={handleSubmit}>
          <div className="global-search-input-wrap">
            <i className="fa fa-search" aria-hidden="true" />
            <input
              ref={inputRef}
              type="search"
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              placeholder={`${uiLabels.search} OptionTrip`}
              autoComplete="off"
            />
          </div>
          <button type="submit" className="btn btn-primary">{uiLabels.search}</button>
        </form>

        <div className="global-search-results" aria-live="polite">
          {matches.map(item => (
            <button type="button" className="global-search-result" key={`${item.id}-${item.route}`} onClick={() => goTo(item)}>
              <span className="global-search-result__icon"><i className={`fa ${item.icon || 'fa-compass'}`} aria-hidden="true" /></span>
              <span>{item.label}</span>
              <i className="fa fa-arrow-right global-search-result__arrow" aria-hidden="true" />
            </button>
          ))}

          {searchQuery.trim() && matches.length === 0 && (
            <button type="button" className="global-search-result global-search-result--vi" onClick={() => askVi(searchQuery.trim())}>
              <span className="global-search-result__icon">Vi</span>
              <span>{serviceLabels.ask}: {searchQuery.trim()}</span>
              <i className="fa fa-arrow-right global-search-result__arrow" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPopup;
