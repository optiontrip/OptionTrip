import { getTravelInventoryGaps } from '../services/travelInventoryService.js';

// Vi reasons in traveler capabilities rather than hard-coded provider brands.
// Provider readiness remains the source of truth for live commercial inventory.
export const VI_TRAVEL_CAPABILITIES = Object.freeze({
  flights: { phase: ['discover', 'plan', 'compare', 'book', 'travel'], commercial: true },
  hotels: { phase: ['plan', 'compare', 'book', 'travel'], commercial: true },
  rail: { phase: ['plan', 'compare', 'book', 'travel'], commercial: true },
  bus: { phase: ['plan', 'compare', 'book', 'travel'], commercial: true },
  cars: { phase: ['plan', 'compare', 'book', 'travel'], commercial: true },
  transfers: { phase: ['plan', 'book', 'travel'], commercial: true },
  activities: { phase: ['discover', 'plan', 'book', 'travel'], commercial: true },
  esim: { phase: ['prepare', 'travel'], commercial: true },
  insurance: { phase: ['plan', 'prepare'], commercial: true },
  restaurants: { phase: ['plan', 'travel'], commercial: false },
  entry_requirements: { phase: ['discover', 'plan', 'prepare', 'travel'], commercial: false },
  weather: { phase: ['discover', 'plan', 'prepare', 'travel'], commercial: false },
  safety: { phase: ['discover', 'plan', 'prepare', 'travel'], commercial: false },
  local_transport: { phase: ['plan', 'prepare', 'travel'], commercial: false },
  disruptions: { phase: ['prepare', 'travel'], commercial: false },
  memories: { phase: ['remember', 'return'], commercial: false },
});

export const getViTravelCapabilityContext = () => {
  let inventoryGaps = [];
  try {
    inventoryGaps = getTravelInventoryGaps();
  } catch {
    inventoryGaps = [];
  }

  return {
    capabilities: VI_TRAVEL_CAPABILITIES,
    inventoryGaps,
    rules: {
      neverFabricateLiveInventory: true,
      travelerValueBeforeCommission: true,
      helpEvenWithoutCommercialProvider: true,
      preserveTripContinuity: true,
    },
  };
};

export default VI_TRAVEL_CAPABILITIES;
