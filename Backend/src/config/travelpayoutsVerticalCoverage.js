import { getProviderCapabilities } from './travelProviderRegistry.js';

export const getTravelpayoutsVerticalCoverage = () => {
  const coverage = new Map();
  for (const provider of getProviderCapabilities()) {
    for (const vertical of provider.verticals) {
      if (!coverage.has(vertical)) coverage.set(vertical, { vertical, configured: [], candidates: [] });
      coverage.get(vertical)[provider.configured ? 'configured' : 'candidates'].push(provider.provider);
    }
  }
  return [...coverage.values()].sort((a, b) => a.vertical.localeCompare(b.vertical));
};
