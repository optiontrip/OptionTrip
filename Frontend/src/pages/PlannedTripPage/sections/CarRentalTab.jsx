import React, { useMemo } from 'react';
import TravelpayoutsWidget from './TravelpayoutsWidget';
import './CarRentalTab.css';

const CAR_RENTAL_WIDGET_SRC =
  'https://tpwdgt.com/content?trs=176202&shmarker=370056&locale=en&powered_by=true&border_radius=5&plain=true&show_logo=true&color_background=%23009E9D&color_button=%23FEC704&color_text=%23000000&color_input_text=%23000000&color_button_text=%23ffffff&promo_id=4480&campaign_id=10';

const formatDate = value => {
  if (!value) return '';
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const normalizeRentalContext = tripData => {
  const pickupLocation = String(
    tripData?.pickupLocation
    || tripData?.pickup_location
    || tripData?.destination?.name
    || ''
  ).trim();
  const dropoffLocation = String(
    tripData?.dropoffLocation
    || tripData?.dropoff_location
    || pickupLocation
  ).trim();
  const pickupDate = String(
    tripData?.pickupDate
    || tripData?.pickup_date
    || tripData?.dates?.start_date
    || ''
  ).slice(0, 10);
  const returnDate = String(
    tripData?.returnDate
    || tripData?.return_date
    || tripData?.dates?.end_date
    || ''
  ).slice(0, 10);

  return { pickupLocation, dropoffLocation, pickupDate, returnDate };
};

const CarRentalTab = ({ tripData = null }) => {
  const searchContext = useMemo(() => normalizeRentalContext(tripData), [tripData]);
  const hasContext = Boolean(
    searchContext.pickupLocation
    || searchContext.dropoffLocation
    || searchContext.pickupDate
    || searchContext.returnDate
  );

  return (
    <div className="cr-root">
      <div className="cr-card__header cr-card__header--standalone">
        <div className="cr-card__header-icon">
          <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
            <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            <circle cx="16" cy="17" r="3" stroke="currentColor" strokeWidth="2"/>
            <circle cx="7" cy="17" r="3" stroke="currentColor" strokeWidth="2"/>
            <path d="M10 5H7v5h5V5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <h3 className="cr-card__title">Find Rental Cars</h3>
          <p className="cr-card__sub">Compare live rental options, choose the car that fits your trip, and continue with the booking partner.</p>
        </div>
      </div>

      {hasContext && (
        <div className="cr-search-context" aria-label="Your rental car search">
          <div className="cr-search-context__heading">
            <span className="cr-search-context__eyebrow">Your OptionTrip search</span>
            <strong>Rental details carried forward</strong>
          </div>
          <div className="cr-search-context__grid">
            <div className="cr-search-context__item">
              <span>Pick-up</span>
              <strong>{searchContext.pickupLocation || 'Choose in live search'}</strong>
            </div>
            <div className="cr-search-context__item">
              <span>Drop-off</span>
              <strong>{searchContext.dropoffLocation || searchContext.pickupLocation || 'Same as pick-up'}</strong>
            </div>
            <div className="cr-search-context__item">
              <span>Pick-up date</span>
              <strong>{formatDate(searchContext.pickupDate) || 'Choose date'}</strong>
            </div>
            <div className="cr-search-context__item">
              <span>Return date</span>
              <strong>{formatDate(searchContext.returnDate) || 'Choose date'}</strong>
            </div>
          </div>
          <p className="cr-search-context__note">
            OptionTrip keeps your route and dates visible while the live partner search loads below. Final availability and price are confirmed by the booking partner.
          </p>
        </div>
      )}

      <TravelpayoutsWidget
        src={CAR_RENTAL_WIDGET_SRC}
        vertical="cars"
        title="Live car rental search"
      />
    </div>
  );
};

export default CarRentalTab;
