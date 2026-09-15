export const TRAVELPAYOUTS_SAFETY_INVARIANTS = Object.freeze([
  'Never claim catalog availability is live inventory.',
  'Never commit private affiliate links, feed URLs, API keys, or tokens.',
  'Never fabricate provider prices, schedules, availability, ratings, or booking confirmations.',
  'Only expose a provider as live when its runtime readiness is configured.',
  'Keep Unlock More programs pending until approval is actually granted.',
]);
