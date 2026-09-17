import express from 'express';
import { getMarketplaceCatalog, getMarketplaceVertical } from '../services/marketplaceCatalogService.js';

const router = express.Router();

router.get('/', (req, res) => {
  const services = getMarketplaceCatalog();
  res.json({
    success: true,
    generatedAt: new Date().toISOString(),
    services,
    summary: {
      total: services.length,
      live: services.filter(item => item.live).length,
      searchable: services.filter(item => item.mode === 'search').length,
      widget: services.filter(item => item.mode === 'widget').length,
    },
  });
});

router.get('/:vertical', (req, res) => {
  const service = getMarketplaceVertical(String(req.params.vertical || '').toLowerCase());
  if (!service) return res.status(404).json({ success: false, error: 'unknown_vertical' });
  return res.json({ success: true, service });
});

export default router;
