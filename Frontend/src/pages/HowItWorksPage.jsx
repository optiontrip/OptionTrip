import React from 'react';
import { Link } from 'react-router-dom';
import PageMeta from '../hooks/usePageMeta';

const HowItWorksPage = () => {
  const steps = [
    { num: '01', icon: 'fas fa-compass', title: 'Discover', desc: 'Start with a destination, an idea, or simply the kind of trip you want. Vi can help turn an open-ended travel goal into useful choices.' },
    { num: '02', icon: 'fas fa-map-marked-alt', title: 'Plan With Vi', desc: 'Add dates, budget, travelers, interests, pace, and preferences. Travel Partner Vi keeps the trip context together as the plan develops.' },
    { num: '03', icon: 'fas fa-search-dollar', title: 'Compare Travel Options', desc: 'Use OptionTrip to compare the travel services available for your journey, including flights and stays, with more transportation and trip services being connected over time.' },
    { num: '04', icon: 'fas fa-suitcase-rolling', title: 'Prepare & Travel', desc: 'Keep your itinerary and trip context in one place. Vi is designed to help with useful destination information, timing, weather, nearby ideas, and changes during the journey.' },
    { num: '05', icon: 'fas fa-route', title: 'Remember & Plan The Next Trip', desc: 'Your travel history can make future planning more relevant. OptionTrip is building a travel map and memory layer so one journey can improve the next.' },
  ];

  const principles = [
    { icon: 'fas fa-user-circle', title: 'Built Around You', desc: 'Your destination, budget, interests, timing, and travel style should shape the plan.' },
    { icon: 'fas fa-link', title: 'One Connected Journey', desc: 'Planning, comparison, trip context, live assistance, and memories belong together.' },
    { icon: 'fas fa-globe', title: 'Made For Global Travel', desc: 'We are building OptionTrip for travelers moving between countries, cities, transportation systems, and languages.' },
    { icon: 'fas fa-lightbulb', title: 'Useful Before Commercial', desc: 'The goal is to recommend what helps the traveler, while connecting legitimate booking and partner options where available.' },
  ];

  return (
    <>
      <PageMeta title="How OptionTrip Works" description="See how OptionTrip and Travel Partner Vi connect discovery, planning, comparison, trip preparation, live travel context, and memories." keywords="how optiontrip works, Travel Partner Vi, AI travel planner, trip planning" path="/how-it-works" />
      <div className="banner pt-8 pb-7 overflow-hidden" style={{ backgroundImage: `url(/images/bg/bg3.jpg)` }}>
        <div className="container">
          <div className="banner-in">
            <div className="row align-items-center">
              <div className="col-lg-10 mx-auto">
                <div className="banner-content text-center">
                  <h4 className="theme mb-2" style={{ color: '#fdc703', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>How OptionTrip Works</h4>
                  <h1 style={{ color: 'rgb(255 255 255 / 90%)', textShadow: '0 3px 12px rgba(0,0,0,0.5)' }}>One Travel Partner For The Whole Journey</h1>
                  <p className="mb-4 mx-auto" style={{ color: 'rgba(255,255,255,0.92)', maxWidth: '800px', textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>OptionTrip is being built to reduce the number of disconnected searches and tools a traveler needs, with Travel Partner Vi keeping the trip context together.</p>
                  <Link to="/travel-buddy" className="btn-white">Plan With Vi</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section style={{ padding: '70px 0', background: '#fff' }}>
        <div className="container">
          <div className="text-center mb-5"><h4 style={{ color: '#029e9d' }}>The Travel Lifecycle</h4><h2 style={{ color: '#17233e' }}>From An Idea To The Next Journey</h2><p style={{ color: '#777', maxWidth: '760px', margin: '0 auto' }}>The platform is growing around a simple flow: discover, plan, compare, prepare, travel, remember, and return.</p></div>
          <div className="row g-4">{steps.map((step) => <div className="col-lg-4 col-md-6" key={step.num}><div style={{ background: '#f8f9fa', borderRadius: '18px', padding: '30px', height: '100%' }}><div style={{ color: '#029e9d', fontWeight: 800, marginBottom: 12 }}>{step.num}</div><i className={step.icon} style={{ color: '#0A539D', fontSize: 30, marginBottom: 16 }}></i><h4 style={{ color: '#17233e' }}>{step.title}</h4><p style={{ color: '#666', margin: 0 }}>{step.desc}</p></div></div>)}</div>
        </div>
      </section>

      <section style={{ padding: '70px 0', background: '#f8f9fa' }}><div className="container"><div className="text-center mb-5"><h4 style={{ color: '#029e9d' }}>What We Are Building For</h4><h2 style={{ color: '#17233e' }}>Useful Travel Technology, Not Template Promises</h2></div><div className="row g-4">{principles.map((item) => <div className="col-lg-3 col-md-6" key={item.title}><div style={{ background: '#fff', borderRadius: 16, padding: '30px 24px', height: '100%', textAlign: 'center' }}><i className={item.icon} style={{ color: '#029e9d', fontSize: 32, marginBottom: 16 }}></i><h5>{item.title}</h5><p style={{ color: '#777', margin: 0 }}>{item.desc}</p></div></div>)}</div></div></section>

      <section style={{ padding: '65px 0', background: 'linear-gradient(135deg, #0A539D 0%, #029e9d 100%)', textAlign: 'center' }}><div className="container"><h2 style={{ color: '#fff' }}>Start With Your Next Trip</h2><p style={{ color: 'rgba(255,255,255,.9)', maxWidth: 700, margin: '0 auto 26px' }}>Tell Vi what you are thinking about and build the journey from there.</p><Link to="/travel-buddy" className="btn-white">Meet Travel Partner Vi</Link></div></section>
    </>
  );
};

export default HowItWorksPage;
