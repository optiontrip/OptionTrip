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

export const applyOpportunityValidation = (context = {}, validation = {}) => {
  const checks = Object.fromEntries(
    REQUIRED_KEYS.map((key) => [key, normalizeCheck(validation?.[key])])
  );

  const windows = (context.windows || []).map((window) => {
    const required = requiredForWindow(window);
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
