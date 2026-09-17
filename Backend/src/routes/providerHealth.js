import express from 'express';
import { getTravelMarketplaceHealth } from '../services/providerOrchestrator.js';

const router = express.Router();

router.get('/', (req, res) => {
  const marketplace = getTravelMarketplaceHealth();
  res.json({
    success: true,
    generatedAt: new Date().toISOString(),
    summary: {
      verticals: marketplace.length,
      operational: marketplace.filter(item => item.operational).length,
      redundant: marketplace.filter(item => item.redundancy > 1).length,
    },
    marketplace,
  });
});

export default router;
