import { searchCheapestRoutePairsForMonth, searchCheapestRoutesForMonth } from '../services/cheapFlightExplorerService.js';

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

const parseCodes = (value) => String(value || '')
  .split(',')
  .map(item => item.trim().toUpperCase())
  .filter(Boolean);

const validateMonthRange = (month, returnMonth) => {
  if (!MONTH_RE.test(String(month || ''))) return 'month must be YYYY-MM';
  if (returnMonth && !MONTH_RE.test(String(returnMonth))) return 'returnMonth must be YYYY-MM when provided';
  if (returnMonth && returnMonth < month) return 'returnMonth cannot be before departure month';
  return '';
};

export const getCheapRoutePairsByMonth = async (req, res) => {
  try {
    const { pairs, month, returnMonth } = req.query;
    const pairList = String(pairs || '')
      .split(',')
      .map(item => item.trim().toUpperCase())
      .filter(Boolean);

    if (!pairList.length) {
      return res.status(400).json({ success: false, message: 'pairs are required as ORG-DST values' });
    }

    const invalidPair = pairList.find(pair => !/^[A-Z]{3}-[A-Z]{3}$/.test(pair));
    if (invalidPair) {
      return res.status(400).json({ success: false, message: `Invalid route pair: ${invalidPair}` });
    }

    const monthError = validateMonthRange(month, returnMonth);
    if (monthError) return res.status(400).json({ success: false, message: monthError });

    const result = await searchCheapestRoutePairsForMonth({
      pairs: pairList,
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
    console.error('❌ Cheap route pair explorer error:', error?.message || error);
    return res.status(502).json({ success: false, message: 'Unable to load monthly route prices right now' });
  }
};

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

    const monthError = validateMonthRange(month, returnMonth);
    if (monthError) return res.status(400).json({ success: false, message: monthError });

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
