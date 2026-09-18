import { searchGooglePlace } from '../services/googlePlacesService.js';
import {
  searchAirportDirectory,
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

const searchTravelpayoutsLocations = async (keyword) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1800);
  try {
    const qs = `term=${encodeURIComponent(keyword)}&locale=en&types[]=airport&types[]=city`;
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
          ? searchAirportDirectory(cityName, 20)
            .filter(airport => normalize(airport.cityName) === normalize(cityName)
              && (!item.country_name || normalize(airport.countryName) === normalize(item.country_name)))
          : [];
        return {
          iataCode: item.code,
          name: entityType === 'city' ? `${cityName} - all airports` : (item.name || cityName || item.code),
          cityName,
          countryName: item.country_name || '',
          entityType,
          isCity: entityType === 'city',
          cityAirports: localCityAirports,
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

const resolveNearestAirportsForUnknownPlace = async (keyword) => {
  try {
    const place = await searchGooglePlace(keyword);
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
    if (keyword.length < 2) {
      return res.status(400).json({ success: false, message: 'keyword must be at least 2 characters' });
    }

    const countryEntry = buildCountryEntry(keyword);
    const localMatches = searchAirportDirectory(keyword, 14);

    // Keep the local directory as a reliable fallback, but also ask the provider
    // for city entities such as MOW/LON/PAR/NYC. This lets a traveler choose
    // "Moscow - all airports" rather than being forced into DME or SVO.
    const liveMatches = !countryEntry
      ? rankLiveMatches(await searchTravelpayoutsLocations(keyword), keyword)
      : [];

    const exactLocalIata = localMatches.find(item => normalize(item.iataCode) === normalize(keyword));
    const exactCityMatches = liveMatches.filter(item => item.entityType === 'city' && normalize(item.cityName) === normalize(keyword));

    let locations = dedupeLocations([
      countryEntry,
      exactLocalIata,
      ...exactCityMatches,
      ...localMatches,
      ...liveMatches,
    ], 12);

    const hasLocalAirport = localMatches.some(item => item.entityType === 'airport');
    const hasResolvedCity = liveMatches.some(item => item.entityType === 'city');
    const shouldResolveNearest = !countryEntry && keyword.length >= 3 && !hasLocalAirport && !hasResolvedCity;

    if (shouldResolveNearest) {
      const nearest = await resolveNearestAirportsForUnknownPlace(keyword);
      if (nearest.length > 0) {
        locations = dedupeLocations([...locations, ...nearest], 12);
      }
    }

    return res.json({
      success: true,
      data: {
        query: keyword,
        locations,
        count: locations.length,
        resolvedBy: locations[0]?.source || 'none',
        includesCityAllAirports: locations.some(item => item.entityType === 'city'),
        includesNearestAirports: locations.some(item => item.entityType === 'nearest-airport'),
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