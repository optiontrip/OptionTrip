import cron from "node-cron";
import app from "./app.js";
import { runScheduledSweep } from "./jobs/scheduledSweep.js";
import { getTravelNewsRunnerStatus, runTravelNewsAutomationWithBudget } from "./jobs/travelNewsRunner.js";
import { primeTravelpayoutsPartnerLinks } from "./services/travelpayoutsPartnerLinks.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Warm real affiliate targets after boot and refresh them periodically. Static
// partner URLs from environment still take priority; this path exists so 12Go,
// Go City and other subscribed Travelpayouts programs can become live without
// manually copying a separate affiliate URL into deployment configuration.
const affiliateWarmupTimer = setTimeout(() => {
  primeTravelpayoutsPartnerLinks({ trigger: 'startup' })
    .catch(err => console.error('Travelpayouts partner-link warmup failed:', err.message));
}, 2500);
affiliateWarmupTimer.unref?.();

cron.schedule('17 */6 * * *', () => {
  primeTravelpayoutsPartnerLinks({ trigger: 'scheduled-refresh', force: true })
    .catch(err => console.error('Travelpayouts partner-link refresh failed:', err.message));
}, { timezone: 'UTC' });
console.log('🔗 Travelpayouts partner-link refresh scheduled every 6 hours');

if (process.env.ENABLE_IN_PROCESS_CRON !== 'false') {
  cron.schedule('*/20 * * * *', () => {
    runScheduledSweep().catch(err => console.error('In-process sweep failed:', err.message));
  });
  console.log('🕐 In-process sweep scheduled every 20 minutes');
}

const newsStatus = getTravelNewsRunnerStatus();
if (newsStatus.enabled) {
  // Check several times per day so timely travel developments do not wait until
  // the next calendar day. The runner still enforces the rolling publication budget.
  const newsSchedule = process.env.NEWS_CRON_SCHEDULE || '15 */4 * * *';
  const newsTimezone = process.env.NEWS_CRON_TIMEZONE || 'UTC';
  // A healthy deploy should check the news feed quickly. Ten seconds leaves the
  // HTTP server and database time to settle while avoiding a long stale window.
  // Production can still override this with NEWS_STARTUP_DELAY_MS when needed.
  const configuredDelay = Number(process.env.NEWS_STARTUP_DELAY_MS || 10000);
  const startupDelayMs = Number.isFinite(configuredDelay)
    ? Math.max(5000, Math.min(configuredDelay, 5 * 60 * 1000))
    : 10000;

  cron.schedule(newsSchedule, () => {
    runTravelNewsAutomationWithBudget({ trigger: 'cron' })
      .catch(err => console.error('Travel news automation failed:', err.message));
  }, { timezone: newsTimezone });

  // A deploy or server restart should not make the feed wait for the next cron.
  // The runner enforces the rolling 24-hour publication budget.
  const startupTimer = setTimeout(() => {
    runTravelNewsAutomationWithBudget({ trigger: 'startup' })
      .catch(err => console.error('Travel news startup catch-up failed:', err.message));
  }, startupDelayMs);
  startupTimer.unref?.();

  console.log(
    `📰 Travel news automation scheduled: ${newsSchedule} (${newsTimezone}); ` +
    `startup catch-up in ${startupDelayMs}ms; mode=${newsStatus.mode}`
  );
} else {
  const detail = newsStatus.explicitlyDisabled
    ? 'explicitly disabled by NEWS_AUTOPUBLISH_ENABLED=false'
    : `waiting for configuration: ${newsStatus.missing.join(', ') || 'unknown'}`;
  console.warn(`📰 Travel news automation not scheduled - ${detail}`);
}
