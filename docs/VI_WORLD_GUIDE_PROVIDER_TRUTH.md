# Provider truth standard

OptionTrip may know that a partner/program exists before it has usable live inventory. These states must never be conflated.

- Catalog/program discovered: integration opportunity only.
- Access requested: not live.
- Credentials/feed available: still not live until adapter and normalization work is complete.
- Adapter ready: testable, not necessarily production-ready.
- Health/freshness verified: eligible for controlled enablement.
- Enabled: Vi/UI may describe results as live only when the current request actually returned provider-backed data.
- Failed/stale: suppress live claims and fall back to another provider or non-live guidance.

This applies to Travelpayouts programs and every other provider.
