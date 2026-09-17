import { registerProviderAdapter } from '../providerExecution.js';
import { searchFlights as searchTravelpayouts } from '../travelpayoutsFlightService.js';
import { searchFlights as searchAmadeus } from '../amadeusService.js';
import { searchFlightsDuffel } from '../duffelService.js';

let registered = false;

const normalizeRequest = request => ({
  origin: String(request.origin || '').toUpperCase(),
  destination: String(request.destination || '').toUpperCase(),
  departureAt: request.departureAt || request.departureDate,
  returnAt: request.returnAt || request.returnDate || null,
  adults: Number(request.adults || 1),
  limit: Number(request.limit || 30),
  currency: String(request.currency || 'usd').toLowerCase(),
});

const requireResults = (provider, result) => {
  const rows = Array.isArray(result) ? result : (result?.data || result?.results || result?.offers || []);
  if (!Array.isArray(rows) || rows.length === 0) throw new Error(`${provider}_empty`);
  return rows;
};

export const registerFlightProviderAdapters = () => {
  if (registered) return;
  registered = true;

  registerProviderAdapter('travelpayouts', 'flights', async request => {
    const input = normalizeRequest(request);
    return requireResults('travelpayouts', await searchTravelpayouts(input));
  });

  registerProviderAdapter('amadeus', 'flights', async request => {
    const input = normalizeRequest(request);
    return requireResults('amadeus', await searchAmadeus({
      originLocationCode: input.origin,
      destinationLocationCode: input.destination,
      departureDate: input.departureAt,
      returnDate: input.returnAt,
      adults: input.adults,
      currencyCode: input.currency.toUpperCase(),
      max: input.limit,
    }));
  });

  registerProviderAdapter('duffel', 'flights', async request => {
    const input = normalizeRequest(request);
    return requireResults('duffel', await searchFlightsDuffel({
      origin: input.origin,
      destination: input.destination,
      departureDate: input.departureAt,
      returnDate: input.returnAt,
      adults: input.adults,
    }));
  });
};
