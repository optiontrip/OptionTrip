const REQUIRED_KEYS = [
  'entry',
  'transport',
  'openingHours',
  'safety',
  'returnBuffer'
];

const normalizeCheck = (value) => {
  if (value === true) return { status: 'pass' };
  if (value === false) return { status: 'fail' };
  if (!value || typeof value !== 'object') return { status: 'unknown' };

  const status = ['pass', 'fail', 'unknown'].includes(value.status)
    ? value.status
    : 'unknown';

  return {
    status,
    source: value.source || null,
    checkedAt: value.checkedAt || null,
    note: value.note || null
  };
};

const requiredForWindow = (window = {}) => {
  const eligibility = window.eligibility || {};
  return REQUIRED_KEYS.filter((key) => {
    if (key === 'entry') return !!eligibility.requiresPassportOrVisaValidation;
    if (key === 'transport') return !!eligibility.requiresLiveTransportCheck;
    if (key === 'openingHours') return !!eligibility.requiresOpeningHoursCheck;
    if (key === 'safety') return !!eligibility.requiresSafetyCheck;
    if (key === 'returnBuffer') return !!eligibility.requiresReturnBufferValidation;
    return false;
  });
};

const automaticReturnBufferCheck = (window = {}) => {
  if (!window.eligibility?.requiresReturnBufferValidation) return null;
  const usableMinutes = Number(window.usableMinutes || 0);
  const rawMinutes = Number(window.rawMinutes || 0);
  const passed = usableMinutes >= 45 && rawMinutes > usableMinutes;
  return {
    status: passed ? 'pass' : 'fail',
    source: 'opportunity-engine-buffer',
    checkedAt: new Date().toISOString(),
    note: passed
      ? `Configured airport/return buffer leaves ${usableMinutes} usable minutes in a ${rawMinutes}-minute window.`
      : 'The calculated window does not leave enough time after the configured airport/return buffer.'
  };
};

const automaticTransportCheck = (window = {}) => {
  if (!window.eligibility?.requiresLiveTransportCheck) return null;
  const candidate = window.transportContext?.bestCandidate;
  if (!candidate || !window.transportContext?.source) return null;
  return {
    status: candidate.feasible ? 'pass' : 'fail',
    source: window.transportContext.source,
    checkedAt: window.transportContext.checkedAt || new Date().toISOString(),
    note: candidate.feasible
      ? `${candidate.name || 'Candidate'} is estimated at ${candidate.oneWayMinutes} min each way, leaving ${candidate.remainingMinutes} min after ground travel.`
      : `${candidate.name || 'Candidate'} needs about ${candidate.roundTripMinutes} min of ground travel, which does not leave the required activity buffer in this window.`
  };
};

const automaticOpeningHoursCheck = (window = {}) => {
  if (!window.eligibility?.requiresOpeningHoursCheck) return null;
  const bestPlaceId = window.transportContext?.bestCandidate?.placeId;
  const place = (window.nearbyPlaces || []).find((item) => item.placeId === bestPlaceId)
    || window.nearbyPlaces?.[0];
  if (!place) return null;
  if (place.businessStatus === 'CLOSED_PERMANENTLY') {
    return {
      status: 'fail',
      source: 'google_places_live_hours',
      checkedAt: new Date().toISOString(),
      note: `${place.name || 'Candidate'} is marked permanently closed.`
    };
  }
  const now = new Date();
  const start = new Date(window.start);
  const end = new Date(window.end);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const hoursUntilStart = (start.getTime() - now.getTime()) / 3600000;
  if (hoursUntilStart < -1 || hoursUntilStart > 6) return null;
  const nextOpen = place.nextOpenTime ? new Date(place.nextOpenTime) : null;
  const nextClose = place.nextCloseTime ? new Date(place.nextCloseTime) : null;
  const minimumActivityEnd = new Date(start.getTime() + 30 * 60000);
  if (place.openNow === true && nextClose && !Number.isNaN(nextClose.getTime())) {
    if (nextClose >= minimumActivityEnd) {
      return {
        status: 'pass',
        source: 'google_places_live_hours',
        checkedAt: now.toISOString(),
        note: `${place.name || 'Candidate'} is open and its live closing time leaves at least 30 minutes at the venue.`
      };
    }
    if (nextClose <= start) return null;
    return {
      status: 'fail',
      source: 'google_places_live_hours',
      checkedAt: now.toISOString(),
      note: `${place.name || 'Candidate'} is open now but closes before the minimum activity window is available.`
    };
  }
  if (place.openNow === false && nextOpen && !Number.isNaN(nextOpen.getTime()) && nextOpen >= end) {
    return {
      status: 'fail',
      source: 'google_places_live_hours',
      checkedAt: now.toISOString(),
      note: `${place.name || 'Candidate'} is closed and is not scheduled to open before this free-time window ends.`
    };
  }
  return null;
};

const automaticSafetyCheck = (window = {}) => {
  if (!window.eligibility?.requiresSafetyCheck) return null;
  const safety = window.safetyContext;
  if (!safety || !['pass', 'fail'].includes(safety.validationStatus)) return null;
  return {
    status: safety.validationStatus,
    source: safety.source || 'official_travel_advisory',
    checkedAt: safety.checkedAt || new Date().toISOString(),
    note: `${safety.country || 'Destination'}: Level ${safety.level} - ${safety.label}. ${safety.note || ''}`.trim()
  };
};

const checksForWindow = (window = {}, validation = {}) => {
  const windowChecks = validation?.windows?.[window.id] || {};
  return Object.fromEntries(REQUIRED_KEYS.map((key) => {
    const explicit = windowChecks?.[key] ?? validation?.[key];
    if (explicit !== undefined) return [key, normalizeCheck(explicit)];
    if (key === 'returnBuffer') {
      const automatic = automaticReturnBufferCheck(window);
      if (automatic) return [key, automatic];
    }
    if (key === 'transport') {
      const automatic = automaticTransportCheck(window);
      if (automatic) return [key, automatic];
    }
    if (key === 'openingHours') {
      const automatic = automaticOpeningHoursCheck(window);
      if (automatic) return [key, automatic];
    }
    if (key === 'safety') {
      const automatic = automaticSafetyCheck(window);
      if (automatic) return [key, automatic];
    }
    return [key, normalizeCheck(null)];
  }));
};

export const applyOpportunityValidation = (context = {}, validation = {}) => {
  const windows = (context.windows || []).map((window) => {
    const required = requiredForWindow(window);
    const checks = checksForWindow(window, validation);
    const failed = required.filter((key) => checks[key].status === 'fail');
    const pending = required.filter((key) => checks[key].status !== 'pass');
    return {
      ...window,
      validation: {
        required,
        failed,
        pending,
        actionable: required.length === 0 || pending.length === 0,
        blocked: failed.length > 0,
        checks
      }
    };
  });
  return {
    ...context,
    windows,
    validationSummary: {
      totalWindows: windows.length,
      actionableWindows: windows.filter((window) => window.validation.actionable).length,
      blockedWindows: windows.filter((window) => window.validation.blocked).length,
      pendingWindows: windows.filter((window) => !window.validation.actionable && !window.validation.blocked).length
    }
  };
};

export default { applyOpportunityValidation };
