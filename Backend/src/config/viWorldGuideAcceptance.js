import { getViWorldGuideContract } from './viWorldGuideContract.js';

export const validateViWorldGuideContract = () => {
  const contract = getViWorldGuideContract();
  const errors = [];

  for (const phase of ['discover', 'plan', 'compare', 'book', 'prepare', 'travel', 'live_assist', 'remember', 'return']) {
    if (!contract.phases.includes(phase)) errors.push(`missing phase: ${phase}`);
  }

  for (const capability of ['flights', 'hotels', 'rail', 'bus', 'cars', 'transfers', 'activities', 'esim', 'insurance', 'restaurants', 'entry_requirements', 'weather', 'safety', 'local_transport', 'disruptions', 'memories']) {
    if (!contract.travel.capabilities[capability]) errors.push(`missing capability: ${capability}`);
  }

  if (!contract.trust.liveFactsRequireProviderEvidence) errors.push('provider evidence rule disabled');
  if (!contract.trust.rankTravelerValueBeforeCommission) errors.push('traveler-value ranking rule disabled');
  if (!contract.continuity.privacyRequired) errors.push('trip-memory privacy rule disabled');

  return { valid: errors.length === 0, errors };
};

export default validateViWorldGuideContract;
