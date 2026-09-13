# OptionTrip Automated Travel News

Goal: publish up to five high-value travel news stories per day to the existing OptionTrip WordPress blog without manual editorial work.

Pipeline:

SOURCE -> INGEST -> VERIFY -> DEDUP -> SCORE -> TRAVEL IMPACT -> DRAFT -> FACT CHECK -> AI IMAGE -> SEO -> INTERNAL/COMMERCIAL LINKS -> PUBLISH -> UPDATE/EXPIRE

## Editorial rules

- Publish up to 5 stories per day. Quality beats quota; publish fewer when confidence is low.
- Prioritize stories that materially affect travelers: routes, airports, rail, buses, visas, border rules, strikes, disruptions, hotels, tourism openings/closures, weather/travel safety, cruises, major attractions and destination access.
- Do not copy source articles. Generate an original OptionTrip article from verified facts.
- Require corroboration from multiple independent sources when practical. Official primary sources may satisfy verification on their own when appropriate.
- Reject rumors, low-confidence claims, duplicated stories and purely local stories with weak traveler impact.
- Every article should explain what changed, who is affected, when it applies and what a traveler should do next.
- Add contextual internal booking links only when relevant, such as flights, stays, cars, eSIM, transfers or activities.
- AI images must be original, travel-relevant and branded for OptionTrip. OptionTrip.com should be visible in the creative or applied as a deterministic watermark before publication.
- Do not use third-party copyrighted images as generated substitutes.
- Add SEO title, excerpt, slug, alt text and structured-data-compatible metadata.

## Safety gates

Autopublishing must remain disabled until all of the following are configured and tested:

- WordPress application credentials stored only as production secrets.
- OpenAI API key stored only as a production secret.
- Source ingestion and verification are returning current items.
- Duplicate protection is confirmed against existing WordPress posts.
- Image upload and featured-image assignment are confirmed.
- A dry-run produces acceptable drafts and links.

Suggested runtime flags:

- `NEWS_AUTOPUBLISH_ENABLED=false` by default
- `NEWS_DAILY_LIMIT=5`
- `WORDPRESS_API_BASE=https://blog.optiontrip.com/wp-json/wp/v2`
- `WORDPRESS_USERNAME`
- `WORDPRESS_APP_PASSWORD`
- `OPENAI_API_KEY`
- `OPENAI_NEWS_MODEL`
- `OPENAI_IMAGE_MODEL`

## Revenue linkage

Articles should route relevant user intent into OptionTrip rather than acting as an isolated news blog. Examples:

- New airline route -> `/flights`
- Hotel/resort opening -> `/hotels`
- Destination access/visa change -> Vi trip planning entry point
- Airport arrival story -> transfer/eSIM upsell when those verticals are live
- Rail/bus story -> ground transport booking when provider integration is live

Affiliate links must preserve approved Travelpayouts attribution and SubIDs. Do not install or activate Travelpayouts Drive until Travelpayouts Support confirms the current project URL is `https://optiontrip.com`.
