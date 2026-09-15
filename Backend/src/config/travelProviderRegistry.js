const hasEnv = (...names) => names.every(name => Boolean(process.env[name]));

const provider = ({ verticals, credentialEnv = [], access = 'credentials', notes = null, integration = 'api' }) => ({
  verticals,
  credentialEnv,
  access,
  notes,
  integration,
  enabled: () => credentialEnv.length === 0 || hasEnv(...credentialEnv),
});

export const TRAVEL_PROVIDER_REGISTRY = Object.freeze({
  travelpayouts: provider({
    verticals: ['flights', 'hotels'],
    credentialEnv: ['TRAVELPAYOUTS_TOKEN', 'TRAVELPAYOUTS_MARKER'],
    access: 'token',
  }),
  travelpayouts_car_rental_widget: provider({
    verticals: ['cars'],
    access: 'widget',
    integration: 'widget',
    notes: 'Live affiliate widget already integrated in OptionTrip.',
  }),
  travelpayouts_esim_widget: provider({
    verticals: ['esim'],
    access: 'widget',
    integration: 'widget',
    notes: 'Live affiliate widget already integrated in OptionTrip.',
  }),
  travelpayouts_tours_widget: provider({
    verticals: ['activities'],
    access: 'widget',
    integration: 'widget',
    notes: 'Live affiliate widget already integrated in OptionTrip.',
  }),
  amadeus: provider({
    verticals: ['flights'],
    credentialEnv: ['AMADEUS_API_KEY', 'AMADEUS_API_SECRET'],
    access: 'approval_and_credentials',
  }),
  duffel: provider({
    verticals: ['flights'],
    credentialEnv: ['DUFFEL_API_KEY'],
    access: 'credentials',
  }),
  hotelbeds: provider({
    verticals: ['hotels'],
    credentialEnv: ['HOTELBEDS_API_KEY', 'HOTELBEDS_SECRET'],
    access: 'approval_and_credentials',
  }),
  omio: provider({
    verticals: ['rail', 'bus'],
    credentialEnv: ['TRAVELPAYOUTS_OMIO_FEED_URL'],
    access: 'feed',
    notes: 'Travelpayouts feed URL must be issued to OptionTrip before this adapter becomes live.',
  }),
  airalo: provider({
    verticals: ['esim'],
    credentialEnv: ['TRAVELPAYOUTS_AIRALO_FEED_URL'],
    access: 'feed',
    notes: 'Optional richer feed integration. OptionTrip already has a live eSIM affiliate widget.',
  }),
  tiqets: provider({
    verticals: ['activities'],
    credentialEnv: ['TRAVELPAYOUTS_TIQETS_FEED_URL'],
    access: 'feed',
    notes: 'Travelpayouts data access must be issued to OptionTrip before this adapter becomes live.',
  }),
  wegotrip: provider({
    verticals: ['activities'],
    credentialEnv: ['TRAVELPAYOUTS_WEGOTRIP_API_KEY'],
    access: 'credentials',
    notes: 'Provider credential must be issued to OptionTrip before this adapter becomes live.',
  }),
  viator: provider({
    verticals: ['activities'],
    credentialEnv: ['TRAVELPAYOUTS_VIATOR_FEED_URL'],
    access: 'feed',
    notes: 'Travelpayouts dynamic feed URL must be issued to OptionTrip before this adapter becomes live.',
  }),
  gettransfer: provider({
    verticals: ['transfers'],
    credentialEnv: ['GETTRANSFER_ACCESS_TOKEN'],
    access: 'approval_and_credentials',
    notes: 'Separate provider approval/access token is required.',
  }),
});

export const getProviderCapabilities = () => Object.entries(TRAVEL_PROVIDER_REGISTRY).map(([providerName, config]) => ({
  provider: providerName,
  verticals: [...config.verticals],
  configured: config.enabled(),
  access: config.access,
  integration: config.integration,
  missingCredentials: config.credentialEnv.filter(name => !process.env[name]),
}));

export const getConfiguredProviders = vertical => getProviderCapabilities()
  .filter(item => item.configured && (!vertical || item.verticals.includes(vertical)))
  .map(item => item.provider);

export const getProviderReadiness = providerName => {
  const config = TRAVEL_PROVIDER_REGISTRY[providerName];
  if (!config) return null;
  const missingCredentials = config.credentialEnv.filter(name => !process.env[name]);
  return {
    provider: providerName,
    verticals: [...config.verticals],
    configured: missingCredentials.length === 0,
    access: config.access,
    integration: config.integration,
    missingCredentials,
    notes: config.notes,
  };
};

export const isProviderConfigured = providerName => Boolean(TRAVEL_PROVIDER_REGISTRY[providerName]?.enabled());
