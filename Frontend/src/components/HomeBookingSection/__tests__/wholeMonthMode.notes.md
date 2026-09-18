# Homepage Whole Month regression contract

This file documents the user-visible acceptance path that must stay working:

1. Open the homepage Flights tab on a narrow mobile viewport.
2. Choose `Whole month` before opening the date picker.
3. The date trigger must switch to travel-month wording.
4. Opening the picker must land directly in the whole-month month grid, not the specific-day calendar.
5. Selecting a month must set `searchMode=month` and must not create a fake day value.
6. One-way searches may submit after choosing one month.
7. Round-trip searches require departure and return months.
8. `Anywhere` + `Whole month` must route into the cheap-flight discovery flow.
9. Switching back to `Specific dates` clears stale month values.
10. Existing autocomplete, 12-month horizon, flexible daily-price mode and mobile swap behavior must remain intact.
