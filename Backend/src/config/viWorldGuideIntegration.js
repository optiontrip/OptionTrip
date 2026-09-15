import { buildViWorldGuidePrompt } from '../services/viWorldGuideService.js';

/**
 * Append the world-guide contract to Vi's existing system prompt.
 * This intentionally preserves all current chatService flight/hotel tooling,
 * memory, trip context, formatting and safety behavior.
 */
export const extendViSystemPrompt = (existingPrompt) => {
  const base = String(existingPrompt || '').trimEnd();
  const extension = buildViWorldGuidePrompt();
  return `${base}\n\n${extension}`;
};

export default extendViSystemPrompt;
