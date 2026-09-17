const hasEnv = (...names) => names.every(name => Boolean(process.env[name]));

const provider = ({
  verticals,
  credentialEnv = [],
  access = 'credentials',
  notes = null,
  integration = 'api',
  liveByDefault = false,
}) => ({
  verticals,
  credentialEnv,
  access,
  notes,
  integration,
  liveByDefault,
  // A program being available to OptionTrip is not the same thing as a live,
  // user-facing integration. Only integrated widgets or credentialed adapters
  // are considered operational here.
  enabled: () => liveByDefault || (credentialEnv.length > 0 && hasEnv(...credentialEnv)),
});

export const TRAVEL_PROVIDER_REGISTRY = Object.freeze({
  travelpayouts: provider({ verticals: ['flights', 'hotels'], credentialEnv: ['TRAVELPAYOUTS_TOKEN', 'TRAVELPAYOUTS_MARKER'], access: 'token' }),
  travelpayouts_car_rental_widget: provider({ verticals: ['cars'], access: 'widget', integration: 'widget', liveByDefault: true, notes: 'Live affiliate widget already integrated in OptionTrip.' }),
  travelpayouts_esim_widget: provider({ verticals: ['esim'], access: 'widget', integration: 'widget', liveByDefault: true, notes: 'Live affiliate widget already integrated in OptionTrip.' }),
  travelpayouts_tours_widget: provider({ verticals: ['activities'], access: 'widget', integration: 'widget', liveByDefault: true, notes: 'Live affiliate widget already integrated in OptionTrip.' }),
  amadeus: provider({ verticals: ['flights'], credentialEnv: ['AMADEUS_API_KEY', 'AMADEUS_API_SECRET'], access: 'approval_and_credentials' }),
  duffel: provider({ verticals: ['flights'], credentialEnv: ['DUFFEL_API_KEY'], access: 'credentials' }),
  hotelbeds: provider({ verticals: ['hotels'], credentialEnv: ['HOTELBEDS_API_KEY', 'HOTELBEDS_SECRET'], access: 'approval_and_credentials' }),

  // Programs visible as approved/available in OptionTrip's Travelpayouts account.
  // They are catalogued so Vi and the recommendation layer understand the full
  // commercial inventory, but remain non-live until an actual deeplink, widget,
  // feed or API adapter is configured. This prevents fake booking/search claims.
  aviasales: provider({ verticals: ['flights'], access: 'affiliate_link', integration: 'affiliate' }),
  trip_com: provider({ verticals: ['hotels', 'flights', 'rail', 'activities'], access: 'affiliate_link', integration: 'affiliate' }),
  twelve_go: provider({ verticals: ['rail', 'bus', 'ferries', 'transfers'], access: 'affiliate_link', integration: 'affiliate' }),
  qeeq: provider({ verticals: ['cars'], access: 'affiliate_link', integration: 'affiliate' }),
  economybookings: provider({ verticals: ['cars'], access: 'affiliate_link', integration: 'affiliate' }),
  bikesbooking: provider({ verticals: ['cars', 'bikes', 'scooters'], access: 'affiliate_link', integration: 'affiliate' }),
  supertravel: provider({ verticals: ['hotels'], access: 'affiliate_link', integration: 'affiliate' }),
  yourtravel: provider({ verticals: ['activities', 'tours'], access: 'affiliate_link', integration: 'affiliate' }),
  klook: provider({ verticals: ['activities', 'tours', 'rail', 'cars', 'transfers'], access: 'affiliate_link', integration: 'affiliate' }),
  yesim: provider({ verticals: ['esim'], access: 'affiliate_link', integration: 'affiliate' }),
  saily: provider({ verticals: ['esim'], access: 'affiliate_link', integration: 'affiliate' }),
  gigsky: provider({ verticals: ['esim'], access: 'affiliate_link', integration: 'affiliate' }),
  drimsim: provider({ verticals: ['esim'], access: 'affiliate_link', integration: 'affiliate' }),
  airalo_program: provider({ verticals: ['esim'], access: 'affiliate_link', integration: 'affiliate' }),
  localrent: provider({ verticals: ['cars'], access: 'affiliate_link', integration: 'affiliate' }),
  getrentacar: provider({ verticals: ['cars'], access: 'affiliate_link', integration: 'affiliate' }),
  autoeurope: provider({ verticals: ['cars'], access: 'affiliate_link', integration: 'affiliate' }),
  welcome_pickups: provider({ verticals: ['transfers'], access: 'affiliate_link', integration: 'affiliate' }),
  kiwitaxi: provider({ verticals: ['transfers'], access: 'affiliate_link', integration: 'affiliate' }),
  intui_travel: provider({ verticals: ['transfers'], access: 'affiliate_link', integration: 'affiliate' }),
  gettransfer_program: provider({ verticals: ['transfers'], access: 'affiliate_link', integration: 'affiliate' }),
  radical_storage: provider({ verticals: ['luggage_storage'], access: 'affiliate_link', integration: 'affiliate' }),
  go_city: provider({ verticals: ['activities', 'city_passes'], access: 'affiliate_link', integration: 'affiliate' }),
  tiqets_program: provider({ verticals: ['activities'], access: 'affiliate_link', integration: 'affiliate' }),
  wegotrip_program: provider({ verticals: ['activities', 'audio_guides'], access: 'affiliate_link', integration: 'affiliate' }),
  kkday: provider({ verticals: ['activities', 'tours', 'food', 'esim', 'hotels'], access: 'affiliate_link', integration: 'affiliate' }),
  airhelp: provider({ verticals: ['flight_compensation'], access: 'affiliate_link', integration: 'affiliate' }),
  compensair: provider({ verticals: ['flight_compensation'], access: 'affiliate_link', integration: 'affiliate' }),
  ekta: provider({ verticals: ['insurance'], access: 'affiliate_link', integration: 'affiliate' }),
  insubuy: provider({ verticals: ['insurance'], access: 'affiliate_link', integration: 'affiliate' }),

  omio: provider({ verticals: ['rail', 'bus'], credentialEnv: ['TRAVELPAYOUTS_OMIO_FEED_URL'], access: 'feed', notes: 'Travelpayouts feed URL must be issued to OptionTrip before this adapter becomes live.' }),
  airalo: provider({ verticals: ['esim'], credentialEnv: ['TRAVELPAYOUTS_AIRALO_FEED_URL'], access: 'feed', notes: 'Optional richer feed integration. OptionTrip already has a live eSIM affiliate widget.' }),
  tiqets: provider({ verticals: ['activities'], credentialEnv: ['TRAVELPAYOUTS_TIQETS_FEED_URL'], access: 'feed', notes: 'Travelpayouts data access must be issued to OptionTrip before this adapter becomes live.' }),
  wegotrip: provider({ verticals: ['activities'], credentialEnv: ['TRAVELPAYOUTS_WEGOTRIP_API_KEY'], access: 'credentials', notes: 'Provider credential must be issued to OptionTrip before this adapter becomes live.' }),
  viator: provider({ verticals: ['activities'], credentialEnv: ['TRAVELPAYOUTS_VIATOR_FEED_URL'], access: 'feed', notes: 'Travelpayouts dynamic feed URL must be issued to OptionTrip before this adapter becomes live.' }),
  gettransfer: provider({ verticals: ['transfers'], credentialEnv: ['GETTRANSFER_ACCESS_TOKEN'], access: 'approval_and_credentials', notes: 'Separate provider approval/access token is required.' }),
});

export const getProviderCapabilities = () => Object.entries(TRAVEL_PROVIDER_REGISTRY).map(([providerName, config]) => ({
  provider: providerName,
  verticals: [...config.verticals],
  configured: config.enabled(),
  available: true,
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
    configured: config.enabled(),
    available: true,
    access: config.access,
    integration: config.integration,
    missingCredentials,
    notes: config.notes,
  };
};

export const isProviderConfigured = providerName => Boolean(TRAVEL_PROVIDER_REGISTRY[providerName]?.enabled());
