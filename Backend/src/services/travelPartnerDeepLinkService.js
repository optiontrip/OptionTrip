import { getAirportInfo } from './nearbyAirportsService.js';
import { createTravelpayoutsPartnerLink } from './travelpayoutsPartnerLinks.js';

const ROUTE_AWARE_SERVICES = Object.freeze({
  rail: { provider: 'twelve_go', path: 'train', label: 'Train' },
  bus: { provider: 'twelve_go', path: 'bus', label: 'Bus' },
  ferries: { provider: 'twelve_go', path: 'ferry', label: 'Ferry' },
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

const resolveRouteEndpoint = code => {
  const normalizedCode = normalizeIata(code);
  if (!normalizedCode) return null;
  const airport = getAirportInfo(normalizedCode);
  if (!airport?.city) return null;
  const slug = latinSlug(airport.city);
  if (!slug) return null;
  return {
    code: normalizedCode,
    city: airport.city,
    country: airport.country || '',
    slug,
  };
};

export const getRouteAwareServiceConfig = serviceId => ROUTE_AWARE_SERVICES[String(serviceId || '').trim()] || null;
export const isRouteAwareService = serviceId => Boolean(getRouteAwareServiceConfig(serviceId));

export const buildRouteAwarePartnerTarget = ({ serviceId, originCode, destinationCode } = {}) => {
  const config = getRouteAwareServiceConfig(serviceId);
  if (!config) return null;

  const origin = resolveRouteEndpoint(originCode);
  const destination = resolveRouteEndpoint(destinationCode);
  if (!origin || !destination || origin.code === destination.code || origin.slug === destination.slug) return null;

  const sourceUrl = `https://12go.asia/en/${config.path}/${encodeURIComponent(origin.slug)}/${encodeURIComponent(destination.slug)}`;
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
    origin: {
      code: target.origin.code,
      city: target.origin.city,
      country: target.origin.country,
    },
    destination: {
      code: target.destination.code,
      city: target.destination.city,
      country: target.destination.country,
    },
    partnerUrl: created.partnerUrl,
    cached: Boolean(created.cached),
  };
};

export const ROUTE_AWARE_SERVICE_IDS = Object.freeze(Object.keys(ROUTE_AWARE_SERVICES));
