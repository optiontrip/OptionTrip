const STATE_DEPARTMENT_ADVISORIES_URL = 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html';

const withTimeout = async (promiseFactory, timeoutMs = 7000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await promiseFactory(controller.signal);
  } finally {
    clearTimeout(timer);
  }
};

const decodeEntities = (value = '') => value
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&nbsp;/g, ' ')
  .replace(/&ndash;|&mdash;/g, '-');

const stripHtml = (html = '') => decodeEntities(String(html)
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim());

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeCountry = (value) => String(value || '').trim();

const fetchAdvisory = async (country) => {
  const normalizedCountry = normalizeCountry(country);
  if (!normalizedCountry) return null;

  try {
    const response = await withTimeout((signal) => fetch(STATE_DEPARTMENT_ADVISORIES_URL, {
      headers: { 'User-Agent': 'OptionTrip/1.0 travel-safety-check' },
      signal
    }));
    if (!response.ok) return null;
    const text = stripHtml(await response.text());
    const countryPattern = escapeRegex(normalizedCountry);
    const regex = new RegExp(`${countryPattern}(?: Travel Advisory)?\\s+Level\\s*([1-4])\\s*:?\\s*([^|]{0,90}?)(?:\\s+[A-Z][a-z]+\\s+\\d{1,2},\\s+\\d{4}|$)`, 'i');
    const match = text.match(regex);
    if (!match) return null;

    const level = Number(match[1]);
    const labels = {
      1: 'Exercise Normal Precautions',
      2: 'Exercise Increased Caution',
      3: 'Reconsider Travel',
      4: 'Do Not Travel'
    };

    return {
      source: 'us_state_department',
      sourceUrl: STATE_DEPARTMENT_ADVISORIES_URL,
      audience: 'U.S. citizens, nationals and legal residents',
      country: normalizedCountry,
      level,
      label: labels[level] || null,
      checkedAt: new Date().toISOString()
    };
  } catch {
    return null;
  }
};

const isUsTraveler = (traveler = {}) => {
  const value = String(
    traveler.citizenship || traveler.nationality || traveler.passportCountry || traveler.countryOfCitizenship || ''
  ).trim().toLowerCase();
  return ['us', 'usa', 'u.s.', 'u.s.a.', 'united states', 'united states of america'].includes(value);
};

export const enrichOpportunitySafetyContext = async (context = {}) => {
  const windows = Array.isArray(context.windows) ? context.windows : [];
  const cache = new Map();
  const usTraveler = isUsTraveler(context.traveler);

  const enriched = await Promise.all(windows.map(async (window) => {
    const country = window.liveContext?.location?.country || null;
    if (!country) return { ...window, safetyContext: null };

    if (!cache.has(country)) cache.set(country, fetchAdvisory(country));
    const advisory = await cache.get(country);
    if (!advisory) return { ...window, safetyContext: null };

    let validationStatus = 'unknown';
    if (usTraveler && advisory.level === 1) validationStatus = 'pass';
    if (usTraveler && advisory.level === 4) validationStatus = 'fail';

    return {
      ...window,
      safetyContext: {
        ...advisory,
        validationStatus,
        note: usTraveler
          ? 'This signal is based on the current U.S. Department of State advisory. Levels 2 and 3 remain pending for a more specific risk review.'
          : 'This U.S. Department of State advisory is shown as context only because traveler citizenship was not confirmed as U.S.'
      }
    };
  }));

  return {
    ...context,
    windows: enriched,
    safetySummary: {
      totalWindows: enriched.length,
      advisoryWindows: enriched.filter((window) => window.safetyContext).length,
      level4Windows: enriched.filter((window) => window.safetyContext?.level === 4).length,
      autoValidatedWindows: enriched.filter((window) => ['pass', 'fail'].includes(window.safetyContext?.validationStatus)).length
    }
  };
};

export default { enrichOpportunitySafetyContext };
