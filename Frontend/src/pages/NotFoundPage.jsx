import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import PageMeta from '../hooks/usePageMeta';
import './NotFoundPage.css';

const QUICK_LINKS = [
  { to: '/flights', icon: 'fa-plane', label: 'Flights', copy: 'Search dates, routes and whole-month prices.' },
  { to: '/hotels', icon: 'fa-building', label: 'Stays', copy: 'Find hotels and other places to stay.' },
  { to: '/car-rental', icon: 'fa-car', label: 'Car rental', copy: 'Compare rental car options.' },
  { to: '/tours', icon: 'fa-ticket', label: 'Tours & activities', copy: 'Find things to do at your destination.' },
  { to: '/services', icon: 'fa-th-large', label: 'All travel services', copy: 'Trains, buses, transfers, city passes and more.' },
  { to: '/travel-buddy?intent=plan-trip', icon: 'fa-comments', label: 'Ask Vi', copy: 'Tell Vi what you need and continue from there.' },
];

export default function NotFoundPage() {
  const location = useLocation();

  return (
    <main className="not-found-page">
      <PageMeta
        title="Page Not Found"
        description="The page you requested is not available. Continue with OptionTrip travel search or ask Travel Partner Vi for help."
        path={location.pathname}
        noindex
      />

      <section className="not-found-hero">
        <div className="container">
          <div className="not-found-code" aria-hidden="true">404</div>
          <span className="not-found-eyebrow">OPTIONTRIP</span>
          <h1>This route is not on the map.</h1>
          <p>
            The link may be old or mistyped. Your trip does not have to stop here - jump straight into a working service or ask Vi what to do next.
          </p>
          <div className="not-found-actions">
            <Link className="nir-btn" to="/">Go to OptionTrip home</Link>
            <Link className="not-found-secondary" to="/travel-buddy?intent=plan-trip">Ask Vi</Link>
          </div>
        </div>
      </section>

      <section className="container not-found-recovery" aria-labelledby="not-found-services-title">
        <div className="not-found-recovery__heading">
          <span>KEEP MOVING</span>
          <h2 id="not-found-services-title">Choose what you need now</h2>
          <p>Every option below leads to an active OptionTrip search, service hub or Vi workflow.</p>
        </div>

        <div className="not-found-grid">
          {QUICK_LINKS.map(item => (
            <Link className="not-found-card" key={item.to} to={item.to}>
              <span className="not-found-card__icon"><i className={`fa ${item.icon}`} aria-hidden="true" /></span>
              <span className="not-found-card__copy">
                <strong>{item.label}</strong>
                <small>{item.copy}</small>
              </span>
              <i className="fa fa-arrow-right not-found-card__arrow" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
