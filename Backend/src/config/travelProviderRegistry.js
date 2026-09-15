const hasEnv = (...names) => names.every(name => Boolean(process.env[name]));

const provider = ({ verticals, credentialEnv = [], access = 'credentials', notes = null }) => ({
  verticals,
  credentialEnv,
  access,
  notes,
  enabled: () => credentialEnv.length === 0 || hasEnv(...credentialEnv),
});

const travelpayoutsProgram = (verticals, envName, notes = null) => provider({
  verticals,
  credentialEnv: [envName],
  access: 'travelpayouts_program',
  notes: notes || 'Program is available in the OptionTrip Travelpayouts catalog. Configure the issued affiliate/deep-link/feed value before exposing it as live inventory.',
});

export const TRAVEL_PROVIDER_REGISTRY = Object.freeze({
  travelpayouts: provider({
    verticals: ['flights', 'hotels'],
    credentialEnv: ['TRAVELPAYOUTS_TOKEN', 'TRAVELPAYOUTS_MARKER'],
    access: 'token',
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

  // Travelpayouts programs visible in OptionTrip's program catalog.
  // A catalog listing is not treated as live inventory until its issued URL/feed/API credential is configured.
  tripcom: travelpayoutsProgram(['flights', 'hotels'], 'TRAVELPAYOUTS_TRIPCOM_URL'),
  twelvego: travelpayoutsProgram(['rail', 'bus', 'ferries', 'transfers'], 'TRAVELPAYOUTS_12GO_URL'),
  qeeq: travelpayoutsProgram(['cars'], 'TRAVELPAYOUTS_QEEQ_URL'),
  economybookings: travelpayoutsProgram(['cars'], 'TRAVELPAYOUTS_ECONOMYBOOKINGS_URL'),
  bikesbooking: travelpayoutsProgram(['bikes', 'scooters', 'motorcycles'], 'TRAVELPAYOUTS_BIKESBOOKING_URL'),
  supertravel: travelpayoutsProgram(['hotels'], 'TRAVELPAYOUTS_SUPERTRAVEL_URL'),
  youtravel: travelpayoutsProgram(['tours', 'packages'], 'TRAVELPAYOUTS_YOUTRAVEL_URL'),
  insubuy: travelpayoutsProgram(['insurance'], 'TRAVELPAYOUTS_INSUBUY_URL'),
  kiwitaxi: travelpayoutsProgram(['transfers', 'taxis'], 'TRAVELPAYOUTS_KIWITAXI_URL'),
  klook: travelpayoutsProgram(['activities', 'tours', 'rail', 'transfers'], 'TRAVELPAYOUTS_KLOOK_URL'),
  welcomepickups: travelpayoutsProgram(['transfers', 'taxis'], 'TRAVELPAYOUTS_WELCOME_PICKUPS_URL'),
  kiwi: travelpayoutsProgram(['flights'], 'TRAVELPAYOUTS_KIWI_URL'),
  drimsim: travelpayoutsProgram(['esim'], 'TRAVELPAYOUTS_DRIMSIM_URL'),
  getrentacar: travelpayoutsProgram(['cars'], 'TRAVELPAYOUTS_GETRENTACAR_URL'),
  airhelp: travelpayoutsProgram(['compensation'], 'TRAVELPAYOUTS_AIRHELP_URL'),
  gocity: travelpayoutsProgram(['activities', 'city_passes'], 'TRAVELPAYOUTS_GO_CITY_URL'),
  ekta: travelpayoutsProgram(['insurance'], 'TRAVELPAYOUTS_EKTA_URL'),
  autoeurope: travelpayoutsProgram(['cars'], 'TRAVELPAYOUTS_AUTOEUROPE_URL'),
  radicalstorage: travelpayoutsProgram(['luggage_storage'], 'TRAVELPAYOUTS_RADICAL_STORAGE_URL'),
  intuitravel: travelpayoutsProgram(['transfers', 'taxis'], 'TRAVELPAYOUTS_INTUI_TRAVEL_URL'),
  compensair: travelpayoutsProgram(['compensation'], 'TRAVELPAYOUTS_COMPENSAIR_URL'),
  saily: travelpayoutsProgram(['esim'], 'TRAVELPAYOUTS_SAILY_URL'),
  kkday: travelpayoutsProgram(['activities', 'tours'], 'TRAVELPAYOUTS_KKDAY_URL'),

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
    notes: 'Travelpayouts feed URL must be issued to OptionTrip before this adapter becomes live.',
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
    missingCredentials,
    notes: config.notes,
  };
};

export const isProviderConfigured = providerName => Boolean(TRAVEL_PROVIDER_REGISTRY[providerName]?.enabled());
