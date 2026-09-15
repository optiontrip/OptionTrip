# OptionTrip Travel OS - Competitive Product Standard (2026)

This document is a product guardrail for every major OptionTrip release. It is not a promise that every item below is already implemented.

## North star

OptionTrip should connect the full journey in one persistent Trip Object:

DISCOVER -> PLAN -> COMPARE -> BOOK -> PREPARE -> TRAVEL -> LIVE ASSIST -> REMEMBER -> RETURN

Vi is the conversational control layer across that lifecycle. Mobile web is treated as an app foundation, not a reduced desktop view.

## Verified competitive baseline - September 2026

Current leading travel products have raised the baseline:

- Tripadvisor AI combines conversational recommendations, real-time hotel/activity availability, comparison/map views, editable itineraries and sharing.
- Google Gemini / AI Mode combines live Flights, Hotels and Maps data, itinerary generation, saved planning context and flight-price tracking.
- Expedia is moving toward natural-language planning across activities and stays, with bookable itineraries, bundles and broader trip-management integrations.
- Booking.com integrates conversational trip planning with accommodation inventory and booking flows.

OptionTrip should not copy these products screen-for-screen. The goal is to close baseline gaps and differentiate through a persistent cross-service Trip Object and Vi across the whole journey.

## Release gates

Every major product batch must be checked against these gates before merge:

### 1. One Trip Object
- New services attach to the current trip where possible.
- Selected flight, stay, car, activity/tour and connectivity choices do not become isolated dead-end state.
- My Trips can resume the journey.

### 2. Vi orchestration
- Vi receives current-trip context where available.
- A Vi recommendation should lead to an actionable OptionTrip surface when one exists.
- Vi must not claim provider availability that OptionTrip cannot actually deliver.

### 3. Commerce integrity
- Search/compare/book paths have a clear next action.
- Affiliate/provider transitions are intentional and attributable.
- Booking buttons must not silently degrade into unrelated map/search links.
- Provider failure has retry/fallback behavior and must not destroy trip state.

### 4. Mobile/app readiness
- Primary actions work at 320px+ viewport widths.
- No horizontal page overflow caused by first-party UI.
- Third-party widgets are contained.
- Tap targets, dialogs, navigation and sticky controls are usable by touch.
- Architecture should remain reusable for a future native/app shell.

### 5. Accessibility and traveler context
- Keyboard and screen-reader semantics are preserved for new controls.
- Accessible, LGBTQ+ and business-travel needs can influence planning rather than existing only as marketing pages.
- Critical accessibility, legal, entry and safety facts require source/provider verification.

### 6. Multilingual integrity
- Inline translations must preserve visible word boundaries around links, strong/emphasis spans and other inline elements.
- Navigation labels use natural localized language rather than literal machine translations.
- Layout must tolerate longer translated labels.

### 7. SEO/discovery
- Indexable public travel surfaces have unique title, description, canonical intent and useful internal links.
- Trip-private/user-specific surfaces should not leak private content into public indexing.
- Destination/content pages should connect discovery to planning/booking rather than becoming content dead ends.
- Structured data is added only where it accurately represents visible content.

### 8. Reliability
- Loading, empty, error and retry states exist for network/provider-dependent features.
- No secret/API credential is committed to frontend or repository source.
- CI must pass before merge and production deployment must be checked after merge.

## Monetization expansion order

Prioritize services that naturally attach to the Trip Object and improve traveler utility:

1. Flights
2. Hotels/stays
3. Rental cars
4. Tours/activities/tickets
5. eSIM/connectivity
6. Rail and bus
7. Airport/city transfers
8. Travel insurance where compliant and provider-approved
9. Airport services / lounges where provider inventory is available
10. Relevant local services that can be verified and booked or requested

Provider/API/feed activation is required before OptionTrip presents a service as live.

## Differentiation backlog

High-value differentiators to evaluate in future batches:

- Vi-driven cross-service comparison and tradeoff explanations
- price watch / meaningful price-change alerts
- automatic trip import from confirmations where permissioned
- disruption-aware live trip assistance
- collaborative trips and shared decision making
- offline/low-connectivity trip essentials
- accessibility requirement checklist attached to each booking
- business-trip policy/receipt workflow
- trip budget and total landed trip cost
- post-trip Travel Map, memories, reviews and rebooking loop
- loyalty/points-aware comparisons when reliable data access exists

## Verification loop

For every release batch:

1. Re-read the current production architecture and preserve working behavior.
2. Compare the target flow with current leading travel products and current provider capabilities.
3. Implement a coherent batch, not disconnected decorative features.
4. Run CI and integrity/security checks.
5. Merge only when checks pass.
6. Verify production deployment status.
7. Re-audit the affected user journey for dead zones, mobile regressions, translation spacing and monetization leakage.
8. Record remaining gaps and begin the next batch.
