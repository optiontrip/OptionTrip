import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageMeta from '../hooks/usePageMeta';
import ToursTab from './PlannedTripPage/sections/ToursTab';

const safeText = (value, maxLength = 120) => String(value || '')
  .replace(/[\r\n\t]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, maxLength);

const safeIata = value => {
  const code = String(value || '').trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : '';
};

const Tours = () => {
  const [searchParams] = useSearchParams();
  const destination = safeText(searchParams.get('destination') || searchParams.get('destinationName'));
  const destinationCode = safeIata(searchParams.get('destinationCode'));

  const handoffTripData = useMemo(() => {
    if (!destination && !destinationCode) return null;
    return {
      destination: {
        name: destination || destinationCode,
        iataCode: destinationCode || undefined,
        code: destinationCode || undefined,
      },
    };
  }, [destination, destinationCode]);

  const destinationLabel = destination || destinationCode;
  const title = destinationLabel
    ? `Tours & Experiences in ${destinationLabel}`
    : 'Tours & Experiences';

  return (
    <>
      <PageMeta
        title={title}
        description={destinationLabel
          ? `Discover tours, attractions and experiences in ${destinationLabel} with OptionTrip and Vi.`
          : 'Discover tours and experiences for your trip with Vi. Explore available activities and build them into your travel plan.'}
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
                  <h1>{destinationLabel ? `Tours & Experiences in ${destinationLabel}` : 'Find Tours & Experiences For Your Trip'}</h1>
                  <p className="mb-4">
                    {destinationLabel
                      ? `Keep exploring ${destinationLabel} without entering your destination again.`
                      : 'Tell Vi what you want to do, or explore available activities for the destination in your trip.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ToursTab tripData={handoffTripData} source="landing_page" />
    </>
  );
};

export default Tours;
