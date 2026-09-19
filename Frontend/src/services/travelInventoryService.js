const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let cached = null;
let cachedAt = 0;
const CACHE_MS = 5 * 60 * 1000;

export const fetchTravelInventoryStatus = async ({ force = false } = {}) => {
  if (!force && cached && Date.now() - cachedAt < CACHE_MS) return cached;

  try {
    const response = await fetch(`${API_BASE}/api/travel-inventory`, {
      headers: { Accept: 'application/json' },
      credentials: 'include',
    });
    if (!response.ok) throw new Error(`Travel inventory status failed: ${response.status}`);
    const data = await response.json();
    const verticals = Array.isArray(data?.verticals) ? data.verticals : [];
    cached = Object.fromEntries(verticals.map(item => [item.vertical, item]));
    cachedAt = Date.now();
    return cached;
  } catch {
    // Provider readiness must never break navigation. Static catalog behavior is
    // the safe fallback if the backend is unreachable.
    return {};
  }
};

const safeBookingOptions = vertical => Array.isArray(vertical?.bookingOptions)
  ? vertical.bookingOptions.filter(option => /^https:\/\//i.test(String(option?.url || '')))
  : [];

const providerCount = vertical => {
  const options = safeBookingOptions(vertical);
  const providers = Array.isArray(vertical?.providers) ? vertical.providers : [];
  const optionProviders = options.map(option => option?.provider).filter(Boolean);
  const liveProviders = providers
    .filter(provider => provider?.configured !== false && provider?.live !== false)
    .map(provider => provider?.provider || provider?.id || provider?.name)
    .filter(Boolean);
  return new Set([...optionProviders, ...liveProviders]).size;
};

export const getInventoryStateForService = (service, inventory = {}) => {
  if (service?.live && service?.route) {
    return {
      operational: true,
      direct: true,
      external: false,
      status: 'live',
      bookingOptionCount: 0,
      liveProviderCount: 0,
      providers: [],
    };
  }

  if (!service?.inventoryVertical) {
    return {
      operational: false,
      direct: false,
      external: false,
      status: 'vi',
      bookingOptionCount: 0,
      liveProviderCount: 0,
      providers: [],
    };
  }

  const vertical = inventory[service.inventoryVertical];
  const bookingOptions = safeBookingOptions(vertical);
  const bookingOption = bookingOptions[0] || null;
  const liveProviderCount = providerCount(vertical);

  if (vertical?.live && bookingOption) {
    return {
      operational: true,
      direct: false,
      external: true,
      status: 'partner-ready',
      bookingUrl: bookingOption.url,
      primaryProvider: bookingOption.provider || null,
      bookingOptionCount: bookingOptions.length,
      liveProviderCount,
      providers: vertical.providers || [],
    };
  }

  if (vertical?.live) {
    return {
      operational: true,
      direct: false,
      external: false,
      status: 'partner-ready',
      bookingOptionCount: 0,
      liveProviderCount,
      providers: vertical.providers || [],
    };
  }

  return {
    operational: false,
    direct: false,
    external: false,
    status: vertical?.hasCandidates ? 'provider-pending' : 'vi',
    bookingOptionCount: 0,
    liveProviderCount: 0,
    providers: [],
  };
};
