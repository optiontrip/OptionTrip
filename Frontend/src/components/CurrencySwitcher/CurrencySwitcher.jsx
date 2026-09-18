import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../../contexts/LocaleContext';
import { getHeaderUiLabels } from '../../config/headerUiLabels';
import './CurrencySwitcher.css';

const CurrencySwitcher = () => {
  const { currency, setCurrency, CURRENCIES } = useLocale();
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);
  const searchRef = useRef(null);
  const languageCode = (i18n.language || 'en').split('-')[0];
  const uiLabels = getHeaderUiLabels(languageCode);

  const displayNames = useMemo(() => {
    try { return typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames([languageCode], { type: 'currency' }) : null; }
    catch { return null; }
  }, [languageCode]);

  const nameFor = item => {
    try { return displayNames?.of(item.code) || item.name; }
    catch { return item.name; }
  };

  const filtered = search.trim()
    ? CURRENCIES.filter(item => {
        const needle = search.toLocaleLowerCase();
        return item.code.toLocaleLowerCase().includes(needle) || nameFor(item).toLocaleLowerCase().includes(needle);
      })
    : CURRENCIES;

  useEffect(() => {
    if (!isOpen) { setSearch(''); return undefined; }
    const timer = setTimeout(() => searchRef.current?.focus(), 50);
    const onClickOutside = event => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
    };
    const onEscape = event => { if (event.key === 'Escape') setIsOpen(false); };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [isOpen]);

  const handleSelect = item => { setCurrency(item); setIsOpen(false); };

  return (
    <div className="footer-select-wrapper" ref={wrapperRef}>
      <button type="button" className="footer-select-btn" onClick={() => setIsOpen(open => !open)} aria-expanded={isOpen} title={uiLabels.currency}>
        <span className="footer-select-icon">💱</span>
        <span className="footer-select-label">
          <span className="footer-select-sub">{uiLabels.currency}</span>
          <span className="footer-select-value">{currency.code} - {currency.symbol}</span>
        </span>
        <svg className={`footer-select-arrow${isOpen ? ' open' : ''}`} width="12" height="12" viewBox="0 0 12 12"><path d="M6 9L1 4h10z" fill="currentColor"/></svg>
      </button>

      {isOpen && (
        <div className="footer-select-dropdown">
          <div className="footer-select-search">
            <input ref={searchRef} type="text" placeholder={uiLabels.search} value={search} onChange={event => setSearch(event.target.value)} onClick={event => event.stopPropagation()} aria-label={`${uiLabels.search} ${uiLabels.currency}`} />
          </div>
          <div className="footer-select-list">
            {filtered.map(item => (
              <button key={item.code} type="button" className={`footer-select-option${item.code === currency.code ? ' active' : ''}`} onClick={() => handleSelect(item)}>
                <span className="footer-select-option-code">{item.symbol} {item.code}</span>
                <span className="footer-select-option-name">{nameFor(item)}</span>
              </button>
            ))}
            {filtered.length === 0 && <div className="footer-select-empty">-</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencySwitcher;
