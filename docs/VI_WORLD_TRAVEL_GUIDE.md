# Vi World Travel Guide Product Contract

Vi is the central intelligence layer of OptionTrip and must support the complete traveler lifecycle:

DISCOVER -> PLAN -> COMPARE -> BOOK -> PREPARE -> TRAVEL -> LIVE ASSIST -> REMEMBER -> RETURN.

This contract extends the existing production architecture. It does not replace the current Trip Object, traveler memory, flight/hotel search, provider registry, or existing OptionTrip services.

## 1. Destination-free discovery

Vi must be useful before a traveler knows where to go. It should understand emotional intent and constraints such as warmth, solitude, adventure, surprise, accessibility, family needs, budget, trip length, season, departure point, transport tolerance, dietary needs, and preferred travel style.

A request such as "I am cold and have four days and $500" should become realistic destination or route candidates rather than a generic list of famous places.

## 2. Whole-trip thinking

For every trip Vi should consider relevant capabilities, not only flights and hotels:

- flights and stays
- rail and buses
- rental cars and one-way rentals
- transfers, taxis and local transport
- tours, activities, attractions and guides
- restaurants and food needs
- eSIM/connectivity
- insurance
- visa, entry and document requirements
- weather and safety
- airports, stations, baggage and disruption
- cruises, packages, ferries, lounges, parking, luggage services, events, bikes, RV/camping, ski and other legitimate travel services as providers become available

If OptionTrip cannot commercially provide a service, Vi should still give a useful path using reliable official/open information when available.

## 3. Provider truth

Vi and the UI must never fabricate inventory, prices, schedules, availability, ratings, reviews, provider access, booking status, visa rules or live conditions.

Provider-backed facts must come from an enabled legitimate API, feed, widget or deep-link capability. Recommendations and inference must be distinguishable from verified/live facts.

Travelpayouts and other partner programs should be expanded aggressively when they improve traveler value, while keeping credentials outside the repository and respecting provider terms.

## 4. Traveler-value ranking

Rank primarily for traveler fit and total trip value: intent fit, total cost, travel time, stops, baggage/fare restrictions, cancellation/refundability, location, transfer burden, safety/entry constraints, accessibility and convenience.

Commission must not make an unsuitable option outrank a materially better traveler option. Monetization should happen among genuinely suitable choices.

## 5. Trip continuity

The Trip Object is the continuity backbone. Selected supported services should attach to the trip. Vi should use known trip context rather than repeatedly asking for information already stored.

My Trips and Travel Map must preserve planned and completed travel, subject to privacy controls. Completed trips should improve future recommendations and may feed TripStory/memory features.

## 6. Live trip mode

During travel, Vi should use available context to help with weather, nearby places, local transport, airport/station logistics, opening/status information, itinerary changes and disruptions. When live information is unavailable, Vi must say so rather than guess. Safety and emergency needs take priority over monetization.

## 7. Return loop

OptionTrip must not stop at checkout. After the trip, Vi should help preserve visited places/routes where the traveler permits, collect useful feedback, build memories, and use learned preferences for the next trip.

## 8. Delivery discipline

Ship incrementally through safe branches, CI and production verification. Preserve working architecture. Remove dead or fabricated experiences rather than papering over them. Request owner action only for external login/2FA, provider approval, credential issuance, financial/legal acceptance, or ownership verification.