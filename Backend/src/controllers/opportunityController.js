import Trip from '../models/Trip.js';
import { buildOpportunityContext } from '../services/opportunityEngine.js';
import { buildFlightTimelineEvents } from '../services/flightTimeline.js';
import { applyOpportunityValidation } from '../services/opportunityValidation.js';
import { enrichOpportunityLiveContext } from '../services/opportunityLiveContext.js';
import { enrichOpportunityNearbyPlaces } from '../services/opportunityNearbyPlaces.js';

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

    const validatedContext = applyOpportunityValidation(context, validation);
    const liveContext = await enrichOpportunityLiveContext(validatedContext);
    const enrichedContext = await enrichOpportunityNearbyPlaces(liveContext);

    return res.json({
      success: true,
      data: enrichedContext,
      meta: {
        generatedAt: new Date().toISOString(),
        derivedFlightEvents: flightEvents.length,
        flightSource: flight ? 'request' : (trip.selectedFlight ? 'savedTrip' : 'none'),
        requiresLiveValidation: enrichedContext.validationSummary.pendingWindows > 0,
        liveContext: enrichedContext.liveContextSummary,
        nearbyPlaces: enrichedContext.nearbyPlacesSummary,
        note: 'Only opportunities with all required live checks passed should be displayed as actionable recommendations. Weather and nearby-place data are live enrichment and do not replace entry, safety, transport, opening-hours or return-buffer validation.'
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default { analyzeTripOpportunities };
