const COUNTRY_INFO_BASE = 'https://travel.state.gov/content/travel/en/international-travel/International-Travel-Country-Information-Pages';

const withTimeout = async (promiseFactory, timeoutMs = 7000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await promiseFactory(controller.signal);
  } finally {
    clearTimeout(timer);
  }
};

const decodeEntities = (value = '') => String(value)
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

const isUsPassport = (traveler = {}) => {
  const value = String(
    traveler.passportCountry || traveler.citizenship || traveler.nationality || traveler.countryOfCitizenship || ''
  ).trim().toLowerCase();
  return ['us', 'usa', 'u.s.', 'u.s.a.', 'united states', 'united states of america'].includes(value);
};

const countrySlugs = (country) => {
  const raw = String(country || '').trim();
  if (!raw) return [];
  const simplified = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]/g, '');
  const withoutThe = raw.replace(/^the\s+/i, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]/g, '');
  const aliases = {
    'The Bahamas': 'Bahamas',
    'Bahamas': 'Bahamas',
    'South Korea': 'SouthKorea',
    'Republic of Korea': 'SouthKorea',
    'North Korea': 'NorthKorea',
    'Czechia': 'CzechRepublic',
    'Czech Republic': 'CzechRepublic',
    'United Kingdom': 'UnitedKingdom',
    'United States': 'UnitedStates',
    'Côte d’Ivoire': 'CotedIvoire',
    "Côte d'Ivoire": 'CotedIvoire'
  };
  return [...new Set([aliases[raw], withoutThe, simplified].filter(Boolean))];
};

const extractQuickFact = (text, label, nextLabels) => {
  const escapedNext = nextLabels.join('|').replace(/ /g, '\\s+');
  const regex = new RegExp(`${label}\\s*:?\\s*(.*?)(?=\\s+(?:${escapedNext})\\s*:|$)`, 'i');
  const match = text.match(regex);
  return match?.[1]?.trim() || null;
};

const classifyVisaRequirement = (value = '') => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return 'unknown';
  if (/\bnot required\b|\bno\.?$|\bno visa\b|\bvisa-free\b/.test(normalized)) return 'not_required';
  if (/\byes\b|\brequired\b|\bobtain\b|\bevisa\b|\bvisa prior\b/.test(normalized)) return 'required';
  return 'conditional';
};

const fetchCountryEntryInfo = async (country) => {
  for (const slug of countrySlugs(country)) {
    const sourceUrl = `${COUNTRY_INFO_BASE}/${slug}.html`;
    try {
      const response = await withTimeout((signal) => fetch(sourceUrl, {
        headers: { 'User-Agent': 'OptionTrip/1.0 official-entry-check' },
        signal
      }));
      if (!response.ok) continue;
      const text = stripHtml(await response.text());
      if (!/TOURIST VISA REQUIRED/i.test(text)) continue;
      const touristVisa = extractQuickFact(text, 'TOURIST VISA REQUIRED', [
        'VACCINATIONS',
        'CURRENCY RESTRICTIONS FOR ENTRY',
        'CURRENCY RESTRICTIONS FOR EXIT',
        'Embassies and Consulates'
      ]);
      const passportValidity = extractQuickFact(text, 'PASSPORT VALIDITY', [
        'BLANK PASSPORT PAGES',
        'TOURIST VISA REQUIRED'
      ]);
      return {
        source: 'us_state_department_country_info',
        sourceUrl,
        audience: 'U.S. passport holders',
        country,
        touristVisaRequirement: touristVisa,
        visaRequirementClass: classifyVisaRequirement(touristVisa),
        passportValidity,
        checkedAt: new Date().toISOString()
      };
    } catch {
      // Try the next deterministic country-page slug and otherwise leave the gate pending.
    }
  }
  return null;
};

const deriveValidationStatus = (entryInfo, traveler = {}) => {
  if (!entryInfo || !isUsPassport(traveler)) return 'unknown';
  const passportValid = traveler.passportValidForTrip === true || traveler.passportValidityVerified === true;
  if (!passportValid) return 'unknown';

  if (entryInfo.visaRequirementClass === 'not_required') return 'pass';
  if (entryInfo.visaRequirementClass === 'required') {
    if (traveler.hasRequiredVisa === false) return 'fail';
    if (traveler.hasRequiredVisa === true && traveler.entryDocumentsVerified === true) return 'pass';
  }
  return 'unknown';
};

export const enrichOpportunityEntryContext = async (context = {}) => {
  const windows = Array.isArray(context.windows) ? context.windows : [];
  const traveler = context.traveler || {};
  const usPassport = isUsPassport(traveler);
  const cache = new Map();

  const enriched = await Promise.all(windows.map(async (window) => {
    const country = window.liveContext?.location?.country || null;
    if (!country || !usPassport) {
      return {
        ...window,
        entryContext: country ? {
          source: null,
          country,
          validationStatus: 'unknown',
          note: 'Automatic official entry checking currently runs only when a U.S. passport is explicitly confirmed.'
        } : null
      };
    }

    if (!cache.has(country)) cache.set(country, fetchCountryEntryInfo(country));
    const entryInfo = await cache.get(country);
    if (!entryInfo) return { ...window, entryContext: null };

    const validationStatus = deriveValidationStatus(entryInfo, traveler);
    return {
      ...window,
      entryContext: {
        ...entryInfo,
        validationStatus,
        note: validationStatus === 'pass'
          ? 'Official U.S. country information plus traveler-confirmed passport/document status supports this entry check.'
          : validationStatus === 'fail'
            ? 'The official country information says a tourist visa is required and the traveler explicitly reported not having the required visa.'
            : 'Official visa information is available, but passport validity and/or required travel documents are not sufficiently confirmed, so the entry gate remains pending.'
      }
    };
  }));

  return {
    ...context,
    windows: enriched,
    entrySummary: {
      totalWindows: enriched.length,
      officialEntryWindows: enriched.filter((window) => window.entryContext?.source).length,
      autoPassedWindows: enriched.filter((window) => window.entryContext?.validationStatus === 'pass').length,
      autoFailedWindows: enriched.filter((window) => window.entryContext?.validationStatus === 'fail').length,
      pendingWindows: enriched.filter((window) => window.entryContext && window.entryContext.validationStatus === 'unknown').length
    }
  };
};

export default { enrichOpportunityEntryContext };
