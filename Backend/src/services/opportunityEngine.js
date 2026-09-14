const MIN_CITY_WINDOW_MINUTES = 240;
const DEFAULT_AIRPORT_BUFFER_MINUTES = 150;
const DEFAULT_GROUND_BUFFER_MINUTES = 45;

const toDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const minutesBetween = (start, end) => {
  const a = toDate(start);
  const b = toDate(end);
  if (!a || !b || b <= a) return 0;
  return Math.floor((b.getTime() - a.getTime()) / 60000);
};

const getLocalHour = (date, timezone) => {
  if (!date) return null;
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone || 'UTC',
      hour: '2-digit',
      hour12: false
    }).formatToParts(date);
    return Number(parts.find((part) => part.type === 'hour')?.value);
  } catch {
    return date.getUTCHours();
  }
};

const inferDaypart = (date, timezone) => {
  const hour = getLocalHour(date, timezone);
  if (hour === null || Number.isNaN(hour)) return 'unknown';
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'day';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
};

const normalizeEvent = (event = {}) => ({
  id: event.id || event._id || null,
  type: event.type || 'activity',
  title: event.title || event.name || event.type || 'Trip event',
  start: toDate(event.start || event.departure || event.checkIn || event.time),
  end: toDate(event.end || event.arrival || event.checkOut),
  location: event.location || event.airport || event.address || null,
  coordinates: event.coordinates || event.location?.coordinates || null,
  metadata: event.metadata || {}
});

const calculateUsableMinutes = ({ rawMinutes, beforeEventType, afterEventType }) => {
  const airportRelated = ['flight', 'airport', 'layover'].includes(beforeEventType)
    || ['flight', 'airport', 'layover'].includes(afterEventType);
  const buffer = airportRelated ? DEFAULT_AIRPORT_BUFFER_MINUTES : DEFAULT_GROUND_BUFFER_MINUTES;
  return Math.max(0, rawMinutes - buffer);
};

const scoreOpportunityType = ({ type, usableMinutes, daypart, traveler = {} }) => {
  const interests = new Set(traveler.interests || []);
  let score = 50;

  if (type === 'airport_lounge' && usableMinutes >= 90) score += 18;
  if (type === 'airport_hotel' && usableMinutes >= 300) score += 20;
  if (type === 'city_break' && usableMinutes >= MIN_CITY_WINDOW_MINUTES) score += 25;
  if (type === 'spa_wellness' && usableMinutes >= 120) score += 16;
  if (type === 'dining' && usableMinutes >= 90) score += 12;
  if (type === 'museum' && usableMinutes >= 150 && daypart !== 'night') score += 14;
  if (type === 'nightlife' && ['evening', 'night'].includes(daypart)) score += 14;
  if (type === 'shopping' && usableMinutes >= 120 && daypart !== 'night') score += 8;

  if (interests.has('wellness') && type === 'spa_wellness') score += 12;
  if (interests.has('food') && type === 'dining') score += 12;
  if (interests.has('culture') && type === 'museum') score += 12;
  if (interests.has('nightlife') && type === 'nightlife') score += 12;
  if (traveler.budget === 'budget' && ['airport_lounge', 'airport_hotel'].includes(type)) score -= 5;

  return Math.max(0, Math.min(100, score));
};

const buildOpportunityTypes = ({ usableMinutes, daypart, traveler }) => {
  const candidates = [
    { type: 'dining', minMinutes: 75 },
    { type: 'airport_lounge', minMinutes: 90 },
    { type: 'spa_wellness', minMinutes: 120 },
    { type: 'shopping', minMinutes: 120, blockedDayparts: ['night'] },
    { type: 'museum', minMinutes: 150, blockedDayparts: ['night'] },
    { type: 'city_break', minMinutes: MIN_CITY_WINDOW_MINUTES },
    { type: 'airport_hotel', minMinutes: 300 },
    { type: 'nightlife', minMinutes: 150, allowedDayparts: ['evening', 'night'] }
  ];

  return candidates
    .filter((candidate) => usableMinutes >= candidate.minMinutes)
    .filter((candidate) => !candidate.blockedDayparts?.includes(daypart))
    .filter((candidate) => !candidate.allowedDayparts || candidate.allowedDayparts.includes(daypart))
    .map((candidate) => ({
      type: candidate.type,
      score: scoreOpportunityType({ type: candidate.type, usableMinutes, daypart, traveler })
    }))
    .sort((a, b) => b.score - a.score);
};

const buildEligibilityRequirements = ({ beforeEvent, afterEvent, usableMinutes }) => {
  const requiresEntryCheck = ['flight', 'airport', 'layover'].includes(beforeEvent.type)
    || ['flight', 'airport', 'layover'].includes(afterEvent.type);

  return {
    requiresEntryCheck,
    requiresPassportOrVisaValidation: requiresEntryCheck,
    requiresLiveTransportCheck: usableMinutes >= MIN_CITY_WINDOW_MINUTES,
    requiresOpeningHoursCheck: true,
    requiresSafetyCheck: true,
    requiresReturnBufferValidation: requiresEntryCheck
  };
};

export const detectFreeTimeWindows = ({ events = [], timezone = 'UTC', traveler = {} } = {}) => {
  const normalized = events
    .map(normalizeEvent)
    .filter((event) => event.start)
    .sort((a, b) => a.start - b.start);

  const windows = [];

  for (let index = 0; index < normalized.length - 1; index += 1) {
    const beforeEvent = normalized[index];
    const afterEvent = normalized[index + 1];
    const start = beforeEvent.end || beforeEvent.start;
    const end = afterEvent.start;
    const rawMinutes = minutesBetween(start, end);
    if (rawMinutes < 60) continue;

    const usableMinutes = calculateUsableMinutes({
      rawMinutes,
      beforeEventType: beforeEvent.type,
      afterEventType: afterEvent.type
    });
    if (usableMinutes < 45) continue;

    const daypart = inferDaypart(start, timezone);
    const opportunityTypes = buildOpportunityTypes({ usableMinutes, daypart, traveler });

    windows.push({
      id: `${beforeEvent.id || index}-${afterEvent.id || index + 1}`,
      start,
      end,
      rawMinutes,
      usableMinutes,
      daypart,
      location: beforeEvent.location || afterEvent.location || null,
      coordinates: beforeEvent.coordinates || afterEvent.coordinates || null,
      beforeEvent: { id: beforeEvent.id, type: beforeEvent.type, title: beforeEvent.title },
      afterEvent: { id: afterEvent.id, type: afterEvent.type, title: afterEvent.title },
      opportunityTypes,
      eligibility: buildEligibilityRequirements({ beforeEvent, afterEvent, usableMinutes })
    });
  }

  return windows;
};

export const buildOpportunityContext = ({ trip, events = [], traveler = {}, timezone = 'UTC' } = {}) => ({
  tripId: trip?.trip_id || trip?._id || null,
  destination: trip?.destination || null,
  budget: traveler.budget || trip?.budget || null,
  traveler,
  windows: detectFreeTimeWindows({ events, timezone, traveler })
});

export default {
  detectFreeTimeWindows,
  buildOpportunityContext
};
