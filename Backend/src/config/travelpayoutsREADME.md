# Travelpayouts provider activation contract

`TRAVEL_PROVIDER_REGISTRY` is the source of truth for provider readiness.

- `configured: true` means the required production environment value exists.
- `configured: false` means OptionTrip knows about the provider but must not claim live inventory.
- `travelpayouts_program` means the program is part of the Travelpayouts rollout path and is activated through an issued affiliate/deep-link/feed value.
- `feed`, `credentials`, and `approval_and_credentials` retain their stricter provider-specific requirements.

Never commit affiliate credentials, private feed URLs, tokens, or API keys.
