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

export const getInventoryStateForService = (service, inventory = {}) => {
  if (service?.live && service?.route) {
    return { operational: true, direct: true, status: 'live' };
  }

  if (!service?.inventoryVertical) {
    return { operational: false, direct: false, status: 'vi' };
  }

  const vertical = inventory[service.inventoryVertical];
  if (vertical?.live) {
    return {
      operational: true,
      direct: false,
      status: 'partner-ready',
      providers: vertical.providers || [],
    };
  }

  return {
    operational: false,
    direct: false,
    status: vertical?.hasCandidates ? 'provider-pending' : 'vi',
    providers: [],
  };
};
