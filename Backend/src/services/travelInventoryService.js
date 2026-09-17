import {
  getConfiguredProviders,
  getProviderCapabilities,
  getProviderReadiness,
  isProviderConfigured,
  TRAVEL_PROVIDER_REGISTRY,
} from '../config/travelProviderRegistry.js';

const SUPPORTED_VERTICALS = Object.freeze(
  [...new Set(Object.values(TRAVEL_PROVIDER_REGISTRY).flatMap(config => config.verticals))].sort()
);

const providersForVertical = vertical => Object.entries(TRAVEL_PROVIDER_REGISTRY)
  .filter(([, config]) => config.verticals.includes(vertical))
  .map(([provider]) => getProviderReadiness(provider));

export const getTravelInventoryStatus = () => ({
  generatedAt: new Date().toISOString(),
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

// Public status intentionally omits credential names and provider notes. The UI
// only needs to know whether a vertical is operational and which provider labels
// are live; secret values and deployment details stay server-side.
export const getPublicTravelInventoryStatus = () => {
  const status = getTravelInventoryStatus();
  return {
    generatedAt: status.generatedAt,
    verticals: status.verticals.map(item => ({
      vertical: item.vertical,
      live: item.live,
      providers: item.providers,
      hasCandidates: item.candidates.length > 0,
    })),
  };
};

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
