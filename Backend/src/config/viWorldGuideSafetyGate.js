import { validateViWorldGuideContract } from './viWorldGuideAcceptance.js';
import { getViWorldGuideFeatureFlags } from './viWorldGuideFeatureFlags.js';

export const getViWorldGuideSafetyGate = () => {
  const validation = validateViWorldGuideContract();
  const flags = getViWorldGuideFeatureFlags();
  return {
    canLoadModules: validation.valid,
    canEnablePrompt: validation.valid && flags.promptExtension,
    errors: validation.errors,
    flags,
  };
};

export default getViWorldGuideSafetyGate;
