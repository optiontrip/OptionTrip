import express from 'express';
import { getExecutionReadiness } from '../services/providerExecution.js';

const router = express.Router();
const allowedVerticals = new Set(['flights','hotels','cars','rail','bus','ferries','transfers','activities','esim','insurance','luggage_storage','flight_compensation']);

router.get('/:vertical', (req, res) => {
  const { vertical } = req.params;
  if (!allowedVerticals.has(vertical)) {
    return res.status(400).json({ success: false, error: 'unsupported_vertical' });
  }

  const providers = getExecutionReadiness(vertical);
  return res.json({
    success: true,
    vertical,
    executableProviders: providers.filter(item => item.executable).map(item => item.provider),
    providers,
  });
});

export default router;
