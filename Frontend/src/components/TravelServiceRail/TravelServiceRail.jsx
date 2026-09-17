import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TRAVEL_SERVICES } from '../../config/travelServices';
import { fetchTravelInventoryStatus, getInventoryStateForService } from '../../services/travelInventoryService';
import './TravelServiceRail.css';

const viRoute = service => `/travel-buddy?service=${encodeURIComponent(service.id)}&intent=find-service`;

const PRIORITY_IDS = [
  'flights', 'stays', 'cars', 'activities', 'rail', 'bus', 'transfers',
  'esim', 'insurance', 'visa', 'luggage_storage', 'flight_compensation'
];

const TravelServiceRail = () => {
  const location = useLocation();
  const [inventory, setInventory] = useState({});
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

  return (
    <nav className="tsr" aria-label="Travel services">
      <div className="container tsr__inner">
        <Link to="/services" className="tsr__brand" aria-label="Open all travel services">
          <span className="tsr__brand-mark"><i className="fa fa-compass" aria-hidden="true" /></span>
          <span className="tsr__brand-copy">
            <strong>Trip Toolkit</strong>
            <small>All services</small>
          </span>
        </Link>

        <div className="tsr__scroll" role="list">
          {services.map(service => {
            const state = getInventoryStateForService(service, inventory);
            const to = state.direct ? service.route : viRoute(service);
            const isActive = service.route && location.pathname === service.route;
            const badge = state.direct ? null : state.status === 'partner-ready' ? 'Live' : 'Vi';
            return (
              <Link
                role="listitem"
                key={service.id}
                to={to}
                className={`tsr__item${isActive ? ' tsr__item--active' : ''}`}
                title={state.direct ? `Open ${service.label}` : state.status === 'partner-ready' ? `Use a live partner for ${service.label} with Vi` : `Ask Vi about ${service.label}`}
              >
                <i className={`fa ${service.icon}`} aria-hidden="true" />
                <span>{service.label}</span>
                {badge && <em>{badge}</em>}
              </Link>
            );
          })}
        </div>

        <Link to="/travel-buddy" className="tsr__vi">
          <i className="fa fa-comments" aria-hidden="true" />
          <span>Ask Vi</span>
        </Link>
      </div>
    </nav>
  );
};

export default TravelServiceRail;
