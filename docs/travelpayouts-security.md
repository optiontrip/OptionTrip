# Travelpayouts secret handling

Production-issued affiliate URLs, private feeds, API keys, and tokens belong in server environment configuration, never repository source. Readiness endpoints may expose missing environment variable names but must never expose their values.
