import axios from 'axios';
import { TP_CONFIG } from '../config/travelpayouts.js';

const cache = new Map();
const TTL = 15 * 60 * 1000;
const EMPTY_TTL = 2 * 60 * 1000;
const PROVIDER = 'travelpayouts';

function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function buildBookingUrl(link) {
  if (link && TP_CONFIG.marker) return `${TP_CONFIG.aviasalesBook}${link}?marker=${TP_CONFIG.marker}`;
  if (link) return `${TP_CONFIG.aviasalesBook}${link}`;
  return TP_CONFIG.aviasalesFallback;
}

function normalizeResult(item, meta = {}) {
  const durationMin = item.duration ?? item.duration_to ?? null;
  const checkedAt = meta.checkedAt || new Date().toISOString();
  return {
    id: `${item.origin}-${item.destination}-${item.departure_at}-${item.airline}-${item.price}`,
    origin: item.origin,
    destination: item.destination,
    airline: item.airline,
    flightNumber: item.flight_number ?? null,
    departureAt: item.departure_at,
    returnAt: item.return_at ?? null,
    duration: formatDuration(durationMin),
    durationMinutes: durationMin,
    stops: item.transfers ?? 0,
    price: item.price,
    currency: String(item.currency || meta.currency || 'USD').toUpperCase(),
    bookingUrl: buildBookingUrl(item.link),
    isRoundTrip: !!item.return_at,
    returnOrigin: item.destination || '',
    returnDestination: item.origin || '',
    returnDepartureTime: item.return_at ? String(item.return_at).slice(11, 16) : '',
    priceMeta: {
      provider: PROVIDER,
      source: meta.source || 'aviasales_prices_for_dates',
      checkedAt,
      freshnessSeconds: meta.freshnessSeconds ?? 0,
      cacheTtlSeconds: Math.round(TTL / 1000),
      isCached: Boolean(meta.isCached),
      isEstimate: Boolean(meta.isEstimate),
      isLiveProviderResult: !meta.isEstimate,
    },
  };
}

function withCacheFreshness(results, cachedAt) {
  const freshnessSeconds = Math.max(0, Math.floor((Date.now() - cachedAt) / 1000));
  return results.map(item => ({
    ...item,
    priceMeta: {
      ...(item.priceMeta || {}),
      provider: item.priceMeta?.provider || PROVIDER,
      checkedAt: item.priceMeta?.checkedAt || new Date(cachedAt).toISOString(),
      freshnessSeconds,
      cacheTtlSeconds: Math.round(TTL / 1000),
      isCached: true,
      isEstimate: Boolean(item.priceMeta?.isEstimate),
      isLiveProviderResult: !item.priceMeta?.isEstimate,
    },
  }));
}

export async function getCityDirections(origin) {
  try {
    const checkedAt = new Date().toISOString();
    const params = new URLSearchParams({ origin: origin.toUpperCase(), currency: 'usd', token: TP_CONFIG.token });
    const res = await fetch(`${TP_CONFIG.cityDirectionsUrl}?${params}`);
    if (!res.ok) return {};
    const json = await res.json();
    if (!json.success) return {};
    const result = {};
    for (const [dest, info] of Object.entries(json.data || {})) {
      result[dest] = {
        price: info.price,
        currency: 'USD',
        airline: info.airline,
        transfers: info.number_of_changes ?? info.transfers ?? 0,
        priceMeta: { provider: PROVIDER, source: 'city_directions', checkedAt, freshnessSeconds: 0, isCached: false, isEstimate: false, isLiveProviderResult: true },
      };
    }
    return result;
  } catch { return {}; }
}

