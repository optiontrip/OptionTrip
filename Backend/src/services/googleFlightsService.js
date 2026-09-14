import { combineFlightSegments, normalizeGoogleSegments } from './flightSegmentNormalizer.js';

const RAPIDAPI_KEY  = process.env.RAPIDAPI_KEY  || '';
const RAPIDAPI_HOST = 'google-flights2.p.rapidapi.com';
const TP_MARKER     = process.env.TRAVELPAYOUTS_MARKER || '370056';

const buildBookingUrl = ({ origin, destination, departureDate, returnDate, adults }) => {
  const fmt = (d) => { const [, mm, dd] = d.split('-'); return `${dd}${mm}`; };
  const pax = String(Math.max(1, adults || 1));
  const returnPart = returnDate ? fmt(returnDate) : '';
  return `https://www.aviasales.com/search/${origin}${fmt(departureDate)}${destination}${returnPart}${pax}?marker=${TP_MARKER}`;
};

const extractTime = (raw) => {
  if (!raw) return '';
  const parts = String(raw).trim().split(' ');
  return parts.length >= 2 ? parts.slice(1).join(' ') : raw;
};

const durationText = (d) => {
  if (!d) return '';
  if (typeof d === 'number') {
    const h = Math.floor(d / 60), m = d % 60;
    return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
  }
  return d.text || '';
};

const parsePrice = (raw, adults = 1) => {
  const val = raw.price ?? null;
  if (val === null || val === undefined) return null;
  const n = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.]/g, '')) : Number(val);
  if (isNaN(n) || n <= 0) return null;
  return Math.round(n / Math.max(1, adults));
};

const parseAmenities = (extensions = []) => {
  const result = { wifi: false, power: false, video: false, usb: false };
  for (const ext of extensions) {
    const s = String(ext).toLowerCase();
    if (s.includes('wi-fi'))                 result.wifi  = true;
    if (s.includes('power'))                 result.power = true;
    if (s.includes('usb'))                   result.usb   = true;
    if (s.includes('video') || s.includes('entertainment')) result.video = true;
  }
  return result;
};

const normalise = (raw, { origin, destination, departureDate, returnDate, adults }) => {
  const segs = raw.flights || [];
  const first = segs[0] || {};
  const last  = segs[segs.length - 1] || first;

  const airlines = [...new Set(segs.map(s => s.airline).filter(Boolean))];

  const layovers = (raw.layovers || []).map(l => ({
    id:       l.airport_code || '',
    name:     l.airport_name || l.city || '',
    duration: l.duration_label || durationText(l.duration) || '',
    overnight: !!l.overnight,
  }));

  const rSegs  = raw.return_flights || [];
  const rFirst = rSegs[0] || {};
  const rLast  = rSegs[rSegs.length - 1] || rFirst;
  const returnLayovers = (raw.return_layovers || []).map(l => ({
    id:       l.airport_code || '',
    name:     l.airport_name || l.city || '',
    duration: l.duration_label || durationText(l.duration) || '',
    overnight: !!l.overnight,
  }));

  const outboundSegments = normalizeGoogleSegments(segs);
  const returnSegments = normalizeGoogleSegments(rSegs);

  return {
    id:            raw.next_token || raw.booking_token || `${origin}-${destination}-${Date.now()}-${Math.random()}`,
    departureTime: extractTime(first.departure_airport?.time) || raw.departure_time || '',
    arrivalTime:   extractTime(last.arrival_airport?.time)   || raw.arrival_time   || '',
    duration:      raw.duration?.text || durationText(raw.duration) || '',
    origin:        first.departure_airport?.airport_code || origin,
    destination:   last.arrival_airport?.airport_code   || destination,
    originName:    first.departure_airport?.airport_name || '',
    destName:      last.arrival_airport?.airport_name   || '',
    stops:         segs.length > 1 ? segs.length - 1 : (raw.stops ?? 0),
    layovers,
    segments:      combineFlightSegments(outboundSegments, returnSegments),
    outboundSegments,
    returnSegments,
    airline:       airlines.join(' · '),
    airlineLogo:   first.airline_logo || raw.airline_logo || '',
    flightNumber:  segs.map(s => s.flight_number).filter(Boolean).join(', '),
    aircraft:      first.aircraft || '',
    price:         parsePrice(raw, adults),
    currency:      'USD',
    bags:          raw.bags || { carry_on: 0, checked: 0 },
    legroom:       first.legroom || '',
    seatType:      first.seat   || '',
    amenities:     parseAmenities(first.extensions || []),
    co2:           raw.carbon_emissions?.difference_percent ?? null,
    bookingUrl:    buildBookingUrl({ origin, destination, departureDate, returnDate, adults }),
    isRoundTrip: rSegs.length > 0,
    returnOrigin:          rFirst.departure_airport?.airport_code || '',
    returnDestination:     rLast.arrival_airport?.airport_code   || '',
    returnDepartureTime:   extractTime(rFirst.departure_airport?.time) || '',
    returnArrivalTime:     extractTime(rLast.arrival_airport?.time)    || '',
    returnDuration:        raw.return_duration?.text || durationText(raw.return_duration) || '',
    returnDurationMinutes: typeof raw.return_duration === 'number' ? raw.return_duration : null,
    returnStops:           rSegs.length > 1 ? rSegs.length - 1 : 0,
    returnLayovers,
    returnFlightNumber:    rSegs.map(s => s.flight_number).filter(Boolean).join(', '),
  };
};

