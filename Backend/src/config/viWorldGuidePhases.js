export const VI_TRAVEL_PHASES = Object.freeze([
  'discover',
  'plan',
  'compare',
  'book',
  'prepare',
  'travel',
  'live_assist',
  'remember',
  'return',
]);

export const normalizeViTravelPhase = (phase) => {
  const normalized = String(phase || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  return VI_TRAVEL_PHASES.includes(normalized) ? normalized : null;
};

export default VI_TRAVEL_PHASES;
