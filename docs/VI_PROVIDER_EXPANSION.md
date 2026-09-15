# Vi provider expansion order

Provider work should follow traveler value and verified access, not the number of logos displayed.

## Current readiness targets

- Flights: Travelpayouts/Aviasales plus existing approved adapters
- Hotels/stays: existing hotel providers and additional approved accommodation APIs
- Rail/bus: Omio feed readiness
- Activities: Tiqets feed, WeGoTrip API, Viator feed
- Connectivity: Airalo feed
- Transfers: GetTransfer access/API

## Next catalog evaluation

Evaluate legitimate Travelpayouts/partner programs and official providers for:

- rental cars and one-way rental
- insurance
- package tours
- cruises
- ferries
- airport lounges and parking
- luggage storage/delivery
- compensation/claims referral where legally appropriate
- events and attraction inventory
- RV/camping and ski-related travel services

## Integration rule

A provider progresses through:

DISCOVERED -> TERMS REVIEWED -> ACCESS REQUESTED -> CREDENTIALS/FEED AVAILABLE -> ADAPTER -> NORMALIZED INVENTORY -> HEALTH/FRESHNESS CHECK -> VI/UI ENABLED -> ATTRIBUTION/CONVERSION MONITORED.

Do not skip from DISCOVERED to VI/UI ENABLED. A brand being present in an affiliate catalog is not evidence that OptionTrip has a live search API.
