const hasEnv = (...names) => names.every(name => Boolean(process.env[name]));

export const TRAVEL_PROVIDER_REGISTRY = Object.freeze({
  travelpayouts: {
    verticals: ['flights', 'hotels'],
    credentialEnv: ['TRAVELPAYOUTS_TOKEN', 'TRAVELPAYOUTS_MARKER'],
    enabled: () => hasEnv('TRAVELPAYOUTS_TOKEN', 'TRAVELPAYOUTS_MARKER'),
  },
  amadeus: {
    verticals: ['flights'],
    credentialEnv: ['AMADEUS_API_KEY', 'AMADEUS_API_SECRET'],
    enabled: () => hasEnv('AMADEUS_API_KEY', 'AMADEUS_API_SECRET'),
  },
  duffel: {
    verticals: ['flights'],
    credentialEnv: ['DUFFEL_API_KEY'],
    enabled: () => hasEnv('DUFFEL_API_KEY'),
  },
  hotelbeds: {
    verticals: ['hotels'],
    credentialEnv: ['HOTELBEDS_API_KEY', 'HOTELBEDS_SECRET'],
    enabled: () => hasEnv('HOTELBEDS_API_KEY', 'HOTELBEDS_SECRET'),
  },
});

export const getProviderCapabilities = () => Object.entries(TRAVEL_PROVIDER_REGISTRY).map(([provider, config]) => ({
  provider,
  verticals: [...config.verticals],
  configured: config.enabled(),
}));

export const getConfiguredProviders = vertical => getProviderCapabilities()
  .filter(provider => provider.configured && (!vertical || provider.verticals.includes(vertical)))
  .map(provider => provider.provider);

export const isProviderConfigured = provider => Boolean(TRAVEL_PROVIDER_REGISTRY[provider]?.enabled());
