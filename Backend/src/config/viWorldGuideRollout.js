import { getViWorldGuideFeatureFlags } from './viWorldGuideFeatureFlags.js';
import { buildViWorldGuidePrompt } from '../services/viWorldGuideService.js';

export const maybeExtendViPrompt = (prompt) => {
  const flags = getViWorldGuideFeatureFlags();
  if (!flags.promptExtension) return prompt;
  return `${String(prompt || '').trimEnd()}\n\n${buildViWorldGuidePrompt()}`;
};

export default maybeExtendViPrompt;
