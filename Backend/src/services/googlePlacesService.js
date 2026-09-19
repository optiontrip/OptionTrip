import PlaceImage from '../models/PlaceImage.js';
import env from '../config/env.js';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';
const GOOGLE_PLACES_API_URL = 'https://places.googleapis.com/v1';
const CACHE_TTL_DAYS = 30;
const MAX_IMAGES_TO_CACHE = 5;

const FALLBACK_IMAGES = [
  '/images/destination/destination1.jpg',
  '/images/destination/destination2.jpg',
  '/images/destination/destination3.jpg',
  '/images/destination/destination4.jpg',
  '/images/destination/destination5.jpg',
];

const normalizePlaceName = (name) => {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
};

const normalizeGoogleLanguageCode = (value) => {
  const raw = String(value || 'en').trim().replace('_', '-');
  if (!raw) return 'en';
  const parts = raw.split('-').filter(Boolean);
  const language = String(parts[0] || '').toLowerCase();
  if (!/^[a-z]{2,3}$/.test(language)) return 'en';
  if (parts.length === 1) return language;
  const suffix = parts.slice(1).map(part => {
    if (/^[a-z]{4}$/i.test(part)) return `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`;
    if (/^[a-z]{2}$/i.test(part)) return part.toUpperCase();
    return part;
  });
  return [language, ...suffix].join('-');
};

const createPlaceId = (placeName) => {
  return `place_${normalizePlaceName(placeName).replace(/\s+/g, '_')}`;
};

const getFallbackImage = (placeName = '') => {
  let hash = 0;
  const text = normalizePlaceName(placeName) || String(Date.now());
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return FALLBACK_IMAGES[Math.abs(hash) % FALLBACK_IMAGES.length];
};

