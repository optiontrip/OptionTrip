import React, { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import CarRentalTab from './PlannedTripPage/sections/CarRentalTab';
import PageMeta from '../hooks/usePageMeta';
import { logActivity } from '../services/activityService';
import './CarRentalSearch.css';

const CarRentalSearch = () => {
  const location = useLocation();
  const handoff = location.state?.autoFill ? location.state : null;

  const rentalContext = useMemo(() => handoff ? {
    pickupLocation: handoff.pickupLocation || '',
    dropoffLocation: handoff.dropoffLocation || handoff.pickupLocation || '',
    pickupDate: handoff.pickupDate || '',
    returnDate: handoff.returnDate || '',
  } : null, [handoff]);

  useEffect(() => {
    if (rentalContext?.pickupLocation) {
      logActivity({
        type: 'car',
        action: 'searched',
        title: `Searched rental cars in ${rentalContext.pickupLocation}`,
        metadata: {
          pickupLocation: rentalContext.pickupLocation,
          dropoffLocation: rentalContext.dropoffLocation,
          dates: {
            start_date: rentalContext.pickupDate,
            end_date: rentalContext.returnDate,
          },
        },
      });
      return;
    }

    logActivity({
      type: 'car',
      action: 'viewed',
      title: 'Opened the car rental search'
    });
  }, [rentalContext]);

  return (
    <>
      <PageMeta
        title="Search Car Rentals"
        description="Compare car rentals worldwide - live partner search, top rental companies, and booking options in one place."
        keywords="car rental, rent a car, cheap car hire, holiday car rental, airport car rental"
        path="/car-rental"
      />
      <section className="crs-hero">
        <div className="container">
          <div className="text-center">
            <h4 className="mb-2 theme1">Search & Compare</h4>
            <h1 className="mb-3">Find Your <span className="theme">Rental Car</span></h1>
            <p className="crs-hero__sub">
              Compare cars from connected rental partners worldwide and continue to live booking.
            </p>
          </div>
        </div>
      </section>

      <section className="crs-content">
        <div className="container">
          <CarRentalTab tripData={rentalContext} />
        </div>
      </section>
    </>
  );
};

export default CarRentalSearch;
