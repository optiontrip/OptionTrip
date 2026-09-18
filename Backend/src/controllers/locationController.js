import { searchGooglePlace } from '../services/googlePlacesService.js';
import {
  searchAirportDirectory,
  findAirportsForCity,
  findCountryDirectoryMatch,
  findAirportsNearCoordinates,
} from '../services/nearbyAirportsService.js';

const COUNTRY_ISO = {
  'pakistan': 'PK', 'india': 'IN', 'bangladesh': 'BD',
  'united arab emirates': 'AE', 'saudi arabia': 'SA',
  'united kingdom': 'GB', 'united states': 'US', 'canada': 'CA',
  'australia': 'AU', 'germany': 'DE', 'france': 'FR', 'turkey': 'TR',
  'serbia': 'RS', 'china': 'CN', 'japan': 'JP', 'malaysia': 'MY',
  'indonesia': 'ID', 'thailand': 'TH', 'iran': 'IR', 'afghanistan': 'AF',
  'egypt': 'EG', 'italy': 'IT', 'spain': 'ES', 'netherlands': 'NL',
  'russia': 'RU', 'brazil': 'BR', 'south africa': 'ZA', 'nigeria': 'NG',
  'kenya': 'KE', 'morocco': 'MA', 'sri lanka': 'LK', 'nepal': 'NP',
  'oman': 'OM', 'qatar': 'QA', 'kuwait': 'KW', 'bahrain': 'BH',
  'iraq': 'IQ', 'singapore': 'SG', 'philippines': 'PH', 'vietnam': 'VN',
  'south korea': 'KR', 'portugal': 'PT', 'greece': 'GR', 'switzerland': 'CH',
  'austria': 'AT', 'belgium': 'BE', 'croatia': 'HR', 'slovenia': 'SI',
  'bosnia and herzegovina': 'BA', 'montenegro': 'ME', 'north macedonia': 'MK',
  'albania': 'AL', 'hungary': 'HU', 'romania': 'RO', 'bulgaria': 'BG',
  'poland': 'PL', 'czech republic': 'CZ', 'czechia': 'CZ', 'slovakia': 'SK',
  'ukraine': 'UA', 'ireland': 'IE', 'denmark': 'DK', 'sweden': 'SE',
  'norway': 'NO', 'finland': 'FI', 'iceland': 'IS', 'mexico': 'MX',
  'argentina': 'AR', 'chile': 'CL', 'colombia': 'CO', 'peru': 'PE',
  'new zealand': 'NZ', 'israel': 'IL', 'jordan': 'JO', 'georgia': 'GE',
  'armenia': 'AM', 'azerbaijan': 'AZ', 'kazakhstan': 'KZ',
};

const COUNTRY_ALIASES = {
  usa: 'united states', america: 'united states', us: 'united states',
  uk: 'united kingdom', england: 'united kingdom', britain: 'united kingdom',
  uae: 'united arab emirates', korea: 'south korea',
};

const normalize = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
const normalizeLocale = (value) => {
  const code = String(value || 'en').trim().toLowerCase().split(/[-_]/)[0];
  return /^[a-z]{2}$/.test(code) ? code : 'en';
};

const dedupeLocations = (locations, limit = 12) => {
  const seen = new Set();
  const result = [];
  for (const item of locations) {
    if (!item) continue;
    const key = item.isCountry
      ? `country:${normalize(item.countryName || item.cityName)}`
      : item.entityType === 'city'
        ? `city:${String(item.iataCode || '').toUpperCase()}:${normalize(item.countryName)}`
        : `airport:${String(item.iataCode || '').toUpperCase()}`;
    if (!item.isCountry && !item.iataCode) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
    if (result.length >= limit) break;
  }
  return result;
};

const buildCountryEntry = (keyword) => {
  const normalizedKeyword = normalize(keyword);
  const canonicalKeyword = COUNTRY_ALIASES[normalizedKeyword] || normalizedKeyword;
  const match = findCountryDirectoryMatch(canonicalKeyword, 20);
  if (!match) return null;

  const code = COUNTRY_ISO[normalize(match.countryName)] || null;
  if (!code) return null;

  return {
    iataCode: code,
    countryCode: code,
    cityName: match.countryName,
    countryName: match.countryName,
    name: `${match.countryName} - all supported airports`,
    isCountry: true,
    entityType: 'country',
    source: 'local-directory',
    countryAirports: match.countryAirports,
  };
};

