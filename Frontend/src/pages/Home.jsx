import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PageMeta from '../hooks/usePageMeta';
import Banner from '../components/Banner/Banner';
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
      refreshProfile()
        .then(() => {
          navigate('/', { replace: true });
        })
        .catch((err) => {
          console.error('Failed to fetch profile:', err);
          navigate('/', { replace: true });
        });
    }

    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [location.search, navigate, refreshProfile]);

  if (loading) {
    return <Loader size="fullpage" />;
  }

  return (
    <>
      <PageMeta
        title="Your Personal Travel Partner Vi"
        description="Plan, compare and organize your trip with Travel Partner Vi, including flights, stays, cars, activities, transport, eSIM and other connected travel services."
        path="/"
      />
      <WelcomeModal />
      <Banner />
      <HomeBookingSection />
      <TravelEcosystemSection />
      <HowItWorksSection />
      <WhyChooseUs ctaOnly />
      <FeaturedBlogSection />
    </>
  );
};

export default Home;
