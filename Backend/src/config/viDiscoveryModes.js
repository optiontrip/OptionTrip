export const VI_DISCOVERY_MODES = Object.freeze({
  emotion: ['warmth', 'escape', 'awe', 'quiet', 'adventure', 'surprise', 'romance', 'culture', 'nature'],
  constraint: ['budget', 'duration', 'season', 'origin', 'accessibility', 'party', 'dietary', 'transport_tolerance'],
  opportunity: ['weekend', 'layover', 'last_minute', 'shoulder_season', 'road_trip', 'rail_trip'],
});

export const buildDiscoverySignals = ({ message = '', preferences = {}, trip = null } = {}) => ({
  message: String(message).trim(),
  knownDestination: trip?.destination?.name || trip?.destination?.text || null,
  knownBudget: trip?.budget || preferences?.preferredBudget || null,
  knownTripStyle: trip?.trip_type || null,
  rememberedTripTypes: Array.isArray(preferences?.tripTypes) ? preferences.tripTypes : [],
  rememberedDestinations: Array.isArray(preferences?.destinations) ? preferences.destinations : [],
});

export default VI_DISCOVERY_MODES;
