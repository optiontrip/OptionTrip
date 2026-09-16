import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TRAVEL_SERVICE_GROUPS } from '../../config/travelServices';
import { getTravelServiceLabels } from '../../config/travelServiceLabels';
import './BookingServiceMenu.css';

const viRoute = service => `/travel-buddy?service=${encodeURIComponent(service.id)}`;

const BookingServiceMenu = ({ mobile = false, onNavigate }) => {
  const { i18n } = useTranslation();
  const labels = getTravelServiceLabels(i18n.language);

  return (
    <div className={mobile ? 'booking-service-menu booking-service-menu--mobile' : 'booking-service-menu'} aria-label={labels.booking}>
      <div className="booking-service-menu__grid">
        {TRAVEL_SERVICE_GROUPS.map(group => (
          <section className="booking-service-menu__group" key={group.id} aria-labelledby={`booking-${mobile ? 'mobile-' : ''}${group.id}`}>
            <h3 id={`booking-${mobile ? 'mobile-' : ''}${group.id}`} className="booking-service-menu__title">{labels[group.id] || group.label}</h3>
            <ul className="booking-service-menu__items">
              {group.services.map(service => {
                const route = service.live && service.route ? service.route : viRoute(service);
                const serviceLabel = labels[service.id] || service.label;
                return (
                  <li key={service.id}>
                    <Link to={route} onClick={onNavigate} className="booking-service-menu__link" title={serviceLabel}>
                      <span className="booking-service-menu__icon" aria-hidden="true"><i className={`fa ${service.icon}`} /></span>
                      <span className="booking-service-menu__label">{serviceLabel}</span>
                      {!service.live && <span className="booking-service-menu__vi" aria-label={`${serviceLabel}: ${labels.ask}`}>{labels.ask}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
      <div className="booking-service-menu__footer">
        <Link to="/services" onClick={onNavigate} className="booking-service-menu__all">
          <span>{labels.all}</span><i className="fa fa-arrow-right" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
};

export default BookingServiceMenu;
