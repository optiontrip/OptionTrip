const PARTNER_LINK_API = 'https://api.travelpayouts.com/links/v1/create';
const DEFAULT_OPTIONTRIP_TRS = 176202;
const DEFAULT_OPTIONTRIP_MARKER = 370056;
const REQUEST_TIMEOUT_MS = 12000;
const BATCH_SIZE = 10;
const WARM_CACHE_MS = 5 * 60 * 1000;

// Canonical long brand URLs are converted server-side by the official
// Travelpayouts Partner Links API. A provider only becomes live after the API
// returns a real HTTPS partner_url for the OptionTrip project.
export const TRAVELPAYOUTS_LINK_TARGETS = Object.freeze({
  twelve_go: 'https://12go.asia/en',
  go_city: 'https://gocity.com/en',
  trip_com: 'https://www.trip.com/',
  qeeq: 'https://www.qeeq.com/',
  economybookings: 'https://www.economybookings.com/',
  tiqets_affiliate: 'https://www.tiqets.com/',
  bikesbooking: 'https://bikesbooking.com/',
  klook: 'https://www.klook.com/',
  yesim: 'https://yesim.app/',
  localrent: 'https://localrent.com/',
  welcome_pickups: 'https://www.welcomepickups.com/',
  kiwitaxi: 'https://kiwitaxi.com/',
  gigsky: 'https://www.gigsky.com/',
  airalo_affiliate: 'https://www.airalo.com/',
  drimsim: 'https://drimsim.com/',
  getrentacar: 'https://getrentacar.com/',
  airhelp: 'https://www.airhelp.com/',
  wegotrip_affiliate: 'https://wegotrip.com/',
  radical_storage: 'https://radicalstorage.com/',
  compensair: 'https://compensair.com/',
  saily: 'https://saily.com/',
  kkday: 'https://www.kkday.com/',
  autoeurope: 'https://www.autoeurope.com/',
  insubuy: 'https://www.insubuy.com/',
  gettransfer_affiliate: 'https://gettransfer.com/',
});

const generatedLinks = new Map();
let primePromise = null;
let lastPrimeCompletedAt = 0;
let lastPrimeResult = null;

const positiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const normalizeHttpsUrl = value => {
  try {
    const url = new URL(String(value || '').trim());
    if (url.protocol !== 'https:') return null;
    return url.toString();
  } catch {
    return null;
  }
};

export const getTravelpayoutsProjectIdentity = () => ({
  trs: positiveInteger(process.env.TRAVELPAYOUTS_TRS, DEFAULT_OPTIONTRIP_TRS),
  marker: positiveInteger(process.env.TRAVELPAYOUTS_MARKER, DEFAULT_OPTIONTRIP_MARKER),
});

export const getTravelpayoutsLinkTarget = providerName =>
  TRAVELPAYOUTS_LINK_TARGETS[providerName] || null;

export const getCachedTravelpayoutsPartnerLink = providerName =>
  generatedLinks.get(providerName)?.partnerUrl || null;

export const getTravelpayoutsPartnerLinkSnapshot = () =>
  Object.fromEntries([...generatedLinks.entries()].map(([provider, value]) => [provider, { ...value }]));

export const getTravelpayoutsPartnerLinkWarmupState = () => ({
  running: Boolean(primePromise),
  lastCompletedAt: lastPrimeCompletedAt ? new Date(lastPrimeCompletedAt).toISOString() : null,
  cachedProviders: [...generatedLinks.keys()],
  cachedProviderCount: generatedLinks.size,
  configured: Boolean(String(process.env.TRAVELPAYOUTS_TOKEN || '').trim()),
});

export const buildTravelpayoutsLinkRequest = (entries, identity = getTravelpayoutsProjectIdentity()) => ({
  trs: positiveInteger(identity?.trs, DEFAULT_OPTIONTRIP_TRS),
  marker: positiveInteger(identity?.marker, DEFAULT_OPTIONTRIP_MARKER),
  shorten: true,
  links: entries.slice(0, BATCH_SIZE).map(entry => ({
    url: entry.url,
    sub_id: entry.subId || `optiontrip_${entry.provider}`,
  })),
});

export const extractSuccessfulPartnerLinks = (payload, entries) => {
  const rows = Array.isArray(payload?.result?.links) ? payload.result.links : [];
  const byUrl = new Map(entries.map(entry => [entry.url, entry]));
  const successful = [];

  rows.forEach(row => {
    const entry = byUrl.get(row?.url);
    const partnerUrl = normalizeHttpsUrl(row?.partner_url);
    if (!entry || row?.code !== 'success' || !partnerUrl) return;
    successful.push({
      provider: entry.provider,
      sourceUrl: entry.url,
      partnerUrl,
    });
  });

  return successful;
};

const requestPartnerLinkBatch = async entries => {
  const token = String(process.env.TRAVELPAYOUTS_TOKEN || '').trim();
  if (!token || entries.length === 0) return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(PARTNER_LINK_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Access-Token': token,
      },
      body: JSON.stringify(buildTravelpayoutsLinkRequest(entries)),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Travelpayouts Partner Links HTTP ${response.status}`);
    }

    const payload = await response.json();
    return extractSuccessfulPartnerLinks(payload, entries);
  } finally {
    clearTimeout(timeout);
  }
};

export const primeTravelpayoutsPartnerLinks = async ({ force = false, trigger = 'startup' } = {}) => {
  if (primePromise) return primePromise;

  const now = Date.now();
  if (!force && lastPrimeCompletedAt && now - lastPrimeCompletedAt < WARM_CACHE_MS && lastPrimeResult) {
    return {
      ...lastPrimeResult,
      trigger,
      cached: true,
      activeProviders: [...generatedLinks.keys()],
    };
  }

  const run = async () => {
    if (!String(process.env.TRAVELPAYOUTS_TOKEN || '').trim()) {
      const result = { trigger, attempted: 0, activated: 0, configured: false, activeProviders: [] };
      lastPrimeCompletedAt = Date.now();
      lastPrimeResult = result;
      console.log('🔗 Travelpayouts partner-link warmup skipped: TRAVELPAYOUTS_TOKEN is not configured');
      return result;
    }

    const entries = Object.entries(TRAVELPAYOUTS_LINK_TARGETS).map(([provider, url]) => ({
      provider,
      url,
      subId: `optiontrip_${provider}`,
    }));

    let activated = 0;
    let attempted = 0;

    for (let offset = 0; offset < entries.length; offset += BATCH_SIZE) {
      const batch = entries.slice(offset, offset + BATCH_SIZE);
      attempted += batch.length;
      try {
        const successful = await requestPartnerLinkBatch(batch);
        successful.forEach(link => {
          generatedLinks.set(link.provider, {
            ...link,
            refreshedAt: new Date().toISOString(),
          });
        });
        activated += successful.length;
      } catch (err) {
        console.warn(`🔗 Travelpayouts partner-link batch failed: ${err.message}`);
      }
    }

    const result = {
      trigger,
      attempted,
      activated,
      configured: true,
      activeProviders: [...generatedLinks.keys()],
    };
    lastPrimeCompletedAt = Date.now();
    lastPrimeResult = result;
    console.log(`🔗 Travelpayouts partner links refreshed (${trigger}): ${activated}/${attempted} active`);
    return result;
  };

  primePromise = run();
  try {
    return await primePromise;
  } finally {
    primePromise = null;
  }
};
