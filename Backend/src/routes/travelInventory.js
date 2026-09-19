import express from 'express';
import { getPublicTravelInventoryStatus } from '../services/travelInventoryService.js';
import { primeTravelpayoutsPartnerLinks } from '../services/travelpayoutsPartnerLinks.js';

const router = express.Router();
const PARTNER_REFRESH_WAIT_MS = 3500;

const waitForPartnerRefresh = async () => {
  let timer;
  try {
    await Promise.race([
      primeTravelpayoutsPartnerLinks({ trigger: 'inventory-demand' }),
      new Promise(resolve => { timer = setTimeout(resolve, PARTNER_REFRESH_WAIT_MS); }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

router.get('/', async (req, res) => {
  if (String(req.query.refreshPartners || '') === '1') {
    try {
      await waitForPartnerRefresh();
    } catch (error) {
      console.warn(`Travel inventory partner refresh failed: ${error?.message || error}`);
    }
  }

  res.json({
    success: true,
    ...getPublicTravelInventoryStatus(),
  });
});

export default router;
