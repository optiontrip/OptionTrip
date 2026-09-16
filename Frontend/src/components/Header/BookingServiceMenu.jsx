import React from 'react';
import { Link } from 'react-router-dom';
import { TRAVEL_SERVICE_GROUPS } from '../../config/travelServices';
import './BookingServiceMenu.css';

const viRoute = service => `/travel-buddy?service=${encodeURIComponent(service.id)}`;

/**
 * Shared Booking catalog for desktop and mobile navigation.
 * One taxonomy prevents desktop/mobile/Vi from drifting apart.
 * A service only links directly when a live OptionTrip route exists.
 * Everything else is handed to Vi with explicit service context, so users
 * never land on a dead page and OptionTrip never implies fake availability.
 */
const BookingServiceMenu = ({ mobile = false, onNavigate }) => (
  <div
    className={mobile ? 'booking-service-menu booking-service-menu--mobile' : 'booking-service-menu'}
    aria-label="Travel booking services"
  >
    <div className="booking-service-menu__grid">
      {TRAVEL_SERVICE_GROUPS.map(group => (
        <section className="booking-service-menu__group" key={group.id} aria-labelledby={`booking-${group.id}`}>
          <h3 id={`booking-${group.id}`} className="booking-service-menu__title">{group.label}</h3>
          <ul className="booking-service-menu__items">
            {group.services.map(service => {
              const route = service.live && service.route ? service.route : viRoute(service);
              return (
                <li key={service.id}>
                  <Link to={route} onClick={onNavigate} className="booking-service-menu__link">
                    <span className="booking-service-menu__icon" aria-hidden="true">
                      <i className={`fa ${service.icon}`} />
                    </span>
                    <span className="booking-service-menu__label">{service.label}</span>
                    {!service.live && <span className="booking-service-menu__vi">Ask Vi</span>}
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
        Explore all travel services <span aria-hidden="true">→</span>
      </Link>
    </div>
  </div>
);

export default BookingServiceMenu;
