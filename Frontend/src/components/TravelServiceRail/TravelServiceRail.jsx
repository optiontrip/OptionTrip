import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TRAVEL_SERVICES, getTravelServiceDisplayLabel } from '../../config/travelServices';
import { getTravelServiceLabels } from '../../config/travelServiceLabels';
import { getHeaderUiLabels } from '../../config/headerUiLabels';
import { fetchTravelInventoryStatus, getInventoryStateForService } from '../../services/travelInventoryService';
import { useLocale } from '../../contexts/LocaleContext';
import './TravelServiceRail.css';

const viRoute = service => `/travel-buddy?service=${encodeURIComponent(service.id)}&intent=find-service`;
const serviceHubRoute = service => `/services?service=${encodeURIComponent(service.id)}#${service.group || ''}`;

const PRIORITY_IDS = [
  'flights', 'stays', 'cars', 'activities', 'rail', 'bus', 'transfers',
  'esim', 'insurance', 'visa', 'luggage_storage', 'flight_compensation'
];

const TravelServiceRail = () => {
  const location = useLocation();
  const { i18n } = useTranslation();
  const { currency, setCurrency, CURRENCIES } = useLocale();
  const [inventory, setInventory] = useState({});
  const language = (i18n.language || 'en').split('-')[0];
  const serviceLabels = getTravelServiceLabels(language);
  const headerLabels = getHeaderUiLabels(language);
  const services = PRIORITY_IDS
    .map(id => TRAVEL_SERVICES.find(service => service.id === id))
    .filter(Boolean);

  useEffect(() => {
    let active = true;
    fetchTravelInventoryStatus().then(data => {
      if (active) setInventory(data);
    });
    return () => { active = false; };
  }, []);

  const handleCurrencyChange = (event) => {
    const next = CURRENCIES.find(item => item.code === event.target.value);
    if (next) setCurrency(next);
  };

  const renderServiceItem = (service) => {
    const state = getInventoryStateForService(service, inventory);
    const isActive = service.route
      ? location.pathname === service.route
      : location.pathname === '/services' && new URLSearchParams(location.search).get('service') === service.id;
    const badge = state.direct ? null : state.external && state.bookingUrl ? 'Live' : 'Vi';
    const label = getTravelServiceDisplayLabel(service, language, serviceLabels);
    const content = (
      <>
        <i className={`fa ${service.icon}`} aria-hidden="true" />
        <span>{label}</span>
        {badge && <em>{badge}</em>}
      </>
    );
    const className = `tsr__item${isActive ? ' tsr__item--active' : ''}`;

    if (state.direct && service.route) {
      return (
        <Link role="listitem" key={service.id} to={service.route} className={className} title={label}>
          {content}
        </Link>
      );
    }

    if (state.external && state.bookingUrl) {
      return (
        <Link
          role="listitem"
          key={service.id}
          to={serviceHubRoute(service)}
          className={`${className} tsr__item--partner`}
          title={`${label} - compare live booking partners`}
        >
          {content}
        </Link>
      );
    }

    return (
      <Link role="listitem" key={service.id} to={viRoute(service)} className={className} title={label}>
        {content}
      </Link>
    );
  };

  return (
    <nav className="tsr" aria-label={serviceLabels.all || 'Travel services'}>
      <div className="container tsr__inner">
        <Link to="/services" className="tsr__brand" aria-label={serviceLabels.all || 'Open all travel services'}>
          <span className="tsr__brand-mark"><i className="fa fa-compass" aria-hidden="true" /></span>
          <span className="tsr__brand-copy">
            <strong>{serviceLabels.booking || 'Booking'}</strong>
            <small>{serviceLabels.all || 'All services'}</small>
          </span>
        </Link>

        <div className="tsr__scroll" role="list">
          {services.map(renderServiceItem)}
        </div>

        <div className="tsr__actions">
          <label className="tsr__currency" title={headerLabels.currency}>
            <span className="tsr__currency-icon" aria-hidden="true">💱</span>
            <span className="tsr__currency-copy">
              <small>{headerLabels.currency}</small>
              <strong>{currency.code}</strong>
            </span>
            <select
              aria-label={headerLabels.currency}
              value={currency.code}
              onChange={handleCurrencyChange}
            >
              {CURRENCIES.map(item => (
                <option key={item.code} value={item.code}>
                  {item.code} {item.symbol} - {item.name}
                </option>
              ))}
            </select>
          </label>

          <Link to="/travel-buddy" className="tsr__vi" aria-label={serviceLabels.ask || 'Ask Vi'}>
            <i className="fa fa-comments" aria-hidden="true" />
            <span>{serviceLabels.ask || 'Ask Vi'}</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default TravelServiceRail;
