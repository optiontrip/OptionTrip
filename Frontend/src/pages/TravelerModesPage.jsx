import React from 'react';
import { Link } from 'react-router-dom';
import PageMeta from '../hooks/usePageMeta';
import './TravelerModesPage.css';

const modes = [
  {
    icon: '♿',
    title: 'Accessible Travel',
    text: 'Plan around mobility, sensory, communication and assistance needs. Vi can help surface practical questions to verify before you book.',
    prompt: 'Help me plan an accessible trip and ask me what accommodations I need.',
  },
  {
    icon: '🏳️‍🌈',
    title: 'LGBTQ+ Travel',
    text: 'Plan with local laws, safety, culture and comfort in mind. Vi can help you research a destination without assuming how you travel.',
    prompt: 'Help me plan an LGBTQ+ friendly trip and flag destination-specific safety or legal considerations.',
  },
  {
    icon: '💼',
    title: 'Business Travel',
    text: 'Build efficient trips around meetings, airports, ground transport, connectivity and schedule constraints, with room for personal time.',
    prompt: 'Plan a business trip for me with an efficient schedule, airport transfers and reliable connectivity.',
  },
];

const askVi = (message) => {
  window.dispatchEvent(new CustomEvent('vi:open', { detail: { message } }));
};

export default function TravelerModesPage() {
  return (
    <>
      <PageMeta
        title="Travel Your Way"
        description="Accessible, LGBTQ+ and business travel planning with OptionTrip and Vi."
        path="/travel-your-way"
      />
      <main className="traveler-modes">
        <section className="traveler-modes__hero">
          <div className="container">
            <span className="traveler-modes__eyebrow">Travel should adapt to you</span>
            <h1>Plan the trip you actually need.</h1>
            <p>OptionTrip gives Vi the context to help with different travel needs while keeping the same trip, bookings, map and travel companion in one place.</p>
            <div className="traveler-modes__actions">
              <button type="button" onClick={() => askVi('Help me plan a trip around my specific travel needs.')}>Ask Vi</button>
              <Link to="/how-it-works">How OptionTrip works</Link>
            </div>
          </div>
        </section>

        <section className="container traveler-modes__grid" aria-label="Traveler planning modes">
          {modes.map((mode) => (
            <article className="traveler-mode-card" key={mode.title}>
              <span className="traveler-mode-card__icon" aria-hidden="true">{mode.icon}</span>
              <h2>{mode.title}</h2>
              <p>{mode.text}</p>
              <button type="button" onClick={() => askVi(mode.prompt)}>Plan with Vi</button>
            </article>
          ))}
        </section>

        <section className="container traveler-modes__principles">
          <div>
            <span className="traveler-modes__eyebrow">One Trip Object</span>
            <h2>Needs belong to the trip, not a separate dead-end tool.</h2>
          </div>
          <p>Start with Vi, continue in My Trips, keep your selected flight, hotel and car together, and use your Travel Map before, during and after the journey. Always verify critical accessibility, legal, safety and entry requirements with the venue, carrier or relevant authority before relying on them.</p>
        </section>
      </main>
    </>
  );
}
