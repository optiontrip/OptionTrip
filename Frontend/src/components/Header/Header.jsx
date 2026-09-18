import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { PRIMARY_HEADER_NAV } from '../../config/headerNav';
import { getHeaderUiLabels } from '../../config/headerUiLabels';
import { getTravelServiceLabels } from '../../config/travelServiceLabels';
import ThemeSwitcher from '../ThemeSwitcher/ThemeSwitcher';
import NotificationBell from '../NotificationBell/NotificationBell';
import BookingServiceMenu from './BookingServiceMenu';
import './Header.css';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' }, { code: 'fr', name: 'Français', flag: '🇫🇷' }, { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Español', flag: '🇪🇸' }, { code: 'it', name: 'Italiano', flag: '🇮🇹' }, { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' }, { code: 'uk', name: 'Українська', flag: '🇺🇦' }, { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' }, { code: 'ar', name: 'العربية', flag: '🇸🇦' }, { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'bn', name: 'বাংলা', flag: '🇧🇩' }, { code: 'zh', name: '中文', flag: '🇨🇳' }, { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' }, { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' }, { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'th', name: 'ภาษาไทย', flag: '🇹🇭' }, { code: 'hu', name: 'Magyar', flag: '🇭🇺' }, { code: 'sv', name: 'Svenska', flag: '🇸🇪' }, { code: 'sr', name: 'Srpski', flag: '🇷🇸' },
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isAuthDropdownOpen, setIsAuthDropdownOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [langDropdownPos, setLangDropdownPos] = useState({ top: 0, right: 0 });

  const location = useLocation();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const uiLabels = getHeaderUiLabels(i18n.language);
  const serviceLabels = getTravelServiceLabels(i18n.language);

  const closeTimeout = useRef(null);
  const bookingRef = useRef(null);
  const langRef = useRef(null);
  const langBtnRef = useRef(null);

  const navItems = PRIMARY_HEADER_NAV.map(item => ({
    ...item,
    label: item.serviceLabel
      ? (serviceLabels[item.serviceLabel] || item.fallback)
      : (uiLabels[item.id] || item.fallback),
  }));

  useEffect(() => {
    const fetchLocation = async () => {
      const cachedLocation = localStorage.getItem('userLocation');
      const cachedTime = localStorage.getItem('userLocationTime');
      if (cachedLocation && cachedTime && parseInt(cachedTime, 10) > Date.now() - 3600000) {
        setUserLocation(cachedLocation);
        setIsLoadingLocation(false);
        return;
      }
      if (!('geolocation' in navigator)) {
        setUserLocation(uiLabels.location);
        setIsLoadingLocation(false);
        return;
      }
      navigator.geolocation.getCurrentPosition(async ({ coords }) => {
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=10&addressdetails=1`, {
            headers: { 'Accept-Language': i18n.language || 'en' },
          });
          if (response.ok) {
            const data = await response.json();
            const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || '';
            const country = data.address?.country || '';
            const value = city && country ? `${city}, ${country}` : city || country || uiLabels.location;
            setUserLocation(value);
            localStorage.setItem('userLocation', value);
            localStorage.setItem('userLocationTime', Date.now().toString());
          }
        } catch {
          setUserLocation(uiLabels.location);
        }
        setIsLoadingLocation(false);
      }, () => {
        setUserLocation(uiLabels.location);
        setIsLoadingLocation(false);
      }, { timeout: 10000, maximumAge: 300000 });
    };
    fetchLocation();
  }, [i18n.language, uiLabels.location]);

  useEffect(() => {
    const handler = e => {
      if (!langBtnRef.current?.contains(e.target) && !langRef.current?.contains(e.target)) setIsLangOpen(false);
      if (!bookingRef.current?.contains(e.target)) setIsBookingOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setIsBookingOpen(false);
    setIsMenuOpen(false);
    setIsAuthDropdownOpen(false);
  }, [location.pathname, i18n.language]);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        setIsBookingOpen(false);
        setIsLangOpen(false);
        setIsAuthDropdownOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const closeMenu = () => setIsMenuOpen(false);
  const isActive = path => location.pathname === path ? 'active' : '';
  const openAuthDropdown = () => { clearTimeout(closeTimeout.current); setIsAuthDropdownOpen(true); };
  const closeAuthDropdown = () => { closeTimeout.current = setTimeout(() => setIsAuthDropdownOpen(false), 150); };
  const closeAuthDropdownImmediately = () => { clearTimeout(closeTimeout.current); setIsAuthDropdownOpen(false); };
  const handleLogout = async () => {
    try { await logout(); closeAuthDropdownImmediately(); navigate('/'); }
    catch (e) { console.error('Logout error:', e); }
  };
  const handleLangChange = code => { i18n.changeLanguage(code); setIsLangOpen(false); };
  const currentLang = LANGUAGES.find(l => l.code === (i18n.language?.split('-')[0] || 'en')) || LANGUAGES[0];
  const openLangDropdown = () => {
    if (langBtnRef.current) {
      const rect = langBtnRef.current.getBoundingClientRect();
      setLangDropdownPos({ top: rect.bottom + 8, right: Math.max(8, window.innerWidth - rect.right) });
    }
    setIsLangOpen(v => !v);
  };
  const formatDate = () => {
    try { return new Date().toLocaleDateString(i18n.language || 'en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); }
    catch { return new Date().toLocaleDateString('en-US'); }
  };
  const renderNavItem = (item, mobile = false) => (
    <li key={item.id} className={item.to ? isActive(item.to) : ''}>
      {item.href
        ? <a href={item.href} target="_blank" rel="noopener noreferrer" onClick={mobile ? closeMenu : undefined}>{item.label}</a>
        : <Link to={item.to} onClick={mobile ? closeMenu : undefined}>{item.label}</Link>}
    </li>
  );

  return <header className="main_header_area">
    <div className="header-content py-1 bg-theme">
      <div className="container d-flex align-items-center justify-content-between">
        <div className="links"><ul>
          <li><span className="white header-status-item"><i className="icon-calendar white" /> {formatDate()}</span></li>
          <li><span className="white location-display header-status-item"><i className="icon-location-pin white" /> {isLoadingLocation ? <span className="location-loading">{uiLabels.detectingLocation}</span> : <span>{userLocation || uiLabels.location}</span>}</span></li>
        </ul></div>
        <div className="header-right d-flex align-items-center gap-2">
          <ul className="header-social-list">
            <li><a href="https://www.facebook.com/optiontrip" target="_blank" rel="noopener noreferrer" className="white" aria-label="Facebook"><i className="fab fa-facebook" /></a></li>
            <li><a href="https://x.com/OptionTripCom" target="_blank" rel="noopener noreferrer" className="white" aria-label="X"><i className="fab fa-twitter" /></a></li>
            <li><a href="https://www.instagram.com/option_trip" target="_blank" rel="noopener noreferrer" className="white" aria-label="Instagram"><i className="fab fa-instagram" /></a></li>
          </ul>
          <NotificationBell />
          <ThemeSwitcher />
          <div className="header-lang">
            <button ref={langBtnRef} className="header-lang__toggle" onClick={openLangDropdown} aria-label={uiLabels.language} aria-expanded={isLangOpen}>
              <i className="fa fa-globe" /><span className="header-lang__flag">{currentLang.flag}</span><span className="header-lang__code">{currentLang.code.toUpperCase()}</span><i className={`icon-arrow-down header-lang__arrow ${isLangOpen ? 'open' : ''}`} />
            </button>
            {isLangOpen && createPortal(<div className="header-lang__dropdown" style={{ top: langDropdownPos.top, right: langDropdownPos.right }} ref={langRef} role="menu">{LANGUAGES.map(lang => <button key={lang.code} className={`header-lang__option ${lang.code === currentLang.code ? 'active' : ''}`} onClick={() => handleLangChange(lang.code)} role="menuitem"><span className="header-lang__option-flag">{lang.flag}</span><span className="header-lang__option-name">{lang.name}</span></button>)}</div>, document.body)}
          </div>
        </div>
      </div>
    </div>

    <div className="header_menu" id="header_menu"><nav className="navbar navbar-default"><div className="container"><div className="navbar-flex d-flex align-items-center justify-content-between w-100">
      <div className="navbar-header"><Link className="navbar-brand" to="/"><img src="/images/newLogo.png" alt="OptionTrip" /></Link></div>
      <div className="navbar-collapse1 d-flex align-items-center"><ul className="nav navbar-nav" id="responsive-menu">
        {renderNavItem(navItems[0])}
        <li ref={bookingRef} className={`dropdown submenu nav-bookings ${isBookingOpen ? 'nav-bookings--open' : ''}`} onMouseEnter={() => setIsBookingOpen(true)} onMouseLeave={() => setIsBookingOpen(false)}>
          <button type="button" className="dropdown-toggle nav-bookings__toggle" onClick={() => setIsBookingOpen(v => !v)} aria-haspopup="true" aria-expanded={isBookingOpen}>{serviceLabels.booking}<i className={`icon-arrow-down nav-bookings__arrow ${isBookingOpen ? 'open' : ''}`} /></button>
          {isBookingOpen && <div className="nav-bookings__mega"><BookingServiceMenu onNavigate={() => setIsBookingOpen(false)} /></div>}
        </li>
        {navItems.slice(1).map(item => renderNavItem(item))}
        <li className="search-main"><a href="#search1" className="mt_search" aria-label={uiLabels.search}><i className="fa fa-search" /></a></li>
      </ul></div>
      <div className="register-login d-flex align-items-center gap-3">
        <div className="auth-dropdown-wrapper" onMouseEnter={openAuthDropdown} onMouseLeave={closeAuthDropdown}>
          <button className="auth-dropdown-toggle" onClick={() => setIsAuthDropdownOpen(v => !v)} aria-expanded={isAuthDropdownOpen}>
            {isAuthenticated ? <><div className="profile-icon">{user?.profileImage ? <img src={user.profileImage} alt={user.name || uiLabels.profile} /> : <i className="icon-user" />}</div><span>{user?.name || uiLabels.profile}</span></> : <><i className="icon-user" /><span>{uiLabels.account}</span></>}
            <i className={`icon-arrow-down dropdown-arrow ${isAuthDropdownOpen ? 'open' : ''}`} />
          </button>
          {isAuthDropdownOpen && <div className="auth-dropdown-menu">{isAuthenticated ? <><Link to="/profile" className="auth-dropdown-item" onClick={closeAuthDropdownImmediately}>{uiLabels.myProfile}</Link><Link to="/my-trips" className="auth-dropdown-item" onClick={closeAuthDropdownImmediately}>{uiLabels.myTrips}</Link><button className="auth-dropdown-item logout-item" onClick={handleLogout}>{uiLabels.logout}</button></> : <><Link to="/login" className="auth-dropdown-item" onClick={closeAuthDropdownImmediately}>{uiLabels.login}</Link><Link to="/signup" className="auth-dropdown-item" onClick={closeAuthDropdownImmediately}>{uiLabels.signUp}</Link></>}</div>}
        </div>
        <Link to="/contact" className="nir-btn white">{uiLabels.contact}</Link>
      </div>
      <button className={`hamburger ${isMenuOpen ? 'hamburger--open' : ''}`} onClick={() => setIsMenuOpen(v => !v)} aria-label={uiLabels.menu} aria-expanded={isMenuOpen}><span /><span /><span /></button>
    </div></div></nav></div>

    {isMenuOpen && <div className="mobile-overlay" onClick={closeMenu} />}
    <aside className={`mobile-drawer ${isMenuOpen ? 'mobile-drawer--open' : ''}`} aria-hidden={!isMenuOpen}>
      <div className="mobile-drawer__header"><Link to="/" onClick={closeMenu}><img src="/images/newLogo.png" alt="OptionTrip" /></Link><button className="mobile-drawer__close" onClick={closeMenu} aria-label={uiLabels.close}><i className="fa fa-times" /></button></div>
      <nav className="mobile-drawer__nav"><ul>
        {renderNavItem(navItems[0], true)}
        <li className="mobile-drawer__booking"><div className="mobile-drawer__section-title">{serviceLabels.booking}</div><BookingServiceMenu mobile onNavigate={closeMenu} /></li>
        {navItems.slice(1).map(item => renderNavItem(item, true))}
        <li className={isActive('/contact')}><Link to="/contact" onClick={closeMenu}>{uiLabels.contact}</Link></li>
      </ul></nav>
      <div className="mobile-drawer__lang"><p className="mobile-drawer__lang-label"><i className="fa fa-globe" /> {uiLabels.language}</p><div className="mobile-drawer__lang-grid">{LANGUAGES.map(lang => <button key={lang.code} title={lang.name} aria-label={lang.name} className={`mobile-drawer__lang-btn ${lang.code === currentLang.code ? 'active' : ''}`} onClick={() => { handleLangChange(lang.code); closeMenu(); }}><span>{lang.flag}</span><span>{lang.code.toUpperCase()}</span></button>)}</div></div>
      <div className="mobile-drawer__auth">{isAuthenticated ? <><Link to="/profile" className="mobile-drawer__auth-item" onClick={closeMenu}>{uiLabels.myProfile}</Link><Link to="/my-trips" className="mobile-drawer__auth-item" onClick={closeMenu}>{uiLabels.myTrips}</Link><button className="mobile-drawer__auth-item mobile-drawer__logout" onClick={() => { handleLogout(); closeMenu(); }}>{uiLabels.logout}</button></> : <><Link to="/login" className="mobile-drawer__auth-item" onClick={closeMenu}>{uiLabels.login}</Link><Link to="/signup" className="mobile-drawer__auth-item mobile-drawer__signup" onClick={closeMenu}>{uiLabels.signUp}</Link></>}</div>
    </aside>
  </header>;
};

export default Header;
