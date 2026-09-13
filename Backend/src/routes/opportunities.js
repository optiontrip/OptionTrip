import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { analyzeTripOpportunities } from '../controllers/opportunityController.js';

const router = express.Router();

router.post('/:tripId/analyze', authenticate, analyzeTripOpportunities);

export default router;
