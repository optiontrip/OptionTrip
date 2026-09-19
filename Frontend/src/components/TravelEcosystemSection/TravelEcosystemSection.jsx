import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TRAVEL_SERVICE_GROUPS, getTravelServiceDisplayLabel } from '../../config/travelServices';
import { getTravelServiceLabels } from '../../config/travelServiceLabels';
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
  if (state.external && state.bookingUrl) return 'Open live booking';
  if (state.status === 'partner-ready') return 'Continue to booking';
  return 'See next step';
};

const ServiceCard = ({ service, state, groupId, label }) => {
  const content = (
    <>
      <span className="tes__service-icon" aria-hidden="true">
        <i className={`fa ${service.icon}`} />
      </span>
      <span className="tes__service-copy">
        <strong>{label}</strong>
        <small>{statusCopy(state)}</small>
      </span>
      <i className="fa fa-chevron-right tes__chevron" aria-hidden="true" />
    </>
  );

  if (state.direct && service.route) {
    return <Link to={service.route} className="tes__service">{content}</Link>;
  }

  if (state.external && state.bookingUrl) {
    return (
      <a
        href={state.bookingUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="tes__service tes__service--partner"
        data-provider={state.primaryProvider || undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      to={`/services?service=${encodeURIComponent(service.id)}#${groupId}`}
      className="tes__service"
    >
      {content}
    </Link>
  );
};

const TravelEcosystemSection = () => {
  const { i18n } = useTranslation();
  const language = (i18n.language || 'en').split('-')[0];
  const labels = getTravelServiceLabels(language);
  const [inventory, setInventory] = useState({});
  const [openMobileGroups, setOpenMobileGroups] = useState(() => new Set(['book']));

  useEffect(() => {
    let active = true;
    fetchTravelInventoryStatus({ force: true }).then(data => {
      if (active) setInventory(data);
    });
    return () => { active = false; };
  }, []);

  const serviceLabel = service => getTravelServiceDisplayLabel(service, language, labels);
  const toggleMobileGroup = groupId => {
    setOpenMobileGroups(current => {
      const next = new Set(current);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

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
            {labels.all || 'Explore all travel services'} <i className="fa fa-arrow-right" aria-hidden="true" />
          </Link>
        </div>

        <div className="tes__groups">
          {TRAVEL_SERVICE_GROUPS.map(group => {
            const isOpenMobile = openMobileGroups.has(group.id);
            return (
              <section
                className={`tes__group ${isOpenMobile ? 'tes__group--mobile-open' : 'tes__group--mobile-collapsed'}`}
                key={group.id}
                id={`home-services-${group.id}`}
              >
                <div className="tes__group-head">
                  <button
                    type="button"
                    className="tes__group-toggle"
                    aria-expanded={isOpenMobile}
                    aria-controls={`tes-services-${group.id}`}
                    onClick={() => toggleMobileGroup(group.id)}
                  >
                    <span className="tes__group-toggle-copy">
                      <span className="tes__group-title">{labels[group.id] || group.label}</span>
                      <span className="tes__group-summary">{GROUP_COPY[group.id] || 'Useful services for your journey.'}</span>
                    </span>
                    <i className={`fa fa-chevron-down ${isOpenMobile ? 'is-open' : ''}`} aria-hidden="true" />
                  </button>

                  <div className="tes__group-head-desktop">
                    <div>
                      <h3>{labels[group.id] || group.label}</h3>
                      <p>{GROUP_COPY[group.id] || 'Useful services for your journey.'}</p>
                    </div>
                    <Link to={`/services#${group.id}`} className="tes__group-link" aria-label={`See all ${group.label} services`}>
                      <i className="fa fa-arrow-right" aria-hidden="true" />
                    </Link>
                  </div>
                </div>

                <div id={`tes-services-${group.id}`} className="tes__service-grid">
                  {group.services.map(service => {
                    const state = getInventoryStateForService(service, inventory);
                    return (
                      <ServiceCard
                        key={service.id}
                        service={service}
                        state={state}
                        groupId={group.id}
                        label={serviceLabel(service)}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <div className="tes__vi-card">
          <div className="tes__vi-icon" aria-hidden="true"><i className="fa fa-comments" /></div>
          <div className="tes__vi-copy">
            <span>Need help planning the whole trip?</span>
            <strong>Use Vi for planning. For a specific booking, choose the service above and OptionTrip will keep you in that flow.</strong>
          </div>
          <Link to="/travel-buddy?intent=plan-trip" className="tes__vi-button">{labels.ask || 'Plan with Vi'}</Link>
        </div>
      </div>
    </section>
  );
};

export default TravelEcosystemSection;
