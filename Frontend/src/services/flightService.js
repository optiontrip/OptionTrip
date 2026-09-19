const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import { getDestinationImage as getCachedDestinationImage } from '../utils/destinationImages';

// Client-side safety net for the booking-critical autocomplete. The backend
// remains the source of truth, but a temporary provider/API outage must not
// leave common city/country inputs as a blank box.
const LOCATION_FALLBACKS = [
  { iataCode: 'MIA', cityName: 'Miami', name: 'Miami International Airport', countryName: 'United States' },
  { iataCode: 'LAX', cityName: 'Los Angeles', name: 'Los Angeles International Airport', countryName: 'United States' },
  { iataCode: 'JFK', cityName: 'New York', name: 'John F. Kennedy International Airport', countryName: 'United States' },
  { iataCode: 'SFO', cityName: 'San Francisco', name: 'San Francisco International Airport', countryName: 'United States' },
  { iataCode: 'ORD', cityName: 'Chicago', name: "O'Hare International Airport", countryName: 'United States' },
  { iataCode: 'LHR', cityName: 'London', name: 'Heathrow Airport', countryName: 'United Kingdom' },
  { iataCode: 'LGW', cityName: 'London', name: 'Gatwick Airport', countryName: 'United Kingdom' },
  { iataCode: 'CDG', cityName: 'Paris', name: 'Charles de Gaulle Airport', countryName: 'France' },
  { iataCode: 'ORY', cityName: 'Paris', name: 'Paris Orly Airport', countryName: 'France' },
  { iataCode: 'BEG', cityName: 'Belgrade', name: 'Belgrade Nikola Tesla Airport', countryName: 'Serbia' },
  { iataCode: 'INI', cityName: 'Niš', name: 'Niš Constantine the Great Airport', countryName: 'Serbia' },
  { iataCode: 'IST', cityName: 'Istanbul', name: 'Istanbul Airport', countryName: 'Turkey' },
  { iataCode: 'SAW', cityName: 'Istanbul', name: 'Sabiha Gökçen International Airport', countryName: 'Turkey' },
  { iataCode: 'AYT', cityName: 'Antalya', name: 'Antalya Airport', countryName: 'Turkey' },
  { iataCode: 'FCO', cityName: 'Rome', name: 'Leonardo da Vinci–Fiumicino Airport', countryName: 'Italy' },
  { iataCode: 'MXP', cityName: 'Milan', name: 'Milan Malpensa Airport', countryName: 'Italy' },
  { iataCode: 'FRA', cityName: 'Frankfurt', name: 'Frankfurt Airport', countryName: 'Germany' },
  { iataCode: 'BER', cityName: 'Berlin', name: 'Berlin Brandenburg Airport', countryName: 'Germany' },
  { iataCode: 'MAD', cityName: 'Madrid', name: 'Adolfo Suárez Madrid–Barajas Airport', countryName: 'Spain' },
  { iataCode: 'BCN', cityName: 'Barcelona', name: 'Barcelona–El Prat Airport', countryName: 'Spain' },
  { iataCode: 'ATH', cityName: 'Athens', name: 'Athens International Airport', countryName: 'Greece' },
  { iataCode: 'YYZ', cityName: 'Toronto', name: 'Toronto Pearson International Airport', countryName: 'Canada' },
  { iataCode: 'YVR', cityName: 'Vancouver', name: 'Vancouver International Airport', countryName: 'Canada' },
];

const COUNTRY_FALLBACKS = [
  { code: 'RS', name: 'Serbia' },
  { code: 'TR', name: 'Turkey' },
  { code: 'US', name: 'United States', aliases: ['USA', 'America'] },
  { code: 'GB', name: 'United Kingdom', aliases: ['UK', 'England'] },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'DE', name: 'Germany' },
  { code: 'ES', name: 'Spain' },
  { code: 'GR', name: 'Greece' },
  { code: 'CA', name: 'Canada' },
];

