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
import './Home.css';

const getCurrentSeason = () => {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
};

const SEASONAL_COPY = {
  spring: { icon: '🌿', label: 'Spring travel season', detail: 'Fresh city breaks, nature trips and shoulder-season ideas' },
  summer: { icon: '☀️', label: 'Summer travel season', detail: 'Beach escapes, road trips and long-day adventures' },
  autumn: { icon: '🍂', label: 'Autumn travel season', detail: 'Fall colors, warm weekends and shoulder-season deals' },
  winter: { icon: '❄️', label: 'Winter travel season', detail: 'Snow trips, festive cities and warm-weather escapes' },
};

const Home = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshProfile } = useAuth();
  const season = getCurrentSeason();
  const seasonalCopy = SEASONAL_COPY[season];

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
    <section className={`home-seasonal-hero home-seasonal-hero--${season}`} data-season={season}>
      <div className="home-season-marker" aria-label={seasonalCopy.label}>
        <span className="home-season-marker__icon" aria-hidden="true">{seasonalCopy.icon}</span>
        <span className="home-season-marker__label">{seasonalCopy.label}</span>
        <span className="home-season-marker__detail">· {seasonalCopy.detail}</span>
      </div>
      <span className="home-seasonal-hero__brand">OptionTrip</span>
      <h1>Search prices. Compare options. Book your trip.</h1>
      <p className="home-seasonal-hero__lead">Start with what you need right now. You can search on your own, or ask Vi to help at any point.</p>
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
