export const VI_PROVIDER_STAGES = Object.freeze([
  'discovered',
  'terms_reviewed',
  'access_requested',
  'access_available',
  'adapter_ready',
  'normalized_inventory',
  'health_checked',
  'enabled',
]);

export const canExposeProviderAsLive = (stage) => stage === 'enabled';

export const nextProviderStage = (stage) => {
  const index = VI_PROVIDER_STAGES.indexOf(stage);
  if (index < 0 || index === VI_PROVIDER_STAGES.length - 1) return null;
  return VI_PROVIDER_STAGES[index + 1];
};

export default VI_PROVIDER_STAGES;
