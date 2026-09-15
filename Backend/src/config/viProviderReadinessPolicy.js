export const VI_PROVIDER_READINESS_POLICY = Object.freeze({
  candidate: 'May be mentioned internally as an integration opportunity, never as live inventory.',
  credentials_missing: 'Do not call or expose as live. Surface only the missing credential names to operations, never values.',
  enabled: 'May be used only through the provider adapter and normalized result contract.',
  failed_health: 'Temporarily suppress live claims and use another provider or non-live guidance.',
  stale: 'Do not present stale price/availability as current.',
});

export default VI_PROVIDER_READINESS_POLICY;