function mergeExploreResult(target, destination, payload = {}, meta = {}) {
  const code = String(destination || '').toUpperCase().trim();
  if (!/^[A-Z]{3}$/.test(code)) return;
  const price = Number(payload.price);
  if (!Number.isFinite(price) || price <= 0) return;
  const prev = target[code];
  const base = {
    price,
    currency: String(payload.currency || meta.currency || 'USD').toUpperCase(),
    airline: payload.airline || payload.airlineName || null,
    transfers: Number.isFinite(Number(payload.transfers)) ? Number(payload.transfers) : 0,
    city: payload.city || payload.destinationName || payload.destination_name || null,
    country: payload.country || payload.countryName || payload.country_name || null,
    priceMeta: { provider: PROVIDER, source: meta.source || 'travelpayouts_explore', checkedAt: meta.checkedAt || new Date().toISOString(), freshnessSeconds: 0, isCached: false, isEstimate: false, isLiveProviderResult: true },
  };
  if (!prev || price < Number(prev.price)) { target[code] = { ...prev, ...base, price }; return; }
  target[code] = { ...prev, airline: prev.airline || base.airline, city: prev.city || base.city, country: prev.country || base.country, transfers: Number.isFinite(Number(prev.transfers)) ? Number(prev.transfers) : base.transfers };
}

