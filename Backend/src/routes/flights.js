import express from 'express';
import { searchFlights, searchFlightsTravelpayouts, searchFlightsGoogleHandler, getCheapPriceHandler, exploreDestinationsHandler, searchFlightsDuffelHandler, getDestinationImageHandler, getPlaceImageHandler, getPlaceImagesBatchHandler, getCacheStatsHandler, clearPlaceImageCacheHandler, getNearbyAirportsHandler, getMonthlyPricesHandler } from '../controllers/flightController.js';
import { getLocations } from '../controllers/locationController.js';
import { getCheapRoutesByMonth } from '../controllers/cheapFlightExplorerController.js';
import { validateFlightSearch, validateTPFlightSearch } from '../middleware/validation.js';

const router = express.Router();

router.get('/airports', getLocations);
router.get('/nearby-airports', getNearbyAirportsHandler);
router.get('/cheap-price', getCheapPriceHandler);
router.get('/monthly-prices', getMonthlyPricesHandler);
router.get('/cheap-routes', getCheapRoutesByMonth);
router.get('/explore', exploreDestinationsHandler);
router.get('/destination-image', getDestinationImageHandler);
router.get('/place-image', getPlaceImageHandler);
router.post('/place-images-batch', getPlaceImagesBatchHandler);
router.get('/cache-stats', getCacheStatsHandler);
router.delete('/cache-clear', clearPlaceImageCacheHandler);
router.get('/duffel-search', searchFlightsDuffelHandler);
router.get('/google-search', searchFlightsGoogleHandler);
router.post('/search', validateFlightSearch, searchFlights);
router.get('/tp-search', validateTPFlightSearch, searchFlightsTravelpayouts);

export default router;