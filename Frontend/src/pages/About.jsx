import React from 'react';
import PageMeta from '../hooks/usePageMeta';
import AboutUs from '../components/AboutUs/AboutUs';
import AboutSection from '../components/AboutSection/AboutSection';
import { CONTACT_EMAIL, CONTACT_MAILTO } from '../config/contact';

const About = () => <>
  <PageMeta title="About OptionTrip" description="Meet the young travel technology team behind OptionTrip and Travel Partner Vi." keywords="about OptionTrip, OptionTrip team, Travel Partner Vi, travel technology" path="/about" />
  <div className="banner pt-8 pb-7 overflow-hidden" style={{backgroundImage:`url(/images/testimonial.png)`}}><div className="container"><div className="banner-content text-center"><h4 className="theme mb-2">About OptionTrip</h4><h1>A Young Team Building A Better Way To Travel</h1><p className="mx-auto mb-4" style={{maxWidth:850}}>We are a young, ambitious travel technology team building OptionTrip for people who want travel to feel exciting instead of exhausting. Our goal is to bring useful information, planning, comparison, trip tools, and Travel Partner Vi into one experience that helps travelers make better decisions before, during, and after a journey.</p><a className="nir-btn" href="/#travel-buddy">Start Planning With Vi</a></div></div></div>
  <section style={{padding:'55px 0',background:'#fff'}}><div className="container"><div className="row justify-content-center"><div className="col-lg-9 text-center"><h2>What We Are Trying To Create</h2><p style={{fontSize:17,lineHeight:1.8,color:'#666'}}>We love the freedom, discovery, people, places, and memories that travel can bring. We also know how fragmented travel planning can be. OptionTrip is our attempt to make the entire journey easier to understand and manage, while still giving travelers choice. We are actively developing the platform, connecting legitimate travel services and data sources, improving Vi, and replacing old template material with features and information that actually belong to OptionTrip.</p><p style={{fontSize:17,lineHeight:1.8,color:'#666'}}>We are not presenting ourselves as a finished giant travel corporation. We are a growing team building toward a global personal travel partner, learning from real travelers and improving the product continuously.</p><p><strong>Questions, feedback, partnerships or ideas:</strong> <a href={CONTACT_MAILTO}>{CONTACT_EMAIL}</a></p></div></div></div></section>
  <AboutUs />
  <AboutSection />
</>;
export default About;
