import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getNotifications } from '../../services/notificationService';
import YearlyReportModal from '../../components/YearlyReport/YearlyReportModal';
import './DashboardTab.css';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

const askVi = (message) => {
  window.dispatchEvent(new CustomEvent('vi:open', { detail: message ? { message } : undefined }));
};

const DashboardTab = ({ trips, wishlist, onViewMap }) => {
  const [tips, setTips] = useState([]);
  const [showYearlyReport, setShowYearlyReport] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getNotifications({ status: 'unread', limit: 3 }).then((list) => {
      if (!cancelled) setTips(list);
    }).catch(() => {
      if (!cancelled) setTips([]);
    });
    return () => { cancelled = true; };
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = trips
    .filter((t) => t.dates?.start_date && t.dates.start_date >= today)
    .sort((a, b) => a.dates.start_date.localeCompare(b.dates.start_date))
    .slice(0, 3);

  const drafts = trips
    .filter((t) => t.status === 'draft' || t.status === 'options_generated')
    .slice(0, 3);

  const continueTarget = drafts[0] || upcoming[0] || null;

  return (
    <div className="dashboard-tab">
      <div className="dash-quick-actions">
        {continueTarget ? (
          <Link to={`/trips/${continueTarget.trip_id}`} className="dash-quick-action dash-quick-action--primary">
            <span className="dash-quick-action__icon">✈️</span>
            Continue planning
          </Link>
        ) : (
          <Link to="/travel-buddy?intent=plan-trip" className="dash-quick-action dash-quick-action--primary">
            <span className="dash-quick-action__icon">✈️</span>
            Start a new trip
          </Link>
        )}
        <button type="button" className="dash-quick-action" onClick={onViewMap}>
          <span className="dash-quick-action__icon">🌍</span>
          View map
        </button>
        <button type="button" className="dash-quick-action" onClick={() => askVi()}>
          <span className="dash-quick-action__icon">💬</span>
          Ask Vi
        </button>
        <button type="button" className="dash-quick-action" onClick={() => setShowYearlyReport(true)}>
          <span className="dash-quick-action__icon">📊</span>
          Yearly report
        </button>
      </div>

      {showYearlyReport && <YearlyReportModal onClose={() => setShowYearlyReport(false)} />}

      <div className="dash-grid">
        <section className="dash-panel dash-panel--wide">
          <div className="dash-panel__head">
            <h3>Upcoming trips</h3>
            <button type="button" className="dash-panel__link" onClick={onViewMap}>See all on map</button>
          </div>
          {upcoming.length === 0 ? (
            <div className="dash-empty">
              <p>No upcoming trip yet. Start with an idea and Vi can turn it into a plan.</p>
              <div className="dash-empty__actions">
                <Link to="/travel-buddy?intent=plan-trip">Plan with Vi</Link>
                <Link to="/where-can-i-go">Find a destination</Link>
              </div>
            </div>
          ) : (
            <ul className="dash-trip-list">
              {upcoming.map((t) => (
                <li key={t.trip_id}>
                  <Link to={`/planned-trip/${t.trip_id}`} className="dash-trip-row">
                    <span className="dash-trip-row__dest">{t.customTitle || t.destination?.name || 'Trip'}</span>
                    <span className="dash-trip-row__dates">{fmtDate(t.dates?.start_date)} - {fmtDate(t.dates?.end_date)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {drafts.length > 0 && (
            <>
              <div className="dash-panel__head dash-panel__head--sub">
                <h4>Still being planned</h4>
              </div>
              <ul className="dash-trip-list">
                {drafts.map((t) => (
                  <li key={t.trip_id}>
                    <Link to={`/trips/${t.trip_id}`} className="dash-trip-row">
                      <span className="dash-trip-row__dest">{t.customTitle || t.destination?.name || 'Trip'}</span>
                      <span className="dash-trip-row__dates dash-trip-row__dates--muted">Draft</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <div className="dash-side">
          <section className="dash-panel">
            <div className="dash-panel__head">
              <h3>From Vi</h3>
            </div>
            {tips.length === 0 ? (
              <div className="dash-empty">
                <p>No new automatic suggestion right now. Vi is still available whenever you need a decision or a second opinion.</p>
                <button type="button" className="dash-panel__link" onClick={() => askVi('What should I focus on next for my travel plans?')}>Ask Vi what is next</button>
              </div>
            ) : (
              <ul className="dash-tip-list">
                {tips.map((n) => (
                  <li key={n._id} className="dash-tip">
                    <span className="dash-tip__title">{n.title}</span>
                    {n.cta?.url && (
                      <Link to={n.cta.url} className="dash-tip__cta">{n.cta.label || 'View'}</Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="dash-panel">
            <div className="dash-panel__head">
              <h3>Saved ideas</h3>
            </div>
            {wishlist.length === 0 ? (
              <div className="dash-empty">
                <p>Your saved ideas will live here, so inspiration does not disappear between visits.</p>
                <div className="dash-empty__actions">
                  <Link to="/trip-ideas">Browse trip ideas</Link>
                  <Link to="/destinations">Explore destinations</Link>
                </div>
              </div>
            ) : (
              <ul className="dash-tip-list">
                {wishlist.slice(0, 3).map((w) => (
                  <li key={w._id} className="dash-tip">
                    <span className="dash-tip__title">{w.destinationName}</span>
                    <Link to={`/travel-buddy?intent=plan-trip&destination=${encodeURIComponent(w.destinationName)}`} className="dash-tip__cta">Plan</Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;
