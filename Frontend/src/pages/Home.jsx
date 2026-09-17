import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PageMeta from '../hooks/usePageMeta';
import Banner from '../components/Banner/Banner';
import FeaturedBlogSection from '../components/FeaturedBlogSection/FeaturedBlogSection';
import WhyChooseUs from '../components/WhyChooseUs/WhyChooseUs';
import HowItWorksSection from '../components/HowItWorksSection/HowItWorksSection';
import HomeBookingSection from '../components/HomeBookingSection/HomeBookingSection';
import TravelEcosystemSection from '../components/TravelEcosystemSection/TravelEcosystemSection';
import WelcomeModal from '../components/WelcomeModal/WelcomeModal';
import { setAccessToken } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshProfile } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (!token) return;

    setAccessToken(token);
    refreshProfile()
      .catch((err) => {
        console.error('Failed to fetch profile:', err);
      })
      .finally(() => {
        navigate('/', { replace: true });
      });
  }, [location.search, navigate, refreshProfile]);

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
