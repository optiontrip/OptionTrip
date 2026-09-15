import { VI_WORLD_GUIDE_VERSION, VI_WORLD_GUIDE_NORTH_STAR } from './viWorldGuideVersion.js';
import { VI_SERVICE_UNIVERSE } from './viServiceUniverse.js';
import { VI_LIVE_TRIP_PRIORITIES } from './viLiveTripPriorities.js';
import { VI_POST_TRIP_LOOP } from './viPostTripLoop.js';
import { VI_COMMERCIAL_INTEGRITY } from './viCommercialIntegrity.js';
import { VI_OWNER_ACTION_POLICY } from './viOwnerActionPolicy.js';

export const VI_WORLD_GUIDE_MANIFEST = Object.freeze({
  version: VI_WORLD_GUIDE_VERSION,
  northStar: VI_WORLD_GUIDE_NORTH_STAR,
  services: VI_SERVICE_UNIVERSE,
  liveTripPriorities: VI_LIVE_TRIP_PRIORITIES,
  postTripLoop: VI_POST_TRIP_LOOP,
  commercialIntegrity: VI_COMMERCIAL_INTEGRITY,
  ownerActionPolicy: VI_OWNER_ACTION_POLICY,
});

export default VI_WORLD_GUIDE_MANIFEST;
