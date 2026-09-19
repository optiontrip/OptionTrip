import cron from "node-cron";
import app from "./app.js";
import { runScheduledSweep } from "./jobs/scheduledSweep.js";
import { runTravelNewsAutomationWithBudget } from "./jobs/travelNewsRunner.js";
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

if (process.env.NEWS_AUTOPUBLISH_ENABLED === 'true') {
  const newsSchedule = process.env.NEWS_CRON_SCHEDULE || '15 12 * * *';
  const newsTimezone = process.env.NEWS_CRON_TIMEZONE || 'UTC';
  const configuredDelay = Number(process.env.NEWS_STARTUP_DELAY_MS || 45000);
  const startupDelayMs = Number.isFinite(configuredDelay)
    ? Math.max(5000, Math.min(configuredDelay, 5 * 60 * 1000))
    : 45000;

  cron.schedule(newsSchedule, () => {
    runTravelNewsAutomationWithBudget({ trigger: 'cron' })
      .catch(err => console.error('Travel news automation failed:', err.message));
  }, { timezone: newsTimezone });

  // A deploy or server restart should not make the feed wait until tomorrow's
  // cron. The runner enforces the rolling 24-hour publication budget, so this
  // catch-up is safe even when a scheduled run already published today.
  const startupTimer = setTimeout(() => {
    runTravelNewsAutomationWithBudget({ trigger: 'startup' })
      .catch(err => console.error('Travel news startup catch-up failed:', err.message));
  }, startupDelayMs);
  startupTimer.unref?.();

  console.log(`📰 Travel news automation scheduled: ${newsSchedule} (${newsTimezone}); startup catch-up in ${startupDelayMs}ms`);
}
