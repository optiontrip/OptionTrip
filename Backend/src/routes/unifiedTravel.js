import express from 'express';
import { unifiedTravelSearch } from '../controllers/unifiedTravelController.js';

const router = express.Router();
router.post('/:vertical/search', unifiedTravelSearch);
router.get('/:vertical/search', unifiedTravelSearch);

export default router;
