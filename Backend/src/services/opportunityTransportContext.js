const GOOGLE_ROUTES_BASE = 'https://routes.googleapis.com/directions/v2:computeRoutes';

const withTimeout = async (promiseFactory, timeoutMs = 7000) => {
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

const durationSeconds = (duration) => {
  if (!duration) return null;
  const match = String(duration).match(/^(\d+(?:\.\d+)?)s$/);
  return match ? Number(match[1]) : null;
};

const routeMinutes = async ({ origin, destination }) => {
  const apiKey = process.env.GOOGLE_ROUTES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey || !origin || !destination) return null;

  try {
    const response = await withTimeout((signal) => fetch(GOOGLE_ROUTES_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters'
      },
      body: JSON.stringify({
        origin: {
          location: {
            latLng: { latitude: origin.lat, longitude: origin.lng }
          }
        },
        destination: {
          location: {
            latLng: { latitude: destination.lat, longitude: destination.lng }
          }
        },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE'
      }),
      signal
    }));

    if (!response.ok) return null;
    const data = await response.json();
    const route = data?.routes?.[0];
    const seconds = durationSeconds(route?.duration);
    if (!Number.isFinite(seconds)) return null;

    return {
      minutes: Math.max(1, Math.ceil(seconds / 60)),
      distanceMeters: Number.isFinite(Number(route?.distanceMeters)) ? Number(route.distanceMeters) : null
    };
  } catch {
    return null;
  }
};

const enrichWindow = async (window = {}) => {
  const origin = normalizeCoordinates(window.liveContext?.location?.coordinates || window.coordinates);
  const candidates = (window.nearbyPlaces || []).filter((place) => normalizeCoordinates(place.coordinates)).slice(0, 5);
  if (!origin || !candidates.length) {
    return { ...window, transportContext: { source: null, candidates: [], bestCandidate: null } };
  }

  const routed = await Promise.all(candidates.map(async (place) => {
    const destination = normalizeCoordinates(place.coordinates);
    const [outbound, inbound] = await Promise.all([
      routeMinutes({ origin, destination }),
      routeMinutes({ origin: destination, destination: origin })
    ]);
    if (!outbound || !inbound) return null;

    const roundTripMinutes = outbound.minutes + inbound.minutes;
    const usableMinutes = Number(window.usableMinutes || 0);
    const activityBufferMinutes = 60;
    const feasible = usableMinutes >= roundTripMinutes + activityBufferMinutes;
    const outboundDistance = Number(outbound.distanceMeters || 0);
    const inboundDistance = Number(inbound.distanceMeters || 0);

    return {
      placeId: place.placeId,
      name: place.name,
      opportunityType: place.opportunityType,
      outboundMinutes: outbound.minutes,
      returnMinutes: inbound.minutes,
      oneWayMinutes: outbound.minutes,
      roundTripMinutes,
      distanceMetersOutbound: outbound.distanceMeters,
      distanceMetersReturn: inbound.distanceMeters,
      distanceMetersRoundTrip: outboundDistance + inboundDistance || null,
      activityBufferMinutes,
      feasible,
      remainingMinutes: Math.max(0, usableMinutes - roundTripMinutes)
    };
  }));

  const transportCandidates = routed.filter(Boolean).sort((a, b) => {
    if (a.feasible !== b.feasible) return a.feasible ? -1 : 1;
    return a.roundTripMinutes - b.roundTripMinutes;
  });

  return {
    ...window,
    transportContext: {
      source: transportCandidates.length ? 'google_routes' : null,
      checkedAt: transportCandidates.length ? new Date().toISOString() : null,
      mode: 'DRIVE',
      trafficAware: true,
      requiresBothDirections: true,
      candidates: transportCandidates,
      bestCandidate: transportCandidates[0] || null
    }
  };
};

export const enrichOpportunityTransportContext = async (context = {}) => {
  const windows = Array.isArray(context.windows) ? context.windows : [];
  const enriched = await Promise.all(windows.map(enrichWindow));
  return {
    ...context,
    windows: enriched,
    transportSummary: {
      totalWindows: enriched.length,
      routedWindows: enriched.filter((window) => window.transportContext?.source).length,
      feasibleWindows: enriched.filter((window) => window.transportContext?.bestCandidate?.feasible === true).length,
      blockedByTravelTime: enriched.filter((window) => window.transportContext?.bestCandidate?.feasible === false).length
    }
  };
};

export default { enrichOpportunityTransportContext };
