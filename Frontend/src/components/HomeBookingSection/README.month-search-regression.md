# Homepage flight date search regression contract

The homepage flight search must not use the browser-native `input[type=date]` as its only flight date control.

Required behavior:

- Reuse `TripDatePicker` so the homepage and `/flights` share Specific dates, Flexible dates, and Whole month.
- Whole month is a first-class search mode and must not manufacture a day.
- One-way month search passes `month=YYYY-MM` to `/flights/cheap`.
- Round-trip month search passes both `month` and `returnMonth`.
- Country selections expand to their supported airport codes for monthly price comparison.
- Exact-date searches continue to route to `/flights` with the existing state payload.
- The selectable horizon remains approximately one year.
- No fare may be invented when provider data is missing.
