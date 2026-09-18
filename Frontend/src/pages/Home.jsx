import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PageMeta from '../hooks/usePageMeta';
import FeaturedBlogSection from '../components/FeaturedBlogSection/FeaturedBlogSection';
import WhyChooseUs from '../components/WhyChooseUs/WhyChooseUs';
import HowItWorksSection from '../components/HowItWorksSection/HowItWorksSection';
import Loader from '../components/Loader/Loader';
import HomeBookingSection from '../components/HomeBookingSection/HomeBookingSection';
import TravelEcosystemSection from '../components/TravelEcosystemSection/TravelEcosystemSection';
import WelcomeModal from '../components/WelcomeModal/WelcomeModal';
import { setAccessToken } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshProfile } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token) {
      setAccessToken(token);
      refreshProfile().then(() => navigate('/', { replace: true })).catch(err => {
        console.error('Failed to fetch profile:', err);
        navigate('/', { replace: true });
      });
    }
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [location.search, navigate, refreshProfile]);

  if (loading) return <Loader size="fullpage" />;

  return <>
    <PageMeta title="Search and Compare Travel Prices" description="Search and compare flights, stays, car rental and other travel services with OptionTrip. Use Travel Partner Vi whenever you want help planning or comparing." path="/" />
    <WelcomeModal />
    <section className="container" style={{paddingTop:'34px',paddingBottom:'8px',textAlign:'center'}}>
      <span style={{fontWeight:800,fontSize:'12px',letterSpacing:'.1em',textTransform:'uppercase'}}>OptionTrip</span>
      <h1 style={{margin:'8px auto 10px',maxWidth:'850px',fontSize:'clamp(32px,5vw,54px)',lineHeight:1.08}}>Search prices. Compare options. Book your trip.</h1>
      <p style={{margin:'0 auto',maxWidth:'720px',fontSize:'17px',lineHeight:1.55,color:'#607086'}}>Start with what you need right now. You can search on your own, or ask Vi to help at any point.</p>
    </section>
    <HomeBookingSection />
    <section className="container" style={{textAlign:'center',padding:'8px 16px 24px'}}>
      <button type="button" className="nir-btn" onClick={() => navigate('/travel-buddy?intent=plan-trip')}>Not sure what to choose? Ask Vi</button>
    </section>
    <TravelEcosystemSection />
    <HowItWorksSection />
    <WhyChooseUs ctaOnly />
    <FeaturedBlogSection />
  </>;
};

export default Home;