const localLocationFallback = (keyword) => {
  const q = String(keyword || '').trim().toLowerCase();
  if (q.length < 2) return [];

  const countryMatches = COUNTRY_FALLBACKS
    .filter(country => {
      const values = [country.name, country.code, ...(country.aliases || [])];
      return values.some(v => String(v).toLowerCase().startsWith(q));
    })
    .map(country => {
      const countryAirports = LOCATION_FALLBACKS.filter(a => a.countryName === country.name);
      return {
        iataCode: country.code,
        cityName: country.name,
        name: `${country.name} - All airports`,
        countryName: country.name,
        isCountry: true,
        countryAirports,
      };
    });

  const airportMatches = LOCATION_FALLBACKS.filter(location => {
    return [location.iataCode, location.cityName, location.name, location.countryName]
      .some(value => String(value || '').toLowerCase().includes(q));
  });

  const seen = new Set();
  return [...countryMatches, ...airportMatches].filter(item => {
    const key = `${item.isCountry ? 'country' : 'airport'}:${item.iataCode}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 10);
};

const getPreferredLocale = () => {
  if (typeof window !== 'undefined') {
    const selected = String(window.localStorage?.getItem('i18nextLng') || '').trim().replace('_', '-');
    const selectedBase = selected.split('-')[0].toLowerCase();
    if (/^[a-z]{2}$/.test(selectedBase)) return selectedBase;
  }
  if (typeof navigator === 'undefined') return 'en';
  const value = String(navigator.language || navigator.languages?.[0] || 'en').split(/[-_]/)[0].toLowerCase();
  return /^[a-z]{2}$/.test(value) ? value : 'en';
};

export const searchAirports = async (keyword) => {
  if (!keyword || keyword.trim().length < 2) return [];
  const fallback = localLocationFallback(keyword);
  try {
    const params = new URLSearchParams({
      keyword: keyword.trim(),
      locale: getPreferredLocale(),
    });
    const res = await fetch(`${API_URL}/api/flights/airports?${params.toString()}`);
    if (!res.ok) return fallback;
    const data = await res.json();
    const live = data.data?.locations || [];
    if (live.length > 0) return live;
    return fallback;
  } catch (error) {
    console.warn('Airport autocomplete API unavailable, using local fallback:', error?.message || error);
    return fallback;
  }
};

export const searchFlights = async ({
  originCode,
  destinationCode,
  departureDate,
  returnDate,
  adults,
  children = 0,
  currencyCode = 'USD',
}) => {
  const res = await fetch(`${API_URL}/api/flights/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      originCode: originCode.trim().toUpperCase(),
      destinationCode: destinationCode.trim().toUpperCase(),
      departureDate,
      returnDate: returnDate || undefined,
      adults: Number(adults),
      children: Number(children),
      currencyCode,
    }),
  });

  const data = await res.json();

  if (!data.success) {
    if (data.errors?.length) {
      throw new Error(data.errors.join('. '));
    }
    throw new Error(data.message || 'Flight search failed');
  }

  return data.data;
};

export const searchFlightsGoogle = async ({
  originCode,
  destinationCode,
  departureDate,
  returnDate    = null,
  adults        = 1,
  travelClass   = 'ECONOMY',
  includeNearby = false,
  radius        = 250,
}) => {
  const params = new URLSearchParams({
    origin:        originCode.trim().toUpperCase(),
    destination:   destinationCode.trim().toUpperCase(),
    departureDate,
    adults:        String(adults),
    travelClass,
  });
  if (returnDate)    params.append('returnDate',    returnDate);
  if (includeNearby) { params.append('includeNearby', 'true'); params.append('radius', String(radius)); }

  const res  = await fetch(`${API_URL}/api/flights/google-search?${params.toString()}`);
  const data = await res.json();

  if (!data.success) throw new Error(data.message || 'Flight search failed');
  return data.data;
};

export const fetchMonthlyPrices = async ({ origin, destination, month }) => {
  try {
    const params = new URLSearchParams({ origin, destination, month });
    const res  = await fetch(`${API_URL}/api/flights/monthly-prices?${params}`);
    const data = await res.json();
    return data.success ? (data.data?.prices || {}) : {};
  } catch { return {}; }
};

export const fetchNearbyAirports = async ({ iata, radius = 250, limit = 3 }) => {
  try {
    const params = new URLSearchParams({ iata, radius: String(radius), limit: String(limit) });
    const res  = await fetch(`${API_URL}/api/flights/nearby-airports?${params}`);
    const data = await res.json();
    return data.success ? (data.data?.nearby || []) : [];
  } catch { return []; }
};

export const exploreDestinations = async (origin) => {
  try {
    const res  = await fetch(`${API_URL}/api/flights/explore?origin=${encodeURIComponent(origin)}`);
    const data = await res.json();
    return data.success ? (data.data?.prices || {}) : {};
  } catch {
    return {};
  }
};

export const getDestinationImage = async (query) => {
  if (!query || query.trim().length < 2) return null;
  return {
    imageUrl: getCachedDestinationImage(query),
    source: 'unsplash-source',
  };
};

export const getCheapPrice = async ({ origin, destination, departDate }) => {
  try {
    const params = new URLSearchParams({ origin, destination, departDate });
    const res  = await fetch(`${API_URL}/api/flights/cheap-price?${params}`);
    const data = await res.json();
    return data.success ? data.data : null;
  } catch { return null; }
};

export const searchFlightsDuffel = async ({
  originCode,
  destinationCode,
  departureDate,
  returnDate    = null,
  adults        = 1,
  travelClass   = 'economy',
  includeNearby = false,
  radius        = 250,
}) => {
  const params = new URLSearchParams({
    origin:      originCode.trim().toUpperCase(),
    destination: destinationCode.trim().toUpperCase(),
    departureDate,
    adults:      String(adults),
    travelClass,
  });
  if (returnDate)    params.append('returnDate',    returnDate);
  if (includeNearby) { params.append('includeNearby', 'true'); params.append('radius', String(radius)); }

  const res  = await fetch(`${API_URL}/api/flights/duffel-search?${params.toString()}`);
  const data = await res.json();

  if (!data.success) throw new Error(data.message || 'Duffel flight search failed');
  return data.data;
};

export const searchFlightsTP = async ({ origin, destination, departureAt, returnAt, limit }) => {
  const params = new URLSearchParams({ origin, destination, departureAt });
  if (returnAt) params.append('returnAt', returnAt);
  if (limit)    params.append('limit', String(limit));

  const res = await fetch(`${API_URL}/api/flights/tp-search?${params.toString()}`);
  const data = await res.json();

  if (!data.success) {
    throw new Error(data.message || 'Flight search failed');
  }

  return data.data;
};
