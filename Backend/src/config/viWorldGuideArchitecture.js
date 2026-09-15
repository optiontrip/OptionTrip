import { VI_WORLD_GUIDE_MANIFEST } from './viWorldGuideManifest.js';
import { VI_TRAVEL_MAP_CONTRACT } from './viTravelMapContract.js';
import { VI_AUTOMATION_CONTRACT } from './viAutomationContract.js';
import { VI_MONETIZATION_CONTRACT } from './viMonetizationContract.js';
import { VI_TRIP_SERVICE_ATTACHMENT_TYPES } from './viTripServiceAttachment.js';
import { VI_DISCOVERY_RESPONSE_CONTRACT } from './viDiscoveryResponseContract.js';

export const VI_WORLD_GUIDE_ARCHITECTURE = Object.freeze({
  manifest: VI_WORLD_GUIDE_MANIFEST,
  discoveryResponse: VI_DISCOVERY_RESPONSE_CONTRACT,
  tripServiceAttachments: VI_TRIP_SERVICE_ATTACHMENT_TYPES,
  travelMap: VI_TRAVEL_MAP_CONTRACT,
  monetization: VI_MONETIZATION_CONTRACT,
  automation: VI_AUTOMATION_CONTRACT,
});

export default VI_WORLD_GUIDE_ARCHITECTURE;
