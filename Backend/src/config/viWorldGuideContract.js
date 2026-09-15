import { VI_TRAVEL_PHASES } from './viWorldGuidePhases.js';
import { VI_DISCOVERY_MODES } from './viDiscoveryModes.js';
import { VI_TRUST_RULES } from './viTrustRules.js';
import { VI_TRIP_CONTINUITY } from './viTripContinuity.js';
import { getViTravelCapabilityContext } from './viTravelCapabilityCatalog.js';

export const getViWorldGuideContract = () => ({
  phases: VI_TRAVEL_PHASES,
  discovery: VI_DISCOVERY_MODES,
  trust: VI_TRUST_RULES,
  continuity: VI_TRIP_CONTINUITY,
  travel: getViTravelCapabilityContext(),
});

export default getViWorldGuideContract;