export const searchFlightsGoogle = async ({
  origin,
  destination,
  departureDate,
  returnDate  = null,
  adults      = 1,
  travelClass = 'ECONOMY',
}) => {
  if (!RAPIDAPI_KEY) throw new Error('RAPIDAPI_KEY not configured');

  const params = new URLSearchParams({
    departure_id:  origin.toUpperCase(),
    arrival_id:    destination.toUpperCase(),
    outbound_date: departureDate,
    travel_class:  travelClass,
    adults:        String(adults),
    currency:      'USD',
    language_code: 'en-US',
    country_code:  'US',
    search_type:   'best',
    show_hidden:   '1',
  });
  if (returnDate) params.set('return_date', returnDate);

  const url = `https://${RAPIDAPI_HOST}/api/v1/searchFlights?${params.toString()}`;
  console.log(`✈️  Google Flights search: ${origin} → ${destination} on ${departureDate}`);

  const RETRIES = 3;
  let res;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    res = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key':  RAPIDAPI_KEY,
        'Content-Type':    'application/json',
      },
    });
    if (res.ok) break;
    if ((res.status === 502 || res.status === 504) && attempt < RETRIES) {
      const delay = attempt * 1500;
      console.log(`⚠️  Google Flights ${res.status} — retry ${attempt}/${RETRIES - 1} in ${delay}ms`);
      await new Promise(r => setTimeout(r, delay));
      continue;
    }
    const body = await res.text().catch(() => '');
    throw new Error(`Google Flights API error (${res.status}): ${body}`);
  }

  const data = await res.json();

  if (!data.status) {
    const msg = Array.isArray(data.message)
      ? data.message.map(m => Object.values(m).join(', ')).join('; ')
      : data.message || 'Unknown API error';
    throw new Error(msg);
  }

  const ctx = { origin: origin.toUpperCase(), destination: destination.toUpperCase(), departureDate, returnDate, adults };

  const itins      = data.data?.itineraries || data.data || {};
  const topFlights  = (itins.topFlights   || []).map(f => normalise(f, ctx)).filter(f => f.price !== null);
  const otherFlights = (itins.otherFlights || []).map(f => normalise(f, ctx)).filter(f => f.price !== null);

  console.log(`✅ Google Flights: ${topFlights.length} top + ${otherFlights.length} other = ${topFlights.length + otherFlights.length} total for ${origin}→${destination}`);
  return { topFlights, otherFlights };
};
