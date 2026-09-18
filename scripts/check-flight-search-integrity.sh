#!/usr/bin/env bash
set -euo pipefail

FORM='Frontend/src/components/FlightSearchForm/FlightSearchForm.jsx'
HOME='Frontend/src/components/HomeBookingSection/HomeBookingSection.jsx'
PLANNED='Frontend/src/pages/PlannedTripPage/sections/PlannedTripFlightTabModern.jsx'
LEGACY='Frontend/src/pages/PlannedTripPage/sections/FlightTab.jsx'
PICKER='Frontend/src/components/TripDatePicker/TripDatePicker.jsx'

fail() {
  echo "Flight whole-month regression guard failed: $1"
  exit 1
}

for file in "$FORM" "$HOME" "$PLANNED" "$LEGACY" "$PICKER"; do
  test -s "$file" || fail "missing required file $file"
done

grep -q 'Whole month' "$FORM" || fail 'main flight form no longer exposes Whole month'
grep -q "dateSearchMode === 'month'" "$FORM" || fail 'main flight form no longer validates month mode'
grep -q 'travelMonth' "$FORM" || fail 'main flight form lost whole-month state'
grep -q '/flights/cheap' "$FORM" || fail 'whole-month search no longer routes to monthly fare explorer'

grep -q 'Whole month' "$HOME" || fail 'homepage flight search no longer exposes Whole month'
grep -q 'fSearchMode' "$HOME" || fail 'homepage flight search lost month/exact mode state'
grep -q '/flights/cheap' "$HOME" || fail 'homepage whole-month search no longer routes to monthly fare explorer'

grep -q 'FlightSearchForm' "$PLANNED" || fail 'Planned Trip flights no longer reuse shared flight search'
grep -q "export { default } from './PlannedTripFlightTabModern'" "$LEGACY" || fail 'legacy Planned Trip date-only flight form returned'

grep -q "searchMode: 'month'" "$PICKER" || fail 'shared date picker no longer emits month searches'
grep -q 'yyyy-MM' "$PICKER" || fail 'shared date picker no longer preserves month-only values'

if grep -q 'type="date"' "$FORM"; then
  fail 'native date-only input returned to main FlightSearchForm'
fi
if grep -q 'type="date"' "$PLANNED"; then
  fail 'native date-only input returned to Planned Trip flight search'
fi

echo 'Flight whole-month regression guard passed.'
