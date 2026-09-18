import React from 'react';
import TravelpayoutsWidget from './TravelpayoutsWidget';
import './CarRentalTab.css';

const CAR_RENTAL_WIDGET_SRC =
  'https://tpwdgt.com/content?trs=176202&shmarker=370056&locale=en&powered_by=true&border_radius=5&plain=true&show_logo=true&color_background=%23009E9D&color_button=%23FEC704&color_text=%23000000&color_input_text=%23000000&color_button_text=%23ffffff&promo_id=4480&campaign_id=10';

const CarRentalTab = () => (
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
        <p className="cr-card__sub">Search a live rental partner now. OptionTrip only adds its own filters when the provider returns filterable inventory.</p>
      </div>
    </div>

    <TravelpayoutsWidget
      src={CAR_RENTAL_WIDGET_SRC}
      vertical="cars"
      title="Live car rental search"
    />
  </div>
);

export default CarRentalTab;
