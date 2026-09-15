# Next production code steps

1. Import `maybeExtendViPrompt` into the existing chat service and apply it once, immediately before the current system prompt is returned. Keep the flag off by default.
2. Add CI invocation for `Backend/scripts/checkViWorldGuide.js`.
3. Add automated tests for existing flight/hotel tool triggering and JSON output before enabling the prompt flag.
4. Enable destination-free discovery only after those regressions pass.
5. Implement real provider adapters from verified access/readiness rather than adding more hard-coded service cards.
6. Extend Trip Object persistence for normalized rail/bus/activity/transfer/eSIM/insurance selections.
7. Feed completed Trip Objects into Travel Map/history with explicit privacy controls.
