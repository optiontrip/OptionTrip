import React from 'react';
import { Link } from 'react-router-dom';
import './WhyChooseUs.css';

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M19 17c1.5.5 3 1.5 3 2.5 0 1.38-4.48 2.5-10 2.5S2 20.88 2 19.5c0-1 1.5-2 3-2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
    label: 'Personalized Planning',
    title: 'Trips Shaped Around You',
    desc: 'Vi can use your destination, budget, pace, interests and saved trip context to make planning more relevant instead of starting from zero each time.',
    accent: '#029e9d',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.6"/>
        <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        <path d="M8 14h4M8 18h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
    label: 'Connected Journey',
    title: 'One Trip Context',
    desc: 'Flights, stays, activities, transport tools and saved trip choices can share the same journey context so you do not have to rebuild your plan on every page.',
    accent: '#2563eb',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
    label: 'Your Travel Partner',
    title: 'Vi Stays in the Loop',
    desc: 'Ask Vi about routes, neighborhoods, entry preparation, local transport, weather, food, activities or how to adjust a trip when plans change.',
    accent: '#7c3aed',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
        <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    label: 'Price Truth',
    title: 'Live Where It Is Connected',
    desc: 'When a live provider search is available, OptionTrip uses those returned results. Estimates and planning ranges should stay clearly separate from live booking prices.',
    accent: '#ea580c',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6"/>
        <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
    label: 'Multilingual Travel',
    title: 'Built for Global Trips',
    desc: 'OptionTrip is designed for travelers crossing countries, languages, currencies and transportation systems, with multilingual assistance throughout the trip flow.',
    accent: '#16a34a',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    label: 'Traveler-First Value',
    title: 'Cheapest Is Not Always Best',
    desc: 'Vi is being built to compare the tradeoffs that matter: total cost, baggage, timing, connections, cancellation flexibility and traveler time.',
    accent: '#e11d48',
  },
];

const CTA = () => (
  <div className="wcu-cta">
    <div className="wcu-cta__text">
      <strong>Start with the trip, not the menu.</strong>
      <span>Tell Vi what you want to do and move from idea to the right OptionTrip service.</span>
    </div>
    <Link to="/travel-buddy?intent=plan-trip" className="wcu-cta__btn">
      Plan With Vi
      <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
        <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </Link>
  </div>
);

const WhyChooseUs = ({ ctaOnly = false }) => {
  if (ctaOnly) return (
    <section className="wcu-section" style={{ background: 'none', padding: '40px 0' }}>
      <div className="container"><CTA /></div>
    </section>
  );

  return (
    <section className="wcu-section" style={{ backgroundImage: 'url(/images/shape4.png)', backgroundPosition: 'center' }}>
      <div className="container">
        <div className="wcu-header">
          <span className="wcu-eyebrow">Why OptionTrip</span>
          <h2 className="wcu-title">
            A Smarter Way <span className="theme">to Travel</span>
          </h2>
          <p className="wcu-sub">
            One connected travel experience built around useful guidance, real provider integrations where available, and Vi keeping the journey context together.
          </p>
        </div>

        <div className="wcu-grid">
          {features.map((f, i) => (
            <div className="wcu-card" key={i}>
              <div className="wcu-card__icon-wrap" style={{ '--card-accent': f.accent }}>
                {f.icon}
              </div>
              <span className="wcu-card__label">{f.label}</span>
              <h3 className="wcu-card__title">{f.title}</h3>
              <p className="wcu-card__desc">{f.desc}</p>
              <div className="wcu-card__bar" style={{ background: f.accent }} />
            </div>
          ))}
        </div>

        <CTA />
      </div>
      <div className="white-overlay"></div>
    </section>
  );
};

export default WhyChooseUs;
