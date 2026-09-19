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

# A provider returning one fare must never stop the entire search. Both the
# public results page and Planned Trip query available providers as one batch
# and choose the richest usable result set.
grep -q 'pickRichestProvider' "$SEARCH" || fail 'main flight results lost richest-provider selection'
grep -q 'Promise.all' "$SEARCH" || fail 'main flight results no longer query providers as one search batch'
grep -q 'limit: 50' "$SEARCH" || fail 'Travelpayouts result request was reduced below the rich search target'
if perl -0ne 'exit 0 if /if\s*\(duffelResult\?\.flights\?\.length[^)]*\)\s*\{[^}]*return;/s; exit 1' "$SEARCH"; then
  fail 'Duffel can again short-circuit the main flight search after one result'
fi

grep -q 'FlightSearchForm' "$PLANNED" || fail 'Planned Trip flights no longer reuse shared flight search'
grep -q 'pickRichestProvider' "$PLANNED" || fail 'Planned Trip lost richest-provider selection'
grep -q 'Promise.all' "$PLANNED" || fail 'Planned Trip no longer queries flight providers as one search batch'
grep -q 'limit: 50' "$PLANNED" || fail 'Planned Trip Travelpayouts request was reduced below the rich search target'
if perl -0ne 'exit 0 if /if\s*\(duffelResult\?\.flights\?\.length[^)]*\)\s*\{[^}]*return;/s; exit 1' "$PLANNED"; then
  fail 'Duffel can again short-circuit Planned Trip after one result'
fi

grep -q "export { default } from './PlannedTripFlightTabModern'" "$LEGACY" || fail 'legacy Planned Trip date-only flight form returned'

grep -q "searchMode: 'month'" "$PICKER" || fail 'shared date picker no longer emits month searches'
grep -q 'yyyy-MM' "$PICKER" || fail 'shared date picker no longer preserves month-only values'
grep -q 'monthSummaries' "$PICKER" || fail 'whole-month picker lost month-level fare summaries'
grep -q 'cheapestMonthKey' "$PICKER" || fail 'whole-month picker lost cheapest-month highlighting'
grep -q 'fetchMonthlyPrices' "$PICKER" || fail 'whole-month picker no longer uses real monthly fare data'
grep -q 'PriceCalendar' "$PICKER" || fail 'whole-month picker lost daily price drill-down'
grep -q 'Search the whole' "$PICKER" || fail 'whole-month picker no longer offers month-only search from the daily-price view'
grep -q "mode === 'single' && flexView === 'calendar'" "$PICKER" || fail 'one-way Whole Month no longer opens the daily price calendar before forcing a date'
if grep -q '>Flexible dates<' "$PICKER"; then
  fail 'duplicate Flexible dates tab returned instead of the unified Whole Month flow'
fi
grep -q "window.addEventListener('scroll'" "$PICKER" || fail 'date picker no longer repositions during scrolling'
grep -q 'visualViewport' "$PICKER" || fail 'date picker lost viewport-aware positioning'

grep -q 'TravelDateBoundary' "$APP" || fail 'global native travel date boundary is missing'
grep -q 'input\[type="date"\]' "$APP" || fail 'global date boundary no longer targets native date inputs'
grep -q 'getDate() + 365' "$APP" || fail 'global native date limit is no longer 365 days'

if grep -q 'type="date"' "$FORM"; then
  fail 'native date-only input returned to main FlightSearchForm'
fi
if grep -q 'type="date"' "$PLANNED"; then
  fail 'native date-only input returned to Planned Trip flight search'
fi

echo 'Flight Whole Month pricing, daily price drill-down, viewport positioning, location metadata, provider richness, and 365-day date guards passed.'
