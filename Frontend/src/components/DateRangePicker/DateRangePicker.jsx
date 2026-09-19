import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { DateRangePicker } from 'react-date-range';
import { format, addMonths, addDays, differenceInDays } from 'date-fns';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import './DateRangePicker.css';

const MAX_BOOKING_HORIZON_DAYS = 365;

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const DateRangePickerComponent = ({
  selectedDates = [],
  onDateRangeChange,
  error
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
    key: 'selection'
  });
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });
  const pickerRef = useRef(null);
  const inputRef = useRef(null);
  const POPUP_WIDTH = 700;
  const minBookingDate = startOfToday();
  const maxBookingDate = addDays(minBookingDate, MAX_BOOKING_HORIZON_DAYS);

  useEffect(() => {
    if (selectedDates[0] && selectedDates[1]) {
      const nextStart = new Date(selectedDates[0]);
      const nextEnd   = new Date(selectedDates[1]);
      if (!dateRange.startDate || !dateRange.endDate ||
      nextStart.getTime() !== dateRange.startDate.getTime() ||
      nextEnd.getTime()   !== dateRange.endDate.getTime()) {
        setDateRange({ startDate: nextStart, endDate: nextEnd, key: 'selection' });
      }
    } else if (!dateRange.startDate && !dateRange.endDate) {
      const defaultStart = addMonths(startOfToday(), 3);
      const defaultEnd   = addDays(defaultStart, 4);
      setDateRange({ startDate: defaultStart, endDate: defaultEnd, key: 'selection' });
    }
  }, [selectedDates[0], selectedDates[1]]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target) && !inputRef.current?.contains(event.target)) {
        handleClose();
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker, dateRange]);

  useEffect(() => {
    if (!showPicker) return undefined;

    const reposition = () => {
      if (!inputRef.current) return;
      const rect = inputRef.current.getBoundingClientRect();
      const mobile = window.innerWidth < 768;
      if (mobile) {
        setPopupPos({ top: 12, left: Math.max(12, (window.innerWidth - Math.min(window.innerWidth - 24, POPUP_WIDTH)) / 2) });
        return;
      }
      const left = Math.max(16, Math.min(rect.left, window.innerWidth - POPUP_WIDTH - 16));
      setPopupPos({ top: Math.min(rect.bottom + 8, window.innerHeight - 120), left });
    };

    reposition();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    window.visualViewport?.addEventListener('resize', reposition);
    window.visualViewport?.addEventListener('scroll', reposition);

    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
      window.visualViewport?.removeEventListener('resize', reposition);
      window.visualViewport?.removeEventListener('scroll', reposition);
    };
  }, [showPicker]);

  const handleSelect = (ranges) => {
    const { selection } = ranges;
    const daysCount = differenceInDays(selection.endDate, selection.startDate);

    if (selection.startDate > maxBookingDate || selection.endDate > maxBookingDate) {
      alert('Travel dates can only be selected up to 365 days ahead.');
      return;
    }

    if (daysCount > 9) {
      alert('You can only select a maximum of 10 days.');
      return;
    }

    setDateRange(selection);

    if (daysCount >= 1) {
      const startDate = format(selection.startDate, 'yyyy-MM-dd');
      const endDate = format(selection.endDate, 'yyyy-MM-dd');
      const durationDays = daysCount + 1;
      const monthYear = format(selection.startDate, 'MMMM yyyy');

      onDateRangeChange({
        start_date: startDate,
        end_date: endDate,
        duration_days: durationDays,
        month_year: monthYear
      });

      setShowPicker(false);
    }
  };

  const handleClose = () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      setShowPicker(false);
      return;
    }

    const daysCount = differenceInDays(dateRange.endDate, dateRange.startDate);

    if (daysCount < 1) {
      alert('You must select a minimum of 2 days.');
    } else {
      setShowPicker(false);
    }
  };

  const toggleShowPicker = () => {
    if (!showPicker && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const mobile = window.innerWidth < 768;
      const left = mobile
        ? 12
        : Math.max(16, Math.min(rect.left, window.innerWidth - POPUP_WIDTH - 16));
      setPopupPos({ top: mobile ? 12 : rect.bottom + 8, left });
    }
    setShowPicker(v => !v);
  };

  const formatDisplayDate = () => {
    if (dateRange.startDate && dateRange.endDate) {
      const start = format(dateRange.startDate, 'EEE, MMM d');
      const end = format(dateRange.endDate, 'EEE, MMM d');
      return `${start} - ${end}`;
    }
    return 'Select dates';
  };

  return (
    <div className="date-range-picker-wrapper">
      <label htmlFor="dates">
        Dates
        <span className="field-tooltip-wrapper">
          <span className="field-tooltip-icon">?</span>
          <span className="field-tooltip-text">You can choose exact travel dates or select a general period such as a specific month.</span>
        </span>
      </label>
      <div className="date-range-input-container">
        <input
          ref={inputRef}
          type="text"
          className={`date-range-display-input ${error ? 'error' : ''}`}
          value={formatDisplayDate()}
          onClick={toggleShowPicker}
          readOnly
          placeholder="Select dates"
        />
        {error && <span className="error-message">{error}</span>}

        {showPicker && createPortal(
          <div
            className="date-range-picker-dropdown"
            ref={pickerRef}
            style={{ top: popupPos.top, left: popupPos.left }}
          >
            <DateRangePicker
              ranges={[dateRange]}
              onChange={handleSelect}
              moveRangeOnFirstSelection={false}
              months={window.innerWidth < 768 ? 1 : 2}
              direction={window.innerWidth < 768 ? 'vertical' : 'horizontal'}
              minDate={minBookingDate}
              maxDate={maxBookingDate}
              showDateDisplay={false}
              showMonthAndYearPickers={false}
              rangeColors={['#0A539D']}
            />
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};

export default DateRangePickerComponent;
