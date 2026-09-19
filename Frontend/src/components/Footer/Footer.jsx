import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';
import CurrencySwitcher from '../CurrencySwitcher/CurrencySwitcher';
import CountrySwitcher from '../CountrySwitcher/CountrySwitcher';
import { CONTACT_EMAIL, CONTACT_MAILTO } from '../../config/contact';
import './Footer.css';
import './Footer.mobile.css';

const FOOTER_GROUPS = [
  {
    id: 'company',
    title: 'Company',
    items: [
      { to: '/about', label: 'About OptionTrip' },
      { to: '/how-it-works', label: 'How It Works' },
      { to: '/travel-buddy', label: 'Travel Partner Vi' },
      { to: '/blog', label: 'Travel News' },
      { to: '/contact', label: 'Contact Us' },
    ],
  },
  {
    id: 'travel',
    title: 'Travel',
    items: [
      { to: '/destinations', label: 'Explore Destinations' },
      { to: '/trip-ideas', label: 'Trip Ideas' },
      { to: '/travel-map', label: 'Travel Map' },
      { to: '/popular-routes', label: 'Popular Routes' },
      { to: '/travel-tips', label: 'Travel Tips' },
    ],
  },
  {
    id: 'support',
    title: 'Support',
    items: [
      { to: '/help-center', label: 'Help Center' },
      { to: '/contact', label: 'Contact Support' },
      { href: `${CONTACT_MAILTO}?subject=Travel%20Question`, label: 'Travel Questions' },
      { href: `${CONTACT_MAILTO}?subject=OptionTrip%20Feedback`, label: 'Feedback' },
    ],
  },
  {
    id: 'legal',
    title: 'Legal',
    items: [
      { to: '/privacy-policy', label: 'Privacy Policy' },
      { to: '/terms', label: 'Terms of Service' },
      { to: '/cookie-policy', label: 'Cookie Policy' },
      { to: '/data-protection', label: 'Data Protection' },
    ],
  },
];

const FooterLink = ({ item }) => item.to
  ? <Link to={item.to}>{item.label}</Link>
  : <a href={item.href}>{item.label}</a>;

const Footer = () => {
  const [openMobileGroup, setOpenMobileGroup] = useState(null);

  return (
    <>
      <div className="footer-subscribe-strip">
        <div className="container">
          <div className="footer-subscribe-inner">
            <div className="footer-subscribe-text">
              <h4 className="footer-subscribe-title">Stay Inspired</h4>
              <p className="footer-subscribe-subtitle">OptionTrip travel news and personalized updates are being expanded.</p>
            </div>
            <div><Link className="footer-subscribe-btn" to="/blog">Travel News</Link></div>
          </div>
        </div>
      </div>

      <footer className="footer-main" style={{ backgroundImage: 'url(/images/background_pattern.png)' }}>
        <div className="footer-columns">
          <div className="container">
            <div className="footer-columns-grid">
              <div className="footer-col footer-col--about">
                <img src="/images/logo-white.png" alt="OptionTrip" className="footer-logo" />
                <p className="footer-about-desc">OptionTrip is a young travel technology team building a simpler way to discover, plan, compare, prepare for, and experience trips with Travel Partner Vi at the center.</p>
                <ul className="footer-contact-list">
                  <li><i className="fas fa-envelope footer-contact-icon" aria-hidden="true" /><a href={CONTACT_MAILTO} aria-label={`Email OptionTrip at ${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></li>
                  <li><i className="fas fa-globe footer-contact-icon" aria-hidden="true" /><a href="https://optiontrip.com">OptionTrip.com</a></li>
                </ul>
                <div className="footer-trust-block">
                  <ul className="footer-trust-list">
                    <li><i className="fas fa-robot" /> Travel Partner Vi</li>
                    <li><i className="fas fa-route" /> Personalized trip planning</li>
                    <li><i className="fas fa-star" /> Useful travel recommendations</li>
                  </ul>
                </div>
              </div>

              {FOOTER_GROUPS.map(group => {
                const isOpen = openMobileGroup === group.id;
                return (
                  <div className={`footer-col footer-col--links ${isOpen ? 'is-mobile-open' : ''}`} key={group.id}>
                    <button
                      type="button"
                      className="footer-col-toggle"
                      aria-expanded={isOpen}
                      aria-controls={`footer-group-${group.id}`}
                      onClick={() => setOpenMobileGroup(current => current === group.id ? null : group.id)}
                    >
                      <span className="footer-col-title">{group.title}</span>
                      <i className={`fas fa-chevron-down ${isOpen ? 'is-open' : ''}`} aria-hidden="true" />
                    </button>
                    <ul className="footer-col-links" id={`footer-group-${group.id}`}>
                      {group.items.map(item => <li key={`${group.id}-${item.label}`}><FooterLink item={item} /></li>)}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="footer-locale-section">
          <div className="container">
            <div className="footer-locale-bar">
              <div className="footer-locale-item"><LanguageSwitcher /></div>
              <div className="footer-locale-item footer-locale-item--currency"><CurrencySwitcher /></div>
              <div className="footer-locale-item"><CountrySwitcher /></div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="container">
            <div className="footer-bottom-inner">
              <p className="footer-copyright-text">© 2026 OptionTrip. All rights reserved.</p>
              <div className="footer-social">
                <a href="https://www.facebook.com/optiontrip" aria-label="Facebook"><i className="fab fa-facebook" /></a>
                <a href="https://www.x.com/OptionTripCom" aria-label="X"><i className="fab fa-twitter" /></a>
                <a href="https://www.instagram.com/option_trip" aria-label="Instagram"><i className="fab fa-instagram" /></a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
