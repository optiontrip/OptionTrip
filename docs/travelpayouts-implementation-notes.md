# Implementation notes

The catalog layer is intentionally provider-agnostic. Provider-specific adapters must preserve the exact upstream contract and normalize only verified fields. Affiliate links must come from configured production values or documented provider link builders, never from guessed URL patterns.
