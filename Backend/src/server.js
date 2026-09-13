import cron from "node-cron";
import app from "./app.js";
import { runScheduledSweep } from "./jobs/scheduledSweep.js";
import { runTravelNewsAutomation } from "./jobs/travelNewsAutomation.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

if (process.env.ENABLE_IN_PROCESS_CRON !== 'false') {
  cron.schedule('*/20 * * * *', () => {
    runScheduledSweep().catch(err => console.error('In-process sweep failed:', err.message));
  });
  console.log('🕐 In-process sweep scheduled every 20 minutes');
}

if (process.env.NEWS_AUTOPUBLISH_ENABLED === 'true') {
  const newsSchedule = process.env.NEWS_CRON_SCHEDULE || '15 12 * * *';
  cron.schedule(newsSchedule, () => {
    runTravelNewsAutomation().catch(err => console.error('Travel news automation failed:', err.message));
  }, { timezone: process.env.NEWS_CRON_TIMEZONE || 'UTC' });
  console.log(`📰 Travel news automation scheduled: ${newsSchedule} (${process.env.NEWS_CRON_TIMEZONE || 'UTC'})`);
}
