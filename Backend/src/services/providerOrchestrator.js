import { getProviderCapabilities } from '../config/travelProviderRegistry.js';

const DEFAULT_PRIORITY = Object.freeze({
  flights: ['travelpayouts', 'amadeus', 'duffel', 'aviasales', 'trip_com'],
  hotels: ['travelpayouts', 'hotelbeds', 'trip_com', 'supertravel'],
  cars: ['travelpayouts_car_rental_widget', 'qeeq', 'economybookings', 'localrent', 'getrentacar', 'autoeurope'],
  rail: ['trip_com', 'twelve_go', 'omio', 'klook'],
  bus: ['twelve_go', 'omio'],
  ferries: ['twelve_go'],
  transfers: ['twelve_go', 'klook', 'welcome_pickups', 'kiwitaxi', 'intui_travel', 'gettransfer'],
  activities: ['travelpayouts_tours_widget', 'klook', 'yourtravel', 'kkday', 'go_city', 'tiqets', 'wegotrip', 'viator'],
  esim: ['travelpayouts_esim_widget', 'airalo', 'yesim', 'saily', 'gigsky', 'drimsim'],
  insurance: ['ekta'],
  luggage_storage: ['radical_storage'],
  flight_compensation: ['airhelp', 'compensair'],
});

const priorityFor = vertical => DEFAULT_PRIORITY[vertical] || [];

export const getProviderPlan = vertical => {
  const priority = priorityFor(vertical);
  return getProviderCapabilities()
    .filter(item => item.verticals.includes(vertical))
    .map(item => ({ ...item, priority: priority.indexOf(item.provider) }))
    .sort((a, b) => {
      if (a.configured !== b.configured) return a.configured ? -1 : 1;
      const aPriority = a.priority < 0 ? Number.MAX_SAFE_INTEGER : a.priority;
      const bPriority = b.priority < 0 ? Number.MAX_SAFE_INTEGER : b.priority;
      return aPriority - bPriority;
    });
};

export const getTravelMarketplaceHealth = () => {
  const verticals = [...new Set(getProviderCapabilities().flatMap(item => item.verticals))];
  return verticals.sort().map(vertical => {
    const providers = getProviderPlan(vertical);
    const live = providers.filter(provider => provider.configured);
    return {
      vertical,
      operational: live.length > 0,
      redundancy: live.length,
      primary: live[0]?.provider || null,
      fallback: live.slice(1).map(provider => provider.provider),
      candidates: providers.filter(provider => !provider.configured).map(provider => ({
        provider: provider.provider,
        access: provider.access,
        integration: provider.integration,
        missingCredentials: provider.missingCredentials,
      })),
    };
  });
};

export const getProviderIntegrationBacklog = () => getTravelMarketplaceHealth()
  .flatMap(item => item.candidates.map(candidate => ({ vertical: item.vertical, ...candidate })));
