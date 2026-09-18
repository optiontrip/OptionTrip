import React, { useEffect } from 'react';
import TravelpayoutsWidget from './TravelpayoutsWidget';
import { logActivity } from '../../../services/activityService';
import './ToursTab.css';

const TOURS_WIDGET_SRC =
  'https://tpwdgt.com/content?trs=176202&shmarker=370056&locale=en&tours=3&powered_by=true&campaign_id=150&promo_id=4489';

const ToursTab = ({ tripData, source = 'landing_page' }) => {
  useEffect(() => {
    logActivity({
      type: 'tours',
      action: 'viewed',
      title: source === 'trip_itinerary' ? 'Opened tours for trip' : 'Opened the tours search',
      metadata: {
        source,
        trip_id: tripData?.trip_id,
        destination: tripData?.destination?.name,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, tripData?.trip_id]);

  return (
    <div className="tt-root">
      <div className="tt-card__header tt-card__header--standalone">
        <div className="tt-card__header-icon">
          <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
            <path d="M12 2 4 6v6c0 5 3.4 8.4 8 10 4.6-1.6 8-5 8-10V6l-8-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <h3 className="tt-card__title">Book Tours & Activities</h3>
          <p className="tt-card__sub">
            {tripData?.destination?.name
              ? `Guided tours and things to do in ${tripData.destination.name}`
              : 'Guided tours and things to do at your destination'}
          </p>
        </div>
      </div>

      <TravelpayoutsWidget
        src={TOURS_WIDGET_SRC}
        vertical="activities"
        title="Live tours & activities search"
      />
    </div>
  );
};

export default ToursTab;
