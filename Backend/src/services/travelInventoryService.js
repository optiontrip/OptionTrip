import {
  getConfiguredProviders,
  getProviderCapabilities,
  isProviderConfigured,
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

export const getTravelInventoryStatus = () => ({
  verticals: SUPPORTED_VERTICALS.map(vertical => ({
    vertical,
    providers: getConfiguredProviders(vertical),
    live: getConfiguredProviders(vertical).length > 0,
  })),
  providers: getProviderCapabilities(),
});

export const canUseProvider = (provider, vertical) => {
  if (!SUPPORTED_VERTICALS.includes(vertical)) return false;
  return isProviderConfigured(provider)
    && getConfiguredProviders(vertical).includes(provider);
};

export const listSupportedTravelVerticals = () => [...SUPPORTED_VERTICALS];
