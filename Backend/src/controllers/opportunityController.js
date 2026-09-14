import Trip from '../models/Trip.js';
import { buildOpportunityContext } from '../services/opportunityEngine.js';
import { buildFlightTimelineEvents } from '../services/flightTimeline.js';
import { applyOpportunityValidation } from '../services/opportunityValidation.js';
import { enrichOpportunityLiveContext } from '../services/opportunityLiveContext.js';
import { enrichOpportunityNearbyPlaces } from '../services/opportunityNearbyPlaces.js';
import { enrichOpportunityTransportContext } from '../services/opportunityTransportContext.js';

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
    const validatedContext = applyOpportunityValidation(transportContext, validation);

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
        note: 'Only opportunities with all required live checks passed should be displayed as actionable recommendations. Live route timing can satisfy transport checks and fresh Google Places hours can satisfy near-term opening-hours checks; future opening hours, entry and safety remain pending until independently validated.'
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default { analyzeTripOpportunities };
