import React from 'react';
import { Link } from 'react-router-dom';
import { TRAVEL_SERVICE_GROUPS } from '../../config/travelServices';

const viRoute = service => `/travel-buddy?service=${encodeURIComponent(service.id)}`;

/**
 * Shared Booking catalog. Desktop and mobile navigation must render from this
 * component so the two surfaces cannot drift apart as providers are enabled.
 * Services without a live first-party route are handed to Vi with service
 * context rather than sent to a dead page or shown with invented pricing.
 */
const BookingServiceMenu = ({ mobile = false, onNavigate }) => (
  <div className={mobile ? 'booking-service-menu booking-service-menu--mobile' : 'booking-service-menu'}>
    {TRAVEL_SERVICE_GROUPS.map(group => (
      <section className="booking-service-menu__group" key={group.id} aria-labelledby={`booking-${group.id}`}>
        <h3 id={`booking-${group.id}`} className="booking-service-menu__title">{group.label}</h3>
        <ul className="booking-service-menu__items">
          {group.services.map(service => {
            const route = service.live && service.route ? service.route : viRoute(service);
            return (
              <li key={service.id}>
                <Link to={route} onClick={onNavigate} className="booking-service-menu__link">
                  <i className={`fa ${service.icon}`} aria-hidden="true" />
                  <span>{service.label}</span>
                  {!service.live && <span className="booking-service-menu__vi">Ask Vi</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    ))}
    <Link to="/services" onClick={onNavigate} className="booking-service-menu__all">Explore all travel services</Link>
  </div>
);

export default BookingServiceMenu;
