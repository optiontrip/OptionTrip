import Trip from '../models/Trip.js';
import { buildOpportunityContext } from '../services/opportunityEngine.js';
import { buildFlightTimelineEvents } from '../services/flightTimeline.js';
import { applyOpportunityValidation } from '../services/opportunityValidation.js';
import { enrichOpportunityLiveContext } from '../services/opportunityLiveContext.js';
import { enrichOpportunityNearbyPlaces } from '../services/opportunityNearbyPlaces.js';
import { enrichOpportunityTransportContext } from '../services/opportunityTransportContext.js';
import { enrichOpportunitySafetyContext } from '../services/opportunitySafetyContext.js';

export const analyzeTripOpportunities = async (req, res) => {
  try {
    const { tripId } = req.params;
    const {
      events = [],
      traveler = {},
      timezone = 'UTC',
      flight = null,
      validation = {}
    } = req.body || {};

    const trip = await Trip.findOne({
      trip_id: tripId,
      user_id: req.user?._id?.toString(),
      deleted: { $ne: true }
    }).lean();

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    const flightSource = flight || trip.selectedFlight || {};
    const flightEvents = buildFlightTimelineEvents(flightSource);
    const mergedEvents = [...flightEvents, ...events];

    const context = buildOpportunityContext({
      trip,
      events: mergedEvents,
      traveler: {
        ...traveler,
        budget: traveler.budget || trip.budget || null
      },
      timezone
    });

    const liveContext = await enrichOpportunityLiveContext(context);
    const placesContext = await enrichOpportunityNearbyPlaces(liveContext);
    const transportContext = await enrichOpportunityTransportContext(placesContext);
    const safetyContext = await enrichOpportunitySafetyContext(transportContext);
    const validatedContext = applyOpportunityValidation(safetyContext, validation);

    return res.json({
      success: true,
      data: validatedContext,
      meta: {
        generatedAt: new Date().toISOString(),
        derivedFlightEvents: flightEvents.length,
        flightSource: flight ? 'request' : (trip.selectedFlight ? 'savedTrip' : 'none'),
        requiresLiveValidation: validatedContext.validationSummary.pendingWindows > 0,
        liveContext: validatedContext.liveContextSummary,
        nearbyPlaces: validatedContext.nearbyPlacesSummary,
        transport: validatedContext.transportSummary,
        safety: validatedContext.safetySummary,
        note: 'Only opportunities with all required live checks passed should be displayed as actionable recommendations. Current U.S. Department of State advisories are used as an official safety signal for confirmed U.S. travelers; Level 1 can pass and Level 4 can fail the safety gate, while Levels 2 and 3 remain pending for a more specific review. Entry rules remain independently required.'
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default { analyzeTripOpportunities };
