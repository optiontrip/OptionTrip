# Vi world-guide rollout

The world-guide prompt extension is designed to be feature-flagged and OFF by default until wired and regression-tested.

Environment flags:

- `VI_WORLD_GUIDE_PROMPT_ENABLED`
- `VI_DESTINATION_FREE_DISCOVERY_ENABLED`
- `VI_PROVIDER_READINESS_CONTEXT_ENABLED`

Rollout sequence: merge dormant modules -> wire prompt behind flag -> CI/regression tests -> enable in controlled production -> verify flight/hotel tool behavior -> expand discovery/provider capabilities.

No secret values belong in GitHub. Provider credentials remain production environment configuration.
