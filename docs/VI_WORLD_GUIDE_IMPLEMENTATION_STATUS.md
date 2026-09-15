# Vi world-guide implementation status

## Implemented on feature branch

- north-star product contract
- complete traveler lifecycle phases
- destination-free discovery vocabulary
- whole-trip capability catalog
- broader travel service universe
- provider-truth rules
- provider activation lifecycle guard
- traveler-value ranking factors
- Trip Object / My Trips / Travel Map continuity contract
- prompt extension module that preserves the existing chat architecture
- executable contract validation script
- provider expansion roadmap including Travelpayouts readiness targets

## Required before production merge

- wire `extendViSystemPrompt()` into the existing `chatService` prompt construction without replacing current flight/hotel tooling
- run backend syntax and existing CI
- verify prompt size and JSON response behavior
- test current real flight and hotel tool invocation for regression
- test destination-free discovery scenarios
- verify provider-readiness signals never appear as live inventory claims

## Next provider work

Turn verified readiness into adapters/capabilities in this order as access permits: Omio rail/bus, activities (Tiqets/WeGoTrip/Viator), Airalo eSIM, GetTransfer transfers, then cars/insurance/packages/cruises and additional legitimate travel verticals.
