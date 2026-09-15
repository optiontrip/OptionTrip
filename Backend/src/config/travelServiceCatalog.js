import { getProviderCapabilities } from './travelProviderRegistry.js';

export const TRAVEL_SERVICE_CATALOG = Object.freeze({
  flights: { label: 'Flights', tripField: 'transport' },
  hotels: { label: 'Stays', tripField: 'stays' },
  rail: { label: 'Trains', tripField: 'transport' },
  bus: { label: 'Buses', tripField: 'transport' },
  ferries: { label: 'Ferries', tripField: 'transport' },
  cars: { label: 'Car rental', tripField: 'transport' },
  bikes: { label: 'Bike rental', tripField: 'transport' },
  scooters: { label: 'Scooter rental', tripField: 'transport' },
  motorcycles: { label: 'Motorcycle rental', tripField: 'transport' },
  transfers: { label: 'Transfers', tripField: 'transport' },
  taxis: { label: 'Taxis', tripField: 'transport' },
  activities: { label: 'Activities', tripField: 'experiences' },
  tours: { label: 'Tours', tripField: 'experiences' },
  packages: { label: 'Travel packages', tripField: 'experiences' },
  city_passes: { label: 'City passes', tripField: 'experiences' },
  esim: { label: 'eSIM', tripField: 'services' },
  insurance: { label: 'Travel insurance', tripField: 'services' },
  luggage_storage: { label: 'Luggage storage', tripField: 'services' },
  compensation: { label: 'Flight compensation', tripField: 'services' },
});

export const getTravelServiceCapabilities = () => {
  const providers = getProviderCapabilities();

  return Object.entries(TRAVEL_SERVICE_CATALOG).map(([service, config]) => {
    const matching = providers.filter(provider => provider.verticals.includes(service));
    return {
      service,
      ...config,
      liveProviders: matching.filter(provider => provider.configured).map(provider => provider.provider),
      candidateProviders: matching.filter(provider => !provider.configured).map(provider => ({
        provider: provider.provider,
        access: provider.access,
        missingCredentials: provider.missingCredentials,
      })),
    };
  });
};
