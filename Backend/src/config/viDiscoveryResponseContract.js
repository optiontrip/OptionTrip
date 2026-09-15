export const VI_DISCOVERY_RESPONSE_CONTRACT = Object.freeze({
  maxPrimaryCandidates: 4,
  candidateFields: ['destination_or_route', 'why_it_fits', 'constraint_fit', 'tradeoff', 'live_data_status'],
  requireLiveDataLabelWhenPriceSensitive: true,
  avoidGenericFamousPlaceDump: true,
  askOnlyForBlockingUnknowns: true,
});

export default VI_DISCOVERY_RESPONSE_CONTRACT;
