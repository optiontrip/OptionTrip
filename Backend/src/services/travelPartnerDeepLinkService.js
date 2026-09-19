import { getAirportInfo } from './nearbyAirportsService.js';
import { createTravelpayoutsPartnerLink } from './travelpayoutsPartnerLinks.js';

const ROUTE_AWARE_SERVICES = Object.freeze({
  rail: { provider: 'twelve_go', path: 'train', label: 'Train' },
  bus: { provider: 'twelve_go', path: 'bus', label: 'Bus' },
  ferries: { provider: 'twelve_go', path: 'ferry', label: 'Ferry' },
});

const GO_CITY_DESTINATIONS = Object.freeze({
  amsterdam: 'amsterdam',
  barcelona: 'barcelona',
  boston: 'boston',
  cancun: 'cancun',
  chicago: 'chicago',
  dubai: 'dubai',
  dublin: 'dublin',
  gothenburg: 'gothenburg',
  hong_kong: 'hong-kong',
  honolulu: 'oahu',
  las_vegas: 'las-vegas',
  london: 'london',
  los_angeles: 'los-angeles',
  madrid: 'madrid',
  miami: 'miami',
  new_orleans: 'new-orleans',
  new_york: 'new-york',
  oahu: 'oahu',
  orlando: 'orlando',
  paris: 'paris',
  philadelphia: 'philadelphia',
  prague: 'prague',
  rome: 'rome',
  san_antonio: 'san-antonio',
  san_diego: 'san-diego',
  san_francisco: 'san-francisco',
  singapore: 'singapore',
  stockholm: 'stockholm',
  sydney: 'sydney',
});

const DESTINATION_AWARE_SERVICES = Object.freeze({
  transfers: { provider: 'kiwitaxi', mode: 'country', label: 'Airport transfer' },
  city_passes: { provider: 'go_city', mode: 'city', label: 'City pass' },
});

const normalizeIata = value => {
  const code = String(value || '').trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : null;
};

const latinSlug = value => String(value || '')
  .normalize('NFKD')
  .replace(/[đĐ]/g, 'd')
  .replace(/[łŁ]/g, 'l')
  .replace(/[øØ]/g, 'o')
  .replace(/[ıİ]/g, 'i')
  .replace(/ß/g, 'ss')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const cityKey = value => String(value || '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '');

const resolveEndpoint = code => {
  const normalizedCode = normalizeIata(code);
  if (!normalizedCode) return null;
  const airport = getAirportInfo(normalizedCode);
  if (!airport?.city) return null;
  const citySlug = latinSlug(airport.city);
  const countrySlug = latinSlug(airport.country);
  if (!citySlug || !countrySlug) return null;
  return {
    code: normalizedCode,
    city: airport.city,
    country: airport.country || '',
    citySlug,
    countrySlug,
  };
};

export const getRouteAwareServiceConfig = serviceId => ROUTE_AWARE_SERVICES[String(serviceId || '').trim()] || null;
export const isRouteAwareService = serviceId => Boolean(getRouteAwareServiceConfig(serviceId));
export const getDestinationAwareServiceConfig = serviceId => DESTINATION_AWARE_SERVICES[String(serviceId || '').trim()] || null;
export const isDestinationAwareService = serviceId => Boolean(getDestinationAwareServiceConfig(serviceId));
export const isDeepLinkAwareService = serviceId => isRouteAwareService(serviceId) || isDestinationAwareService(serviceId);

export const buildRouteAwarePartnerTarget = ({ serviceId, originCode, destinationCode } = {}) => {
  const config = getRouteAwareServiceConfig(serviceId);
  if (!config) return null;

  const origin = resolveEndpoint(originCode);
  const destination = resolveEndpoint(destinationCode);
  if (!origin || !destination || origin.code === destination.code || origin.citySlug === destination.citySlug) return null;

  const sourceUrl = `https://12go.asia/en/${config.path}/${encodeURIComponent(origin.citySlug)}/${encodeURIComponent(destination.citySlug)}`;
  return {
    serviceId,
    provider: config.provider,
    mode: config.path,
    label: config.label,
    origin,
    destination,
    sourceUrl,
  };
};

export const buildDestinationAwarePartnerTarget = ({ serviceId, destinationCode } = {}) => {
  const config = getDestinationAwareServiceConfig(serviceId);
  if (!config) return null;
  const destination = resolveEndpoint(destinationCode);
  if (!destination) return null;

  if (serviceId === 'transfers') {
    return {
      serviceId,
      provider: config.provider,
      mode: config.mode,
      label: config.label,
      destination,
      sourceUrl: `https://kiwitaxi.com/en/${encodeURIComponent(destination.countrySlug)}`,
    };
  }

  if (serviceId === 'city_passes') {
    const goCitySlug = GO_CITY_DESTINATIONS[cityKey(destination.city)] || null;
    if (!goCitySlug) return null;
    return {
      serviceId,
      provider: config.provider,
      mode: config.mode,
      label: config.label,
      destination,
      sourceUrl: `https://gocity.com/en/${encodeURIComponent(goCitySlug)}`,
    };
  }

  return null;
};

const publicEndpoint = endpoint => endpoint ? ({
  code: endpoint.code,
  city: endpoint.city,
  country: endpoint.country,
}) : null;

export const createRouteAwarePartnerDeepLink = async ({ serviceId, originCode, destinationCode } = {}) => {
  const target = buildRouteAwarePartnerTarget({ serviceId, originCode, destinationCode });
  if (!target) return null;

  const created = await createTravelpayoutsPartnerLink({
    provider: target.provider,
    url: target.sourceUrl,
    subId: `optiontrip_${target.serviceId}_${target.origin.code}_${target.destination.code}`,
  });
  if (!created?.partnerUrl) return null;

  return {
    serviceId: target.serviceId,
    provider: target.provider,
    mode: target.mode,
    label: target.label,
    origin: publicEndpoint(target.origin),
    destination: publicEndpoint(target.destination),
    partnerUrl: created.partnerUrl,
    cached: Boolean(created.cached),
  };
};

export const createDestinationAwarePartnerDeepLink = async ({ serviceId, destinationCode } = {}) => {
  const target = buildDestinationAwarePartnerTarget({ serviceId, destinationCode });
  if (!target) return null;

  const created = await createTravelpayoutsPartnerLink({
    provider: target.provider,
    url: target.sourceUrl,
    subId: `optiontrip_${target.serviceId}_${target.destination.code}`,
  });
  if (!created?.partnerUrl) return null;

  return {
    serviceId: target.serviceId,
    provider: target.provider,
    mode: target.mode,
    label: target.label,
    destination: publicEndpoint(target.destination),
    partnerUrl: created.partnerUrl,
    cached: Boolean(created.cached),
  };
};

export const createPartnerDeepLink = async ({ serviceId, originCode, destinationCode } = {}) => {
  if (isRouteAwareService(serviceId)) {
    return createRouteAwarePartnerDeepLink({ serviceId, originCode, destinationCode });
  }
  if (isDestinationAwareService(serviceId)) {
    return createDestinationAwarePartnerDeepLink({ serviceId, destinationCode });
  }
  return null;
};

export const ROUTE_AWARE_SERVICE_IDS = Object.freeze(Object.keys(ROUTE_AWARE_SERVICES));
export const DESTINATION_AWARE_SERVICE_IDS = Object.freeze(Object.keys(DESTINATION_AWARE_SERVICES));
export const GO_CITY_SUPPORTED_DESTINATIONS = Object.freeze(Object.values(GO_CITY_DESTINATIONS));
