const GOOGLE_PLACES_BASE = 'https://places.googleapis.com/v1/places:searchText';

const QUERY_BY_TYPE = {
  dining: 'restaurants',
  airport_lounge: 'airport lounges',
  spa_wellness: 'spa wellness',
  shopping: 'shopping',
  museum: 'museums',
  city_break: 'top attractions',
  airport_hotel: 'airport hotels',
  nightlife: 'nightlife bars'
};

const withTimeout = async (promiseFactory, timeoutMs = 6000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await promiseFactory(controller.signal);
  } finally {
    clearTimeout(timer);
  }
};

const normalizeCoordinates = (value) => {
  if (!value) return null;
  const lat = Number(value.lat ?? value.latitude);
  const lng = Number(value.lng ?? value.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
};

const searchPlaces = async ({ query, coordinates }) => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey || !query || !coordinates) return [];

  try {
    const response = await withTimeout((signal) => fetch(GOOGLE_PLACES_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': [
          'places.id',
          'places.displayName',
          'places.formattedAddress',
          'places.location',
          'places.rating',
          'places.userRatingCount',
          'places.priceLevel',
          'places.businessStatus',
          'places.currentOpeningHours',
          'places.regularOpeningHours',
          'places.primaryType'
        ].join(',')
      },
      body: JSON.stringify({
        textQuery: query,
        maxResultCount: 5,
        languageCode: 'en',
        locationBias: {
          circle: {
            center: {
              latitude: coordinates.lat,
              longitude: coordinates.lng
            },
            radius: 20000
          }
        }
      }),
      signal
    }));

    if (!response.ok) return [];
    const data = await response.json();
    return (data?.places || []).map((place) => ({
      placeId: place.id || null,
      name: place.displayName?.text || null,
      address: place.formattedAddress || null,
      coordinates: place.location ? {
        lat: place.location.latitude,
        lng: place.location.longitude
      } : null,
      rating: place.rating ?? null,
      ratingCount: place.userRatingCount ?? null,
      priceLevel: place.priceLevel || null,
      businessStatus: place.businessStatus || null,
      primaryType: place.primaryType || null,
      openNow: place.currentOpeningHours?.openNow ?? null,
      weekdayDescriptions: place.regularOpeningHours?.weekdayDescriptions || [],
      source: 'google_places'
    }));
  } catch {
    return [];
  }
};

const enrichWindowPlaces = async (window = {}) => {
  const coordinates = normalizeCoordinates(window.liveContext?.location?.coordinates || window.coordinates);
  if (!coordinates) return { ...window, nearbyPlaces: [] };

  const opportunityTypes = (window.opportunityTypes || []).slice(0, 3);
  const groups = await Promise.all(opportunityTypes.map(async (opportunity) => {
    const query = QUERY_BY_TYPE[opportunity.type];
    if (!query) return [];
    const places = await searchPlaces({ query, coordinates });
    return places.map((place) => ({ ...place, opportunityType: opportunity.type }));
  }));

  const seen = new Set();
  const nearbyPlaces = groups.flat().filter((place) => {
    if (!place.placeId || seen.has(place.placeId)) return false;
    seen.add(place.placeId);
    return true;
  }).slice(0, 12);

  return { ...window, nearbyPlaces };
};

export const enrichOpportunityNearbyPlaces = async (context = {}) => {
  const windows = Array.isArray(context.windows) ? context.windows : [];
  const enriched = await Promise.all(windows.map(enrichWindowPlaces));
  return {
    ...context,
    windows: enriched,
    nearbyPlacesSummary: {
      totalWindows: enriched.length,
      windowsWithPlaces: enriched.filter((window) => window.nearbyPlaces?.length).length,
      candidatePlaces: enriched.reduce((sum, window) => sum + (window.nearbyPlaces?.length || 0), 0),
      currentlyOpenCandidates: enriched.reduce(
        (sum, window) => sum + (window.nearbyPlaces || []).filter((place) => place.openNow === true).length,
        0
      )
    }
  };
};

export default { enrichOpportunityNearbyPlaces };
