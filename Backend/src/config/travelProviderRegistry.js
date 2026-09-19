const hasEnv = (...names) => names.every(name => Boolean(process.env[name]));

const normalizePublicBookingUrl = value => {
  const raw = String(value || '').trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:') return null;
    return url.toString();
  } catch {
    return null;
  }
};

const provider = ({
  verticals,
  credentialEnv = [],
  directUrlEnv = null,
  access = 'credentials',
  notes = null,
  integration = 'api',
  liveByDefault = false,
}) => {
  const bookingUrl = () => directUrlEnv
    ? normalizePublicBookingUrl(process.env[directUrlEnv])
    : null;

  return {
    verticals,
    credentialEnv,
    directUrlEnv,
    access,
    notes,
    integration,
    liveByDefault,
    bookingUrl,
    enabled: () => liveByDefault
      || Boolean(bookingUrl())
      || (credentialEnv.length > 0 && hasEnv(...credentialEnv)),
  };
};

const affiliate = ({ verticals, directUrlEnv, notes = null }) => provider({
  verticals,
  directUrlEnv,
  access: 'affiliate_link',
  integration: 'affiliate',
  notes,
});

// Only declare filters that OptionTrip can actually honor with normalized data from
// the current integration. Widget/affiliate-only providers intentionally expose no
// internal filters until a richer adapter is wired.
const PROVIDER_FILTER_CAPABILITIES = Object.freeze({
  travelpayouts: Object.freeze({
    flights: Object.freeze(['price', 'stops', 'airline', 'departure_time', 'duration']),
    hotels: Object.freeze(['price', 'stars', 'guest_rating']),
  }),
  duffel: Object.freeze({
    flights: Object.freeze(['price', 'stops', 'airline', 'departure_time', 'arrival_time', 'duration']),
  }),
  hotelbeds: Object.freeze({
    hotels: Object.freeze(['price', 'stars', 'breakfast', 'refundable']),
  }),
});

