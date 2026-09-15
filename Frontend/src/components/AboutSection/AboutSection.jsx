import React from 'react';
import './AboutSection.css';

const AboutSection = () => {
  return (
    <section className="about-us pt-0" style={{backgroundImage: `url(/images/bg/bg-trans.png)`}}>
      <div className="container">
        <div className="about-image-box">
          <div className="row d-flex align-items-center justify-content-between">
            <div className="col-lg-6 mb-4 pe-4">
              <div className="about-image overflow-hidden">
                <img src="/images/travel1.png" alt="Traveler using OptionTrip" />
              </div>
            </div>
            <div className="col-lg-6 mb-4 ps-4">
              <div className="about-content text-center text-lg-start mb-4">
                <h4 className="theme d-inline-block mb-0">Why OptionTrip</h4>
                <h2 className="border-b mb-2 pb-1">One Travel Partner Instead Of Dozens Of Disconnected Searches</h2>
                <p className="border-b mb-2 pb-2">
                  Travel planning usually gets scattered across search engines, booking sites, maps, notes, emails, and screenshots. OptionTrip is being built to connect those decisions around one trip and one assistant: Vi.<br /><br />The goal is simple: help you make better travel decisions before departure, stay useful while you are away, and remember enough about your preferences and past journeys to make the next trip easier.
                </p>
                <div className="about-listing">
                  <ul className="d-flex justify-content-between flex-wrap gap-3">
                    <li><i className="icon-location-pin theme"></i> Trip Context</li>
                    <li><i className="icon-compass theme"></i> Personalized Vi</li>
                    <li><i className="icon-briefcase theme"></i> Connected Booking</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="white-overlay"></div>
    </section>
  );
};

export default AboutSection;
