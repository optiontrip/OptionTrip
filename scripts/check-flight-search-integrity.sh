#!/usr/bin/env bash
set -euo pipefail

FORM='Frontend/src/components/FlightSearchForm/FlightSearchForm.jsx'
HOME='Frontend/src/components/HomeBookingSection/HomeBookingSection.jsx'
SEARCH='Frontend/src/pages/FlightSearch.jsx'
PLANNED='Frontend/src/pages/PlannedTripPage/sections/PlannedTripFlightTabModern.jsx'
LEGACY='Frontend/src/pages/PlannedTripPage/sections/FlightTab.jsx'
PICKER='Frontend/src/components/TripDatePicker/TripDatePicker.jsx'
APP='Frontend/src/App.jsx'

fail() {
  echo "Flight search regression guard failed: $1"
  exit 1
}

for file in "$FORM" "$HOME" "$SEARCH" "$PLANNED" "$LEGACY" "$PICKER" "$APP"; do
  test -s "$file" || fail "missing required file $file"
done

grep -q 'Whole month' "$FORM" || fail 'main flight form no longer exposes Whole month'
grep -q "dateSearchMode === 'month'" "$FORM" || fail 'main flight form no longer validates month mode'
grep -q 'travelMonth' "$FORM" || fail 'main flight form lost whole-month state'
grep -q '/flights/cheap' "$FORM" || fail 'whole-month search no longer routes to monthly fare explorer'

grep -q 'Whole month' "$HOME" || fail 'homepage flight search no longer exposes Whole month'
grep -q 'fSearchMode' "$HOME" || fail 'homepage flight search lost month/exact mode state'
grep -q '/flights/cheap' "$HOME" || fail 'homepage whole-month search no longer routes to monthly fare explorer'
grep -q 'cityAirports' "$HOME" || fail 'homepage no longer preserves airport groups for city results'
grep -q 'nearest-airport' "$HOME" || fail 'homepage no longer preserves nearest-airport results'
grep -q 'requestedPlace' "$HOME" || fail 'homepage lost nearest-airport place context'
grep -q 'getDate() + 365' "$HOME" || fail 'homepage native date fields are not capped to 365 days'

# A provider returning one fare must never stop the entire search. The main
# results page queries all available providers and chooses the richest usable
# result set so a single Duffel offer cannot hide dozens of other fares.
grep -q 'pickRichestProvider' "$SEARCH" || fail 'main flight results lost richest-provider selection'
grep -q 'Promise.all' "$SEARCH" || fail 'main flight results no longer query providers as one search batch'
grep -q 'limit: 50' "$SEARCH" || fail 'Travelpayouts result request was reduced below the rich search target'
if perl -0ne 'exit 0 if /if\s*\(duffelResult\?\.flights\?\.length[^)]*\)\s*\{[^}]*return;/s; exit 1' "$SEARCH"; then
  fail 'Duffel can again short-circuit the main flight search after one result'
fi

grep -q 'FlightSearchForm' "$PLANNED" || fail 'Planned Trip flights no longer reuse shared flight search'
grep -q "export { default } from './PlannedTripFlightTabModern'" "$LEGACY" || fail 'legacy Planned Trip date-only flight form returned'

grep -q "searchMode: 'month'" "$PICKER" || fail 'shared date picker no longer emits month searches'
grep -q 'yyyy-MM' "$PICKER" || fail 'shared date picker no longer preserves month-only values'

grep -q 'TravelDateBoundary' "$APP" || fail 'global native travel date boundary is missing'
grep -q 'input\[type="date"\]' "$APP" || fail 'global date boundary no longer targets native date inputs'
grep -q 'getDate() + 365' "$APP" || fail 'global native date limit is no longer 365 days'

if grep -q 'type="date"' "$FORM"; then
  fail 'native date-only input returned to main FlightSearchForm'
fi
if grep -q 'type="date"' "$PLANNED"; then
  fail 'native date-only input returned to Planned Trip flight search'
fi

echo 'Flight whole-month, location metadata, provider richness, and 365-day date guards passed.'
