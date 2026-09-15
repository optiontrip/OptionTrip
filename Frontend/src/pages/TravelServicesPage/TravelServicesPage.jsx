import React from 'react';
import { Link } from 'react-router-dom';
import './TravelServicesPage.css';

const services = [
  { icon: 'fa-plane', title: 'Flights', text: 'Compare flight options and continue with live booking partners.', to: '/flights', status: 'Search now' },
  { icon: 'fa-building', title: 'Stays', text: 'Find hotels and places to stay for your trip.', to: '/hotels', status: 'Search now' },
  { icon: 'fa-car', title: 'Car Rental', text: 'Compare rental cars for your destination.', to: '/car-rental', status: 'Search now' },
  { icon: 'fa-ticket', title: 'Tours & Activities', text: 'Attractions, tickets, city experiences and guided tours.', to: '/tours', status: 'Explore' },
  { icon: 'fa-train', title: 'Trains & Buses', text: 'Ground transportation for city-to-city travel.', to: '/travel-buddy?service=ground-transport', status: 'Ask Vi' },
  { icon: 'fa-taxi', title: 'Transfers', text: 'Airport and city transfers matched to your itinerary.', to: '/travel-buddy?service=transfers', status: 'Ask Vi' },
  { icon: 'fa-wifi', title: 'eSIM', text: 'Stay connected abroad with travel eSIM options.', to: '/esim', status: 'Compare' },
  { icon: 'fa-shield', title: 'Travel Insurance', text: 'Explore insurance options based on destination and trip type.', to: '/travel-buddy?service=insurance', status: 'Ask Vi' },
  { icon: 'fa-ship', title: 'Ferries & Sea Travel', text: 'Include ferries and other sea connections in your journey.', to: '/travel-buddy?service=ferries', status: 'Ask Vi' },
  { icon: 'fa-suitcase', title: 'Luggage Storage', text: 'Find convenient storage between checkout, arrival and departure.', to: '/travel-buddy?service=luggage-storage', status: 'Ask Vi' },
  { icon: 'fa-map', title: 'City Passes', text: 'Bundle attractions and local experiences where available.', to: '/travel-buddy?service=city-passes', status: 'Ask Vi' },
  { icon: 'fa-bicycle', title: 'Bikes & Scooters', text: 'Add flexible local mobility to the trip.', to: '/travel-buddy?service=local-mobility', status: 'Ask Vi' },
  { icon: 'fa-clock', title: 'Flight Compensation', text: 'Check options after eligible delays, cancellations or disruptions.', to: '/travel-buddy?service=flight-compensation', status: 'Check with Vi' },
];

export default function TravelServicesPage() {
  return (
    <main className="travel-services-page">
      <section className="travel-services-hero">
        <div className="container">
          <span className="travel-services-eyebrow">OPTIONTRIP TRAVEL MARKETPLACE</span>
          <h1>Everything your trip needs, connected in one place.</h1>
          <p>Search core bookings directly and use Vi to connect transportation, protection, connectivity and experiences to the same journey.</p>
          <div className="travel-services-actions">
            <Link className="nir-btn" to="/travel-buddy?intent=plan-trip">Plan with Vi</Link>
            <Link className="travel-services-secondary" to="/my-trips">My Trips</Link>
          </div>
        </div>
      </section>
      <section className="container travel-services-grid" aria-label="Travel services">
        {services.map(service => (
          <Link className="travel-service-card" to={service.to} key={service.title}>
            <div className="travel-service-icon"><i className={`fa ${service.icon}`} aria-hidden="true"></i></div>
            <div className="travel-service-copy"><h2>{service.title}</h2><p>{service.text}</p></div>
            <span className="travel-service-status">{service.status} <i className="fa fa-arrow-right" aria-hidden="true"></i></span>
          </Link>
        ))}
      </section>
      <section className="container travel-services-trust">
        <strong>Price integrity first.</strong>
        <span>OptionTrip does not present invented prices as live offers. Availability and prices are confirmed by the relevant booking provider.</span>
      </section>
    </main>
  );
}
