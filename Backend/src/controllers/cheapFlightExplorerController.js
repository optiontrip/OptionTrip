import { searchCheapestRoutesForMonth } from '../services/cheapFlightExplorerService.js';

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

const parseCodes = (value) => String(value || '')
  .split(',')
  .map(item => item.trim().toUpperCase())
  .filter(Boolean);

export const getCheapRoutesByMonth = async (req, res) => {
  try {
    const { origins, destinations, month, returnMonth } = req.query;
    const originAirports = parseCodes(origins);
    const destinationAirports = parseCodes(destinations);

    if (!originAirports.length || !destinationAirports.length) {
      return res.status(400).json({
        success: false,
        message: 'origins and destinations are required as comma-separated IATA codes',
      });
    }

    if (!originAirports.every(code => /^[A-Z]{3}$/.test(code)) || !destinationAirports.every(code => /^[A-Z]{3}$/.test(code))) {
      return res.status(400).json({ success: false, message: 'All origin/destination codes must be 3-letter IATA codes' });
    }

    if (!MONTH_RE.test(String(month || ''))) {
      return res.status(400).json({ success: false, message: 'month must be YYYY-MM' });
    }

    if (returnMonth && !MONTH_RE.test(String(returnMonth))) {
      return res.status(400).json({ success: false, message: 'returnMonth must be YYYY-MM when provided' });
    }

    if (returnMonth && returnMonth < month) {
      return res.status(400).json({ success: false, message: 'returnMonth cannot be before departure month' });
    }

    const result = await searchCheapestRoutesForMonth({
      originAirports,
      destinationAirports,
      month,
      returnMonth: returnMonth || null,
    });

    return res.json({
      success: true,
      data: {
        ...result,
        month,
        returnMonth: returnMonth || null,
        count: result.routes.length,
        fareType: 'discovery',
        requiresLiveRecheck: true,
      },
    });
  } catch (error) {
    console.error('❌ Cheap route explorer error:', error?.message || error);
    return res.status(502).json({ success: false, message: 'Unable to load monthly route prices right now' });
  }
};
