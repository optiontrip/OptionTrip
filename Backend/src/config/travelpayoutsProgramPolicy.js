import { getProviderReadiness } from './travelProviderRegistry.js';

export const getTravelpayoutsProgramExposure = providerName => {
  const readiness = getProviderReadiness(providerName);
  if (!readiness) return { provider: providerName, state: 'unknown', canExposeLive: false };

  return {
    provider: providerName,
    state: readiness.configured ? 'configured' : 'available_not_configured',
    canExposeLive: readiness.configured,
    verticals: readiness.verticals,
    access: readiness.access,
    missingCredentials: readiness.missingCredentials,
  };
};
