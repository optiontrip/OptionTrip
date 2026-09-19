import express from 'express';
import { getPublicTravelInventoryStatus } from '../services/travelInventoryService.js';
import { primeTravelpayoutsPartnerLinks } from '../services/travelpayoutsPartnerLinks.js';
import {
  createRouteAwarePartnerDeepLink,
  isRouteAwareService,
} from '../services/travelPartnerDeepLinkService.js';

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

router.post('/deep-link', async (req, res) => {
  const serviceId = String(req.body?.serviceId || '').trim();
  const originCode = String(req.body?.originCode || '').trim().toUpperCase();
  const destinationCode = String(req.body?.destinationCode || '').trim().toUpperCase();

  if (!isRouteAwareService(serviceId)) {
    return res.status(400).json({
      success: false,
      message: 'This service does not support route-aware partner handoff yet.',
    });
  }
  if (!/^[A-Z]{3}$/.test(originCode) || !/^[A-Z]{3}$/.test(destinationCode) || originCode === destinationCode) {
    return res.status(400).json({
      success: false,
      message: 'Choose two different supported cities or airports.',
    });
  }

  try {
    const result = await createRouteAwarePartnerDeepLink({ serviceId, originCode, destinationCode });
    if (!result) {
      return res.status(503).json({
        success: false,
        message: 'A route-specific booking link is not available right now. Use the live partner comparison instead.',
      });
    }

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.warn(`Route-aware travel partner handoff failed: ${error?.message || error}`);
    return res.status(503).json({
      success: false,
      message: 'Route-specific booking is temporarily unavailable. Use the live partner comparison instead.',
    });
  }
});

export default router;
