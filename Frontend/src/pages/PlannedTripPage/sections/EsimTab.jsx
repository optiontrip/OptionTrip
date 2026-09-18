import React, { useEffect } from 'react';
import TravelpayoutsWidget from './TravelpayoutsWidget';
import { logActivity } from '../../../services/activityService';
import './EsimTab.css';

const ESIM_WIDGET_SRC =
  'https://tpwdgt.com/content?trs=176202&shmarker=370056&locale=en&powered_by=true&color_button=%23f2685f&color_focused=%23f2685f&secondary=%23FFFFFF&dark=%2311100f&light=%23FFFFFF&special=%23C4C4C4&border_radius=5&plain=false&no_labels=true&promo_id=8588&campaign_id=541';

const EsimTab = ({ tripData, source = 'landing_page' }) => {
  useEffect(() => {
    logActivity({
      type: 'esim',
      action: 'viewed',
      title: source === 'trip_itinerary' ? 'Opened eSIM plans for trip' : 'Opened the eSIM search',
      metadata: {
        source,
        trip_id: tripData?.trip_id,
        destination: tripData?.destination?.name,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, tripData?.trip_id]);

  return (
    <div className="est-root">
      <div className="est-card__header est-card__header--standalone">
        <div className="est-card__header-icon">
          <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
            <rect x="4" y="2" width="16" height="20" rx="3" stroke="currentColor" strokeWidth="2"/>
            <rect x="8" y="6" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="2"/>
            <path d="M8 16h.01M12 16h.01M16 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <h3 className="est-card__title">Stay Connected with an eSIM</h3>
          <p className="est-card__sub">
            {tripData?.destination?.name
              ? `Instant data plans for ${tripData.destination.name} - no roaming fees`
              : 'Instant data plans for your destination - no roaming fees'}
          </p>
        </div>
      </div>

      <TravelpayoutsWidget
        src={ESIM_WIDGET_SRC}
        vertical="esim"
        title="Live eSIM plan search"
      />
    </div>
  );
};

export default EsimTab;
