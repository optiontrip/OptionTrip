import express from 'express';
import {
  generateTripOptions,
  generateItineraryForOption,
  getTripById,
  selectOption,
  saveTrip,
  getMyTrips,
  getUserTrips,
  generateSingleDay,
  getDayItinerary,
  parseTripDescriptionController,
  getMapData,
  getVisitedLocations,
  addVisitedLocation,
  removeVisitedLocation,
  updateTripSelection,
  deleteTrip,
  renameTrip,
  suggestDestinationsController,
  markTripConfirmed,
  shareTrip,
  getSharedTrip,
  startTrip,
  addTripNote
} from '../controllers/tripController.js';
import {
  validateTripGeneration,
  validateTripId,
  validateOptionSelection
} from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';
import { hydrateFlightSelection } from '../middleware/hydrateFlightSelection.js';

const router = express.Router();

router.get('/shared/:shareToken', getSharedTrip);

router.post('/parse-description', parseTripDescriptionController);

router.post('/suggest-destinations', suggestDestinationsController);

router.post('/generate-options', validateTripGeneration, generateTripOptions);

router.get('/my-trips', authenticate, getMyTrips);

router.get('/map-data', authenticate, getMapData);

router.get('/visited-locations', authenticate, getVisitedLocations);
router.post('/visited-locations', authenticate, addVisitedLocation);
router.delete('/visited-locations/:id', authenticate, removeVisitedLocation);

router.get('/user/:userId', getUserTrips);

router.post('/:tripId/options/:optionId/generate-itinerary', validateTripId, generateItineraryForOption);

router.post('/:tripId/options/:optionId/generate-day/:dayNumber', validateTripId, generateSingleDay);

router.get('/:tripId/options/:optionId/day/:dayNumber', validateTripId, getDayItinerary);

router.get('/:tripId', validateTripId, getTripById);

router.patch('/:tripId/select-option', validateTripId, validateOptionSelection, selectOption);

router.post('/:tripId/save', authenticate, validateTripId, saveTrip);

router.patch('/:tripId/selection', authenticate, validateTripId, hydrateFlightSelection, updateTripSelection);

router.delete('/:tripId', authenticate, validateTripId, deleteTrip);

router.patch('/:tripId/rename',   authenticate, validateTripId, renameTrip);
router.patch('/:tripId/confirm',  authenticate, validateTripId, markTripConfirmed);
router.patch('/:tripId/start',    authenticate, validateTripId, startTrip);
router.post('/:tripId/notes',     authenticate, validateTripId, addTripNote);
router.post('/:tripId/share',     authenticate, validateTripId, shareTrip);

export default router;
