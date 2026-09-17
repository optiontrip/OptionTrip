import React, { useState } from 'react';
import ActivityCard from '../ActivityCard/ActivityCard';
import ActionableEmptyState from '../ActionableEmptyState/ActionableEmptyState';
import useCurrency from '../../hooks/useCurrency';
import './ItineraryDisplay.css';

const ItineraryDisplay = ({ itinerary, searchCenter }) => {
  const [activeDay, setActiveDay] = useState(0);
  const { formatPrice } = useCurrency();

  if (!itinerary || itinerary.length === 0) {
    return (
      <div className="itinerary-display">
        <ActionableEmptyState
          icon="📅"
          eyebrow="Build the next step"
          title="Your itinerary is ready to be built"
          description="Tell Vi the destination, dates, budget or vibe you have in mind, or start with Plan My Day if you are already there."
          primaryAction={{ label: 'Build itinerary with Vi', to: '/travel-buddy?intent=build-itinerary' }}
          secondaryAction={{ label: 'Plan my day', to: '/plan-my-day' }}
        />
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const currentDay = itinerary[activeDay];

  return (
    <div className="itinerary-display">
      <div className="itinerary-display__header">
        <h2 className="itinerary-display__title">Daily Itinerary</h2>
        <p className="itinerary-display__subtitle">
          {itinerary.length} day{itinerary.length !== 1 ? 's' : ''} of trip planning in one place
        </p>
      </div>

      <div className="itinerary-display__tabs">
        {itinerary.map((day, index) => (
          <button
            key={day.day_number}
            className={`itinerary-display__tab ${activeDay === index ? 'active' : ''}`}
            onClick={() => setActiveDay(index)}
          >
            Day {day.day_number}
          </button>
        ))}
      </div>

      {currentDay && (
        <div className="itinerary-display__day-content">
          <div className="itinerary-display__day-header">
            <h3 className="itinerary-display__day-title">{currentDay.title}</h3>
            <p className="itinerary-display__day-date">
              {formatDate(currentDay.date)}
            </p>
            {currentDay.summary && (
              <p className="itinerary-display__day-summary">{currentDay.summary}</p>
            )}
          </div>

          <div className="itinerary-display__activities">
            {currentDay.activities && currentDay.activities.length > 0 ? (
              currentDay.activities.map((activity, activityIndex) => (
                <div key={activityIndex} style={{ position: 'relative' }}>
                  <ActivityCard
                    activity={activity}
                    searchCenter={searchCenter}
                  />
                </div>
              ))
            ) : (
              <ActionableEmptyState
                compact
                icon="✨"
                eyebrow="This day is open"
                title="No activities are planned yet"
                description="Use Vi to fill the day around your interests, or browse nearby ideas without rebuilding the rest of the trip."
                primaryAction={{ label: 'Fill this day with Vi', to: '/travel-buddy?intent=plan-day' }}
                secondaryAction={{ label: 'Explore destinations', to: '/destinations' }}
              />
            )}
          </div>

          <div className="itinerary-display__day-footer">
            <span className="itinerary-display__day-footer-label">
              Total Day Cost
            </span>
            <span className="itinerary-display__day-footer-value">
              {formatPrice(currentDay.total_cost || 0)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItineraryDisplay;
