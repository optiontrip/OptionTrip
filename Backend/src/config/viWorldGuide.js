import { VI_WORLD_GUIDE_PROMPT } from './viWorldGuidePrompt.js';
import { getViTravelCapabilityContext } from './viTravelCapabilityCatalog.js';

// Central extension point for Vi's whole-trip behavior. Keeping this outside
// chatService lets provider and product capabilities expand without turning
// the chat prompt into another hard-coded provider registry.
export const getViWorldGuideContext = () => ({
  prompt: VI_WORLD_GUIDE_PROMPT,
  travel: getViTravelCapabilityContext(),
});

export default getViWorldGuideContext;
