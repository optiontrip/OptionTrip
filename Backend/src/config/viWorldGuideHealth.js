import { validateViWorldGuideContract } from './viWorldGuideAcceptance.js';
import { getViTravelCapabilityContext } from './viTravelCapabilityCatalog.js';

export const getViWorldGuideHealth = () => {
  const contract = validateViWorldGuideContract();
  const travel = getViTravelCapabilityContext();
  return {
    contractValid: contract.valid,
    contractErrors: contract.errors,
    providerGapCount: Array.isArray(travel.inventoryGaps) ? travel.inventoryGaps.length : 0,
    neverFabricateLiveInventory: travel.rules.neverFabricateLiveInventory === true,
    travelerValueBeforeCommission: travel.rules.travelerValueBeforeCommission === true,
  };
};

export default getViWorldGuideHealth;
