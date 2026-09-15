import React from 'react';
import PageMeta from '../hooks/usePageMeta';
import ToursTab from './PlannedTripPage/sections/ToursTab';

const Tours = () => {
  return (
    <>
      <PageMeta
        title="Tours & Experiences"
        description="Discover tours and experiences for your trip with Vi. Explore available activities and build them into your travel plan."
        keywords="travel experiences, tours, activities, things to do, trip planning"
        path="/tours"
      />
      <div className="banner pt-10 pb-0 overflow-hidden" style={{backgroundImage: `url(/images/testimonial.png)`}}>
        <div className="container">
          <div className="banner-in">
            <div className="row align-items-center">
              <div className="col-lg-12 mb-4">
                <div className="banner-content text-center">
                  <h4 className="theme mb-0">Explore With Vi</h4>
                  <h1>Find Tours & Experiences For Your Trip</h1>
                  <p className="mb-4">Tell Vi what you want to do, or explore available activities for the destination in your trip.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ToursTab source="landing_page" />
    </>
  );
};

export default Tours;
