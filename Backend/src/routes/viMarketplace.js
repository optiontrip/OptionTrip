import express from 'express';
import { buildMarketplaceSuggestion } from '../services/viMarketplaceRouter.js';

const router = express.Router();

router.post('/route', (req, res) => {
  const message = String(req.body?.message || '').trim();
  if (!message) return res.status(400).json({ success: false, error: 'message_required' });
  const suggestion = buildMarketplaceSuggestion(message);
  return res.json({ success: true, matched: Boolean(suggestion), suggestion });
});

export default router;
