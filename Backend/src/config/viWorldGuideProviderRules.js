export const VI_WORLD_GUIDE_PROVIDER_RULES = Object.freeze({
  discovered: { live: false, userClaim: false },
  access_requested: { live: false, userClaim: false },
  credentials_missing: { live: false, userClaim: false },
  adapter_ready: { live: false, userClaim: false },
  health_checked: { live: false, userClaim: false },
  enabled: { live: true, userClaim: true },
  stale: { live: false, userClaim: false },
  failed: { live: false, userClaim: false },
});

export const providerCanMakeLiveClaims = (status) => VI_WORLD_GUIDE_PROVIDER_RULES[status]?.userClaim === true;

export default VI_WORLD_GUIDE_PROVIDER_RULES;
