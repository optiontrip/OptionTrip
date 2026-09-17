import React from 'react';
import { Link } from 'react-router-dom';
import './HowItWorksSection.css';

const steps = [
  {
    icon: 'fas fa-comment-dots',
    title: 'Describe the Trip You Want',
    desc: 'Tell Vi what kind of trip you are after - a warm beach in May, a food tour in Spain, or simply a budget and a mood.',
    to: '/travel-buddy?intent=discover',
    action: 'Start with Vi',
  },
  {
    icon: 'fas fa-map-marker-alt',
    title: 'Discover Matching Destinations',
    desc: 'Explore places that fit your dates, budget, passport situation and travel style instead of browsing random lists.',
    to: '/where-can-i-go',
    action: 'Find where to go',
  },
  {
    icon: 'fas fa-route',
    title: 'Build Your Trip',
    desc: 'Turn the idea into dates, route, travelers, budget and a connected plan that Vi can keep refining with you.',
    to: '/travel-buddy?intent=plan-trip',
    action: 'Build the trip',
  },
  {
    icon: 'fas fa-compass',
    title: 'Book, Prepare & Travel',
    desc: 'Use connected travel services for booking and preparation, then keep Vi with you for practical help during the journey.',
    to: '/services',
    action: 'Explore services',
  },
];

const HowItWorksSection = () => (
  <section className="hiw-section">
    <div className="container">
      <div className="hiw-header">
        <span className="hiw-eyebrow">How It Works</span>
        <h2 className="hiw-title">
          From Idea <span className="theme">to Itinerary</span>
        </h2>
        <p className="hiw-sub">Every step below is live - start with Vi, discover destinations, build the trip, or open the service marketplace.</p>
      </div>

      <div className="hiw-grid">
        {steps.map((step, i) => (
          <Link className="hiw-card" key={step.title} to={step.to}>
            <span className="hiw-card__num">{String(i + 1).padStart(2, '0')}</span>
            <div className="hiw-card__icon">
              <i className={step.icon}></i>
            </div>
            <h3 className="hiw-card__title">{step.title}</h3>
            <p className="hiw-card__desc">{step.desc}</p>
            <span className="hiw-card__action">
              {step.action} <i className="fa fa-arrow-right" aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>

      <div className="hiw-footer">
        <Link to="/how-it-works" className="hiw-link">
          See the full walkthrough
          <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </div>
    </div>
  </section>
);

export default HowItWorksSection;
