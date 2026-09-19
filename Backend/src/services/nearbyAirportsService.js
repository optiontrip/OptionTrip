import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const baseAirports = JSON.parse(
  readFileSync(join(__dirname, '../data/airports.json'), 'utf-8')
);
const supplementalAirports = JSON.parse(
  readFileSync(join(__dirname, '../data/airports.supplemental.json'), 'utf-8')
);
const locationAliases = JSON.parse(
  readFileSync(join(__dirname, '../data/locationAliases.json'), 'utf-8')
);

const existingCodes = new Set(baseAirports.map(a => a.iata?.toUpperCase()).filter(Boolean));
const airports = [
  ...baseAirports,
  ...supplementalAirports.filter(a => !existingCodes.has(a.iata.toUpperCase())),
];

const normalize = (value) => String(value || '')
  .normalize('NFKD')
  .replace(/\p{M}+/gu, '')
  .toLowerCase()
  .replace(/[’'`]/g, '')
  .replace(/[^\p{L}\p{N}]+/gu, ' ')
  .trim()
  .replace(/\s+/g, ' ');

const cityAliasesByCode = new Map(
  Object.entries(locationAliases?.cities || {}).map(([code, aliases]) => [
    String(code).toUpperCase(),
    [...new Set((Array.isArray(aliases) ? aliases : []).map(normalize).filter(Boolean))],
  ])
);

const countryAliasToCanonical = new Map();
for (const [canonical, aliases] of Object.entries(locationAliases?.countries || {})) {
  countryAliasToCanonical.set(normalize(canonical), canonical);
  for (const alias of Array.isArray(aliases) ? aliases : []) {
    const normalized = normalize(alias);
    if (normalized) countryAliasToCanonical.set(normalized, canonical);
  }
}
const countryAliasEntries = [...countryAliasToCanonical.entries()];

// Provider/source datasets still use a few legacy English country names.
// Explicit canonical overrides also win when historical/non-ISO display names
// need to map into the application's two-letter country contract.
const COUNTRY_CODE_OVERRIDES = new Map([
  ['serbia', 'RS'],
  ['kosovo', 'XK'],
  ['bosnia and herzegovina', 'BA'],
  ['czech republic', 'CZ'],
  ['south korea', 'KR'],
  ['north korea', 'KP'],
  ['turkey', 'TR'],
]);

const buildCountryCodeIndex = () => {
  const index = new Map(COUNTRY_CODE_OVERRIDES);

  try {
    const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
    for (let first = 65; first <= 90; first += 1) {
      for (let second = 65; second <= 90; second += 1) {
        const code = `${String.fromCharCode(first)}${String.fromCharCode(second)}`;
        const name = displayNames.of(code);
        if (!name || name === code || name === 'Unknown Region') continue;
        const normalizedName = normalize(name);
        if (!index.has(normalizedName)) index.set(normalizedName, code);
      }
    }
  } catch (error) {
    console.warn('Intl region names unavailable; using country-code overrides only:', error?.message || error);
  }

  return index;
};

const countryCodeIndex = buildCountryCodeIndex();

const canonicalCountryName = value => {
  const needle = normalize(value);
  if (!needle) return null;
  const exact = countryAliasToCanonical.get(needle);
  if (exact) return exact;
  const prefix = countryAliasEntries.find(([alias]) => alias.startsWith(needle));
  return prefix?.[1] || null;
};

export const resolveCountryCode = (countryName) => {
  const needle = normalize(countryName);
  if (!needle) return null;
  const canonical = canonicalCountryName(countryName);
  const lookup = canonical ? normalize(canonical) : needle;
  return COUNTRY_CODE_OVERRIDES.get(lookup) || countryCodeIndex.get(lookup) || null;
};

const airportIndex = new Map(airports.map(a => [a.iata.toUpperCase(), a]));
const countries = [...new Set(airports.map(a => a.country).filter(Boolean))].sort();

const canonicalCityForAlias = value => {
  const needle = normalize(value);
  if (!needle) return null;

  for (const [code, aliases] of cityAliasesByCode.entries()) {
    if (!aliases.includes(needle)) continue;
    const airport = airportIndex.get(code);
    if (airport?.city) return airport.city;
  }
  return null;
};

const airportMatchesCity = (airport, cityNeedle) => {
  if (normalize(airport.city) === cityNeedle) return true;
  const aliases = cityAliasesByCode.get(airport.iata.toUpperCase()) || [];
  return aliases.includes(cityNeedle);
};

const _cache = new Map();
const CACHE_TTL = 60 * 60 * 1000;

const cacheGet = (key) => {
  const e = _cache.get(key);
  if (!e || Date.now() > e.expiresAt) { _cache.delete(key); return null; }
  return e.data;
};
const cacheSet = (key, data) =>
  _cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL });

const TO_RAD = Math.PI / 180;
const EARTH_KM = 6371;

const haversineKm = (lat1, lng1, lat2, lng2) => {
  const dLat = (lat2 - lat1) * TO_RAD;
  const dLng = (lng2 - lng1) * TO_RAD;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * TO_RAD) * Math.cos(lat2 * TO_RAD) * Math.sin(dLng / 2) ** 2;
  return EARTH_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const toLocation = (airport, extra = {}) => ({
  iataCode: airport.iata,
  name: airport.name,
  cityName: airport.city,
  countryName: airport.country,
  countryCode: resolveCountryCode(airport.country),
  latitude: airport.lat,
  longitude: airport.lng,
  entityType: 'airport',
  source: 'local-directory',
  ...extra,
});

