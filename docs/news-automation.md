# OptionTrip Automated Travel News

Goal: publish up to five high-value travel news stories per rolling 24 hours to the existing OptionTrip WordPress blog without manual editorial work.

Pipeline:

SOURCE -> INGEST -> VERIFY -> DEDUP -> SCORE -> TRAVEL IMPACT -> DRAFT -> FACT CHECK -> AI IMAGE -> SEO -> INTERNAL/COMMERCIAL LINKS -> PUBLISH -> UPDATE/EXPIRE

## Editorial rules

- Publish up to 5 stories per rolling 24 hours. Quality beats quota; publish fewer when confidence is low.
- Prioritize stories that materially affect travelers: routes, airports, rail, buses, visas, border rules, strikes, disruptions, hotels, tourism openings/closures, weather/travel safety, cruises, major attractions and destination access.
- Do not copy source articles. Generate an original OptionTrip article from verified facts.
- Require corroboration from multiple independent sources when practical. Official primary sources may satisfy verification on their own when appropriate.
- Reject rumors, low-confidence claims, duplicated stories and purely local stories with weak traveler impact.
- Every article should explain what changed, who is affected, when it applies and what a traveler should do next.
- Add contextual internal booking links only when relevant, such as flights, stays, cars, eSIM, transfers or activities.
- AI images must be original, travel-relevant and branded for OptionTrip. OptionTrip.com should be visible in the creative or applied as a deterministic watermark before publication.
- Do not use third-party copyrighted images as generated substitutes.
- Add SEO title, excerpt, slug, alt text and structured-data-compatible metadata.

## Production activation

The news runner now operates in automatic mode when the required production credentials are present. `NEWS_AUTOPUBLISH_ENABLED=false` remains an emergency kill switch.

Required production configuration:

- `WORDPRESS_USERNAME`
- `WORDPRESS_APP_PASSWORD`
- `OPENAI_API_KEY`
- `WORDPRESS_API_BASE=https://blog.optiontrip.com/wp-json/wp/v2` (optional override)
- `NEWS_DAILY_LIMIT=5` (optional, hard-capped at 5)
- `NEWS_CRON_SCHEDULE=15 */4 * * *` (optional; default checks every 4 hours)
- `NEWS_CRON_TIMEZONE=UTC` (optional)
- `NEWS_STARTUP_DELAY_MS=45000` (optional)
- `OPENAI_NEWS_MODEL` (optional)
- `OPENAI_IMAGE_MODEL` (optional)

If any required credential is missing, the runner does not publish and reports the missing configuration through `/api/health` and the protected internal news-status endpoint.

The server performs a catch-up run shortly after startup, then checks for fresh stories throughout the day. The rolling publication budget prevents more than five automated posts in 24 hours.

Protected operational endpoints under `/api/internal/cron`:

- `GET /news-status` - current readiness and last-run status
- `POST /run-news` - manually trigger the budget-protected automation

Both require the existing cron secret middleware.

## Revenue linkage

Articles should route relevant user intent into OptionTrip rather than acting as an isolated news blog. Examples:

- New airline route -> `/flights`
- Hotel/resort opening -> `/hotels`
- Destination access/visa change -> Vi trip planning entry point
- Airport arrival story -> transfer/eSIM upsell when those verticals are live
- Rail/bus story -> ground transport booking when provider integration is live

Affiliate links must preserve approved Travelpayouts attribution and SubIDs. Do not install or activate Travelpayouts Drive until Travelpayouts Support confirms the current project URL is `https://optiontrip.com`.
