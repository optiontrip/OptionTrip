import React from 'react';
import './AboutUs.css';

const AboutUs = () => {
  const steps = [
    {
      icon: 'icon-compass',
      title: 'Discover & Plan',
      description: 'Tell Vi where you want to go or what kind of experience you want. Vi turns your dates, budget, interests, and preferences into a practical trip plan.'
    },
    {
      icon: 'icon-briefcase',
      title: 'Compare & Book',
      description: 'Bring flights, stays, transportation, activities, and other travel services into one decision flow so you can compare useful options without rebuilding the trip from scratch.'
    },
    {
      icon: 'icon-location-pin',
      title: 'Travel With Vi',
      description: 'Keep the trip context with you. Vi can use your itinerary and destination context to help with timing, weather, nearby ideas, route decisions, and changes while you travel.'
    },
    {
      icon: 'icon-flag',
      title: 'Remember & Return',
      description: 'Keep completed trips connected to your travel history so future recommendations can become more relevant and every journey can help shape the next one.'
    }
  ];

  return (
    <section className="about-us pb-6 pt-6" style={{backgroundImage: `url(/images/shape4.png)`, backgroundPosition: 'center'}}>
      <div className="container">
        <div className="section-title mb-6 w-75 mx-auto text-center">
          <h4 className="mb-1 theme1">One Connected Travel Journey</h4>
          <h2 className="mb-1">Vi Stays With You <span className="theme">Beyond The Search Box</span></h2>
          <p>OptionTrip is designed around the whole travel lifecycle, not a collection of disconnected template pages.</p>
        </div>
        <div className="why-us">
          <div className="why-us-box">
            <div className="row">
              {steps.map((step, index) => (
                <div key={index} className="col-lg-3 col-md-6 col-sm-6 mb-4">
                  <div className="why-us-item text-center p-4 py-5 border rounded bg-white h-100">
                    <div className="why-us-content">
                      <div className="why-us-icon"><i className={`${step.icon} theme`}></i></div>
                      <h4>{step.title}</h4>
                      <p className="mb-0">{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="white-overlay"></div>
    </section>
  );
};

export default AboutUs;
