import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { PRIMARY_HEADER_NAV } from '../../config/headerNav';
import { SUPPORTED_LANGUAGES, normalizeLanguageCode } from '../../config/supportedLanguages';
import { getHeaderUiLabels } from '../../config/headerUiLabels';
import { getTravelServiceLabels } from '../../config/travelServiceLabels';
import ThemeSwitcher from '../ThemeSwitcher/ThemeSwitcher';
import NotificationBell from '../NotificationBell/NotificationBell';
import BookingServiceMenu from './BookingServiceMenu';
import HeaderTravelPreferences from './HeaderTravelPreferences';
import './Header.css';

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), select:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isAuthDropdownOpen, setIsAuthDropdownOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const languageCode = normalizeLanguageCode(i18n.language);
  const uiLabels = getHeaderUiLabels(languageCode);
  const serviceLabels = getTravelServiceLabels(languageCode);

  const closeTimeout = useRef(null);
  const bookingRef = useRef(null);
  const hamburgerRef = useRef(null);
  const drawerRef = useRef(null);
  const drawerCloseRef = useRef(null);
  const previousFocusRef = useRef(null);

  const navItems = PRIMARY_HEADER_NAV.map(item => ({
    ...item,
    label: item.serviceLabel
      ? (serviceLabels[item.serviceLabel] || item.fallback)
      : (uiLabels[item.headerLabel || item.id] || item.fallback),
  }));

  useEffect(() => {
    const fetchLocation = async () => {
      const locationKey = `userLocation:${languageCode}`;
      const locationTimeKey = `userLocationTime:${languageCode}`;
      const cachedLocation = localStorage.getItem(locationKey);
      const cachedTime = localStorage.getItem(locationTimeKey);

      setUserLocation(null);
      setIsLoadingLocation(true);

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
            headers: { 'Accept-Language': i18n.language || languageCode },
          });
          if (response.ok) {
            const data = await response.json();
            const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || '';
            const country = data.address?.country || '';
            const value = city && country ? `${city}, ${country}` : city || country || uiLabels.location;
            setUserLocation(value);
            localStorage.setItem(locationKey, value);
            localStorage.setItem(locationTimeKey, Date.now().toString());
          } else {
            setUserLocation(uiLabels.location);
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
  }, [i18n.language, languageCode, uiLabels.location]);

  useEffect(() => {
    const handler = event => {
      if (!bookingRef.current?.contains(event.target)) setIsBookingOpen(false);
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
    const drawer = drawerRef.current;
    if (drawer) drawer.inert = !isMenuOpen;

    document.body.style.overflow = isMenuOpen ? 'hidden' : '';

    if (isMenuOpen) {
      previousFocusRef.current = document.activeElement;
      requestAnimationFrame(() => drawerCloseRef.current?.focus());
    } else if (previousFocusRef.current instanceof HTMLElement) {
      const focusTarget = previousFocusRef.current;
      requestAnimationFrame(() => {
        if (document.contains(focusTarget)) focusTarget.focus();
      });
      previousFocusRef.current = null;
    }

    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  useEffect(() => {
    const onKey = event => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
        setIsBookingOpen(false);
        setIsAuthDropdownOpen(false);
        return;
      }

      if (event.key !== 'Tab' || !isMenuOpen || !drawerRef.current) return;
      const focusable = [...drawerRef.current.querySelectorAll(FOCUSABLE_SELECTOR)]
        .filter(element => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true');
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);
  const isActive = path => location.pathname === path ? 'active' : '';
  const openAuthDropdown = () => { clearTimeout(closeTimeout.current); setIsAuthDropdownOpen(true); };
  const closeAuthDropdown = () => { closeTimeout.current = setTimeout(() => setIsAuthDropdownOpen(false), 150); };
  const closeAuthDropdownImmediately = () => { clearTimeout(closeTimeout.current); setIsAuthDropdownOpen(false); };
  const handleLogout = async () => {
    try { await logout(); closeAuthDropdownImmediately(); navigate('/'); }
    catch (error) { console.error('Logout error:', error); }
  };
  const handleLangChange = code => i18n.changeLanguage(code);
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
          <HeaderTravelPreferences
            languages={SUPPORTED_LANGUAGES}
            languageCode={languageCode}
            onLanguageChange={handleLangChange}
            labels={uiLabels}
          />
        </div>
      </div>
    </div>

    <div className="header_menu" id="header_menu"><nav className="navbar navbar-default"><div className="container"><div className="navbar-flex d-flex align-items-center justify-content-between w-100">
      <div className="navbar-header"><Link className="navbar-brand" to="/"><img src="/images/newLogo.png" alt="OptionTrip" /></Link></div>
      <div className="navbar-collapse1 d-flex align-items-center"><ul className="nav navbar-nav" id="responsive-menu">
        {renderNavItem(navItems[0])}
        <li ref={bookingRef} className={`dropdown submenu nav-bookings ${isBookingOpen ? 'nav-bookings--open' : ''}`} onMouseEnter={() => setIsBookingOpen(true)} onMouseLeave={() => setIsBookingOpen(false)}>
          <button type="button" className="dropdown-toggle nav-bookings__toggle" onClick={() => setIsBookingOpen(open => !open)} aria-haspopup="true" aria-expanded={isBookingOpen}>{serviceLabels.all}<i className={`icon-arrow-down nav-bookings__arrow ${isBookingOpen ? 'open' : ''}`} /></button>
          {isBookingOpen && <div className="nav-bookings__mega"><BookingServiceMenu onNavigate={() => setIsBookingOpen(false)} /></div>}
        </li>
        {navItems.slice(1).map(item => renderNavItem(item))}
        <li className="search-main"><a href="#search1" className="mt_search" aria-label={uiLabels.search}><i className="fa fa-search" /></a></li>
      </ul></div>
      <div className="register-login d-flex align-items-center gap-3">
        <div className="auth-dropdown-wrapper" onMouseEnter={openAuthDropdown} onMouseLeave={closeAuthDropdown}>
          <button className="auth-dropdown-toggle" onClick={() => setIsAuthDropdownOpen(open => !open)} aria-expanded={isAuthDropdownOpen} aria-haspopup="menu">
            {isAuthenticated ? <><div className="profile-icon">{user?.profileImage ? <img src={user.profileImage} alt={user.name || uiLabels.profile} /> : <i className="icon-user" />}</div><span>{user?.name || uiLabels.profile}</span></> : <><i className="icon-user" /><span>{uiLabels.account}</span></>}
            <i className={`icon-arrow-down dropdown-arrow ${isAuthDropdownOpen ? 'open' : ''}`} />
          </button>
          {isAuthDropdownOpen && <div className="auth-dropdown-menu" role="menu">{isAuthenticated ? <><Link to="/profile" className="auth-dropdown-item" onClick={closeAuthDropdownImmediately} role="menuitem">{uiLabels.myProfile}</Link><Link to="/my-trips" className="auth-dropdown-item" onClick={closeAuthDropdownImmediately} role="menuitem">{uiLabels.myTrips}</Link><button className="auth-dropdown-item logout-item" onClick={handleLogout} role="menuitem">{uiLabels.logout}</button></> : <><Link to="/login" className="auth-dropdown-item" onClick={closeAuthDropdownImmediately} role="menuitem">{uiLabels.login}</Link><Link to="/signup" className="auth-dropdown-item" onClick={closeAuthDropdownImmediately} role="menuitem">{uiLabels.signUp}</Link></>}</div>}
        </div>
      </div>
      <button ref={hamburgerRef} className={`hamburger ${isMenuOpen ? 'hamburger--open' : ''}`} onClick={() => setIsMenuOpen(open => !open)} aria-label={uiLabels.menu} aria-expanded={isMenuOpen} aria-controls="mobile-site-navigation"><span /><span /><span /></button>
    </div></div></nav></div>

    {isMenuOpen && <div className="mobile-overlay" onClick={closeMenu} />}
    <aside
      ref={drawerRef}
      id="mobile-site-navigation"
      className={`mobile-drawer ${isMenuOpen ? 'mobile-drawer--open' : ''}`}
      aria-hidden={!isMenuOpen}
      aria-modal={isMenuOpen ? 'true' : undefined}
      aria-label={uiLabels.menu}
      role="dialog"
    >
      <div className="mobile-drawer__header"><Link to="/" onClick={closeMenu}><img src="/images/newLogo.png" alt="OptionTrip" /></Link><button ref={drawerCloseRef} className="mobile-drawer__close" onClick={closeMenu} aria-label={uiLabels.close}><i className="fa fa-times" /></button></div>
      <nav className="mobile-drawer__nav"><ul>
        {navItems.map(item => renderNavItem(item, true))}
        <li className="mobile-drawer__search"><a href="#search1" onClick={closeMenu}><i className="fa fa-search" aria-hidden="true" /><span>{uiLabels.search}</span></a></li>
        <li className="mobile-drawer__booking"><div className="mobile-drawer__section-title">{serviceLabels.all}</div><BookingServiceMenu mobile onNavigate={closeMenu} /></li>
      </ul></nav>
      <HeaderTravelPreferences
        mobile
        languages={SUPPORTED_LANGUAGES}
        languageCode={languageCode}
        onLanguageChange={handleLangChange}
        labels={uiLabels}
      />
      <div className="mobile-drawer__auth">{isAuthenticated ? <><Link to="/profile" className="mobile-drawer__auth-item" onClick={closeMenu}>{uiLabels.myProfile}</Link><Link to="/my-trips" className="mobile-drawer__auth-item" onClick={closeMenu}>{uiLabels.myTrips}</Link><button className="mobile-drawer__auth-item mobile-drawer__logout" onClick={() => { handleLogout(); closeMenu(); }}>{uiLabels.logout}</button></> : <><Link to="/login" className="mobile-drawer__auth-item" onClick={closeMenu}>{uiLabels.login}</Link><Link to="/signup" className="mobile-drawer__auth-item mobile-drawer__signup" onClick={closeMenu}>{uiLabels.signUp}</Link></>}</div>
    </aside>
  </header>;
};

export default Header;
