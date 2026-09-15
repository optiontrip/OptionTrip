import {
  getConfiguredProviders,
  getProviderCapabilities,
  getProviderReadiness,
  isProviderConfigured,
  TRAVEL_PROVIDER_REGISTRY,
} from '../config/travelProviderRegistry.js';

const SUPPORTED_VERTICALS = Object.freeze([
  'flights',
  'hotels',
  'rail',
  'bus',
  'cars',
  'transfers',
  'activities',
  'esim',
  'insurance',
  'luggage_storage',
]);

const providersForVertical = vertical => Object.entries(TRAVEL_PROVIDER_REGISTRY)
  .filter(([, config]) => config.verticals.includes(vertical))
  .map(([provider]) => getProviderReadiness(provider));

export const getTravelInventoryStatus = () => ({
  verticals: SUPPORTED_VERTICALS.map(vertical => {
    const liveProviders = getConfiguredProviders(vertical);
    const candidates = providersForVertical(vertical);
    return {
      vertical,
      providers: liveProviders,
      live: liveProviders.length > 0,
      candidates,
      missingProvider: candidates.length === 0,
    };
  }),
  providers: getProviderCapabilities(),
});

export const getTravelInventoryGaps = () => getTravelInventoryStatus().verticals
  .filter(vertical => !vertical.live)
  .map(vertical => ({
    vertical: vertical.vertical,
    candidateProviders: vertical.candidates.map(candidate => candidate.provider),
    missingCredentials: [...new Set(vertical.candidates.flatMap(candidate => candidate.missingCredentials))],
    missingProvider: vertical.missingProvider,
  }));

export const canUseProvider = (provider, vertical) => {
  if (!SUPPORTED_VERTICALS.includes(vertical)) return false;
  return isProviderConfigured(provider)
    && getConfiguredProviders(vertical).includes(provider);
};

export const listSupportedTravelVerticals = () => [...SUPPORTED_VERTICALS];
