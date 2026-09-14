const GOOGLE_PLACES_BASE = 'https://places.googleapis.com/v1/places:searchText';
const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

const withTimeout = async (promiseFactory, timeoutMs = 6000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await promiseFactory(controller.signal);
  } finally {
    clearTimeout(timer);
  }
};

const normalizeCoordinates = (coordinates) => {
  if (!coordinates) return null;
  const lat = Number(coordinates.lat ?? coordinates.latitude);
  const lng = Number(coordinates.lng ?? coordinates.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
};

const resolveLocation = async (window = {}) => {
  const direct = normalizeCoordinates(window.coordinates);
  if (direct) return { coordinates: direct, source: 'window' };

  const query = typeof window.location === 'string'
    ? window.location.trim()
    : window.location?.name || window.location?.code || '';
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!query || !apiKey) return null;

  try {
    const response = await withTimeout((signal) => fetch(GOOGLE_PLACES_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location'
      },
      body: JSON.stringify({
        textQuery: query.length <= 4 ? `${query} airport` : query,
        maxResultCount: 1,
        languageCode: 'en'
      }),
      signal
    }));
    if (!response.ok) return null;
    const data = await response.json();
    const place = data?.places?.[0];
    const lat = place?.location?.latitude;
    const lng = place?.location?.longitude;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return {
      coordinates: { lat, lng },
      source: 'google_places',
      placeId: place.id || null,
      name: place.displayName?.text || query,
      address: place.formattedAddress || null
    };
  } catch {
    return null;
  }
};

const weatherLabel = (code) => {
  if ([95, 96, 99].includes(code)) return 'thunderstorm';
  if ([65, 82].includes(code)) return 'heavy_rain';
  if ([75, 86].includes(code)) return 'heavy_snow';
  if ([61, 63, 80, 81].includes(code)) return 'rain';
  if ([71, 73, 77, 85].includes(code)) return 'snow';
  if ([45, 48].includes(code)) return 'fog';
  if ([0, 1].includes(code)) return 'clear';
  if ([2, 3].includes(code)) return 'cloudy';
  return 'mixed';
};

const fetchWeather = async ({ lat, lng, at }) => {
  const date = at ? new Date(at) : new Date();
  if (Number.isNaN(date.getTime())) return null;
  const dateISO = date.toISOString().slice(0, 10);
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    timezone: 'auto',
    start_date: dateISO,
    end_date: dateISO,
    current: 'temperature_2m,precipitation,weather_code,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max'
  });

  try {
    const response = await withTimeout((signal) => fetch(`${OPEN_METEO_BASE}?${params.toString()}`, { signal }));
    if (!response.ok) return null;
    const data = await response.json();
    const code = data?.daily?.weather_code?.[0] ?? data?.current?.weather_code ?? null;
    return {
      source: 'open_meteo',
      checkedAt: new Date().toISOString(),
      forecastDate: dateISO,
      condition: code == null ? 'unknown' : weatherLabel(Number(code)),
      weatherCode: code,
      temperatureNowC: data?.current?.temperature_2m ?? null,
      temperatureMaxC: data?.daily?.temperature_2m_max?.[0] ?? null,
      temperatureMinC: data?.daily?.temperature_2m_min?.[0] ?? null,
      precipitationProbabilityMax: data?.daily?.precipitation_probability_max?.[0] ?? null,
      windSpeedNowKmh: data?.current?.wind_speed_10m ?? null,
      windSpeedMaxKmh: data?.daily?.wind_speed_10m_max?.[0] ?? null,
      disruptive: [65, 75, 82, 86, 95, 96, 99].includes(Number(code))
    };
  } catch {
    return null;
  }
};

const enrichWindow = async (window) => {
  const location = await resolveLocation(window);
  if (!location) return { ...window, liveContext: { location: null, weather: null } };
  const weather = await fetchWeather({
    lat: location.coordinates.lat,
    lng: location.coordinates.lng,
    at: window.start
  });
  return {
    ...window,
    liveContext: {
      location,
      weather
    }
  };
};

export const enrichOpportunityLiveContext = async (context = {}) => {
  const windows = Array.isArray(context.windows) ? context.windows : [];
  const enriched = await Promise.all(windows.map(enrichWindow));
  return {
    ...context,
    windows: enriched,
    liveContextSummary: {
      totalWindows: enriched.length,
      resolvedLocations: enriched.filter((window) => window.liveContext?.location).length,
      weatherWindows: enriched.filter((window) => window.liveContext?.weather).length,
      disruptiveWeatherWindows: enriched.filter((window) => window.liveContext?.weather?.disruptive).length
    }
  };
};

export default { enrichOpportunityLiveContext };
