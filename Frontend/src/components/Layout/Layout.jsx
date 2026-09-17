import React from 'react';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import Preloader from '../Preloader/Preloader';
import SearchPopup from '../SearchPopup/SearchPopup';
import TravelServiceRail from '../TravelServiceRail/TravelServiceRail';
import ViAssistant from '../ViAssistant/ViAssistant';

const Layout = ({ children }) => {
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
      <ViAssistant />
    </>
  );
};

export default Layout;