const searchTravelpayoutsLocations = async (keyword, locale = 'en') => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1800);
  try {
    const qs = `term=${encodeURIComponent(keyword)}&locale=${encodeURIComponent(locale)}&types[]=airport&types[]=city`;
    const response = await fetch(`https://autocomplete.travelpayouts.com/places2?${qs}`, {
      signal: controller.signal,
    });
    if (!response.ok) return [];
    const raw = await response.json();
    if (!Array.isArray(raw)) return [];

    return raw
      .filter(item => item?.code)
      .map(item => {
        const entityType = item.type === 'city' ? 'city' : 'airport';
        const cityName = item.city_name || item.name || item.code;
        const localCityAirports = entityType === 'city'
          ? findAirportsForCity(cityName, item.country_name || '', 20)
          : [];
        return {
          iataCode: item.code,
          name: entityType === 'city' ? `${cityName} - all airports` : (item.name || cityName || item.code),
          cityName,
          countryName: item.country_name || '',
          entityType,
          isCity: entityType === 'city',
          cityAirports: localCityAirports,
          hasDirectAirport: entityType !== 'city' || localCityAirports.length > 0,
          source: 'travelpayouts',
        };
      });
  } catch (error) {
    if (error?.name !== 'AbortError') {
      console.warn('⚠️ Travelpayouts location autocomplete unavailable:', error?.message || error);
    }
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
};

const rankLiveMatches = (matches, keyword) => {
  const needle = normalize(keyword);
  return [...matches].sort((a, b) => {
    const score = (item) => {
      if (normalize(item.iataCode) === needle) return 0;
      if (item.entityType === 'city' && normalize(item.cityName) === needle) return 1;
      if (item.entityType === 'airport' && normalize(item.cityName) === needle) return 2;
      if (item.entityType === 'city' && normalize(item.cityName).startsWith(needle)) return 3;
      if (item.entityType === 'airport' && normalize(item.cityName).startsWith(needle)) return 4;
      return 5;
    };
    return score(a) - score(b);
  });
};

const resolveNearestAirportsForPlace = async (keyword, locale = 'en') => {
  try {
    const place = await searchGooglePlace(keyword, locale);
    if (!place || !Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)) return [];

    let nearby = findAirportsNearCoordinates(place.latitude, place.longitude, 300, 5);
    if (nearby.length === 0) {
      nearby = findAirportsNearCoordinates(place.latitude, place.longitude, 800, 5);
    }

    const requestedPlace = place.displayName || keyword;
    return nearby.map(item => ({
      ...item,
      name: `${item.name} · Nearest to ${requestedPlace} · ${item.distanceKm} km`,
      requestedPlace,
      requestedAddress: place.formattedAddress || '',
      nearestLabel: `Nearest to ${requestedPlace} · ${item.distanceKm} km`,
      entityType: 'nearest-airport',
      source: 'nearest-airport-resolver',
    }));
  } catch (error) {
    console.warn('⚠️ Nearest-airport resolution failed:', error?.message || error);
    return [];
  }
};

export const getLocations = async (req, res) => {
  try {
    const keyword = String(req.query.keyword || '').trim();
    const locale = normalizeLocale(req.query.locale);
    if (keyword.length < 2) {
      return res.status(400).json({ success: false, message: 'keyword must be at least 2 characters' });
    }

    const needle = normalize(keyword);
    const countryEntry = buildCountryEntry(keyword);
    const localMatches = searchAirportDirectory(keyword, 14);
    const exactLocalIata = localMatches.find(item => normalize(item.iataCode) === needle);
    const exactLocalCityAirports = findAirportsForCity(keyword, '', 20);

    const liveMatches = !countryEntry
      ? rankLiveMatches(await searchTravelpayoutsLocations(keyword, locale), keyword)
      : [];

    const exactCityMatches = liveMatches.filter(item => item.entityType === 'city' && normalize(item.cityName) === needle);
    const exactCityWithAirports = exactCityMatches.filter(item => item.cityAirports?.length > 0);
    const exactCityWithoutAirport = exactCityMatches.find(item => !item.cityAirports?.length) || null;

    const shouldResolveNearest = !countryEntry
      && keyword.length >= 3
      && !exactLocalIata
      && exactLocalCityAirports.length === 0
      && (Boolean(exactCityWithoutAirport) || exactCityMatches.length === 0);

    const nearest = shouldResolveNearest
      ? await resolveNearestAirportsForPlace(keyword, locale)
      : [];

    const remainingLiveMatches = liveMatches.filter(item => {
      if (item.entityType !== 'city') return true;
      if (normalize(item.cityName) !== needle) return true;
      return item.cityAirports?.length > 0;
    });

    let locations = dedupeLocations([
      countryEntry,
      exactLocalIata,
      ...exactCityWithAirports,
      ...nearest,
      ...exactLocalCityAirports,
      ...localMatches,
      ...remainingLiveMatches,
    ], 12);

    return res.json({
      success: true,
      data: {
        query: keyword,
        locale,
        locations,
        count: locations.length,
        resolvedBy: locations[0]?.source || 'none',
        includesCityAllAirports: locations.some(item => item.entityType === 'city'),
        includesNearestAirports: nearest.length > 0,
        matchedCityWithoutAirport: exactCityWithoutAirport
          ? {
            cityName: exactCityWithoutAirport.cityName,
            countryName: exactCityWithoutAirport.countryName,
            providerCode: exactCityWithoutAirport.iataCode,
          }
          : null,
      },
    });
  } catch (error) {
    console.error('❌ Canonical location search error:', error?.message || error);
    return res.status(500).json({
      success: false,
      message: 'Location search failed',
    });
  }
};
