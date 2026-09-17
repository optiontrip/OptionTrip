import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TRAVEL_SERVICE_GROUPS } from '../../config/travelServices';
import { getTravelServiceLabels } from '../../config/travelServiceLabels';
import './BookingServiceMenu.css';

// Booking navigation must have one predictable destination per service.
// Direct search products open their search page. Every other product opens its
// dedicated section on the services hub instead of silently throwing the user
// into Vi and making them start over.
const serviceRoute = service => service.live && service.route
  ? service.route
  : `/services?service=${encodeURIComponent(service.id)}#${service.group || ''}`;
const groupRoute = group => `/services#${group.id}`;

const BookingServiceMenu = ({ mobile = false, onNavigate }) => {
  const { i18n } = useTranslation();
  const labels = getTravelServiceLabels(i18n.language);

  return (
    <div className={mobile ? 'booking-service-menu booking-service-menu--mobile' : 'booking-service-menu'} aria-label={labels.booking}>
      <div className="booking-service-menu__grid">
        {TRAVEL_SERVICE_GROUPS.map(group => (
          <section className="booking-service-menu__group" key={group.id} aria-labelledby={`booking-${mobile ? 'mobile-' : ''}${group.id}`}>
            <Link to={groupRoute(group)} onClick={onNavigate} className="booking-service-menu__group-link">
              <h3 id={`booking-${mobile ? 'mobile-' : ''}${group.id}`} className="booking-service-menu__title">{labels[group.id] || group.label}</h3>
              <i className="fa fa-chevron-right" aria-hidden="true" />
            </Link>
            <ul className="booking-service-menu__items">
              {group.services.map(service => {
                const route = service.live && service.route ? service.route : `/services?service=${encodeURIComponent(service.id)}#${group.id}`;
                const serviceLabel = labels[service.id] || service.label;
                return (
                  <li key={service.id}>
                    <Link to={route} onClick={onNavigate} className="booking-service-menu__link" title={serviceLabel}>
                      <span className="booking-service-menu__icon" aria-hidden="true"><i className={`fa ${service.icon}`} /></span>
                      <span className="booking-service-menu__label">{serviceLabel}</span>
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
