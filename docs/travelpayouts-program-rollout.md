# Travelpayouts program rollout

OptionTrip's Travelpayouts account shows a broad My Programs catalog. The backend registry tracks those programs as provider candidates without pretending that catalog availability equals live inventory.

## Activation rule

A provider is exposed as configured only when its required affiliate URL, feed URL, API key, or provider token exists in the production environment. Secrets and issued URLs are never committed to GitHub.

## Service coverage prepared

Flights, stays, rail, buses, ferries, car rental, bikes/scooters/motorcycles, transfers/taxis, tours and activities, packages, city passes, eSIM, travel insurance, luggage storage, and flight compensation.

## Rollout

1. Prefer already-issued no-approval Travelpayouts feeds/data access.
2. Add provider-specific adapters only after the exact issued format is known.
3. Normalize provider output into OptionTrip service capabilities and Trip Object categories.
4. Keep candidate providers visible to internal readiness tooling but never label them as live to travelers until configured.
5. Keep Unlock More programs separate until Travelpayouts/provider approval is actually granted.
