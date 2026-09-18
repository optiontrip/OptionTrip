import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TRAVEL_SERVICE_GROUPS } from '../../config/travelServices';
import { fetchTravelInventoryStatus, getInventoryStateForService } from '../../services/travelInventoryService';
import './TravelEcosystemSection.css';

const GROUP_COPY = {
  book: 'Search and book the core parts of your trip.',
  move: 'Connect airports, cities, stations and the last mile.',
  prepare: 'Handle the practical things that make travel easier.',
  help: 'Use Vi and OptionTrip tools before, during and after the trip.',
};

const statusCopy = state => {
  if (state.direct) return 'Search & book';
  if (state.status === 'partner-ready') return 'Continue to booking';
  return 'See next step';
};

const serviceRoute = (service, state) => state.direct
  ? service.route
  : `/services?service=${encodeURIComponent(service.id)}#${service.group || ''}`;

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
            <h2 id="tes-title">Book your trip without starting over</h2>
            <p>
              Choose a service once. OptionTrip keeps that choice as you move from search to booking, partner checkout or Vi assistance.
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
                  const route = state.direct ? service.route : `/services?service=${encodeURIComponent(service.id)}#${group.id}`;
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
            <span>Need help planning the whole trip?</span>
            <strong>Use Vi for planning. For a specific booking, choose the service above and OptionTrip will keep you in that flow.</strong>
          </div>
          <Link to="/travel-buddy?intent=plan-trip" className="tes__vi-button">Plan with Vi</Link>
        </div>
      </div>
    </section>
  );
};

export default TravelEcosystemSection;