const scoreAirportMatch = (airport, query) => {
  const iata = normalize(airport.iata);
  const city = normalize(airport.city);
  const name = normalize(airport.name);
  const country = normalize(airport.country);
  const aliases = cityAliasesByCode.get(airport.iata.toUpperCase()) || [];
  const canonicalCountry = canonicalCountryName(query);

  if (iata === query) return 0;
  if (city === query || aliases.includes(query)) return 1;
  if (city.startsWith(query) || aliases.some(alias => alias.startsWith(query))) return 2;
  if (name.startsWith(query)) return 3;
  if (country === query || (canonicalCountry && normalize(airport.country) === normalize(canonicalCountry))) return 4;
  if (country.startsWith(query)) return 5;
  if (city.includes(query) || aliases.some(alias => alias.includes(query))) return 6;
  if (name.includes(query)) return 7;
  if (country.includes(query)) return 8;
  return Infinity;
};

export const searchAirportDirectory = (query, limit = 12) => {
  const needle = normalize(query);
  if (needle.length < 2) return [];

  return airports
    .map((airport) => ({ airport, score: scoreAirportMatch(airport, needle) }))
    .filter((entry) => Number.isFinite(entry.score))
    .sort((a, b) => a.score - b.score || a.airport.city.localeCompare(b.airport.city) || a.airport.iata.localeCompare(b.airport.iata))
    .slice(0, Math.max(1, limit))
    .map(({ airport }) => toLocation(airport));
};

export const findAirportsForCity = (cityName, countryName = '', limit = 20) => {
  const rawCityNeedle = normalize(cityName);
  const aliasCanonicalCity = canonicalCityForAlias(cityName);
  const cityNeedle = normalize(aliasCanonicalCity || cityName);
  const canonicalCountry = canonicalCountryName(countryName);
  const countryNeedle = normalize(canonicalCountry || countryName);
  if (!cityNeedle) return [];

  return airports
    .filter(airport => normalize(airport.city) === cityNeedle || (!aliasCanonicalCity && airportMatchesCity(airport, rawCityNeedle)))
    .filter(airport => !countryNeedle || normalize(airport.country) === countryNeedle)
    .sort((a, b) => a.iata.localeCompare(b.iata))
    .slice(0, Math.max(1, limit))
    .map(airport => toLocation(airport));
};

export const findAirportsForCountryCode = (countryCode, limit = 20) => {
  const code = String(countryCode || '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return [];

  return airports
    .filter(airport => resolveCountryCode(airport.country) === code)
    .slice(0, Math.max(1, limit))
    .map(airport => toLocation(airport));
};

export const findCountryDirectoryMatch = (query, limit = 12) => {
  const needle = normalize(query);
  if (needle.length < 2) return null;

  const aliasedCanonical = canonicalCountryName(query);
  const exact = aliasedCanonical || countries.find(country => normalize(country) === needle);
  const prefix = exact || countries.find(country => normalize(country).startsWith(needle));
  if (!prefix) return null;

  const countryAirports = findAirportsForCountryCode(resolveCountryCode(prefix), limit);

  return {
    countryName: prefix,
    countryCode: resolveCountryCode(prefix),
    countryAirports,
  };
};

export const findAirportsNearCoordinates = (lat, lng, radiusKm = 250, limit = 5) => {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];

  const key = `coords:${latitude.toFixed(4)}:${longitude.toFixed(4)}:${radiusKm}:${limit}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const result = airports
    .map((airport) => ({
      airport,
      distanceKm: haversineKm(latitude, longitude, airport.lat, airport.lng),
    }))
    .filter((entry) => entry.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, Math.max(1, limit))
    .map(({ airport, distanceKm }) => toLocation(airport, {
      isNearest: true,
      distanceKm: Math.round(distanceKm * 10) / 10,
    }));

  cacheSet(key, result);
  return result;
};

export const findNearbyAirports = (iata, radiusKm = 250, limit = 3) => {
  const code = iata.toUpperCase().trim();
  const key = `${code}:${radiusKm}:${limit}`;

  const cached = cacheGet(key);
  if (cached) return cached;

  const ref = airportIndex.get(code);
  if (!ref) return [];

  const nearby = [];
  for (const airport of airports) {
    if (airport.iata === code) continue;
    const dist = haversineKm(ref.lat, ref.lng, airport.lat, airport.lng);
    if (dist <= radiusKm) {
      nearby.push({ ...airport, distanceKm: Math.round(dist * 10) / 10 });
    }
  }

  const result = nearby
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);

  cacheSet(key, result);
  return result;
};

export const findNearbyForRoute = (originIata, destIata, radiusKm = 250, limit = 3) => ({
  originNearby: findNearbyAirports(originIata, radiusKm, limit),
  destNearby: findNearbyAirports(destIata, radiusKm, limit),
});

export const getAirportInfo = (iata) =>
  airportIndex.get(iata?.toUpperCase().trim()) || null;

export const findAirportByCityName = (name) => {
  if (!name || typeof name !== 'string') return null;
  const needle = normalize(name);
  if (!needle) return null;

  const canonicalCity = canonicalCityForAlias(name);
  if (canonicalCity) {
    return airports.find(a => normalize(a.city) === normalize(canonicalCity)) || null;
  }

  const aliasMatch = airports.find(a => (cityAliasesByCode.get(a.iata.toUpperCase()) || []).includes(needle));
  if (aliasMatch) return aliasMatch;

  const match = airports.find(a => normalize(a.city) === needle || normalize(a.name).includes(needle))
    || airports.find(a => normalize(a.city).includes(needle));
  return match || null;
};

console.log(`Nearby airports service loaded: ${airports.length} airports indexed; ${cityAliasesByCode.size} multilingual city alias groups`);
