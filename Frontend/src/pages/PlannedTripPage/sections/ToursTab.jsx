import React, { useEffect, useMemo } from 'react';
import TravelpayoutsWidget from './TravelpayoutsWidget';
import { logActivity } from '../../../services/activityService';
import './ToursTab.css';

const TOURS_WIDGET_SRC =
  'https://tpwdgt.com/content?trs=176202&shmarker=370056&locale=en&tours=3&powered_by=true&campaign_id=150&promo_id=4489';

const safeText = value => String(value || '')
  .replace(/[\r\n\t]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, 120);

const safeIata = value => {
  const code = String(value || '').trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : '';
};

const ToursTab = ({ tripData, source = 'landing_page' }) => {
  const destinationName = safeText(
    tripData?.destination?.name
      || tripData?.destination_name
      || tripData?.location?.destination
  );
  const destinationCode = safeIata(
    tripData?.destination?.iataCode
      || tripData?.destination?.iata
      || tripData?.destination?.code
      || tripData?.destinationCode
  );

  const bookingContext = useMemo(() => ({
    destination: destinationName || destinationCode || '',
    destinationCode,
  }), [destinationName, destinationCode]);

  useEffect(() => {
    logActivity({
      type: 'tours',
      action: 'viewed',
      title: source === 'trip_itinerary' ? 'Opened tours for trip' : 'Opened the tours search',
      metadata: {
        source,
        trip_id: tripData?.trip_id,
        destination: destinationName || undefined,
        destinationCode: destinationCode || undefined,
      },
    });
  }, [source, tripData?.trip_id, destinationName, destinationCode]);

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
            {destinationName || destinationCode
              ? `Guided tours and things to do in ${destinationName || destinationCode}`
              : 'Guided tours and things to do at your destination'}
          </p>
        </div>
      </div>

      <TravelpayoutsWidget
        src={TOURS_WIDGET_SRC}
        vertical="activities"
        title={destinationName || destinationCode
          ? `Live tours & activities for ${destinationName || destinationCode}`
          : 'Live tours & activities search'}
        context={bookingContext}
      />
    </div>
  );
};

export default ToursTab;
