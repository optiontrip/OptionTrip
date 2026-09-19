import express from 'express';
import { verifyCronSecret } from '../middleware/cronAuth.js';
import { runScheduledSweep } from '../jobs/scheduledSweep.js';
import {
  getTravelNewsRunnerStatus,
  runTravelNewsAutomationWithBudget,
} from '../jobs/travelNewsRunner.js';

const router = express.Router();

router.post('/run-sweep', verifyCronSecret, async (req, res) => {
  try {
    const results = await runScheduledSweep();
    return res.status(200).json({ success: true, data: results });
  } catch (err) {
    console.error('run-sweep error:', err);
    return res.status(500).json({ success: false, message: 'Sweep failed' });
  }
});

router.get('/news-status', verifyCronSecret, (req, res) => {
  return res.status(200).json({
    success: true,
    data: getTravelNewsRunnerStatus(),
  });
});

router.post('/run-news', verifyCronSecret, async (req, res) => {
  try {
    const result = await runTravelNewsAutomationWithBudget({ trigger: 'manual-api' });
    const statusCode = result?.reason === 'missing-configuration' ? 503 : 200;
    return res.status(statusCode).json({ success: statusCode === 200, data: result });
  } catch (err) {
    console.error('run-news error:', err);
    return res.status(500).json({ success: false, message: 'Travel news run failed' });
  }
});

export default router;
