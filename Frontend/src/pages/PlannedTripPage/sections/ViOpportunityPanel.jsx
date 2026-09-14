import React, { useEffect, useMemo, useState } from 'react';
import { getAccessToken } from '../../../services/authService';
import { analyzeTripOpportunities } from '../../../services/opportunityService';
import './ViOpportunityPanel.css';

const TYPE_LABELS = {
  dining: 'Food',
  airport_lounge: 'Airport lounge',
  spa_wellness: 'Spa & wellness',
  shopping: 'Shopping',
  museum: 'Museum',
  city_break: 'Quick city break',
  airport_hotel: 'Airport hotel',
  nightlife: 'Nightlife'
};

const formatMinutes = (minutes = 0) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (!hours) return `${mins} min`;
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
};

const ViOpportunityPanel = ({ tripId, selectedFlight, isAuthenticated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!tripId || !isAuthenticated) return;
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await analyzeTripOpportunities(
          tripId,
          getAccessToken(),
          selectedFlight ? { flight: selectedFlight } : {}
        );
        if (!cancelled) setResult(response?.data || null);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Unable to analyze this trip right now.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [tripId, selectedFlight, isAuthenticated]);

  const windows = result?.windows || [];
  const visibleWindows = useMemo(
    () => windows.filter((window) => (window.opportunityTypes || []).length > 0).slice(0, 3),
    [windows]
  );

  if (!isAuthenticated || (!selectedFlight && !loading && windows.length === 0)) return null;

  return (
    <section className="vi-opportunity-panel" aria-label="Vi smart trip opportunities">
      <div className="vi-opportunity-panel__header">
        <div>
          <span className="vi-opportunity-panel__eyebrow">VI SMART TRIP</span>
          <h2>Free-time opportunities</h2>
          <p>Vi checks your route for usable layover and between-booking time, then validates live conditions before suggesting an action.</p>
        </div>
        {result?.validationSummary && (
          <div className="vi-opportunity-panel__status">
            <strong>{result.validationSummary.actionableWindows || 0}</strong>
            <span>ready now</span>
          </div>
        )}
      </div>

      {loading && <div className="vi-opportunity-panel__message">Vi is checking your trip...</div>}
      {error && <div className="vi-opportunity-panel__message vi-opportunity-panel__message--error">{error}</div>}

      {!loading && !error && visibleWindows.length === 0 && (
        <div className="vi-opportunity-panel__message">No useful free-time window found yet. Vi will keep this trip context ready as bookings are added.</div>
      )}

      <div className="vi-opportunity-panel__grid">
        {visibleWindows.map((window) => {
          const topType = window.opportunityTypes?.[0];
          const place = window.liveContext?.places?.[0] || null;
          const weather = window.liveContext?.weather || null;
          const blocked = window.validation?.blocked;
          const actionable = window.validation?.actionable;
          const state = blocked ? 'Blocked' : actionable ? 'Ready' : 'Checking live details';

          return (
            <article className="vi-opportunity-card" key={window.id}>
              <div className="vi-opportunity-card__top">
                <span className={`vi-opportunity-card__state ${actionable ? 'is-ready' : ''}`}>{state}</span>
                <span className="vi-opportunity-card__time">{formatMinutes(window.usableMinutes)}</span>
              </div>
              <h3>{TYPE_LABELS[topType?.type] || 'Smart stop'}</h3>
              <p className="vi-opportunity-card__location">{window.liveContext?.location?.name || window.location || 'Along your route'}</p>

              {weather && (
                <p className="vi-opportunity-card__detail">
                  Weather: {weather.condition?.replaceAll('_', ' ') || 'unknown'}
                  {weather.temperatureNowC != null ? `, ${Math.round(weather.temperatureNowC)}°C` : ''}
                </p>
              )}

              {place && (
                <div className="vi-opportunity-card__place">
                  <strong>{place.name}</strong>
                  {place.rating ? <span>★ {place.rating}</span> : null}
                  {place.address ? <small>{place.address}</small> : null}
                </div>
              )}

              {!actionable && !blocked && (
                <p className="vi-opportunity-card__pending">Waiting for required entry, transport, opening-hours or safety checks before Vi marks this as actionable.</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default ViOpportunityPanel;
