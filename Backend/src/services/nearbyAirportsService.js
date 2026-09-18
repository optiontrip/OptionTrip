import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const airports = JSON.parse(
  readFileSync(join(__dirname, '../data/airports.json'), 'utf-8')
);

const normalize = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');

const airportIndex = new Map(airports.map(a => [a.iata.toUpperCase(), a]));
const countries = [...new Set(airports.map(a => a.country).filter(Boolean))].sort();

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

  if (iata === query) return 0;
  if (city === query) return 1;
  if (city.startsWith(query)) return 2;
  if (name.startsWith(query)) return 3;
  if (country === query) return 4;
  if (country.startsWith(query)) return 5;
  if (city.includes(query)) return 6;
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

export const findCountryDirectoryMatch = (query, limit = 12) => {
  const needle = normalize(query);
  if (needle.length < 2) return null;

  const exact = countries.find(country => normalize(country) === needle);
  const prefix = exact || countries.find(country => normalize(country).startsWith(needle));
  if (!prefix) return null;

  const countryAirports = airports
    .filter(airport => airport.country === prefix)
    .slice(0, Math.max(1, limit))
    .map(airport => ({
      iataCode: airport.iata,
      cityName: airport.city,
      name: airport.name,
      countryName: airport.country,
      latitude: airport.lat,
      longitude: airport.lng,
    }));

  return {
    countryName: prefix,
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
  const match = airports.find(a => normalize(a.city) === needle || normalize(a.name).includes(needle))
    || airports.find(a => normalize(a.city).includes(needle));
  return match || null;
};

console.log(`✅ Nearby airports service loaded: ${airports.length} airports indexed`);