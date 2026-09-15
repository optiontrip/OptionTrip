const enabled = (value, fallback = false) => {
  if (value == null || value === '') return fallback;
  return String(value).toLowerCase() === 'true';
};

export const getViWorldGuideFeatureFlags = () => ({
  promptExtension: enabled(process.env.VI_WORLD_GUIDE_PROMPT_ENABLED, false),
  destinationFreeDiscovery: enabled(process.env.VI_DESTINATION_FREE_DISCOVERY_ENABLED, false),
  providerReadinessContext: enabled(process.env.VI_PROVIDER_READINESS_CONTEXT_ENABLED, false),
});

export default getViWorldGuideFeatureFlags;