export const TRAVEL_PROVIDER_REGISTRY = Object.freeze({
  travelpayouts: provider({ verticals: ['flights', 'hotels'], credentialEnv: ['TRAVELPAYOUTS_TOKEN', 'TRAVELPAYOUTS_MARKER'], access: 'token' }),
  travelpayouts_car_rental_widget: provider({ verticals: ['cars'], access: 'widget', integration: 'widget', liveByDefault: true, notes: 'Live affiliate widget already integrated in OptionTrip.' }),
  travelpayouts_esim_widget: provider({ verticals: ['esim'], access: 'widget', integration: 'widget', liveByDefault: true, notes: 'Live affiliate widget already integrated in OptionTrip.' }),
  travelpayouts_tours_widget: provider({ verticals: ['activities'], access: 'widget', integration: 'widget', liveByDefault: true, notes: 'Live affiliate widget already integrated in OptionTrip.' }),
  amadeus: provider({ verticals: ['flights'], credentialEnv: ['AMADEUS_API_KEY', 'AMADEUS_API_SECRET'], access: 'approval_and_credentials' }),
  duffel: provider({ verticals: ['flights'], credentialEnv: ['DUFFEL_API_KEY'], access: 'credentials' }),
  hotelbeds: provider({ verticals: ['hotels'], credentialEnv: ['HOTELBEDS_API_KEY', 'HOTELBEDS_SECRET'], access: 'approval_and_credentials' }),

  // Travelpayouts programs confirmed from the OptionTrip account screenshots.
  // An affiliate provider becomes live only after its real HTTPS booking URL is
  // configured in the deployment environment. This prevents dead partner buttons.
  aviasales: affiliate({ verticals: ['flights'], directUrlEnv: 'TRAVELPAYOUTS_AVIASALES_AFFILIATE_URL' }),
  trip_com: affiliate({ verticals: ['hotels', 'flights', 'rail', 'activities'], directUrlEnv: 'TRAVELPAYOUTS_TRIP_COM_AFFILIATE_URL' }),
  twelve_go: affiliate({ verticals: ['rail', 'bus', 'ferries', 'transfers'], directUrlEnv: 'TRAVELPAYOUTS_12GO_AFFILIATE_URL' }),
  qeeq: affiliate({ verticals: ['cars'], directUrlEnv: 'TRAVELPAYOUTS_QEEQ_AFFILIATE_URL' }),
  economybookings: affiliate({ verticals: ['cars'], directUrlEnv: 'TRAVELPAYOUTS_ECONOMYBOOKINGS_AFFILIATE_URL' }),
  tiqets_affiliate: affiliate({ verticals: ['activities'], directUrlEnv: 'TRAVELPAYOUTS_TIQETS_AFFILIATE_URL' }),
  bikesbooking: affiliate({ verticals: ['cars', 'bikes', 'scooters'], directUrlEnv: 'TRAVELPAYOUTS_BIKESBOOKING_AFFILIATE_URL' }),
  supertravel: affiliate({ verticals: ['hotels'], directUrlEnv: 'TRAVELPAYOUTS_SUPERTRAVEL_AFFILIATE_URL' }),
  yourtravel: affiliate({ verticals: ['activities', 'tours'], directUrlEnv: 'TRAVELPAYOUTS_YOURTRAVEL_AFFILIATE_URL' }),
  insubuy: affiliate({ verticals: ['insurance'], directUrlEnv: 'TRAVELPAYOUTS_INSUBUY_AFFILIATE_URL' }),
  gettransfer_affiliate: affiliate({ verticals: ['transfers'], directUrlEnv: 'TRAVELPAYOUTS_GETTRANSFER_AFFILIATE_URL' }),
  kiwitaxi: affiliate({ verticals: ['transfers'], directUrlEnv: 'TRAVELPAYOUTS_KIWITAXI_AFFILIATE_URL' }),
  klook: affiliate({ verticals: ['activities', 'tours', 'rail', 'cars', 'transfers'], directUrlEnv: 'TRAVELPAYOUTS_KLOOK_AFFILIATE_URL' }),
  yesim: affiliate({ verticals: ['esim'], directUrlEnv: 'TRAVELPAYOUTS_YESIM_AFFILIATE_URL' }),
  localrent: affiliate({ verticals: ['cars'], directUrlEnv: 'TRAVELPAYOUTS_LOCALRENT_AFFILIATE_URL' }),
  welcome_pickups: affiliate({ verticals: ['transfers'], directUrlEnv: 'TRAVELPAYOUTS_WELCOME_PICKUPS_AFFILIATE_URL' }),
  kiwi_com: affiliate({ verticals: ['flights'], directUrlEnv: 'TRAVELPAYOUTS_KIWI_COM_AFFILIATE_URL' }),
  gigsky: affiliate({ verticals: ['esim'], directUrlEnv: 'TRAVELPAYOUTS_GIGSKY_AFFILIATE_URL' }),
  airalo_affiliate: affiliate({ verticals: ['esim'], directUrlEnv: 'TRAVELPAYOUTS_AIRALO_AFFILIATE_URL' }),
  drimsim: affiliate({ verticals: ['esim'], directUrlEnv: 'TRAVELPAYOUTS_DRIMSIM_AFFILIATE_URL' }),
  getrentacar: affiliate({ verticals: ['cars'], directUrlEnv: 'TRAVELPAYOUTS_GETRENTACAR_AFFILIATE_URL' }),
  airhelp: affiliate({ verticals: ['flight_compensation'], directUrlEnv: 'TRAVELPAYOUTS_AIRHELP_AFFILIATE_URL' }),
  go_city: affiliate({ verticals: ['activities', 'city_passes'], directUrlEnv: 'TRAVELPAYOUTS_GO_CITY_AFFILIATE_URL' }),
  ekta: affiliate({ verticals: ['insurance'], directUrlEnv: 'TRAVELPAYOUTS_EKTA_AFFILIATE_URL' }),
  wegotrip_affiliate: affiliate({ verticals: ['activities', 'tours'], directUrlEnv: 'TRAVELPAYOUTS_WEGOTRIP_AFFILIATE_URL' }),
  autoeurope: affiliate({ verticals: ['cars'], directUrlEnv: 'TRAVELPAYOUTS_AUTOEUROPE_AFFILIATE_URL' }),
  radical_storage: affiliate({ verticals: ['luggage_storage'], directUrlEnv: 'TRAVELPAYOUTS_RADICAL_STORAGE_AFFILIATE_URL' }),
  intui_travel: affiliate({ verticals: ['transfers'], directUrlEnv: 'TRAVELPAYOUTS_INTUI_TRAVEL_AFFILIATE_URL' }),
  compensair: affiliate({ verticals: ['flight_compensation'], directUrlEnv: 'TRAVELPAYOUTS_COMPENSAIR_AFFILIATE_URL' }),
  saily: affiliate({ verticals: ['esim'], directUrlEnv: 'TRAVELPAYOUTS_SAILY_AFFILIATE_URL' }),
  kkday: affiliate({ verticals: ['activities', 'tours', 'food', 'esim', 'hotels'], directUrlEnv: 'TRAVELPAYOUTS_KKDAY_AFFILIATE_URL' }),

  // Optional richer integrations. These do not make an affiliate program live by themselves.
  omio: provider({ verticals: ['rail', 'bus'], credentialEnv: ['TRAVELPAYOUTS_OMIO_FEED_URL'], access: 'feed', notes: 'Travelpayouts feed URL must be issued to OptionTrip before this adapter becomes live.' }),
  airalo: provider({ verticals: ['esim'], credentialEnv: ['TRAVELPAYOUTS_AIRALO_FEED_URL'], access: 'feed', notes: 'Optional richer feed integration. OptionTrip already has a live eSIM affiliate widget.' }),
  tiqets: provider({ verticals: ['activities'], credentialEnv: ['TRAVELPAYOUTS_TIQETS_FEED_URL'], access: 'feed', notes: 'Travelpayouts data access must be issued to OptionTrip before this adapter becomes live.' }),
  wegotrip: provider({ verticals: ['activities'], credentialEnv: ['TRAVELPAYOUTS_WEGOTRIP_API_KEY'], access: 'credentials', notes: 'Provider credential must be issued to OptionTrip before this adapter becomes live.' }),
  viator: provider({ verticals: ['activities'], credentialEnv: ['TRAVELPAYOUTS_VIATOR_FEED_URL'], access: 'feed', notes: 'Travelpayouts dynamic feed URL must be issued to OptionTrip before this adapter becomes live.' }),
  gettransfer: provider({ verticals: ['transfers'], credentialEnv: ['GETTRANSFER_ACCESS_TOKEN'], access: 'approval_and_credentials', notes: 'Separate provider approval/access token is required.' }),
});

