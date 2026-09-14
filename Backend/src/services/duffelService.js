import { combineFlightSegments, normalizeDuffelSegments } from './flightSegmentNormalizer.js';

const DUFFEL_API_KEY = process.env.DUFFEL_API_KEY || '';
const DUFFEL_BASE    = 'https://api.duffel.com';
const TP_MARKER      = process.env.TRAVELPAYOUTS_MARKER || '370056';

const parseDuration = (iso) => {
  if (!iso) return '';
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return iso;
  const h   = parseInt(m[1] || '0', 10);
  const min = parseInt(m[2] || '0', 10);
  if (h && min) return `${h}h ${min}m`;
  if (h) return `${h}h`;
  if (min) return `${min}m`;
  return iso;
};

const parseDurationMinutes = (iso) => {
  if (!iso) return null;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return null;
  return parseInt(m[1] || '0', 10) * 60 + parseInt(m[2] || '0', 10);
};

const extractTime = (iso) => {
  if (!iso) return '';
  const t = String(iso).split('T')[1];
  return t ? t.slice(0, 5) : '';
};

const buildBookingUrl = ({ origin, destination, departureDate, returnDate, adults }) => {
  const fmt = (d) => { const [, mm, dd] = d.split('-'); return `${dd}${mm}`; };
  const pax = String(Math.max(1, adults));
  const returnPart = returnDate ? fmt(returnDate) : '';
  return `https://www.aviasales.com/search/${origin}${fmt(departureDate)}${destination}${returnPart}${pax}?marker=${TP_MARKER}`;
};

const normalise = (offer, { origin, destination, departureDate, returnDate, adults }) => {
  const slice    = offer.slices?.[0] || {};
  const segs     = slice.segments  || [];
  const first    = segs[0]         || {};
  const last     = segs[segs.length - 1] || first;

  const airlines = [
    ...new Set(
      segs.map(s => s.marketing_carrier?.name || offer.owner?.name).filter(Boolean)
    ),
  ];

  const cabinClass = first.passengers?.[0]?.cabin_class_marketing_name || '';

  const baggages  = first.passengers?.[0]?.baggages || [];
  const carryOn   = baggages
    .filter(b => b.type === 'carry_on')
    .reduce((sum, b) => sum + (b.quantity || 0), 0);
  const checked   = baggages
    .filter(b => b.type === 'checked')
    .reduce((sum, b) => sum + (b.quantity || 0), 0);

  const total = parseFloat(offer.total_amount || '0');
  const price = adults > 0 ? Math.round(total / adults) : Math.round(total);

  const layovers = segs.slice(0, -1).map((seg) => ({
    id:   seg.destination?.iata_code || '',
    name: seg.destination?.name     || '',
  }));

  const returnSlice = offer.slices?.[1] || null;
  const rSegs       = returnSlice?.segments || [];
  const rFirst      = rSegs[0] || {};
  const rLast       = rSegs[rSegs.length - 1] || rFirst;
  const returnLayovers = rSegs.slice(0, -1).map(seg => ({
    id:   seg.destination?.iata_code || '',
    name: seg.destination?.name     || '',
  }));

  const outboundSegments = normalizeDuffelSegments(segs, 'outbound');
  const returnSegments = normalizeDuffelSegments(rSegs, 'return');

  return {
    id:                offer.id || `duffel-${Date.now()}-${Math.random()}`,
    departureTime:     extractTime(first.departing_at),
    arrivalTime:       extractTime(last.arriving_at),
    departureDateTime: first.departing_at   || '',
    duration:          parseDuration(slice.duration),
    durationMinutes:   parseDurationMinutes(slice.duration),
    origin:            first.origin?.iata_code      || origin,
    destination:       last.destination?.iata_code  || destination,
    originName:        first.origin?.name            || '',
    destName:          last.destination?.name        || '',
    stops:             Math.max(0, segs.length - 1),
    layovers,
    segments:          combineFlightSegments(outboundSegments, returnSegments),
    outboundSegments,
    returnSegments,
    airline:           airlines.join(' · ') || offer.owner?.name || '',
    airlineLogo:       offer.owner?.logo_symbol_url || first.marketing_carrier?.logo_symbol_url || '',
    flightNumber:      segs
      .map(s => `${s.marketing_carrier?.iata_code || ''}${s.marketing_carrier_flight_number || ''}`)
      .filter(Boolean)
      .join(', '),
    aircraft:          first.aircraft?.name || '',
    cabinClass,
    price,
    currency:          offer.total_currency || 'USD',
    changeable:        offer.conditions?.change_before_departure?.allowed  ?? null,
    refundable:        offer.conditions?.refund_before_departure?.allowed  ?? null,
    bags:              { carry_on: carryOn, checked },
    bookingUrl:        buildBookingUrl({ origin, destination, departureDate, returnDate, adults }),
    source:            'duffel',
    isRoundTrip: !!returnSlice,
    returnOrigin:          rFirst.origin?.iata_code          || '',
    returnDestination:     rLast.destination?.iata_code      || '',
    returnDepartureTime:   extractTime(rFirst.departing_at)  || '',
    returnArrivalTime:     extractTime(rLast.arriving_at)    || '',
    returnDuration:        parseDuration(returnSlice?.duration) || '',
    returnDurationMinutes: parseDurationMinutes(returnSlice?.duration),
    returnStops:           rSegs.length > 1 ? rSegs.length - 1 : 0,
    returnLayovers,
    returnFlightNumber:    rSegs
      .map(s => `${s.marketing_carrier?.iata_code || ''}${s.marketing_carrier_flight_number || ''}`)
      .filter(Boolean).join(', '),
  };
};

export const searchFlightsDuffel = async ({
  origin,
  destination,
  departureDate,
  returnDate  = null,
  adults      = 1,
  travelClass = 'economy',
}) => {
  if (!DUFFEL_API_KEY) throw new Error('DUFFEL_API_KEY not configured');

  const passengers = Array.from({ length: Math.max(1, adults) }, () => ({ type: 'adult' }));
  const slices = [
    { origin: origin.toUpperCase(), destination: destination.toUpperCase(), departure_date: departureDate },
  ];
  if (returnDate) {
    slices.push({
      origin:         destination.toUpperCase(),
      destination:    origin.toUpperCase(),
      departure_date: returnDate,
    });
  }

  const body = {
    data: {
      slices,
      passengers,
      cabin_class: travelClass.toLowerCase(),
    },
  };

  console.log(`🛫  Duffel search: ${origin} → ${destination} on ${departureDate}`);

  const res = await fetch(`${DUFFEL_BASE}/air/offer_requests?return_offers=true`, {
    method:  'POST',
    headers: {
      'Authorization':  `Bearer ${DUFFEL_API_KEY}`,
      'Duffel-Version': 'v2',
      'Content-Type':   'application/json',
      'Accept':         'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Duffel API error (${res.status}): ${text}`);
  }

  const data   = await res.json();
  const offers = data.data?.offers || [];

  const ctx = {
    origin:        origin.toUpperCase(),
    destination:   destination.toUpperCase(),
    departureDate,
    returnDate,
    adults,
  };

  const flights = offers
    .map(o => normalise(o, ctx))
    .filter(f => f.price > 0)
    .sort((a, b) => a.price - b.price);

  console.log(`✅ Duffel: ${flights.length} offers for ${origin}→${destination}`);
  return flights;
};
