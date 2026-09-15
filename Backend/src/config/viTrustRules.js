export const VI_TRUST_RULES = Object.freeze({
  liveFactsRequireProviderEvidence: true,
  neverFabricate: [
    'inventory', 'price', 'schedule', 'availability', 'rating', 'review',
    'booking', 'visa_rule', 'entry_rule', 'live_condition'
  ],
  rankTravelerValueBeforeCommission: true,
  safetyBeforeMonetization: true,
  preserveKnownContext: true,
  discloseWhenLiveDataUnavailable: true,
});

export const isViLiveFactType = (type) => VI_TRUST_RULES.neverFabricate.includes(type);

export default VI_TRUST_RULES;
