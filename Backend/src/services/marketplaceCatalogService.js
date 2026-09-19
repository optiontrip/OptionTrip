import { getProviderPlan } from './providerOrchestrator.js';
import { getExecutionReadiness } from './providerExecution.js';

const LABELS = Object.freeze({
  flights: 'Flights', hotels: 'Hotels', cars: 'Car rental', rail: 'Trains', bus: 'Buses', ferries: 'Ferries',
  transfers: 'Transfers', activities: 'Things to do', esim: 'eSIM', insurance: 'Travel insurance',
  luggage_storage: 'Luggage storage', flight_compensation: 'Flight compensation', bikes: 'Bikes', scooters: 'Scooters',
  tours: 'Tours', city_passes: 'City passes', food: 'Food experiences',
});

const SEARCHABLE = new Set(['flights', 'hotels']);
const WIDGET_FIRST = new Set(['cars', 'activities', 'esim']);

export const getMarketplaceCatalog = () => {
  const verticals = [...new Set(Object.values(LABELS).length ? Object.keys(LABELS) : [])];
  return verticals.map(vertical => {
    const providers = getProviderPlan(vertical);
    const live = providers.filter(item => item.configured);
    const executable = getExecutionReadiness(vertical).filter(item => item.executable);
    const widget = live.find(item => item.integration === 'widget');
    const directPartner = live.find(item => item.integration === 'affiliate' && item.bookingUrl);

    let mode = 'coming_soon';
    if (executable.length > 0 && SEARCHABLE.has(vertical)) mode = 'search';
    else if (widget || (WIDGET_FIRST.has(vertical) && live.length > 0)) mode = 'widget';
    else if (directPartner) mode = 'affiliate';
    else if (live.length > 0) mode = 'available';

    return {
      vertical,
      label: LABELS[vertical] || vertical,
      mode,
      live: live.length > 0,
      providerCount: providers.length,
      liveProviderCount: live.length,
      executableProviders: executable.map(item => item.provider),
      primaryProvider: live[0]?.provider || null,
      bookingProvider: directPartner?.provider || null,
      bookingUrl: directPartner?.bookingUrl || null,
      integrations: [...new Set(live.map(item => item.integration))],
    };
  });
};

export const getMarketplaceVertical = vertical => getMarketplaceCatalog().find(item => item.vertical === vertical) || null;