export const searchGooglePlace = async (placeName, languageCode = 'en') => {
  try {
    if (!placeName || placeName.trim().length < 2) {
      console.warn('⚠️ Invalid place name provided to Google Places API');
      return null;
    }

    if (!GOOGLE_PLACES_API_KEY) {
      console.warn('⚠️ GOOGLE_PLACES_API_KEY not configured');
      return null;
    }

    const preferredLanguage = normalizeGoogleLanguageCode(languageCode);
    console.log(`🔍 Searching Google Places for: ${placeName} (${preferredLanguage})`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const requestBody = {
      textQuery: placeName,
      maxResultCount: 1,
      languageCode: preferredLanguage
    };

    const fieldMask = 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.types,places.websiteUri,places.internationalPhoneNumber,places.photos';

    console.log(`📤 Request URL: ${GOOGLE_PLACES_API_URL}/places:searchText`);
    console.log(`📤 Request body:`, JSON.stringify(requestBody));
    console.log(`📤 Field mask: ${fieldMask}`);
    console.log(`📤 API Key configured: ${GOOGLE_PLACES_API_KEY ? 'YES' : 'NO'}`);

    const response = await fetch(`${GOOGLE_PLACES_API_URL}/places:searchText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': fieldMask
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`❌ Google Places API error: ${response.status} ${response.statusText}`);
      console.error(`   Error body: ${errorBody}`);
      
      try {
        const errorJson = JSON.parse(errorBody);
        if (errorJson.error) {
          console.error(`   Error details: ${JSON.stringify(errorJson.error)}`);
        }
      } catch (e) {}
      return null;
    }

    const data = await response.json();
    
    if (!data.places || data.places.length === 0) {
      console.warn(`⚠️ No places found for: ${placeName}`);
      return null;
    }

    const place = data.places[0];
    console.log(`✅ Found place: ${place.displayName.text}`);

    return {
      placeId: place.id,
      displayName: place.displayName?.text || placeName,
      formattedAddress: place.formattedAddress || '',
      latitude: place.location?.latitude,
      longitude: place.location?.longitude,
      rating: place.rating,
      userRatingsTotal: place.userRatingCount,
      types: place.types || [],
      website: place.websiteUri || '',
      phone: place.internationalPhoneNumber || '',
      photos: place.photos || []
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`❌ Google Places API request timeout (10s)`);
    } else {
      console.error(`❌ Error searching Google Places:`, error.message);
    }
    return null;
  }
};

export const getGooglePlacePhotoUrl = (photoReference, maxWidth = 800, maxHeight = 600) => {
  if (!photoReference || !GOOGLE_PLACES_API_KEY) {
    return null;
  }

  return `${GOOGLE_PLACES_API_URL}/${photoReference}/media?maxHeightPx=${maxHeight}&maxWidthPx=${maxWidth}&key=${GOOGLE_PLACES_API_KEY}`;
};

const fetchPlacePhotos = async (placeId, displayName) => {
  try {
    if (!placeId || !GOOGLE_PLACES_API_KEY) {
      console.warn('⚠️ Missing placeId or API key for fetching photos');
      return [];
    }

    console.log(`📸 Fetching photos for place: ${displayName}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const fields = 'places.photos,places.displayName,places.formattedAddress';
    
    const url = `${GOOGLE_PLACES_API_URL}/places/${placeId}?fields=${encodeURIComponent(fields)}`;

    console.log(`📸 Fetching from: ${url}`);
    console.log(`📸 Fields: ${fields}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`❌ Failed to fetch place details: ${response.status} ${response.statusText}`);
      console.error(`   Error body: ${errorBody.substring(0, 300)}`);
      return [];
    }

    const data = await response.json();
    const photos = data.photos || [];

    if (photos.length === 0) {
      console.warn(`⚠️ No photos found for place: ${displayName}`);
      return [];
    }

    console.log(`✅ Found ${photos.length} photos for ${displayName}`);

    return photos.slice(0, MAX_IMAGES_TO_CACHE).map((photo, index) => ({
      photoReference: photo.name,
      url: getGooglePlacePhotoUrl(photo.name),
      attribution: photo.attributions?.join(', ') || 'Google Places',
      width: photo.widthPx,
      height: photo.heightPx,
      addedAt: new Date()
    }));
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`❌ Fetch place photos request timeout (10s)`);
    } else {
      console.error(`❌ Error fetching place photos:`, error.message);
    }
    return [];
  }
};

const pendingFetches = new Map();

const saveToDb = async (placeId, placeName, normalized, primaryImageUrl, photos, placeDetails, ttlDays) => {
  try {
    const now = new Date();
    await PlaceImage.findOneAndUpdate(
      { placeId },
      {
        placeId,
        placeName: normalized,
        images: photos,
        primaryImageUrl,
        source: photos.length > 0 ? 'google-places' : 'fallback',
        placeDetails: placeDetails || {},
        fallbackImages: FALLBACK_IMAGES,
        isActive: true,
        cacheMetadata: {
          fetchCount: 1,
          lastFetched: now,
          nextRefreshDate: new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000),
          expiresAt: new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000)
        }
      },
      { upsert: true, new: true }
    );
    console.log(`💾 Saved to DB cache (TTL: ${ttlDays}d): ${placeName}`);
  } catch (err) {
    console.error(`⚠️ DB save failed for ${placeName}:`, err.message);
  }
};

const fetchFromApiAndCache = async (placeName, normalized, placeId) => {
  const fallbackUrl = getFallbackImage(placeName);

  try {
    const placeDetails = await searchGooglePlace(placeName);

    if (!placeDetails) {
      console.log(`⚠️ Google Places returned nothing for: ${placeName} — caching fallback for 1h`);
      await saveToDb(placeId, placeName, normalized, fallbackUrl, [], null, 1 / 24);
      return { imageUrl: fallbackUrl, source: 'fallback', cacheStatus: 'failed' };
    }

    const rawPhotos = placeDetails.photos || [];

    if (rawPhotos.length === 0) {
      console.log(`⚠️ No photos for: ${placeName} — caching fallback for 1h`);
      await saveToDb(placeId, placeName, normalized, fallbackUrl, [], placeDetails, 1 / 24);
      return { imageUrl: fallbackUrl, source: 'fallback', placeDetails, cacheStatus: 'no_photos' };
    }

    const photos = rawPhotos.slice(0, MAX_IMAGES_TO_CACHE).map((photo) => ({
      photoReference: photo.name,
      url: getGooglePlacePhotoUrl(photo.name),
      attribution: photo.authorAttributions?.map(a => a.displayName).join(', ') || 'Google Places',
      width: photo.widthPx,
      height: photo.heightPx,
      addedAt: new Date()
    }));

    await saveToDb(placeId, placeName, normalized, photos[0].url, photos, placeDetails, CACHE_TTL_DAYS);

    console.log(`✅ Fetched + cached ${photos.length} photos for: ${placeName}`);
    return {
      imageUrl: photos[0].url,
      source: 'google-places',
      placeDetails,
      cacheStatus: 'new'
    };

  } catch (error) {
    console.error(`❌ fetchFromApiAndCache error for ${placeName}:`, error.message);
    await saveToDb(placeId, placeName, normalized, fallbackUrl, [], null, 1 / 24);
    return { imageUrl: fallbackUrl, source: 'fallback', cacheStatus: 'error', error: error.message };
  }
};

export const getPlaceImageWithCache = async (placeName) => {
  const normalized = normalizePlaceName(placeName);
  const placeId = createPlaceId(placeName);

  const cached = await PlaceImage.getCachedImage(placeId);
  if (cached?.primaryImageUrl) {
    console.log(`✅ DB cache HIT: ${placeName}`);
    return { imageUrl: cached.primaryImageUrl, source: 'cached', placeDetails: cached.placeDetails, cacheStatus: 'hit' };
  }

  if (pendingFetches.has(placeId)) {
    console.log(`⏳ Waiting for in-flight fetch: ${placeName}`);
    return pendingFetches.get(placeId);
  }

  console.log(`🔄 DB miss — calling Google Places API: ${placeName}`);
  const promise = fetchFromApiAndCache(placeName, normalized, placeId);
  pendingFetches.set(placeId, promise);
  promise.finally(() => pendingFetches.delete(placeId));
  return promise;
};

export const getPlaceImagesForMultiplePlaces = async (placeNames) => {
  if (!Array.isArray(placeNames) || placeNames.length === 0) return {};

  console.log(`\n📦 Batch image fetch for ${placeNames.length} places`);

  const placeIdMap = {};
  placeNames.forEach(name => { placeIdMap[createPlaceId(name)] = name; });
  const allPlaceIds = Object.keys(placeIdMap);

  const cachedDocs = await PlaceImage.find({
    placeId: { $in: allPlaceIds },
    isActive: true,
    'cacheMetadata.expiresAt': { $gt: new Date() }
  }).lean();

  const cachedById = {};
  cachedDocs.forEach(doc => { cachedById[doc.placeId] = doc; });

  const hits = cachedDocs.length;
  const misses = allPlaceIds.filter(id => !cachedById[id]);
  console.log(`📊 DB: ${hits} hits, ${misses.length} misses`);

  const missResults = await Promise.allSettled(
    misses.map(placeId => {
      const name = placeIdMap[placeId];
      return getPlaceImageWithCache(name);
    })
  );

  const imageMap = {};

  placeNames.forEach(name => {
    const placeId = createPlaceId(name);
    const doc = cachedById[placeId];
    if (doc?.primaryImageUrl) {
      imageMap[name] = { imageUrl: doc.primaryImageUrl, source: 'cached', cacheStatus: 'hit' };
    }
  });

  misses.forEach((placeId, idx) => {
    const name = placeIdMap[placeId];
    const result = missResults[idx];
    imageMap[name] = result.status === 'fulfilled'
      ? result.value
      : { imageUrl: getFallbackImage(name), source: 'fallback', cacheStatus: 'error' };
  });

  const apiCalls = misses.length;
  console.log(`✅ Batch complete — ${hits} from DB cache, ${apiCalls} from Google API`);
  return imageMap;
};

export const clearExpiredCache = async () => {
  try {
    console.log(`🧹 Clearing expired cache entries...`);
    
    const result = await PlaceImage.deleteMany({
      'cacheMetadata.expiresAt': { $lt: new Date() }
    });

    console.log(`✅ Deleted ${result.deletedCount} expired cache entries`);
    return result;
  } catch (error) {
    console.error(`❌ Error clearing expired cache:`, error.message);
    return null;
  }
};

export const getCacheStats = async () => {
  try {
    const totalEntries = await PlaceImage.countDocuments();
    const activeCacheEntries = await PlaceImage.countDocuments({ isActive: true });
    const totalFetches = await PlaceImage.aggregate([
      { $group: { _id: null, totalFetches: { $sum: '$cacheMetadata.fetchCount' } } }
    ]);

    return {
      totalEntries,
      activeCacheEntries,
      totalFetches: totalFetches[0]?.totalFetches || 0,
      timestamp: new Date()
    };
  } catch (error) {
    console.error(`❌ Error getting cache stats:`, error.message);
    return null;
  }
};

export default {
  getPlaceImageWithCache,
  getPlaceImagesForMultiplePlaces,
  searchGooglePlace,
  getGooglePlacePhotoUrl,
  clearExpiredCache,
  getCacheStats
};
