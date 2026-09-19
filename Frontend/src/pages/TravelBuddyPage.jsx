import React from 'react';
import { Link } from 'react-router-dom';
import PageMeta from '../hooks/usePageMeta';
import './TravelBuddyPage.css';

const features = [
  { icon: 'fas fa-comments', title: 'Natural conversations', desc: 'Tell Vi what you want in normal language. Vi keeps the travel context and helps you turn an idea into a practical next step.' },
  { icon: 'fas fa-route', title: 'Trip planning', desc: 'Build routes, compare travel options and organize the trip around your dates, budget, pace and interests.' },
  { icon: 'fas fa-map-marked-alt', title: 'Help during the trip', desc: 'Use Vi for local ideas, nearby places, practical questions and changes while you are already traveling.' },
  { icon: 'fas fa-language', title: 'Multilingual support', desc: 'Plan in the language that feels natural to you. Vi can follow the language you use in the conversation.' },
  { icon: 'fas fa-sync-alt', title: 'Plans that can change', desc: 'Trips change. Vi can help adjust an itinerary, rethink a day or compare another route without starting over.' },
  { icon: 'fas fa-compass', title: 'One travel ecosystem', desc: 'Flights, stays, cars, activities, trains, buses, transfers, city passes and other OptionTrip services stay connected.' },
];

const steps = [
  { num: '01', title: 'Tell Vi what you need', desc: 'A destination, a rough idea or even just a budget is enough to start.' },
  { num: '02', title: 'Compare the possibilities', desc: 'Vi helps narrow the options and points you to the right OptionTrip search or partner.' },
  { num: '03', title: 'Refine the trip', desc: 'Change dates, priorities, pace or route and continue from the same travel context.' },
  { num: '04', title: 'Keep Vi with you', desc: 'Come back before, during and after the trip when you need the next answer.' },
];

const TravelBuddyPage = () => (
  <div className="tb-page">
    <PageMeta
      title="Meet Vi - Your Personal Travel Partner"
      description="Meet Vi, OptionTrip's personal travel partner for planning, comparing and navigating your trip across the OptionTrip travel ecosystem."
      keywords="AI travel assistant, travel partner, Vi, trip planner, travel planning, OptionTrip"
      path="/travel-buddy"
    />

    <section className="tb-hero" style={{ backgroundImage: 'url(/images/bg/bg2.jpg)' }}>
      <div className="container">
        <div className="tb-hero__content">
          <span className="tb-eyebrow"><i className="fas fa-plane" aria-hidden="true" /> Meet Vi</span>
          <h1>Your Personal Travel Partner</h1>
          <p>Vi is OptionTrip's intelligent travel partner, built to help you plan, compare, decide and keep moving throughout the whole trip.</p>
          <Link to="/" className="tb-primary-cta">Start planning with Vi <i className="fas fa-arrow-right" aria-hidden="true" /></Link>
        </div>
      </div>
    </section>

    <section className="tb-section">
      <div className="container">
        <div className="tb-intro-grid">
          <div className="tb-intro-visual">
            <img src="/images/illu1.png" alt="Illustration of travel planning with Vi" loading="lazy" />
          </div>
          <div className="tb-intro-copy">
            <p className="tb-kicker">WHY VI</p>
            <h2>Travel planning that stays with you</h2>
            <p>Vi is more than a one-time itinerary generator. The goal is to connect inspiration, search, booking options, preparation and help on the road in one continuous OptionTrip experience.</p>
            <p>Start with as much or as little information as you have. Vi can help you decide what to do next and move you into the right travel service when you are ready.</p>
          </div>
        </div>
      </div>
    </section>

    <section className="tb-section tb-section--soft">
      <div className="container">
        <div className="tb-section-heading">
          <p className="tb-kicker">CAPABILITIES</p>
          <h2>What Vi can help you do</h2>
          <p>Useful help before the trip, while you travel and when plans change.</p>
        </div>
        <div className="tb-features">
          {features.map(feature => (
            <article className="tb-feature" key={feature.title}>
              <div className="tb-feature__icon"><i className={feature.icon} aria-hidden="true" /></div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="tb-section">
      <div className="container">
        <div className="tb-section-heading">
          <p className="tb-kicker">HOW IT WORKS</p>
          <h2>A simple travel flow</h2>
        </div>
        <div className="tb-steps">
          {steps.map(step => (
            <article className="tb-step" key={step.num}>
              <div className="tb-step__num">{step.num}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="tb-cta">
      <div className="container">
        <h2>Ready to plan your next trip?</h2>
        <p>Start with the search you need now, or use Vi when you want help deciding what comes next.</p>
        <Link to="/" className="tb-secondary-cta">Start on OptionTrip</Link>
      </div>
    </section>
  </div>
);

export default TravelBuddyPage;
