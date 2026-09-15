import React from 'react';
import { Link } from 'react-router-dom';
import './TravelServicesGrid.css';

const SERVICES = [
  { icon: 'fa-plane', title: 'Flights', text: 'Compare routes and real flight options.', to: '/flights', live: true },
  { icon: 'fa-building', title: 'Stays', text: 'Hotels and places to stay for your trip.', to: '/hotels', live: true },
  { icon: 'fa-car', title: 'Car Rental', text: 'Find the right car for the route.', to: '/car-rental', live: true },
  { icon: 'fa-wifi', title: 'eSIM', text: 'Stay connected abroad without roaming surprises.', to: '/esim', live: true },
  { icon: 'fa-ticket', title: 'Tours & Activities', text: 'Experiences, attractions, tickets and local ideas.', to: '/tours', live: true },
  { icon: 'fa-train', title: 'Trains & Buses', text: 'Plan ground transport between cities and countries.', prompt: 'Help me find trains and buses for my trip' },
  { icon: 'fa-taxi', title: 'Transfers & Taxis', text: 'Airport pickups and door-to-door transfers.', prompt: 'Help me arrange an airport transfer or taxi' },
  { icon: 'fa-shield', title: 'Travel Insurance', text: 'Find the coverage that fits the trip.', prompt: 'Help me choose travel insurance for my trip' },
  { icon: 'fa-suitcase', title: 'Luggage Storage', text: 'Find a place to leave bags between check-out and departure.', prompt: 'Help me find luggage storage for my trip' },
  { icon: 'fa-calendar', title: 'Events & Tickets', text: 'Concerts, shows, sports and things happening while you travel.', prompt: 'Find events and tickets during my trip' },
  { icon: 'fa-bicycle', title: 'Bikes & Scooters', text: 'Explore locally with bike and scooter rental options.', prompt: 'Help me find bike or scooter rental for my trip' },
  { icon: 'fa-life-ring', title: 'Flight Compensation', text: 'Get help after eligible delays or cancellations.', prompt: 'Help me understand flight delay or cancellation compensation' },
];

const TravelServicesGrid = () => (
  <section className="travel-services" aria-labelledby="travel-services-title">
    <div className="container">
      <div className="travel-services__heading">
        <span className="travel-services__eyebrow">Everything for the trip</span>
        <h2 id="travel-services-title">One trip. More services. One Vi.</h2>
        <p>Start with what you need now. Vi keeps the whole journey connected instead of making you plan each part in a different place.</p>
      </div>
      <div className="travel-services__grid">
        {SERVICES.map(service => service.to ? (
          <Link key={service.title} to={service.to} className="travel-services__card">
            <span className="travel-services__icon"><i className={`fa ${service.icon}`} /></span>
            <span className="travel-services__copy"><strong>{service.title}</strong><small>{service.text}</small></span>
            <span className="travel-services__arrow" aria-hidden="true">→</span>
          </Link>
        ) : (
          <Link key={service.title} to="/travel-buddy" state={{ initialMessage: service.prompt }} className="travel-services__card travel-services__card--vi">
            <span className="travel-services__icon"><i className={`fa ${service.icon}`} /></span>
            <span className="travel-services__copy"><strong>{service.title}</strong><small>{service.text}</small></span>
            <span className="travel-services__vi">Ask Vi</span>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

export default TravelServicesGrid;
