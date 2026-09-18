import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getHeaderUiLabels } from '../../config/headerUiLabels';
import './LanguageSwitcher.css';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' }, { code: 'fr', name: 'Français', flag: '🇫🇷' }, { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Español', flag: '🇪🇸' }, { code: 'it', name: 'Italiano', flag: '🇮🇹' }, { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' }, { code: 'uk', name: 'Українська', flag: '🇺🇦' }, { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' }, { code: 'ar', name: 'العربية', flag: '🇸🇦' }, { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'bn', name: 'বাংলা', flag: '🇧🇩' }, { code: 'zh', name: '中文', flag: '🇨🇳' }, { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' }, { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' }, { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'th', name: 'ภาษาไทย', flag: '🇹🇭' }, { code: 'hu', name: 'Magyar', flag: '🇭🇺' }, { code: 'sv', name: 'Svenska', flag: '🇸🇪' }, { code: 'sr', name: 'Srpski', flag: '🇷🇸' },
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const languageCode = (i18n.language || 'en').split('-')[0];
  const uiLabels = getHeaderUiLabels(languageCode);
  const currentLanguage = LANGUAGES.find(lang => lang.code === languageCode) || LANGUAGES[0];

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
          {LANGUAGES.map(lang => (
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