async function fetchTPJson(url, queryObj = {}) {
  try {
    const params = new URLSearchParams(Object.entries(queryObj).filter(([, value]) => value !== undefined && value !== null && value !== '').map(([key, value]) => [key, String(value)]));
    const res = await fetch(`${url}?${params.toString()}`);
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

export async function getExploreDestinations(origin) {
  const o = String(origin || '').toUpperCase().trim();
  if (!/^[A-Z]{3}$/.test(o) || !TP_CONFIG.token) return {};
  const result = {};
  const checkedAt = new Date().toISOString();
  const [cityDirectionsJson, cheapJson, directJson, latestJson, specialJson, rangeJson] = await Promise.all([
    fetchTPJson(TP_CONFIG.cityDirectionsUrl, { origin: o, currency: 'usd', token: TP_CONFIG.token }),
    fetchTPJson('https://api.travelpayouts.com/v1/prices/cheap', { origin: o, destination: '-', currency: 'usd', token: TP_CONFIG.token }),
    fetchTPJson('https://api.travelpayouts.com/v1/prices/direct', { origin: o, destination: '-', currency: 'usd', token: TP_CONFIG.token }),
    fetchTPJson(TP_CONFIG.latestPricesUrl, { origin: o, currency: 'usd', period_type: 'year', sorting: 'price', group_by: 'directions', page: 1, token: TP_CONFIG.token }),
    fetchTPJson('https://api.travelpayouts.com/aviasales/v3/get_special_offers', { origin: o, locale: 'en', currency: 'usd', token: TP_CONFIG.token }),
    fetchTPJson('https://api.travelpayouts.com/aviasales/v3/search_by_price_range', { origin: o, destination: '-', value_min: 50, value_max: 500, one_way: true, direct: false, locale: 'en', currency: 'usd', market: 'us', limit: 60, page: 1, token: TP_CONFIG.token }),
  ]);
  for (const [dest, info] of Object.entries(cityDirectionsJson?.data || {})) mergeExploreResult(result, dest, { price: info.price, airline: info.airline, transfers: info.number_of_changes ?? info.transfers ?? 0, destinationName: info.destination_name, countryName: info.country_name }, { source: 'city_directions', checkedAt });
  for (const [dest, months] of Object.entries(cheapJson?.data || {})) { const entries = Object.values(months || {}).filter(Boolean); if (!entries.length) continue; const best = entries.reduce((a, i) => !a || Number(i.price) < Number(a.price) ? i : a, null); if (best) mergeExploreResult(result, dest, best, { source: 'cheap_prices', checkedAt }); }
  for (const [dest, data] of Object.entries(directJson?.data || {})) { const entries = Object.values(data || {}).filter(Boolean); if (!entries.length) continue; const best = entries.reduce((a, i) => !a || Number(i.price) < Number(a.price) ? i : a, null); if (best) mergeExploreResult(result, dest, { ...best, transfers: 0 }, { source: 'direct_prices', checkedAt }); }
  for (const item of (latestJson?.data || [])) mergeExploreResult(result, item.destination, { ...item, price: item.price ?? item.value }, { source: 'latest_prices', checkedAt });
  for (const item of (specialJson?.data || [])) mergeExploreResult(result, item.destination, { ...item, price: item.price ?? item.value }, { source: 'special_offers', checkedAt });
  for (const item of (rangeJson?.data || [])) mergeExploreResult(result, item.destination, { ...item, price: item.price ?? item.value }, { source: 'price_range', checkedAt });
  return result;
}

export async function getCheapPrice({ origin, destination, departDate }) {
  try {
    const checkedAt = new Date().toISOString();
    const month = departDate.substring(0, 7);
    const params = new URLSearchParams({ origin: origin.toUpperCase(), destination: destination.toUpperCase(), depart_date: month, currency: 'usd', token: TP_CONFIG.token });
    const res = await fetch(`https://api.travelpayouts.com/v1/prices/cheap?${params}`);
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.success) return null;
    const destData = json.data?.[destination.toUpperCase()];
    if (!destData) return null;
    const prices = Object.values(destData);
    if (!prices.length) return null;
    const best = prices.reduce((candidate, p) => (!candidate || p.price < candidate.price) ? p : candidate, null);
    return best ? { ...best, currency: 'USD', priceMeta: { provider: PROVIDER, source: 'cheap_prices', checkedAt, freshnessSeconds: 0, isCached: false, isEstimate: false, isLiveProviderResult: true } } : null;
  } catch { return null; }
}

async function fetchPricesForDates({ origin, destination, departureAt, returnAt, limit, currency }) {
  try {
    const checkedAt = new Date().toISOString();
    const params = { origin: origin.toUpperCase(), destination: destination.toUpperCase(), departure_at: departureAt, currency, sorting: 'price', page: 1, limit, one_way: !returnAt, token: TP_CONFIG.token };
    if (returnAt) params.return_at = returnAt;
    const { data } = await axios.get(TP_CONFIG.aviasalesBase, { params });
    return (data.data ?? []).map(item => normalizeResult(item, { source: 'aviasales_prices_for_dates', checkedAt, currency }));
  } catch { return []; }
}

async function fetchCheapPricesForRoute({ origin, destination, departureAt }) {
  try {
    const checkedAt = new Date().toISOString();
    const month = departureAt.substring(0, 7);
    const params = new URLSearchParams({ origin: origin.toUpperCase(), destination: destination.toUpperCase(), depart_date: month, currency: 'usd', token: TP_CONFIG.token });
    const res = await fetch(`https://api.travelpayouts.com/v1/prices/cheap?${params}`);
    if (!res.ok) return [];
    const json = await res.json();
    if (!json.success) return [];
    const destData = json.data?.[destination.toUpperCase()];
    if (!destData) return [];
    return Object.values(destData).map(item => normalizeResult({ origin: origin.toUpperCase(), destination: destination.toUpperCase(), airline: item.airline ?? '', flight_number: item.flight_number ?? null, departure_at: item.departure_at ?? `${month}-01T00:00:00`, return_at: item.return_at ?? null, duration: item.duration ?? null, transfers: item.transfers ?? 0, price: item.price, link: item.link ?? null }, { source: 'cheap_prices_fallback', checkedAt, currency: 'usd', isEstimate: true }));
  } catch { return []; }
}

export async function searchFlights({ origin, destination, departureAt, returnAt = null, limit = 30, currency = 'usd' }) {
  const o = origin.toUpperCase();
  const d = destination.toUpperCase();
  const key = `${o}-${d}-${departureAt}-${returnAt || 'one'}-${limit}-${currency}`;
  const cached = cache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    console.log(`✈️ Flight cache hit: ${key}`);
    return withCacheFreshness(cached.data, cached.cachedAt);
  }
  console.log(`🔍 Aviasales search: ${o} → ${d} on ${departureAt}`);
  let results = await fetchPricesForDates({ origin: o, destination: d, departureAt, returnAt, limit, currency });
  if (results.length === 0) {
    const month = departureAt.substring(0, 7);
    if (month !== departureAt) results = await fetchPricesForDates({ origin: o, destination: d, departureAt: month, returnAt, limit, currency });
  }
  if (results.length === 0) results = await fetchCheapPricesForRoute({ origin: o, destination: d, departureAt });
  const ttl = results.length > 0 ? TTL : EMPTY_TTL;
  const cachedAt = Date.now();
  cache.set(key, { data: results, cachedAt, expiresAt: cachedAt + ttl });
  console.log(`${results.length > 0 ? '✅' : '⚠️'} Aviasales: ${results.length} result(s) for ${o} → ${d}`);
  return results;
}
