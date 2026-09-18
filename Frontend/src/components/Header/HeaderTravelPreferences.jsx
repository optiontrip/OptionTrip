import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale } from '../../contexts/LocaleContext';
import './HeaderTravelPreferences.css';

const safeDisplayNames = (languageCode, type) => {
  try {
    if (typeof Intl?.DisplayNames !== 'function') return null;
    return new Intl.DisplayNames([languageCode || 'en'], { type });
  } catch {
    return null;
  }
};

const HeaderTravelPreferences = ({
  languages,
  languageCode,
  onLanguageChange,
  labels,
  mobile = false,
}) => {
  const { currency, setCurrency, country, setCountry, CURRENCIES, COUNTRIES } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  const regionNames = useMemo(() => safeDisplayNames(languageCode, 'region'), [languageCode]);
  const currencyNames = useMemo(() => safeDisplayNames(languageCode, 'currency'), [languageCode]);

  useEffect(() => {
    if (mobile || !isOpen) return undefined;
    const onOutside = event => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
    };
    const onKey = event => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen, mobile]);

  const localizedCountry = item => {
    try { return regionNames?.of(item.code) || item.name; }
    catch { return item.name; }
  };

  const localizedCurrency = item => {
    try { return currencyNames?.of(item.code) || item.name; }
    catch { return item.name; }
  };

  const handleCountry = code => {
    const next = COUNTRIES.find(item => item.code === code);
    if (next) setCountry(next);
  };

  const handleCurrency = code => {
    const next = CURRENCIES.find(item => item.code === code);
    if (next) setCurrency(next);
  };

  const controls = (
    <div className="header-prefs__controls">
      <label className="header-prefs__field">
        <span className="header-prefs__field-label">{labels.language}</span>
        <select
          value={languageCode}
          onChange={event => onLanguageChange(event.target.value)}
          aria-label={labels.language}
        >
          {languages.map(language => (
            <option key={language.code} value={language.code}>{language.flag} {language.name}</option>
          ))}
        </select>
      </label>

      <label className="header-prefs__field">
        <span className="header-prefs__field-label">{labels.country}</span>
        <select
          value={country.code}
          onChange={event => handleCountry(event.target.value)}
          aria-label={labels.country}
        >
          {COUNTRIES.map(item => (
            <option key={item.code} value={item.code}>{item.flag} {localizedCountry(item)}</option>
          ))}
        </select>
      </label>

      <label className="header-prefs__field">
        <span className="header-prefs__field-label">{labels.currency}</span>
        <select
          value={currency.code}
          onChange={event => handleCurrency(event.target.value)}
          aria-label={labels.currency}
        >
          {CURRENCIES.map(item => (
            <option key={item.code} value={item.code}>{item.symbol} {item.code} - {localizedCurrency(item)}</option>
          ))}
        </select>
      </label>
    </div>
  );

  if (mobile) {
    return (
      <section className="header-prefs header-prefs--mobile" aria-label={labels.preferences}>
        <div className="header-prefs__mobile-title">
          <i className="fa fa-sliders" aria-hidden="true" />
          <span>{labels.preferences}</span>
        </div>
        {controls}
      </section>
    );
  }

  return (
    <div className="header-prefs" ref={wrapperRef}>
      <button
        type="button"
        className="header-prefs__toggle"
        onClick={() => setIsOpen(open => !open)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={labels.preferences}
        title={labels.preferences}
      >
        <i className="fa fa-globe" aria-hidden="true" />
        <span className="header-prefs__language-code">{languageCode.toUpperCase()}</span>
        <span className="header-prefs__country-flag" aria-hidden="true">{country.flag}</span>
        <span className="header-prefs__currency-code">{currency.code}</span>
        <i className={`icon-arrow-down header-prefs__arrow ${isOpen ? 'open' : ''}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="header-prefs__panel" role="dialog" aria-label={labels.preferences}>
          <div className="header-prefs__panel-title">
            <span>{labels.preferences}</span>
            <button type="button" onClick={() => setIsOpen(false)} aria-label={labels.close}>
              <i className="fa fa-times" aria-hidden="true" />
            </button>
          </div>
          {controls}
        </div>
      )}
    </div>
  );
};

export default HeaderTravelPreferences;
