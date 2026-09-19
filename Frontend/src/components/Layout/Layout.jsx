import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import Preloader from '../Preloader/Preloader';
import SearchPopup from '../SearchPopup/SearchPopup';
import TravelServiceRail from '../TravelServiceRail/TravelServiceRail';
import ViAssistant from '../ViAssistant/ViAssistant';

const MOBILE_SEARCH_SURFACES = [
  '/',
  '/flights',
  '/hotels',
  '/car-rental',
  '/tours',
  '/esim',
  '/services',
  '/plan-my-day',
  '/where-can-i-go',
];

const Layout = ({ children }) => {
  const location = useLocation();
  const suppressFloatingVi = MOBILE_SEARCH_SURFACES.some(path => (
    path === '/'
      ? location.pathname === '/'
      : location.pathname === path || location.pathname.startsWith(`${path}/`)
  ));

  return (
    <>
      <Preloader />
      <Header />
      <TravelServiceRail />
      <main>
        {children}
      </main>
      <Footer />
      <SearchPopup />
      <div className={suppressFloatingVi ? 'vi-mobile-suppressed' : ''}>
        <ViAssistant />
      </div>
    </>
  );
};

export default Layout;
