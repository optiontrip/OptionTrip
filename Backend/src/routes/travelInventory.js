import express from 'express';
import { getPublicTravelInventoryStatus } from '../services/travelInventoryService.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    ...getPublicTravelInventoryStatus(),
  });
});

export default router;
