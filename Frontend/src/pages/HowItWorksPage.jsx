import React from 'react';
import { Link } from 'react-router-dom';
import PageMeta from '../hooks/usePageMeta';
import TravelEcosystemSection from '../components/TravelEcosystemSection/TravelEcosystemSection';

const HowItWorksPage = () => {
  const steps = [
    { num: '01', icon: 'fas fa-compass', title: 'Discover', desc: 'Start with a destination, an idea, a passport, a budget, or simply the kind of trip you want.', to: '/where-can-i-go', action: 'Find where you can go' },
    { num: '02', icon: 'fas fa-map-marked-alt', title: 'Plan With Vi', desc: 'Add dates, budget, travelers, interests and pace. Vi keeps the trip context together as the plan develops.', to: '/travel-buddy?intent=plan-trip', action: 'Plan with Vi' },
    { num: '03', icon: 'fas fa-search-dollar', title: 'Compare Travel Options', desc: 'Compare the services already connected to OptionTrip and let Vi help with the rest without inventing availability.', to: '/services', action: 'Open travel services' },
    { num: '04', icon: 'fas fa-suitcase-rolling', title: 'Prepare & Travel', desc: 'Keep practical needs together: entry preparation, connectivity, transfers, luggage, insurance and on-trip help.', to: '/services#prepare', action: 'Prepare the trip' },
    { num: '05', icon: 'fas fa-route', title: 'Remember & Return', desc: 'Use saved trips and preferences so the next journey starts smarter instead of starting from zero.', to: '/my-trips', action: 'Open my trips' },
  ];

  const principles = [
    { icon: 'fas fa-user-circle', title: 'Built Around You', desc: 'Your destination, budget, interests, timing and travel style should shape the plan.', to: '/profile' },
    { icon: 'fas fa-link', title: 'One Connected Journey', desc: 'Planning, comparison, trip context, live assistance and memories belong together.', to: '/services' },
    { icon: 'fas fa-globe', title: 'Made For Global Travel', desc: 'Move between countries, cities, transportation systems and languages without losing trip context.', to: '/destinations' },
    { icon: 'fas fa-lightbulb', title: 'Useful Before Commercial', desc: 'Vi should recommend what helps the traveler first and connect a booking option only when it is relevant.', to: '/travel-buddy' },
  ];

  return (
    <>
      <PageMeta
        title="How OptionTrip Works"
        description="See how OptionTrip and Travel Partner Vi connect discovery, planning, comparison, trip preparation, live travel context, and memories."
        keywords="how optiontrip works, Travel Partner Vi, AI travel planner, trip planning"
        path="/how-it-works"
      />

      <div className="banner pt-8 pb-7 overflow-hidden" style={{ backgroundImage: 'url(/images/bg/bg3.jpg)' }}>
        <div className="container">
          <div className="banner-in">
            <div className="row align-items-center">
              <div className="col-lg-10 mx-auto">
                <div className="banner-content text-center">
                  <h4 className="theme mb-2" style={{ color: '#fdc703', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>How OptionTrip Works</h4>
                  <h1 style={{ color: 'rgb(255 255 255 / 90%)', textShadow: '0 3px 12px rgba(0,0,0,0.5)' }}>One Travel Partner For The Whole Journey</h1>
                  <p className="mb-4 mx-auto" style={{ color: 'rgba(255,255,255,0.92)', maxWidth: '800px', textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>
                    Start with an idea, compare what matters, book through connected services, prepare properly, and keep Vi with the trip before, during and after travel.
                  </p>
                  <Link to="/travel-buddy?intent=plan-trip" className="btn-white">Start Planning With Vi</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section style={{ padding: '70px 0', background: '#fff' }}>
        <div className="container">
          <div className="text-center mb-5">
            <h4 style={{ color: '#029e9d' }}>The Travel Lifecycle</h4>
            <h2 style={{ color: '#17233e' }}>From An Idea To The Next Journey</h2>
            <p style={{ color: '#777', maxWidth: '760px', margin: '0 auto' }}>These are no longer static explanation cards. Each step opens a real OptionTrip workflow.</p>
          </div>
          <div className="row g-4">
            {steps.map(step => (
              <div className="col-lg-4 col-md-6" key={step.num}>
                <Link
                  to={step.to}
                  style={{ display: 'flex', flexDirection: 'column', background: '#f8f9fa', border: '1px solid rgba(23,35,62,.06)', borderRadius: 18, padding: 30, height: '100%', textDecoration: 'none', color: 'inherit', boxShadow: '0 10px 28px rgba(20,45,80,.04)' }}
                >
                  <div style={{ color: '#029e9d', fontWeight: 800, marginBottom: 12 }}>{step.num}</div>
                  <i className={step.icon} style={{ color: '#0A539D', fontSize: 30, marginBottom: 16 }}></i>
                  <h4 style={{ color: '#17233e' }}>{step.title}</h4>
                  <p style={{ color: '#666', marginBottom: 20 }}>{step.desc}</p>
                  <span style={{ marginTop: 'auto', color: '#0A539D', fontWeight: 800, fontSize: 13 }}>{step.action} <i className="fa fa-arrow-right" aria-hidden="true" /></span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TravelEcosystemSection />

      <section style={{ padding: '70px 0', background: '#fff' }}>
        <div className="container">
          <div className="text-center mb-5">
            <h4 style={{ color: '#029e9d' }}>What We Are Building For</h4>
            <h2 style={{ color: '#17233e' }}>Useful Travel Technology, Not Template Promises</h2>
          </div>
          <div className="row g-4">
            {principles.map(item => (
              <div className="col-lg-3 col-md-6" key={item.title}>
                <Link to={item.to} style={{ display: 'block', background: '#f8fafb', border: '1px solid rgba(23,35,62,.06)', borderRadius: 16, padding: '30px 24px', height: '100%', textAlign: 'center', color: 'inherit', textDecoration: 'none' }}>
                  <i className={item.icon} style={{ color: '#029e9d', fontSize: 32, marginBottom: 16 }}></i>
                  <h5 style={{ color: '#17233e' }}>{item.title}</h5>
                  <p style={{ color: '#777', margin: 0 }}>{item.desc}</p>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '65px 0', background: 'linear-gradient(135deg, #0A539D 0%, #029e9d 100%)', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ color: '#fff' }}>Start With Your Next Trip</h2>
          <p style={{ color: 'rgba(255,255,255,.9)', maxWidth: 700, margin: '0 auto 26px' }}>Tell Vi what you are thinking about. You do not need to know which booking service or tool you need first.</p>
          <Link to="/travel-buddy?intent=plan-trip" className="btn-white">Meet Travel Partner Vi</Link>
        </div>
      </section>
    </>
  );
};

export default HowItWorksPage;
