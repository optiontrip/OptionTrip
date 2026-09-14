import Trip from '../models/Trip.js';
import { buildOpportunityContext } from '../services/opportunityEngine.js';
import { buildFlightTimelineEvents } from '../services/flightTimeline.js';

export const analyzeTripOpportunities = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { events = [], traveler = {}, timezone = 'UTC' } = req.body || {};

    const trip = await Trip.findOne({
      trip_id: tripId,
      user_id: req.user?._id?.toString(),
      deleted: { $ne: true }
    }).lean();

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    const flightEvents = buildFlightTimelineEvents(trip.selectedFlight || {});
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

    return res.json({
      success: true,
      data: context,
      meta: {
        generatedAt: new Date().toISOString(),
        derivedFlightEvents: flightEvents.length,
        requiresLiveValidation: true,
        note: 'Suggestions must be validated against current entry rules, opening hours, transport, safety, availability and return-time buffers before display as actionable recommendations.'
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default { analyzeTripOpportunities };
