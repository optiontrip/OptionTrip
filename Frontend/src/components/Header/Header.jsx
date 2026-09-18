import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
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
  { code: 'ko', name: '한국어', flag: '🇰🇷' }, { code: 'id', name: 'Indonesia', flag: '🇮🇩' }, { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'th', name: 'ภาษาไทย', flag: '🇹🇭' }, { code: 'hu', name: 'Magyar', flag: '🇭🇺' }, { code: 'sv', name: 'Svenska', flag: '🇸🇪' }, { code: 'sr', name: 'Srpski', flag: '🇷🇸' },
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isAuthDropdownOpen, setIsAuthDropdownOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const location = useLocation(); const navigate = useNavigate(); const { t, i18n } = useTranslation(); const { user, isAuthenticated, logout } = useAuth();
  const [langDropdownPos, setLangDropdownPos] = useState({ top: 0, right: 0 });
  const closeTimeout = useRef(null); const bookingRef = useRef(null); const langRef = useRef(null); const langBtnRef = useRef(null);

  const navItems = [
    { id: 'home', to: '/', label: t('common.home', { defaultValue: 'Home' }) },
    { id: 'destinations', to: '/destinations', label: t('header.topDestinations', { defaultValue: 'Destinations' }) },
    { id: 'plan-day', to: '/plan-my-day', label: t('header.planMyDay', { defaultValue: 'Plan My Day' }) },
    { id: 'where-go', to: '/where-can-i-go', label: t('header.whereCanIGo', { defaultValue: 'Where Can I Go?' }) },
    { id: 'tours', to: '/tours', label: t('common.tours', { defaultValue: 'Tours' }) },
    { id: 'blog', href: 'https://blog.optiontrip.com', label: t('common.blog', { defaultValue: 'Blog' }) },
    { id: 'about', to: '/about', label: t('common.about', { defaultValue: 'About Us' }) },
  ];

  useEffect(() => {
    const fetchLocation = async () => {
      const cachedLocation = localStorage.getItem('userLocation'); const cachedTime = localStorage.getItem('userLocationTime');
      if (cachedLocation && cachedTime && parseInt(cachedTime, 10) > Date.now() - 3600000) { setUserLocation(cachedLocation); setIsLoadingLocation(false); return; }
      if (!('geolocation' in navigator)) { setUserLocation(t('header.location')); setIsLoadingLocation(false); return; }
      navigator.geolocation.getCurrentPosition(async ({ coords }) => {
        try { const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=10&addressdetails=1`, { headers: { 'Accept-Language': i18n.language || 'en' } });
          if (response.ok) { const data = await response.json(); const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || ''; const country = data.address?.country || ''; const value = city && country ? `${city}, ${country}` : city || country || t('header.location'); setUserLocation(value); localStorage.setItem('userLocation', value); localStorage.setItem('userLocationTime', Date.now().toString()); }
        } catch { setUserLocation(t('header.location')); } setIsLoadingLocation(false);
      }, () => { setUserLocation(t('header.location')); setIsLoadingLocation(false); }, { timeout: 10000, maximumAge: 300000 });
    }; fetchLocation();
  }, [t, i18n.language]);

  useEffect(() => { const handler = e => { if (!langBtnRef.current?.contains(e.target) && !langRef.current?.contains(e.target)) setIsLangOpen(false); if (!bookingRef.current?.contains(e.target)) setIsBookingOpen(false); }; document.addEventListener('mousedown', handler); return () => document.removeEventListener('mousedown', handler); }, []);
  useEffect(() => { setIsBookingOpen(false); setIsMenuOpen(false); setIsAuthDropdownOpen(false); }, [location.pathname, i18n.language]);
  useEffect(() => { document.body.style.overflow = isMenuOpen ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [isMenuOpen]);
  useEffect(() => { const onKey = e => { if (e.key === 'Escape') { setIsMenuOpen(false); setIsBookingOpen(false); setIsLangOpen(false); setIsAuthDropdownOpen(false); } }; document.addEventListener('keydown', onKey); return () => document.removeEventListener('keydown', onKey); }, []);

  const closeMenu = () => setIsMenuOpen(false); const isActive = path => location.pathname === path ? 'active' : '';
  const openAuthDropdown = () => { clearTimeout(closeTimeout.current); setIsAuthDropdownOpen(true); }; const closeAuthDropdown = () => { closeTimeout.current = setTimeout(() => setIsAuthDropdownOpen(false), 150); }; const closeAuthDropdownImmediately = () => { clearTimeout(closeTimeout.current); setIsAuthDropdownOpen(false); };
  const handleLogout = async () => { try { await logout(); closeAuthDropdownImmediately(); navigate('/'); } catch (e) { console.error('Logout error:', e); } };
  const handleLangChange = code => { i18n.changeLanguage(code); setIsLangOpen(false); }; const currentLang = LANGUAGES.find(l => l.code === (i18n.language?.split('-')[0] || 'en')) || LANGUAGES[0];
  const openLangDropdown = () => { if (langBtnRef.current) { const rect = langBtnRef.current.getBoundingClientRect(); setLangDropdownPos({ top: rect.bottom + 8, right: Math.max(8, window.innerWidth - rect.right) }); } setIsLangOpen(v => !v); };
  const formatDate = () => { try { return new Date().toLocaleDateString(i18n.language || 'en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); } catch { return new Date().toLocaleDateString('en-US'); } };
  const renderNavItem = (item, mobile = false) => <li key={item.id} className={item.to ? isActive(item.to) : ''}>{item.href ? <a href={item.href} target="_blank" rel="noopener noreferrer" onClick={mobile ? closeMenu : undefined}>{item.label}</a> : <Link to={item.to} onClick={mobile ? closeMenu : undefined}>{item.label}</Link>}</li>;

  return <header className="main_header_area">
    <div className="header-content py-1 bg-theme"><div className="container d-flex align-items-center justify-content-between"><div className="links"><ul><li><span className="white header-status-item"><i className="icon-calendar white" /> {formatDate()}</span></li><li><span className="white location-display header-status-item"><i className="icon-location-pin white" /> {isLoadingLocation ? <span className="location-loading">{t('header.detectingLocation', { defaultValue: 'Detecting...' })}</span> : <span>{userLocation || t('header.location')}</span>}</span></li></ul></div><div className="header-right d-flex align-items-center gap-2"><ul className="header-social-list"><li><a href="https://www.facebook.com/optiontrip" target="_blank" rel="noopener noreferrer" className="white"><i className="fab fa-facebook" /></a></li><li><a href="https://x.com/OptionTripCom" target="_blank" rel="noopener noreferrer" className="white"><i className="fab fa-twitter" /></a></li><li><a href="https://www.instagram.com/option_trip" target="_blank" rel="noopener noreferrer" className="white"><i className="fab fa-instagram" /></a></li></ul><NotificationBell /><ThemeSwitcher /><div className="header-lang"><button ref={langBtnRef} className="header-lang__toggle" onClick={openLangDropdown} aria-label={t('common.language', { defaultValue: 'Language' })}><i className="fa fa-globe" /><span className="header-lang__flag">{currentLang.flag}</span><span className="header-lang__code">{currentLang.code.toUpperCase()}</span><i className={`icon-arrow-down header-lang__arrow ${isLangOpen ? 'open' : ''}`} /></button>{isLangOpen && createPortal(<div className="header-lang__dropdown" style={{ top: langDropdownPos.top, right: langDropdownPos.right }} ref={langRef}>{LANGUAGES.map(lang => <button key={lang.code} className={`header-lang__option ${lang.code === currentLang.code ? 'active' : ''}`} onClick={() => handleLangChange(lang.code)}><span className="header-lang__option-flag">{lang.flag}</span><span className="header-lang__option-name">{lang.name}</span></button>)}</div>, document.body)}</div></div></div></div>
    <div className="header_menu" id="header_menu"><nav className="navbar navbar-default"><div className="container"><div className="navbar-flex d-flex align-items-center justify-content-between w-100"><div className="navbar-header"><Link className="navbar-brand" to="/"><img src="/images/newLogo.png" alt="OptionTrip" /></Link></div><div className="navbar-collapse1 d-flex align-items-center"><ul className="nav navbar-nav" id="responsive-menu">{renderNavItem(navItems[0])}<li ref={bookingRef} className={`dropdown submenu nav-bookings ${isBookingOpen ? 'nav-bookings--open' : ''}`} onMouseEnter={() => setIsBookingOpen(true)} onMouseLeave={() => setIsBookingOpen(false)}><button type="button" className="dropdown-toggle nav-bookings__toggle" onClick={() => setIsBookingOpen(v => !v)} aria-haspopup="true" aria-expanded={isBookingOpen}>{t('common.booking', { defaultValue: 'Booking' })}<i className={`icon-arrow-down nav-bookings__arrow ${isBookingOpen ? 'open' : ''}`} /></button>{isBookingOpen && <div className="nav-bookings__mega"><BookingServiceMenu onNavigate={() => setIsBookingOpen(false)} /></div>}</li>{navItems.slice(1).map(item => renderNavItem(item))}<li className="search-main"><a href="#search1" className="mt_search" aria-label={t('common.search', { defaultValue: 'Search' })}><i className="fa fa-search" /></a></li></ul></div><div className="register-login d-flex align-items-center gap-3"><div className="auth-dropdown-wrapper" onMouseEnter={openAuthDropdown} onMouseLeave={closeAuthDropdown}><button className="auth-dropdown-toggle" onClick={() => setIsAuthDropdownOpen(v => !v)}>{isAuthenticated ? <><div className="profile-icon">{user?.profileImage ? <img src={user.profileImage} alt={user.name || 'Profile'} /> : <i className="icon-user" />}</div><span>{user?.name || t('common.profile', { defaultValue: 'Profile' })}</span></> : <><i className="icon-user" /><span>{t('common.account', { defaultValue: 'Account' })}</span></>}<i className={`icon-arrow-down dropdown-arrow ${isAuthDropdownOpen ? 'open' : ''}`} /></button>{isAuthDropdownOpen && <div className="auth-dropdown-menu">{isAuthenticated ? <><Link to="/profile" className="auth-dropdown-item" onClick={closeAuthDropdownImmediately}>{t('common.myProfile', { defaultValue: 'My Profile' })}</Link><Link to="/my-trips" className="auth-dropdown-item" onClick={closeAuthDropdownImmediately}>{t('common.myTrips', { defaultValue: 'My Trips' })}</Link><button className="auth-dropdown-item logout-item" onClick={handleLogout}>{t('common.logout', { defaultValue: 'Logout' })}</button></> : <><Link to="/login" className="auth-dropdown-item" onClick={closeAuthDropdownImmediately}>{t('common.login', { defaultValue: 'Login' })}</Link><Link to="/signup" className="auth-dropdown-item" onClick={closeAuthDropdownImmediately}>{t('common.signUp', { defaultValue: 'Sign Up' })}</Link></>}</div>}</div><Link to="/contact" className="nir-btn white">{t('common.contact')}</Link></div><button className={`hamburger ${isMenuOpen ? 'hamburger--open' : ''}`} onClick={() => setIsMenuOpen(v => !v)} aria-label={t('common.menu', { defaultValue: 'Menu' })} aria-expanded={isMenuOpen}><span /><span /><span /></button></div></div></nav></div>
    {isMenuOpen && <div className="mobile-overlay" onClick={closeMenu} />}
    <aside className={`mobile-drawer ${isMenuOpen ? 'mobile-drawer--open' : ''}`} aria-hidden={!isMenuOpen}><div className="mobile-drawer__header"><Link to="/" onClick={closeMenu}><img src="/images/newLogo.png" alt="OptionTrip" /></Link><button className="mobile-drawer__close" onClick={closeMenu} aria-label={t('common.close', { defaultValue: 'Close' })}><i className="fa fa-times" /></button></div><nav className="mobile-drawer__nav"><ul>{renderNavItem(navItems[0], true)}<li className="mobile-drawer__booking"><div className="mobile-drawer__section-title">{t('common.booking', { defaultValue: 'Booking' })}</div><BookingServiceMenu mobile onNavigate={closeMenu} /></li>{navItems.slice(1).map(item => renderNavItem(item, true))}<li className={isActive('/contact')}><Link to="/contact" onClick={closeMenu}>{t('common.contact')}</Link></li></ul></nav><div className="mobile-drawer__lang"><p className="mobile-drawer__lang-label"><i className="fa fa-globe" /> {t('common.language', { defaultValue: 'Language' })}</p><div className="mobile-drawer__lang-grid">{LANGUAGES.map(lang => <button key={lang.code} className={`mobile-drawer__lang-btn ${lang.code === currentLang.code ? 'active' : ''}`} onClick={() => { handleLangChange(lang.code); closeMenu(); }}><span>{lang.flag}</span><span>{lang.code.toUpperCase()}</span></button>)}</div></div><div className="mobile-drawer__auth">{isAuthenticated ? <><Link to="/profile" className="mobile-drawer__auth-item" onClick={closeMenu}>{t('common.myProfile', { defaultValue: 'My Profile' })}</Link><Link to="/my-trips" className="mobile-drawer__auth-item" onClick={closeMenu}>{t('common.myTrips', { defaultValue: 'My Trips' })}</Link><button className="mobile-drawer__auth-item mobile-drawer__logout" onClick={() => { handleLogout(); closeMenu(); }}>{t('common.logout', { defaultValue: 'Logout' })}</button></> : <><Link to="/login" className="mobile-drawer__auth-item" onClick={closeMenu}>{t('common.login', { defaultValue: 'Login' })}</Link><Link to="/signup" className="mobile-drawer__auth-item mobile-drawer__signup" onClick={closeMenu}>{t('common.signUp', { defaultValue: 'Sign Up' })}</Link></>}</div></aside>
  </header>;
};
export default Header;
