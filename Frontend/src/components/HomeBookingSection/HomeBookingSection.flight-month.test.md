# Acceptance cases

1. Mobile homepage -> Flights -> date control shows `Specific dates`, `Whole month`, and `Flexible dates`.
2. One way -> Whole month -> October 2026 -> selected value displays `Oct 2026` and search routes to `/flights/cheap` with `month=2026-10`.
3. Round trip -> Whole month -> October 2026 then November 2026 -> both months persist and search includes `returnMonth=2026-11`.
4. Country origin/destination -> monthly search expands canonical supported airport codes rather than treating the two-letter country code as an airport.
5. Specific date mode still opens OptionTrip's shared date picker and exact search still routes to `/flights`.
6. Search cannot proceed with missing origin, destination, or required date/month selection.
7. No native Android date dialog is the only flight date-selection path on the homepage.
