import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TRAVEL_SERVICE_GROUPS, getTravelServiceDisplayLabel } from '../../config/travelServices';
import { getTravelServiceLabels } from '../../config/travelServiceLabels';
import './BookingServiceMenu.css';

const serviceRoute = service => service.live && service.route
  ? service.route
  : `/services?service=${encodeURIComponent(service.id)}#${service.group || ''}`;

const groupRoute = group => `/services#${group.id}`;

const BookingServiceMenu = ({ mobile = false, onNavigate }) => {
  const { i18n } = useTranslation();
  const labels = getTravelServiceLabels(i18n.language);
  const [openGroup, setOpenGroup] = useState(TRAVEL_SERVICE_GROUPS[0]?.id || null);

  useEffect(() => {
    if (!mobile) return;
    setOpenGroup(TRAVEL_SERVICE_GROUPS[0]?.id || null);
  }, [mobile, i18n.language]);

  return (
    <div className={mobile ? 'booking-service-menu booking-service-menu--mobile' : 'booking-service-menu'} aria-label={labels.booking}>
      <div className="booking-service-menu__grid">
        {TRAVEL_SERVICE_GROUPS.map(group => {
          const isOpen = !mobile || openGroup === group.id;
          const groupLabel = labels[group.id] || group.label;
          const panelId = `booking-${mobile ? 'mobile-' : ''}${group.id}-panel`;
          const headingId = `booking-${mobile ? 'mobile-' : ''}${group.id}`;

          return (
            <section className={`booking-service-menu__group ${mobile && isOpen ? 'is-open' : ''}`} key={group.id} aria-labelledby={headingId}>
              {mobile ? (
                <button
                  type="button"
                  id={headingId}
                  className="booking-service-menu__group-toggle"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenGroup(current => current === group.id ? null : group.id)}
                >
                  <span>{groupLabel}</span>
                  <i className={`fa fa-chevron-down ${isOpen ? 'is-open' : ''}`} aria-hidden="true" />
                </button>
              ) : (
                <Link to={groupRoute(group)} onClick={onNavigate} className="booking-service-menu__group-link">
                  <h3 id={headingId} className="booking-service-menu__title">{groupLabel}</h3>
                  <i className="fa fa-chevron-right" aria-hidden="true" />
                </Link>
              )}

              <ul id={panelId} className="booking-service-menu__items" hidden={mobile && !isOpen}>
                {group.services.map(service => {
                  const route = serviceRoute({ ...service, group: group.id });
                  const serviceLabel = getTravelServiceDisplayLabel(service, i18n.language, labels);
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
          );
        })}
      </div>
      <div className="booking-service-menu__footer">
        <Link to="/services" onClick={onNavigate} className="booking-service-menu__all">
          <span>{labels.all}</span><i className="fa fa-arrow-right" aria-hidden="true" />
        </Link>
        <Link to="/travel-buddy?intent=plan-trip" onClick={onNavigate} className="booking-service-menu__vi-link">
          <span className="booking-service-menu__vi-mark">Vi</span><span>{labels.ask}</span>
        </Link>
      </div>
    </div>
  );
};

export default BookingServiceMenu;