const filtersForProvider = providerName => PROVIDER_FILTER_CAPABILITIES[providerName] || {};

const readinessFor = (providerName, config) => {
  const bookingUrl = config.bookingUrl?.() || null;
  return {
    provider: providerName,
    verticals: [...config.verticals],
    configured: config.enabled(),
    available: true,
    access: config.access,
    integration: config.integration,
    filters: filtersForProvider(providerName),
    bookingUrl,
    missingCredentials: config.credentialEnv.filter(name => !process.env[name]),
    missingDirectUrl: Boolean(config.directUrlEnv && !bookingUrl),
    notes: config.notes,
  };
};

export const getProviderCapabilities = () => Object.entries(TRAVEL_PROVIDER_REGISTRY)
  .map(([providerName, config]) => readinessFor(providerName, config));

export const getConfiguredProviders = vertical => getProviderCapabilities()
  .filter(item => item.configured && (!vertical || item.verticals.includes(vertical)))
  .map(item => item.provider);

export const getConfiguredFilterCapabilities = vertical => {
  const filters = new Set();
  getProviderCapabilities()
    .filter(item => item.configured && item.verticals.includes(vertical))
    .forEach(item => (item.filters?.[vertical] || []).forEach(filter => filters.add(filter)));
  return [...filters].sort();
};

export const getProviderReadiness = providerName => {
  const config = TRAVEL_PROVIDER_REGISTRY[providerName];
  return config ? readinessFor(providerName, config) : null;
};

export const isProviderConfigured = providerName => Boolean(TRAVEL_PROVIDER_REGISTRY[providerName]?.enabled());
