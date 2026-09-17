import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TRAVEL_SERVICE_GROUPS } from '../../config/travelServices';
import { fetchTravelInventoryStatus, getInventoryStateForService } from '../../services/travelInventoryService';
import './TravelEcosystemSection.css';

const viRoute = service => `/travel-buddy?service=${encodeURIComponent(service.id)}&intent=find-service`;

const GROUP_COPY = {
  book: 'Search and book the core parts of your trip.',
  move: 'Connect airports, cities, stations and the last mile.',
  prepare: 'Handle the practical things that make travel easier.',
  help: 'Use Vi and OptionTrip tools before, during and after the trip.',
};

const statusCopy = state => {
  if (state.direct) return 'Open service';
  if (state.status === 'partner-ready') return 'Live partner via Vi';
  if (state.status === 'provider-pending') return 'Vi can guide you';
  return 'Ask Vi';
};

const TravelEcosystemSection = () => {
  const [inventory, setInventory] = useState({});

  useEffect(() => {
    let active = true;
    fetchTravelInventoryStatus().then(data => {
      if (active) setInventory(data);
    });
    return () => { active = false; };
  }, []);

  return (
    <section className="tes" aria-labelledby="tes-title">
      <div className="container">
        <div className="tes__hero">
          <div>
            <span className="tes__eyebrow">One trip. One connected place.</span>
            <h2 id="tes-title">More than flights and hotels</h2>
            <p>
              OptionTrip connects booking, transport, trip preparation and live travel help around Vi, so every service can work with the same trip context.
            </p>
          </div>
          <Link to="/services" className="tes__all-link">
            Explore all travel services <i className="fa fa-arrow-right" aria-hidden="true" />
          </Link>
        </div>

        <div className="tes__groups">
          {TRAVEL_SERVICE_GROUPS.map(group => (
            <section className="tes__group" key={group.id} id={`home-services-${group.id}`}>
              <div className="tes__group-head">
                <div>
                  <h3>{group.label}</h3>
                  <p>{GROUP_COPY[group.id] || 'Useful services for your journey.'}</p>
                </div>
                <Link to={`/services#${group.id}`} className="tes__group-link" aria-label={`See all ${group.label} services`}>
                  <i className="fa fa-arrow-right" aria-hidden="true" />
                </Link>
              </div>

              <div className="tes__service-grid">
                {group.services.map(service => {
                  const state = getInventoryStateForService(service, inventory);
                  const route = state.direct ? service.route : viRoute(service);
                  return (
                    <Link to={route} className="tes__service" key={service.id}>
                      <span className="tes__service-icon" aria-hidden="true">
                        <i className={`fa ${service.icon}`} />
                      </span>
                      <span className="tes__service-copy">
                        <strong>{service.label}</strong>
                        <small>{statusCopy(state)}</small>
                      </span>
                      <i className="fa fa-chevron-right tes__chevron" aria-hidden="true" />
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="tes__vi-card">
          <div className="tes__vi-icon" aria-hidden="true"><i className="fa fa-comments" /></div>
          <div className="tes__vi-copy">
            <span>Not sure which service you need?</span>
            <strong>Tell Vi what you are trying to do. Vi can route the trip from there.</strong>
          </div>
          <Link to="/travel-buddy" className="tes__vi-button">Ask Vi</Link>
        </div>
      </div>
    </section>
  );
};

export default TravelEcosystemSection;
