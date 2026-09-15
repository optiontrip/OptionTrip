import { getViWorldGuideContract } from './viWorldGuideContract.js';
import { buildViWorldGuidePrompt } from '../services/viWorldGuideService.js';

export const getViWorldGuideRuntime = () => ({
  contract: getViWorldGuideContract(),
  systemPromptExtension: buildViWorldGuidePrompt(),
});

export default getViWorldGuideRuntime;
