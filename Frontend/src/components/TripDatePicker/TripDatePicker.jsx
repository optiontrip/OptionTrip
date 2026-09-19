import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { DateRange, Calendar } from 'react-date-range';
import {
  format, addDays, addMonths,
  startOfMonth,
  isAfter, isBefore, isSameDay,
  getDay, getDaysInMonth,
} from 'date-fns';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { fetchMonthlyPrices } from '../../services/flightService';
import useCurrency from '../../hooks/useCurrency';
import './TripDatePicker.css';

const toDate = (str) => (str ? new Date(`${str}T00:00:00`) : null);
const toStr = (d) => (d ? format(d, 'yyyy-MM-dd') : '');
const todayD = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const displayDate = (str) => {
  if (!str) return null;
  return new Date(`${str}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

const displayMonth = (month) => {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return null;
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(year, monthNumber - 1, 1).toLocaleDateString('en-US', {
    month: 'short', year: 'numeric',
  });
};

const buildMonths = (count = 12) => {
  const base = startOfMonth(new Date());
  return Array.from({ length: count }, (_, i) => addMonths(base, i));
};

const MONTHS = buildMonths(12);
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const routeSupportsPriceCalendar = (origin, destination) => (
  /^[A-Z]{3}$/i.test(String(origin || '')) && /^[A-Z]{3}$/i.test(String(destination || ''))
);

const minimumPrice = (prices) => {
  const values = Object.values(prices || {})
    .map(Number)
    .filter(value => Number.isFinite(value) && value > 0);
  return values.length ? Math.min(...values) : null;
};

const PriceCalendar = ({
  month,
  prices,
  loading,
  minDate,
  maxDate,
  mode,
  onSelect,
  onBack,
  onMonthChange,
  onWholeMonth,
  formatPrice,
}) => {
  const [displayedMonth, setDisplayedMonth] = useState(month);
  const [phase, setPhase] = useState(0);
  const [rangeStart, setRangeStart] = useState(null);

  useEffect(() => {
    setDisplayedMonth(month);
    setPhase(0);
    setRangeStart(null);
  }, [month]);

  const priceVals = Object.values(prices).map(Number).filter(value => Number.isFinite(value) && value > 0);
  const minPrice = priceVals.length ? Math.min(...priceVals) : 0;
  const maxPrice = priceVals.length ? Math.max(...priceVals) : 0;
  const band = (maxPrice - minPrice) / 3 || 1;
  const priceClass = (p) => {
    if (!p) return '';
    if (p <= minPrice + band) return 'pc-day--cheap';
    if (p <= minPrice + band * 2) return 'pc-day--mid';
    return 'pc-day--pricey';
  };

  const firstOfMonth = startOfMonth(displayedMonth);
  const startDow = (getDay(firstOfMonth) + 6) % 7;
  const daysInMonth = getDaysInMonth(displayedMonth);
  const cells = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) =>
      new Date(displayedMonth.getFullYear(), displayedMonth.getMonth(), i + 1)
    ),
  ];

  const beforeMin = (day) => isBefore(day, minDate || todayD()) && !isSameDay(day, minDate || todayD());
  const afterMax = (day) => maxDate && isAfter(day, maxDate) && !isSameDay(day, maxDate);
  const disabledDay = (day) => beforeMin(day) || afterMax(day);

  const handleDayClick = (day) => {
    if (!day || disabledDay(day)) return;
    if (mode === 'single') {
      onSelect(day, day);
      return;
    }
    if (phase === 0 || rangeStart === null) {
      setRangeStart(day);
      setPhase(1);
      return;
    }
    const start = isBefore(day, rangeStart) ? day : rangeStart;
    const end = isBefore(day, rangeStart) ? rangeStart : day;
    onSelect(start, end);
    setRangeStart(null);
    setPhase(0);
  };

  const minMonth = startOfMonth(minDate || todayD());
  const maxMonth = startOfMonth(maxDate || addMonths(todayD(), 12));
  const canGoPrev = isAfter(startOfMonth(displayedMonth), minMonth);
  const canGoNext = isBefore(startOfMonth(displayedMonth), maxMonth);

  const changeMonth = (delta) => {
    const next = addMonths(displayedMonth, delta);
    setDisplayedMonth(next);
    setPhase(0);
    setRangeStart(null);
    onMonthChange?.(next);
  };

  return (
    <div className="pc-wrap">
      <div className="pc-header">
        <button className="pc-nav-btn" type="button" onClick={onBack}>← Months</button>
        <div className="pc-nav-month">
          <button className="pc-nav-arrow" type="button" disabled={!canGoPrev} aria-disabled={!canGoPrev}
            onClick={() => canGoPrev && changeMonth(-1)}>‹</button>
          <span className="pc-month-label">{format(displayedMonth, 'MMMM yyyy')}</span>
          <button className="pc-nav-arrow" type="button" disabled={!canGoNext} aria-disabled={!canGoNext}
            onClick={() => canGoNext && changeMonth(1)}>›</button>
        </div>
        {mode === 'range' && (
          <span className="pc-phase-hint">{phase === 0 ? 'Select departure' : 'Select return'}</span>
        )}
      </div>

      <button className="pc-whole-month-btn" type="button" onClick={() => onWholeMonth?.(displayedMonth)}>
        <strong>Search the whole {format(displayedMonth, 'MMMM')}</strong>
        <span>{mode === 'range' ? 'Use this as the departure month, then choose a return month' : 'No exact day required - find the cheapest available days'}</span>
      </button>

      {loading ? (
        <div className="pc-loading"><div className="pc-loading__spinner" /><span>Loading prices…</span></div>
      ) : (
        <>
          <div className="pc-weekdays">{WEEKDAYS.map(d => <div key={d} className="pc-weekday">{d}</div>)}</div>
          <div className="pc-grid">
            {cells.map((day, i) => {
              if (!day) return <div key={i} className="pc-day pc-day--empty" />;
              const dateStr = toStr(day);
              const price = Number(prices[dateStr]) || 0;
              const disabled = disabledDay(day);
              const selected = rangeStart && isSameDay(day, rangeStart);
              return (
                <button key={dateStr} type="button"
                  className={['pc-day', disabled ? 'pc-day--past' : '', selected ? 'pc-day--selected' : '', !disabled && price ? priceClass(price) : ''].filter(Boolean).join(' ')}
                  onClick={() => handleDayClick(day)} disabled={disabled}>
                  <span className="pc-day__num">{day.getDate()}</span>
                  {price > 0 && !disabled && <span className="pc-day__price">{formatPrice ? formatPrice(price) : `$${price.toLocaleString()}`}</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

const MonthGrid = ({
  mode,
  onMonthClick,
  selectedStart = null,
  hintText = '',
  monthSummaries = {},
  summaryLoading = {},
  formatPrice,
  cheapestMonthKey = '',
  routePriced = false,
}) => (
  <div className="tdp-flex-wrap">
    <p className="tdp-flex-hint">
      {hintText || (mode === 'range'
        ? (selectedStart ? `Departure: ${format(selectedStart, 'MMMM yyyy')} - now choose a return month` : 'Select a departure month')
        : 'Select a travel month')}
    </p>
    {routePriced && (
      <p className="tdp-month-price-note">Indicative fares from current partner data. Live price is rechecked before booking.</p>
    )}
    <div className="tdp-month-grid">
      {MONTHS.map((month) => {
        const monthKey = format(month, 'yyyy-MM');
        const selected = selectedStart && monthKey === format(selectedStart, 'yyyy-MM');
        const price = monthSummaries[monthKey];
        const loading = Boolean(summaryLoading[monthKey]);
        const cheapest = Boolean(price && cheapestMonthKey === monthKey);
        return (
          <button
            key={month.toISOString()}
            className={`tdp-month-card${selected ? ' tdp-month-card--selected' : ''}${cheapest ? ' tdp-month-card--cheapest' : ''}`}
            onClick={() => onMonthClick(month)}
            type="button"
          >
            {cheapest && <span className="tdp-month-card__badge">Cheapest</span>}
            <span className="tdp-month-card__year">{format(month, 'yyyy')}</span>
            <span className="tdp-month-card__name">{format(month, 'MMMM')}</span>
            {routePriced && (
              <span className={`tdp-month-card__price${price ? '' : ' tdp-month-card__price--muted'}`}>
                {loading ? 'Checking…' : (price ? `from ${formatPrice ? formatPrice(price) : `$${Number(price).toLocaleString()}`}` : 'Check prices')}
              </span>
            )}
          </button>
        );
      })}
    </div>
  </div>
);

const TripDatePicker = ({
  mode = 'range',
  startDate,
  endDate,
  selectedMonth,
  selectedReturnMonth,
  searchMode = 'exact',
  minDate,
  onApply,
  startLabel = 'Departure',
  endLabel = 'Return',
  startPlaceholder = 'Select date',
  endPlaceholder = 'Select date',
  startError,
  endError,
  origin,
  destination,
}) => {
  const minD = minDate instanceof Date ? minDate : (minDate ? toDate(minDate) : todayD());
  const maxD = addMonths(todayD(), 12);

  const buildRange = useCallback(() => {
    const s = toDate(startDate) || todayD();
    const e = toDate(endDate) || (mode === 'range' ? addDays(s, 1) : s);
    return [{ startDate: s, endDate: e, key: 'selection' }];
  }, [startDate, endDate, mode]);

  const { formatPrice } = useCurrency();
  const [open, setOpen] = useState(false);
  const [dateMode, setDateMode] = useState(searchMode === 'month' ? 'whole-month' : 'specific');
  const [range, setRange] = useState(buildRange);
  const [flexView, setFlexView] = useState('months');
  const [flexMonth, setFlexMonth] = useState(null);
  const [wholeStart, setWholeStart] = useState(null);
  const [monthPrices, setMonthPrices] = useState({});
  const [pricesLoading, setPricesLoading] = useState(false);
  const [monthSummaries, setMonthSummaries] = useState({});
  const [summaryLoading, setSummaryLoading] = useState({});
  const [popupPos, setPopupPos] = useState({ top: 16, left: 16 });
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const popupRef = useRef(null);
  const positionFrameRef = useRef(null);
  const summaryRequestRef = useRef(0);

  const hasPriceRoute = routeSupportsPriceCalendar(origin, destination);

  const cheapestMonthKey = useMemo(() => {
    const entries = Object.entries(monthSummaries)
      .filter(([, value]) => Number.isFinite(Number(value)) && Number(value) > 0);
    if (!entries.length) return '';
    entries.sort((a, b) => Number(a[1]) - Number(b[1]));
    return entries[0][0];
  }, [monthSummaries]);

  useEffect(() => { setRange(buildRange()); }, [startDate, endDate, buildRange]);

  useEffect(() => {
    const h = (e) => {
      if (wrapRef.current?.contains(e.target)) return;
      if (popupRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const apply = (s, e) => {
    onApply({
      searchMode: 'exact',
      month: '',
      returnMonth: '',
      startDate: toStr(s),
      endDate: mode === 'range' ? toStr(e) : toStr(s),
    });
    setOpen(false);
  };

  const applyWholeMonth = (departureMonth, returnMonth = null) => {
    onApply({
      searchMode: 'month',
      month: format(departureMonth, 'yyyy-MM'),
      returnMonth: returnMonth ? format(returnMonth, 'yyyy-MM') : '',
      startDate: '',
      endDate: '',
    });
    setWholeStart(null);
    setOpen(false);
  };

  const handleWholeMonthClick = (month) => {
    if (mode === 'single') {
      applyWholeMonth(month);
      return;
    }
    if (!wholeStart) {
      setWholeStart(month);
      return;
    }
    const start = isBefore(month, wholeStart) ? month : wholeStart;
    const end = isBefore(month, wholeStart) ? wholeStart : month;
    applyWholeMonth(start, end);
  };

  const handleRangeChange = (item) => {
    const sel = item.selection;
    setRange([sel]);
    if (sel.startDate && sel.endDate && toStr(sel.startDate) !== toStr(sel.endDate)) {
      apply(sel.startDate, sel.endDate);
    }
  };

  const handleSingleChange = (d) => {
    setRange([{ startDate: d, endDate: d, key: 'selection' }]);
    apply(d, d);
  };

  const loadMonthlyPrices = async (month) => {
    setFlexMonth(month);
    setMonthPrices({});
    if (!hasPriceRoute) return;
    setPricesLoading(true);
    try {
      const prices = await fetchMonthlyPrices({
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase(),
        month: format(month, 'yyyy-MM'),
      });
      setMonthPrices(prices || {});
    } finally {
      setPricesLoading(false);
    }
  };

  const loadMonthSummaries = useCallback(async () => {
    const requestId = ++summaryRequestRef.current;
    setMonthSummaries({});
    setSummaryLoading({});
    if (!routeSupportsPriceCalendar(origin, destination)) return;

    const initialLoading = {};
    MONTHS.forEach(month => { initialLoading[format(month, 'yyyy-MM')] = true; });
    setSummaryLoading(initialLoading);

    // Use small batches so the UI becomes useful quickly without hammering the
    // monthly-price provider with twelve simultaneous calls.
    for (let offset = 0; offset < MONTHS.length; offset += 3) {
      const batch = MONTHS.slice(offset, offset + 3);
      const rows = await Promise.all(batch.map(async month => {
        const key = format(month, 'yyyy-MM');
        const prices = await fetchMonthlyPrices({
          origin: String(origin).toUpperCase(),
          destination: String(destination).toUpperCase(),
          month: key,
        });
        return { key, price: minimumPrice(prices) };
      }));

      if (summaryRequestRef.current !== requestId) return;
      setMonthSummaries(previous => {
        const next = { ...previous };
        rows.forEach(({ key, price }) => {
          if (price) next[key] = price;
        });
        return next;
      });
      setSummaryLoading(previous => {
        const next = { ...previous };
        rows.forEach(({ key }) => { next[key] = false; });
        return next;
      });
    }
  }, [origin, destination]);

  useEffect(() => {
    if (open && dateMode === 'whole-month') loadMonthSummaries();
    return () => { summaryRequestRef.current += 1; };
  }, [open, dateMode, loadMonthSummaries]);

  const handleMonthClick = async (month) => {
    setFlexView('calendar');
    await loadMonthlyPrices(month);
  };

  const handleFlexibleWholeMonth = (month) => {
    if (mode === 'single') {
      applyWholeMonth(month);
      return;
    }
    setWholeStart(month);
    setDateMode('whole-month');
    setFlexView('months');
    setFlexMonth(null);
    setMonthPrices({});
  };

  const repositionPopup = useCallback(() => {
    if (!open || !triggerRef.current || typeof window === 'undefined') return;
    if (positionFrameRef.current) cancelAnimationFrame(positionFrameRef.current);
    positionFrameRef.current = requestAnimationFrame(() => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const visualViewport = window.visualViewport;
      const viewportWidth = visualViewport?.width || window.innerWidth;
      const viewportHeight = visualViewport?.height || window.innerHeight;
      const mobile = viewportWidth <= 720;
      if (mobile) {
        setPopupPos({ top: 8, left: 12 });
        return;
      }

      const popupWidth = Math.min(660, Math.max(320, viewportWidth - 32));
      const popupHeight = Math.min(
        popupRef.current?.offsetHeight || 560,
        Math.max(240, viewportHeight - 32),
      );
      const left = Math.max(16, Math.min(rect.left, viewportWidth - popupWidth - 16));
      const belowTop = rect.bottom + 10;
      const aboveTop = rect.top - popupHeight - 10;
      const roomBelow = viewportHeight - rect.bottom - 16;
      const roomAbove = rect.top - 16;
      const preferredTop = roomBelow >= popupHeight || roomBelow >= roomAbove ? belowTop : aboveTop;
      const maxTop = Math.max(16, viewportHeight - popupHeight - 16);
      const top = Math.max(16, Math.min(preferredTop, maxTop));
      setPopupPos({ top, left });
    });
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    repositionPopup();
    const onViewportChange = () => repositionPopup();
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);
    window.visualViewport?.addEventListener('resize', onViewportChange);
    window.visualViewport?.addEventListener('scroll', onViewportChange);
    const secondPass = requestAnimationFrame(repositionPopup);
    return () => {
      cancelAnimationFrame(secondPass);
      if (positionFrameRef.current) cancelAnimationFrame(positionFrameRef.current);
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange, true);
      window.visualViewport?.removeEventListener('resize', onViewportChange);
      window.visualViewport?.removeEventListener('scroll', onViewportChange);
    };
  }, [open, dateMode, flexView, repositionPopup]);

  const nights = mode === 'range' && range[0].startDate && range[0].endDate
    ? Math.max(0, Math.round((range[0].endDate - range[0].startDate) / 86400000)) : 0;

  const handleOpen = () => {
    setOpen(true);
    setDateMode(searchMode === 'month' ? 'whole-month' : 'specific');
    setFlexView('months');
    setFlexMonth(null);
    setWholeStart(null);
    setMonthPrices({});
    requestAnimationFrame(repositionPopup);
  };

  const startText = searchMode === 'month' && selectedMonth
    ? displayMonth(selectedMonth)
    : (startDate ? displayDate(startDate) : null);
  const endText = searchMode === 'month' && selectedReturnMonth
    ? displayMonth(selectedReturnMonth)
    : (endDate ? displayDate(endDate) : null);

  return (
    <div className="tdp-wrap" ref={wrapRef}>
      <div className="tdp-trigger" ref={triggerRef}>
        <div className={`tdp-field${open ? ' tdp-field--active' : ''}${startError ? ' tdp-field--error' : ''}`} onClick={handleOpen}>
          <span className="tdp-field__label">{searchMode === 'month' ? 'Travel month' : startLabel}</span>
          <div className="tdp-field__value">
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14" className="tdp-field__icon">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className={startText ? 'tdp-field__date' : 'tdp-field__ph'}>{startText || startPlaceholder}</span>
          </div>
          {startError && <p className="tdp-field__err">{startError}</p>}
        </div>

        {mode === 'range' && (
          <>
            <span className="tdp-sep">→</span>
            <div className={`tdp-field${open ? ' tdp-field--active' : ''}${endError ? ' tdp-field--error' : ''}`} onClick={handleOpen}>
              <span className="tdp-field__label">{searchMode === 'month' ? 'Return month' : endLabel}</span>
              <div className="tdp-field__value">
                <svg viewBox="0 0 24 24" fill="none" width="14" height="14" className="tdp-field__icon">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span className={endText ? 'tdp-field__date' : 'tdp-field__ph'}>{endText || endPlaceholder}</span>
              </div>
              {endError && <p className="tdp-field__err">{endError}</p>}
            </div>
          </>
        )}
      </div>

      {open && createPortal(
        <div className="tdp-popup" ref={popupRef} style={{ top: popupPos.top, left: popupPos.left }}>
          <div className="tdp-tabs" role="tablist" aria-label="Flight date search mode">
            <button type="button" className={`tdp-tab${dateMode === 'specific' ? ' tdp-tab--active' : ''}`} onClick={() => setDateMode('specific')}>Specific dates</button>
            <button type="button" className={`tdp-tab${dateMode === 'whole-month' ? ' tdp-tab--active' : ''}`} onClick={() => { setDateMode('whole-month'); setWholeStart(null); }}>Whole month</button>
            <button type="button" className={`tdp-tab${dateMode === 'flexible' ? ' tdp-tab--active' : ''}`} onClick={() => { setDateMode('flexible'); setFlexView('months'); }}>Flexible dates</button>
          </div>

          {dateMode === 'specific' && (
            <>
              {mode === 'range' ? (
                <DateRange ranges={range} onChange={handleRangeChange} months={2} direction="horizontal" minDate={minD} maxDate={maxD}
                  rangeColors={['#029e9d']} showMonthAndYearPickers={false} showDateDisplay={false} moveRangeOnFirstSelection={false}
                  weekdayDisplayFormat="EEEEEE" monthDisplayFormat="MMMM yyyy" />
              ) : (
                <Calendar date={range[0].startDate} onChange={handleSingleChange} months={2} direction="horizontal" minDate={minD} maxDate={maxD}
                  color="#029e9d" showMonthAndYearPickers={false} weekdayDisplayFormat="EEEEEE" monthDisplayFormat="MMMM yyyy" />
              )}
              <div className="tdp-footer">
                {nights > 0
                  ? <span className="tdp-footer__nights">{nights} night{nights !== 1 ? 's' : ''} - pick return date</span>
                  : mode === 'range' ? <span className="tdp-footer__nights">Select departure date</span> : null}
                <button className="tdp-btn tdp-btn--cancel" onClick={() => setOpen(false)}>Cancel</button>
              </div>
            </>
          )}

          {dateMode === 'whole-month' && (
            <>
              <div className="tdp-month-mode-intro">
                <strong>Search the whole month</strong>
                <span>No exact date required. Compare the cheapest available fares across the selected month.</span>
              </div>
              <MonthGrid
                mode={mode}
                selectedStart={wholeStart}
                onMonthClick={handleWholeMonthClick}
                monthSummaries={monthSummaries}
                summaryLoading={summaryLoading}
                formatPrice={formatPrice}
                cheapestMonthKey={cheapestMonthKey}
                routePriced={hasPriceRoute}
              />
              <div className="tdp-footer">
                {mode === 'range' && wholeStart && (
                  <span className="tdp-footer__nights">Departure: {format(wholeStart, 'MMMM yyyy')} - choose a return month</span>
                )}
                {hasPriceRoute && cheapestMonthKey && !wholeStart && (
                  <span className="tdp-footer__nights">Cheapest currently found: {format(new Date(`${cheapestMonthKey}-01T00:00:00`), 'MMMM yyyy')}</span>
                )}
                <button className="tdp-btn tdp-btn--cancel" onClick={() => setOpen(false)}>Cancel</button>
              </div>
            </>
          )}

          {dateMode === 'flexible' && (
            <>
              {flexView === 'months' ? (
                <MonthGrid mode="single" hintText="Choose a month to see daily prices. You can still search that entire month without choosing a day." onMonthClick={handleMonthClick} />
              ) : (
                <PriceCalendar
                  month={flexMonth}
                  prices={monthPrices}
                  loading={pricesLoading}
                  minDate={minD}
                  maxDate={maxD}
                  mode={mode}
                  formatPrice={formatPrice}
                  onSelect={(s, e) => apply(s, e)}
                  onWholeMonth={handleFlexibleWholeMonth}
                  onMonthChange={loadMonthlyPrices}
                  onBack={() => { setFlexView('months'); setFlexMonth(null); setMonthPrices({}); }}
                />
              )}
              <div className="tdp-footer">
                {flexView === 'calendar' && !pricesLoading && Object.keys(monthPrices).length > 0 && (
                  <span className="tdp-footer__nights"><span className="tdp-legend tdp-legend--cheap" /> Cheapest &nbsp;<span className="tdp-legend tdp-legend--pricey" /> More expensive</span>
                )}
                <button className="tdp-btn tdp-btn--cancel" onClick={() => setOpen(false)}>Cancel</button>
              </div>
            </>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default TripDatePicker;
