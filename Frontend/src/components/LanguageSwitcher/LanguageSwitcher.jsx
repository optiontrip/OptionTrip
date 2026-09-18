import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, normalizeLanguageCode } from '../../config/supportedLanguages';
import { getHeaderUiLabels } from '../../config/headerUiLabels';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const languageCode = normalizeLanguageCode(i18n.language);
  const uiLabels = getHeaderUiLabels(languageCode);
  const currentLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode) || SUPPORTED_LANGUAGES[0];

  const handleLanguageChange = langCode => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('i18nextLng', langCode);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    const handleEscape = event => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !dropdownRef.current) return;
    const dropdown = dropdownRef.current.querySelector('.language-dropdown-menu');
    if (!dropdown) return;
    const rect = dropdown.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    if (spaceBelow < 100 && spaceAbove > spaceBelow) {
      dropdown.style.top = 'auto';
      dropdown.style.bottom = '100%';
      dropdown.style.marginBottom = '5px';
      dropdown.style.marginTop = '0';
    } else {
      dropdown.style.top = '100%';
      dropdown.style.bottom = 'auto';
      dropdown.style.marginTop = '5px';
      dropdown.style.marginBottom = '0';
    }
  }, [isOpen]);

  return (
    <div className="language-switcher-wrapper" ref={dropdownRef}>
      <button type="button" className="language-switcher-button" onClick={() => setIsOpen(open => !open)} aria-label={uiLabels.language} aria-expanded={isOpen}>
        <span className="language-switcher-icon">🌐</span>
        <span className="language-switcher-label">
          <span className="language-switcher-sub">{uiLabels.language}</span>
          <span className="language-switcher-value">{currentLanguage.flag} {currentLanguage.name}</span>
        </span>
        <svg className={`language-switcher-arrow ${isOpen ? 'open' : ''}`} width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 9L1 4h10z" fill="currentColor" /></svg>
      </button>
      {isOpen && (
        <div className="language-dropdown-menu" role="menu">
          {SUPPORTED_LANGUAGES.map(lang => (
            <button key={lang.code} type="button" className={`language-option ${lang.code === languageCode ? 'active' : ''}`} onClick={() => handleLanguageChange(lang.code)} role="menuitem">
              <span>{lang.flag}</span><span>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
