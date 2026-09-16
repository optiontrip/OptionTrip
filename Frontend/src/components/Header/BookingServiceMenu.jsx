import React from 'react';
import { Link } from 'react-router-dom';
import { TRAVEL_SERVICE_GROUPS } from '../../config/travelServices';
import './BookingServiceMenu.css';

const viRoute = service => `/travel-buddy?service=${encodeURIComponent(service.id)}`;

/**
 * One Booking catalog for desktop, mobile, Vi and future app surfaces.
 * A service is only sent to a dedicated route when that route is live.
 * Otherwise Vi receives explicit service context, avoiding dead links and
 * invented prices while the provider integration is being activated.
 */
const BookingServiceMenu = ({ mobile = false, onNavigate }) => (
  <div
    className={mobile ? 'booking-service-menu booking-service-menu--mobile' : 'booking-service-menu'}
    aria-label="Travel booking services"
  >
    <div className="booking-service-menu__grid">
      {TRAVEL_SERVICE_GROUPS.map(group => (
        <section className="booking-service-menu__group" key={group.id} aria-labelledby={`booking-${mobile ? 'mobile-' : ''}${group.id}`}>
          <h3 id={`booking-${mobile ? 'mobile-' : ''}${group.id}`} className="booking-service-menu__title">{group.label}</h3>
          <ul className="booking-service-menu__items">
            {group.services.map(service => {
              const route = service.live && service.route ? service.route : viRoute(service);
              return (
                <li key={service.id}>
                  <Link to={route} onClick={onNavigate} className="booking-service-menu__link">
                    <span className="booking-service-menu__icon" aria-hidden="true"><i className={`fa ${service.icon}`} /></span>
                    <span className="booking-service-menu__label">{service.label}</span>
                    {!service.live && <span className="booking-service-menu__vi" aria-label={`${service.label} with Vi`}>Ask Vi</span>}
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
        <span>Explore all travel services</span><i className="fa fa-arrow-right" aria-hidden="true" />
      </Link>
    </div>
  </div>
);

export default BookingServiceMenu;
