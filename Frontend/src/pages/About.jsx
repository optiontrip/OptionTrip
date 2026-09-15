import React from 'react';
import PageMeta from '../hooks/usePageMeta';
import AboutUs from '../components/AboutUs/AboutUs';
import AboutSection from '../components/AboutSection/AboutSection';

const About = () => {
  return (
    <>
      <PageMeta
        title="About OptionTrip"
        description="Meet OptionTrip and Travel Partner Vi, the AI travel companion designed to help travelers plan, compare, book, prepare, travel, and remember every trip."
        keywords="about optiontrip, Travel Partner Vi, AI travel assistant, trip planner, travel technology"
        path="/about"
      />
      <div className="banner pt-8 pb-7 overflow-hidden" style={{backgroundImage: `url(/images/testimonial.png)`}}>
        <div className="container">
          <div className="banner-in">
            <div className="row align-items-center">
              <div className="col-lg-10 mx-auto">
                <div className="banner-content text-center">
                  <h4 className="theme mb-2">About OptionTrip</h4>
                  <h1>Your Personal Travel Partner, From Idea To Return</h1>
                  <p className="mb-4 mx-auto" style={{maxWidth: '820px'}}>
                    OptionTrip is building one connected travel experience around Travel Partner Vi. Discover where to go, plan the trip, compare options, prepare for departure, get help while traveling, and keep your journeys and memories together afterward.
                  </p>
                  <a className="nir-btn" href="/#travel-buddy">Start Planning With Vi</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <AboutUs />
      <AboutSection />
    </>
  );
};

export default About;
