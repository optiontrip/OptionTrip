import OpenAI from 'openai';
import { formatActivitiesForPrompt } from './userActivityService.js';
import { searchAirports } from './amadeusService.js';
import { findAirportByCityName } from './nearbyAirportsService.js';
import { aggregateFlightSearch } from './chatFlightAggregatorService.js';
import { aggregateHotelSearch } from './chatHotelAggregatorService.js';

let openai = null;

const getOpenAIClient = () => {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
};

const MODEL = process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini';

const detectStrongMessageLanguage = (text = '') => {
  const value = String(text || '').trim();
  if (!value) return null;
  if (/[іїєґ]/i.test(value)) return 'uk';
  if (/[а-яё]/i.test(value)) return 'ru';
  if (/[一-鿿]/u.test(value)) return 'zh';
  if (/[぀-ヿ]/u.test(value)) return 'ja';
  if (/[가-힯]/u.test(value)) return 'ko';
  if (/[؀-ۿ]/u.test(value)) return 'ar';
  if (/[A-Za-z]/.test(value) && /\b(the|and|from|to|flight|hotel|trip|travel|please|need|want|where|when|how|what|book|find|help)\b/i.test(value)) return 'en';
  return null;
};

const inferConversationLanguage = (userMessage = '', conversationHistory = []) => {
  const direct = detectStrongMessageLanguage(userMessage);
  if (direct) return direct;
  const prior = [...(conversationHistory || [])].reverse().find(item => item?.role === 'user' && detectStrongMessageLanguage(item?.text));
  return detectStrongMessageLanguage(prior?.text) || 'en';
};

const DIRECT_SEARCH_COPY = {
  en: {
    origin: 'Which city are you flying from?',
    destination: 'Which city are you flying to?',
    hotel: 'Which city are you looking to stay in?',
    current: 'Use my current location',
    type: "I'll type it in",
    foundFlight: count => `Found ${count} flight option${count !== 1 ? 's' : ''} for you!`,
    foundHotel: count => `Found ${count} hotel option${count !== 1 ? 's' : ''} for you!`,
    failedFlight: 'Sorry, I could not complete that flight search. Try again in a moment, or open [/flights](/flights).',
    failedHotel: 'Sorry, I could not complete that hotel search. Try again in a moment, or open [/hotels](/hotels).',
  },
  ru: {
    origin: 'Из какого города вы летите?',
    destination: 'В какой город вы хотите лететь?',
    hotel: 'В каком городе вы ищете отель?',
    current: 'Моё текущее местоположение',
    type: 'Я введу сам',
    foundFlight: count => `Нашёл ${count} ${count === 1 ? 'вариант перелёта' : 'варианта перелёта'}.`,
    foundHotel: count => `Нашёл ${count} ${count === 1 ? 'вариант отеля' : 'варианта отелей'}.`,
    failedFlight: 'Не удалось завершить поиск авиабилетов. Попробуйте ещё раз или откройте [/flights](/flights).',
    failedHotel: 'Не удалось завершить поиск отелей. Попробуйте ещё раз или откройте [/hotels](/hotels).',
  },
  uk: {
    origin: 'З якого міста ви летите?',
    destination: 'До якого міста ви хочете летіти?',
    hotel: 'У якому місті ви шукаєте готель?',
    current: 'Моє поточне місцезнаходження',
    type: 'Я введу сам',
    foundFlight: count => `Знайшов ${count} ${count === 1 ? 'варіант перельоту' : 'варіанти перельоту'}.`,
    foundHotel: count => `Знайшов ${count} ${count === 1 ? 'варіант готелю' : 'варіанти готелів'}.`,
    failedFlight: 'Не вдалося завершити пошук авіаквитків. Спробуйте ще раз або відкрийте [/flights](/flights).',
    failedHotel: 'Не вдалося завершити пошук готелів. Спробуйте ще раз або відкрийте [/hotels](/hotels).',
  },
};

const directCopy = language => DIRECT_SEARCH_COPY[language] || DIRECT_SEARCH_COPY.en;

const FLIGHT_SEARCH_TOOL = {
  type: 'function',
  function: {
    name: 'search_flights',
    description: 'Search real flight prices and options when the user wants to find/book/search flights and origin+destination are known. Do NOT call this for vague "how do I get to X" questions with no clear origin+destination, or for general flight advice/booking-tips questions. A specific date is NOT required to call this - if the user gave no date at all, omit departureDate entirely and the search will run against a default near-term date; mention that default date in your reply and ask for their real dates.',
    parameters: {
      type: 'object',
      properties: {
        origin: { type: 'string', description: 'IATA airport code if known (e.g. "JFK"), otherwise the city/place name as the user said it (e.g. "New York")' },
        destination: { type: 'string', description: 'IATA airport code if known, otherwise the city/place name' },
        departureDate: { type: 'string', description: 'YYYY-MM-DD. Infer a reasonable near-future date if the user gave any hint ("next month" etc.) and say so in your reply. Omit this field entirely if the user gave no date hint whatsoever - do not guess a specific day out of thin air.' },
        returnDate: { type: 'string', description: 'YYYY-MM-DD, omit entirely for a one-way search' },
        adults: { type: 'integer', description: 'Number of adult passengers, default 1' },
        travelClass: { type: 'string', enum: ['economy', 'premium_economy', 'business', 'first'] }
      },
      required: ['origin', 'destination']
    }
  }
};

const HOTEL_SEARCH_TOOL = {
  type: 'function',
  function: {
    name: 'search_hotels',
    description: 'Search real hotel prices and options when the user wants to find/book a hotel or place to stay and the destination city is known. Do NOT call this for vague browsing questions with no clear destination, or for general hotel-booking-tips questions. Specific check-in/check-out dates are NOT required to call this - if the user gave no date at all, omit checkIn/checkOut entirely and the search will run against sensible default dates; mention that default in your reply and ask for their real dates.',
    parameters: {
      type: 'object',
      properties: {
        destination: { type: 'string', description: 'City/place name the user wants to stay in, as they said it (e.g. "Paris", "Rome")' },
        checkIn: { type: 'string', description: 'YYYY-MM-DD. Infer a reasonable near-future date if the user gave any hint ("next month" etc.) and say so in your reply. Omit this field entirely if the user gave no date hint whatsoever.' },
        checkOut: { type: 'string', description: 'YYYY-MM-DD. Omit if unknown - a default of a few nights after check-in will be used.' },
        adults: { type: 'integer', description: 'Number of adult guests, default 1' },
        rooms: { type: 'integer', description: 'Number of rooms, default 1' }
      },
      required: ['destination']
    }
  }
};

const DEFAULT_SEARCH_DATE = () => {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
};

const DEFAULT_CHECKOUT_DATE = (checkIn) => {
  const d = checkIn ? new Date(checkIn) : new Date();
  d.setDate(d.getDate() + 3);
  return d.toISOString().slice(0, 10);
};

const ROUTE_STOPWORDS = 'on|next|this|for|around|by|in|near|during|and|with|at|starting|leaving';

const FLIGHT_ROUTE_PATTERN = new RegExp(
  `\\bfrom\\s+([a-z][a-z\\s]{1,28}?)\\s+to\\s+([a-z][a-z\\s]{1,28}?)(?=[.,!?;]|\\s+(?:${ROUTE_STOPWORDS})\\b|$)`,
  'i'
);

const extractFlightRouteHint = (text) => {
  if (!text) return null;
  const m = String(text).match(FLIGHT_ROUTE_PATTERN);
  if (!m) return null;
  const origin = m[1].trim();
  const destination = m[2].trim();
  if (origin.length < 2 || destination.length < 2) return null;
  return { origin, destination };
};

const HOTEL_DESTINATION_PATTERN = new RegExp(
  `\\b(?:hotel|stay|accommodation|place to stay|room)\\b.{0,20}?\\bin\\s+([a-z][a-z\\s]{1,28}?)(?=[.,!?;]|\\s+(?:${ROUTE_STOPWORDS})\\b|$)`,
  'i'
);

const extractHotelDestinationHint = (text) => {
  if (!text) return null;
  const m = String(text).match(HOTEL_DESTINATION_PATTERN);
  if (!m) return null;
  const destination = m[1].trim();
  if (destination.length < 2) return null;
  return { destination };
};

const resolveIata = async (place) => {
  if (!place) return null;
  const trimmed = String(place).trim();
  if (/^[A-Za-z]{3}$/.test(trimmed)) return trimmed.toUpperCase();

  const local = findAirportByCityName(trimmed);
  if (local) return local.iata;

  try {
    const matches = await searchAirports(trimmed);
    return matches[0]?.iataCode || null;
  } catch {
    return null;
  }
};

const formatItineraryForPrompt = (trip) => {
  if (!trip?.options?.length) return '';
  const selectedId = trip.selected_option_id;
  const opt =
    (selectedId && trip.options.find(o => o.option_id === selectedId)) ||
    trip.options.find(o => o.itinerary_generated && o.itinerary?.length) ||
    null;
  if (!opt?.itinerary?.length) return '';

  const lines = [`\nSELECTED ITINERARY (${opt.title}, ${opt.total_days} days, est. $${opt.estimated_total_cost || '-'}):`];
  for (const day of opt.itinerary) {
    lines.push(`\nDay ${day.day_number} - ${day.title}${day.date ? ` (${day.date})` : ''}`);
    if (day.summary) lines.push(`  ${day.summary}`);
    for (const act of (day.activities || []).slice(0, 8)) {
      const cost = act.cost ? ` ($${act.cost})` : '';
      lines.push(`  • ${act.time} - ${act.title} @ ${act.place_name}${cost}`);
    }
  }
  return lines.join('\n');
};

const buildSystemPrompt = (context, userMessage = '') => {
  const {
    user, currentTrip, tripPhase, allTrips, preferences,
    currentLocation, recentActivities, memoryProfile, serviceSignals, weather
  } = context;

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  let prompt = `You are Vi - an expert AI travel assistant for OptionTrip, a trip-planning, flight, hotel, and activity booking platform.

# Today's date
${todayStr}. Resolve every relative date ("next Friday", "next month", "in two weeks", "this weekend") against this real date - never guess or default to a date from training data. This matters most for flight search dates, which must always be in the future.

# Response language - mandatory
- Reply in the SAME natural language as the user's latest message. This rule overrides the website/interface language.
- If the latest message is language-neutral (for example only an IATA code, number, emoji, or a one-word place name), infer the language from the most recent user turns in this conversation.
- If the user switches languages, switch with them immediately.
- Keep airport codes, brand names and proper nouns unchanged where appropriate.
- Never mix languages inside normal prose unless the user explicitly asks for translation or bilingual output.
- Use natural native travel terminology, not literal machine-translated wording.

# Identity & Personality
- Warm, friendly, and genuinely enthusiastic about travel.
- Speak like a savvy, well-traveled friend, not a brochure.
- Be confident and decisive. Give specific recommendations, not "you could consider X or Y or Z".
- Genuinely funny in a dry, clever way - at most one light quip per reply, never forced, never at the user's expense. Skip the humor entirely on "emergency"-type replies.
- Act like you actually remember this user: weave in facts from their long-term memory profile naturally ("since you're usually budget-first..."), rather than re-asking things you already know.
- Cooperative and proactive: offer the sensible next step instead of waiting to be asked for it.
- Use light emojis sparingly - at most 1-2 per reply, only when they add warmth.
- Never be condescending; never apologize for things outside your control.

# What you can help with
- Trip planning, itinerary refinement, day-by-day suggestions
- Destination knowledge: neighborhoods, when-to-visit, must-do experiences, hidden gems
- Practical: packing, visa & docs, currency, transit, SIM/eSIM, tipping, etiquette, safety
- Restaurant, café, and bar recommendations by neighborhood and vibe
- Flight & hotel guidance (search tactics, booking timing, loyalty tips)
- Searching REAL flights and hotels for the user - see "Flight search tool" and "Hotel search tool" below
- On-trip help: directions, nearby places, weather expectations, emergencies
- Steering the user toward the right OptionTrip service at the right moment - see "Contextual service opportunities" below

# Flight search tool
You have a \`search_flights\` tool. Use it the moment the user names or implies both an origin and a destination - including phrasing like "I want to travel from X to Y", "flight to Y", "book me a ticket to Y" combined with a known origin. Never call it for general questions with no real trip in mind ("how do flight prices usually work", "what's the best time to fly somewhere") - answer those with advice as you already would.

**Auto-fill from what you already know before asking anything:**
- If "Current trip in focus" above has a destination, that IS the destination - don't ask for it.
- If it has dates, use dates.start_date as departureDate and dates.end_date as returnDate - don't ask for dates you already have.
- If "Where the user is right now" shows a live location, that's a reasonable default origin for a bare "find me flights" ask - use it and just mention the assumption in your reply instead of turning it into a question.
- Scan the ENTIRE conversation above, not just the latest message - if the user named an origin or destination in an earlier turn (even several turns back, even via a quick-reply tap), that value still stands. Never ask again for something already given.
- Call the tool the moment origin + destination are known from ANY combination of context, message, and prior turns - don't hold out for the user to repeat things you already know.

**Dates are never a reason to block the search.** If you have a date hint ("next month", "around the 10th"), pass your best-inferred \`departureDate\`. If the user gave NO date hint at all, just omit \`departureDate\` from the tool call entirely and still call the tool - it will search a sensible default near-term date. In your reply, briefly show the results as usual, mention in one clause that you searched a default date (the tool result's \`searchedDate\`), and ask them to share their real dates for accurate pricing. Do not hold the search hostage waiting for a date.

**Origin or destination missing** is the only real blocker, and only after you've genuinely checked context and the full conversation history for it. If it's still unknown, ask exactly ONE short question for just what's missing - e.g. "Which city are you flying from?" - never ask about dates as part of that blocking question, and never split missing pieces across several back-and-forth turns. \`quickReplies\` on that turn are NEVER invented city names - a city you make up is indistinguishable from real flight data to the user and is a hard rule violation. Only ever offer a real city that is already visible somewhere above (their live location, a place named earlier in this conversation). If no real city is available to offer, quickReplies must be non-city actions instead: "Use my current location", "I'll type it in" - never a fabricated place.

After a tool call resolves, narrate the results briefly (1-2 sentences, e.g. "Found some good options - cheapest is around $X with [airline], nonstop"). Never re-type every individual price/time/flight number - the app renders the actual result cards below your reply. One extra tip is welcome if genuinely useful (e.g. "the cheapest has a long layover - the next one up is nonstop for $30 more").
If the tool result contains an error: for a rate limit, suggest [/flights](/flights) directly; for \`could_not_resolve_airport\`, ask specifically about whichever of \`unresolvedOrigin\`/\`unresolvedDestination\` is present in the tool result (not both, unless both are) - ask them to spell it out or give the airport code.

# Hotel search tool
You have a \`search_hotels\` tool. Use it the moment the user names or implies a destination city to stay in - including "hotel in Y", "somewhere to stay in Y", or a Y already established as the trip destination. Never call it for general questions with no real trip in mind ("what's a good area to stay in general", "how far ahead should I book a hotel") - answer those with advice as you already would.

**Auto-fill from what you already know before asking anything:**
- If "Current trip in focus" above has a destination, that IS the destination - don't ask for it.
- If it has dates, use dates.start_date as checkIn and dates.end_date as checkOut - don't ask for dates you already have.
- Scan the ENTIRE conversation above, not just the latest message - if the user named a destination in an earlier turn, that value still stands. Never ask again for something already given.
- Call the tool the moment the destination is known from ANY combination of context, message, and prior turns - don't hold out for the user to repeat things you already know.

**Dates are never a reason to block the search.** If you have a date hint, pass your best-inferred \`checkIn\`/\`checkOut\`. If the user gave NO date hint at all, omit both fields entirely and still call the tool - it will search sensible default dates. In your reply, briefly show the results as usual, mention in one clause that you searched default dates, and ask them to share their real dates for accurate pricing. Do not hold the search hostage waiting for a date.

**Destination missing** is the only real blocker, and only after you've genuinely checked context and the full conversation history for it. If it's still unknown, ask exactly ONE short question - e.g. "Which city are you looking to stay in?" - never ask about dates as part of that blocking question. \`quickReplies\` on that turn are NEVER invented city names - a city you make up is indistinguishable from real data to the user and is a hard rule violation. Only ever offer a real city that is already visible somewhere above (a place named earlier in this conversation). If no real city is available to offer, quickReplies must be non-city actions instead: "I'll type it in" - never a fabricated place.

After a tool call resolves, narrate the results briefly (1-2 sentences, e.g. "Found some solid options - cheapest is around $X a night, 4-star"). Never re-type every individual price/rating - the app renders the actual result cards below your reply. One extra tip is welcome if genuinely useful.
If the tool result contains an error: for a rate limit or a failed search, suggest [/hotels](/hotels) directly.

**One combined question, ever.** If BOTH origin/destination (flight) and hotel destination are missing in the same turn - e.g. the user says "help me plan a trip to Lisbon" with no origin - ask for whatever's missing as ONE single combined question, not one tool's question then the other's on a later turn.

# Formatting rules (apply inside the "message" field of the JSON output)
- Use clean Markdown: short paragraphs, **bold** for key terms, bullet points (\`-\`) and numbered lists where they help scanability.
- Always keep a normal space before and after \`**bold**\` markers, e.g. "word **bold** word" - never "word**bold**word". This applies in every language, including Cyrillic and other non-Latin scripts.
- Headings (\`###\`) only when the answer has clearly distinct sections.
- Inline links allowed: \`[label](url)\`. Do not invent URLs you aren't sure of - prefer naming the source.
- Keep replies tight: under ~180 words unless the user explicitly asks for depth.
- Never wrap the whole reply in a code block. Code blocks are only for code/data.

# Style of advice
- Prefer concrete: "Stay in Le Marais, walk to dinner at Breizh Café" over "There are many great areas".
- When the user has a trip on file, anchor advice to their actual destination, dates, party size, and budget.
- When they have a generated itinerary, reference specific days by number and named activities.
- If a date- or price-sensitive fact would be guessed, say "check live" and tell them what to search for.
- For emergencies, lead with: International 112 (works in EU + most countries), then US 911 / UK 999.

# Boundaries
- Do not invent prices, schedules, availability, or facts about specific businesses you don't know.
- If asked something genuinely ambiguous, ask one short clarifying question.
- Never claim you booked or can book anything - booking happens in the OptionTrip UI.
- Never say you are "searching", "checking", "looking into it", or "just a moment" for flights, hotels, or any live data unless you are actually calling the matching tool on this exact turn - this message is only shown after a tool call already resolved, so a promise to search that isn't backed by an actual tool call in this turn will never be followed up on. If you have enough info, call the tool now; if you don't, ask directly instead of pretending to work on it.

# Linking to OptionTrip services
When the user asks about car rental, eSIM/data, or tours/activities - for their trip or in general - always give them the direct in-app link, never say "visit our website" or "go to OptionTrip" generically, and never write out a full https://... URL. Use EXACTLY these relative paths as the markdown link target (not the full site URL, not a different label-only phrasing): car rental → [/car-rental](/car-rental), eSIM → [/esim](/esim), tours/activities → [/tours](/tours). The link text itself can read naturally (e.g. "you can [browse tours](/tours) right in the app"), but the URL inside the parentheses must be exactly one of the paths above, verbatim. Weave it into a real, specific answer (recommend what to look for, a tip, etc.) - don't just paste a bare link with no context. Flights and hotels/stays do NOT get this link treatment when the user is actually trying to search - use the \`search_flights\`/\`search_hotels\` tools instead (see above); only fall back to [/flights](/flights) or [/hotels](/hotels) as a plain link when the question isn't a search at all (e.g. baggage policy, booking timing, or a search/rate-limit error).

# Output format
Respond ONLY with valid JSON, no surrounding prose, in this exact shape:
{
  "message": "<your markdown reply>",
  "type": "greeting|info|emergency|planning|trip_details|recommendation|general",
  "quickReplies": ["short follow-up 1", "short follow-up 2", "short follow-up 3"]
}
- 2-4 quickReplies, each ≤ 28 chars, tailored to the reply and the user's trip phase.`;

  if (user) {
    prompt += `\n\n# User\n- Name: ${user.name || 'Guest'}\n- Saved trips: ${allTrips?.length || 0}`;
  } else {
    prompt += `\n\n# User\n- Guest user (not signed in). Be welcoming; suggest signing in to unlock saved-trip features.`;
  }

  if (preferences) {
    const { destinations, tripTypes, preferredBudget, loveDescriptions } = preferences;
    const bits = [];
    if (destinations?.length) bits.push(`- Past destinations: ${destinations.slice(0, 6).join(', ')}`);
    if (tripTypes?.length)    bits.push(`- Trip styles enjoyed: ${tripTypes.join(', ')}`);
    if (preferredBudget)      bits.push(`- Typical budget tier: ${preferredBudget}`);
    if (loveDescriptions?.length) {
      const sample = loveDescriptions.slice(0, 2).map(d => `"${d.substring(0, 90)}"`).join('; ');
      bits.push(`- Stated interests: ${sample}`);
    }
    if (bits.length) prompt += `\n\n# Inferred preferences (from history)\n${bits.join('\n')}`;
  }

  if (currentTrip) {
    const dest = currentTrip.destination?.name || currentTrip.destination?.text || 'Unknown';
    const origin = currentTrip.origin?.name || currentTrip.origin?.text || null;
    prompt += `\n\n# Current trip in focus\n- Destination: ${dest}`;
    if (origin) prompt += `\n- Origin: ${origin}`;
    prompt += `\n- Dates: ${currentTrip.dates?.start_date || 'TBD'} → ${currentTrip.dates?.end_date || 'TBD'} (${currentTrip.dates?.duration_days || 0} days)`;
    if (currentTrip.guests?.label) prompt += `\n- Travelers: ${currentTrip.guests.label}`;
    else if (currentTrip.guests?.total) prompt += `\n- Travelers: ${currentTrip.guests.total}`;
    if (currentTrip.trip_type) prompt += `\n- Trip style: ${currentTrip.trip_type}`;
    if (currentTrip.budget) prompt += `\n- Budget tier: ${currentTrip.budget}`;
    if (currentTrip.travel_status) prompt += `\n- Travel status: ${currentTrip.travel_status}`;
    if (currentTrip.selectedFlight?.airline) {
      const f = currentTrip.selectedFlight;
      prompt += `\n- Booked flight: ${f.airline}${f.flightNumber ? ` ${f.flightNumber}` : ''}, ${f.departure || '?'} → ${f.arrival || '?'}${f.price ? `, ${f.currency || 'USD'} ${f.price}` : ''}`;
    }
    if (currentTrip.selectedHotel?.name) {
      const h = currentTrip.selectedHotel;
      prompt += `\n- Booked stay: ${h.name}${h.checkIn ? `, ${h.checkIn} → ${h.checkOut}` : ''}${h.price ? `, ${h.currency || 'USD'} ${h.price}/night` : ''}`;
    }
    if (currentTrip.selectedCar?.carType) {
      const c = currentTrip.selectedCar;
      prompt += `\n- Booked car: ${c.carType}${c.pickupLocation ? ` from ${c.pickupLocation}` : ''}`;
    }
    if (currentTrip.notes?.length) {
      prompt += `\n- Trip notes:\n${currentTrip.notes.slice(-5).map(n => `  - ${n.text}`).join('\n')}`;
    }
    prompt += `\n- Phase: **${tripPhase || 'planning'}** - `;
    prompt += tripPhase === 'before'
      ? 'pre-trip; focus on prep, anticipation, last-minute tweaks.'
      : tripPhase === 'during'
      ? 'on-trip right now; be brief, useful, on-the-ground (logistics, nearby spots, opening hours guidance).'
      : tripPhase === 'after'
      ? 'post-trip; reflect, capture memories, suggest the next adventure.'
      : 'planning; help shape the trip.';

    const itinSection = formatItineraryForPrompt(currentTrip);
    if (itinSection) prompt += `\n${itinSection}`;
  } else if (allTrips?.length) {
    prompt += `\n\n# Current trip in focus\nNone selected. The user has ${allTrips.length} saved trip(s) - ask which one they want help with, or treat the message as general travel advice.`;
  }

  if (currentLocation && (currentLocation.lat || currentLocation.city || currentLocation.label)) {
    const parts = [];
    if (currentLocation.label)        parts.push(currentLocation.label);
    if (currentLocation.neighborhood) parts.push(currentLocation.neighborhood);
    if (currentLocation.city)         parts.push(currentLocation.city);
    if (currentLocation.country)      parts.push(currentLocation.country);
    const place = [...new Set(parts)].join(', ');
    prompt += `\n\n# Where the user is right now\n- Live location: ${place || 'Coordinates only'}`;
    if (typeof currentLocation.lat === 'number' && typeof currentLocation.lng === 'number') {
      prompt += `\n- Coordinates: ${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`;
    }
    prompt += `\nUse this to answer "near me" questions, ground walking-time / commute advice, and bias recommendations to their actual surroundings. If their saved trip is somewhere else, gently distinguish "today, where you are" from "for your upcoming trip".`;
  }

  if (weather) {
    const hour = new Date().getHours();
    const timeOfDay = hour < 5 ? 'late night' : hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';
    prompt += `\n\n# Live conditions\n- Time of day: ${timeOfDay}`;
    prompt += `\n- Weather: ${weather.emoji || ''} ${weather.label || 'Unknown'}${typeof weather.temp_now_c === 'number' ? `, ${Math.round(weather.temp_now_c)}°C now` : ''}${typeof weather.temp_max_c === 'number' ? ` (${Math.round(weather.temp_min_c)}-${Math.round(weather.temp_max_c)}°C today)` : ''}`;
    if (weather.precip_prob != null) prompt += `\n- Chance of rain: ${weather.precip_prob}%`;
    prompt += `\nWeave this in naturally when relevant (what to wear, indoor vs outdoor plans, best time for a walk) - don't just recite the numbers unless asked directly.`;
  }

  if (Array.isArray(recentActivities) && recentActivities.length) {
    const formatted = formatActivitiesForPrompt(recentActivities);
    if (formatted) {
      prompt += `\n\n# What the user has been doing on OptionTrip (recent, newest first)\n${formatted}`;
      prompt += `\nUse this to reason about what they're actively planning. Reference specific actions when natural ("I see you just generated a Plan My Day for X - want me to extend it?"), but don't list everything back to them robotically.`;
    }
  }

  if (memoryProfile) {
    prompt += `\n\n# Long-term memory (persistent, across all history)\n${memoryProfile}`;
    prompt += `\nTreat this as things you already know about the user - reference it naturally, don't quote it verbatim or announce that you "have a profile" on them.`;
  }

  if (Array.isArray(serviceSignals) && serviceSignals.length) {
    const lines = serviceSignals.map(s => `- ${s.service} → [${s.url}] - ${s.reason}`);
    prompt += `\n\n# Contextual service opportunities\n${lines.join('\n')}`;
    prompt += `\nMention AT MOST ONE of these per reply, and only if it fits naturally in context - never force it. Phrase it as a helpful tip, not an ad ("Since your trip's in a week and you haven't sorted data yet, might be worth grabbing an eSIM - [here](/esim)."). Use the exact url given; never invent a different one. Skip entirely if none fit the current message.`;
  }

  return prompt;
};

const buildUserPrompt = (userMessage, context) => {
  const { tripPhase, currentTrip } = context;
  let prompt = userMessage;
  if (tripPhase && currentTrip?.destination?.name) {
    prompt = `[Context: user is in the "${tripPhase}" phase of their trip to ${currentTrip.destination.name}]\n\n${prompt}`;
  }
  return prompt;
};

const buildMessages = (userMessage, context, conversationHistory) => {
  const messages = [{ role: 'system', content: buildSystemPrompt(context, userMessage) }];

  const history = conversationHistory.slice(0, -1).slice(-20);
  for (const m of history) {
    messages.push({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.text
    });
  }

  messages.push({ role: 'user', content: buildUserPrompt(userMessage, context) });
  return messages;
};

export const streamViResponse = async (userMessage, context = {}, conversationHistory = []) => {
  const client = getOpenAIClient();
  if (!client) return null;
  const messages = buildMessages(userMessage, context, conversationHistory);
  return client.chat.completions.create({
    model: MODEL,
    messages,
    temperature: 0.75,
    max_tokens: 700,
    response_format: { type: 'json_object' },
    stream: true
  });
};

export const generateViResponse = async (userMessage, context = {}, conversationHistory = []) => {
  try {
    const client = getOpenAIClient();
    if (!client) return generateFallbackResponse(userMessage, context, conversationHistory);

    const messages = buildMessages(userMessage, context, conversationHistory);

    const completion = await client.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.75,
      max_tokens: 700,
      response_format: { type: 'json_object' }
    });

    let parsed;
    try {
      parsed = JSON.parse(completion.choices[0].message.content);
    } catch {
      return generateFallbackResponse(userMessage, context, conversationHistory);
    }

    return {
      text: parsed.message || parsed.text || "I'm here to help with your travel plans!",
      type: parsed.type || 'general',
      quickReplies: Array.isArray(parsed.quickReplies) && parsed.quickReplies.length
        ? parsed.quickReplies.slice(0, 4)
        : getContextualQuickReplies(context)
    };
  } catch (err) {
    console.error('Vi chat error:', err);
    return generateFallbackResponse(userMessage, context, conversationHistory);
  }
};

const getPendingSearch = (conversationHistory) => {
  const prev = conversationHistory[conversationHistory.length - 2];
  return prev?.role === 'assistant' && prev.pendingSearch ? prev.pendingSearch : null;
};

const RESET_PHRASES = [
  'find flights', 'search hotels', 'explore activities', 'looking for flights',
  'finding a hotel', 'need trip tips', 'help me with destinations',
  'help me with flights', 'help me plan my trip', 'no, a different place',
  'plan a trip', 'my trips', 'need help with flights'
];

const cleanPlaceValue = (text) => {
  let t = String(text).trim();
  t = t.replace(/^(yes,?|no,?|sure,?|ok,?|okay,?)\s*/i, '');
  t = t.replace(/^(from|to|in)\s+/i, '');
  t = t.replace(/[!.?]+$/g, '');
  return t.trim();
};

const resolvePendingSlot = (pending, userMessage, context) => {
  if (!pending || !pending.missing) return null;
  const raw = String(userMessage || '').trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();

  if (RESET_PHRASES.some(p => lower === p || lower.startsWith(p))) {
    return { status: 'unchanged', pending };
  }

  let value = null;

  if (pending.missing === 'origin' && /^use my current location$/i.test(lower)) {
    value = context?.currentLocation?.city || context?.currentLocation?.label || null;
    if (!value) return { status: 'unchanged', pending };
  } else if (/^(i'?ll type it in|type it in)$/i.test(lower)) {
    return { status: 'unchanged', pending };
  } else {
    const cleaned = cleanPlaceValue(raw);
    if (!cleaned || cleaned.split(/\s+/).length > 4 || /\b(help|find|search|explore|looking|need|plan|book)\b/i.test(cleaned)) {
      return { status: 'unchanged', pending };
    }
    value = cleaned;
  }

  const filled = { ...pending, [pending.missing]: value, missing: undefined };
  const stillMissing =
    pending.type === 'flight' && !filled.origin ? 'origin' :
    pending.type === 'flight' && !filled.destination ? 'destination' :
    pending.type === 'hotel' && !filled.destination ? 'destination' :
    null;

  if (stillMissing) {
    return { status: 'unchanged', pending: { ...filled, missing: stillMissing } };
  }

  return { status: 'complete', args: filled };
};

const buildPendingClarification = (pending, context, userMessage = '', conversationHistory = []) => {
  const language = inferConversationLanguage(userMessage, conversationHistory);
  const copy = directCopy(language);
  const question = pending.missing === 'origin'
    ? copy.origin
    : pending.type === 'hotel'
    ? copy.hotel
    : copy.destination;
  const quickReplies = pending.missing === 'origin'
    ? [copy.current, copy.type]
    : [copy.type];
  return {
    text: question,
    type: 'planning',
    quickReplies,
    results: null,
    resultsType: null,
    providerStatus: null,
    pendingSearch: pending
  };
};

export const planTurn = async (userMessage, context = {}, conversationHistory = [], options = {}) => {
  const pending = getPendingSearch(conversationHistory);
  if (pending) {
    const resolution = resolvePendingSlot(pending, userMessage, context);
    if (resolution?.status === 'complete') {
      const messages = buildMessages(userMessage, context, conversationHistory);
      return {
        kind: 'tool',
        toolCall: {
          id: `resumed_${pending.type}_${Date.now()}`,
          type: 'function',
          function: { name: pending.type === 'hotel' ? 'search_hotels' : 'search_flights', arguments: JSON.stringify(resolution.args) }
        },
        messages
      };
    }
    if (resolution?.status === 'unchanged') {
      return { kind: 'direct', response: buildPendingClarification(resolution.pending, context, userMessage, conversationHistory) };
    }
  }

  const { toolCall, messages } = await detectToolCall(userMessage, context, conversationHistory);
  if (toolCall) return { kind: 'tool', toolCall, messages };
  return { kind: 'chat' };
};

export const detectToolCall = async (userMessage, context = {}, conversationHistory = []) => {
  const messages = buildMessages(userMessage, context, conversationHistory);

  const routeHint = extractFlightRouteHint(userMessage);
  if (routeHint) {
    return {
      toolCall: {
        id: `forced_flight_${Date.now()}`,
        type: 'function',
        function: { name: 'search_flights', arguments: JSON.stringify(routeHint) }
      },
      messages
    };
  }

  const hotelHint = extractHotelDestinationHint(userMessage);
  if (hotelHint) {
    return {
      toolCall: {
        id: `forced_hotel_${Date.now()}`,
        type: 'function',
        function: { name: 'search_hotels', arguments: JSON.stringify(hotelHint) }
      },
      messages
    };
  }

  const client = getOpenAIClient();
  if (!client) return { toolCall: null, messages: null };

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages,
      tools: [FLIGHT_SEARCH_TOOL, HOTEL_SEARCH_TOOL],
      tool_choice: 'auto',
      temperature: 0,
      max_tokens: 300
    });
    const toolCalls = completion.choices[0]?.message?.tool_calls;
    return { toolCall: toolCalls?.[0] || null, messages };
  } catch (err) {
    console.error('Vi tool-detection error:', err.message);
    return { toolCall: null, messages };
  }
};

const executeFlightTool = async (args, options) => {
  const { canUseTool = true } = options;

  if (!canUseTool) return { toolResultPayload: { error: 'rate_limited' } };
  if (!args.origin || !args.destination) {
    return {
      toolResultPayload: { error: 'missing_search_params' },
      pendingSearch: {
        type: 'flight',
        origin: args.origin || null,
        destination: args.destination || null,
        missing: !args.origin ? 'origin' : 'destination',
        departureDate: args.departureDate || null,
        returnDate: args.returnDate || null,
        adults: args.adults || 1,
        travelClass: args.travelClass || 'economy'
      }
    };
  }

  try {
    const [origin, destination] = await Promise.all([resolveIata(args.origin), resolveIata(args.destination)]);
    if (!origin || !destination) {
      return {
        toolResultPayload: {
          error: 'could_not_resolve_airport',
          unresolvedOrigin: !origin ? args.origin : null,
          unresolvedDestination: !destination ? args.destination : null
        },
        pendingSearch: {
          type: 'flight',
          origin: origin ? args.origin : null,
          destination: destination ? args.destination : null,
          missing: !origin ? 'origin' : 'destination',
          departureDate: args.departureDate || null,
          returnDate: args.returnDate || null,
          adults: args.adults || 1,
          travelClass: args.travelClass || 'economy'
        }
      };
    }

    const usedDefaultDate = !args.departureDate;
    const departureDate = args.departureDate || DEFAULT_SEARCH_DATE();
    const agg = await aggregateFlightSearch({
      origin,
      destination,
      departureDate,
      returnDate: args.returnDate || null,
      adults: args.adults || 1,
      travelClass: args.travelClass || 'economy'
    });

    return {
      results: agg.results,
      resultsType: 'flights',
      providerStatus: agg.providerStatus,
      toolResultPayload: {
        resultCount: agg.results.length,
        providerStatus: agg.providerStatus,
        usedDefaultDate,
        searchedDate: departureDate,
        cheapest: agg.results[0]
          ? { airline: agg.results[0].airline, price: agg.results[0].price, currency: agg.results[0].currency, stops: agg.results[0].stops }
          : null
      }
    };
  } catch (err) {
    console.error('Flight tool execution error:', err.message);
    return { toolResultPayload: { error: 'search_failed' } };
  }
};

const executeHotelTool = async (args, options) => {
  const { canUseTool = true } = options;

  if (!canUseTool) return { toolResultPayload: { error: 'rate_limited' } };
  if (!args.destination) {
    return {
      toolResultPayload: { error: 'missing_search_params' },
      pendingSearch: {
        type: 'hotel',
        destination: null,
        missing: 'destination',
        checkIn: args.checkIn || null,
        checkOut: args.checkOut || null,
        adults: args.adults || 1,
        rooms: args.rooms || 1
      }
    };
  }

  try {
    const usedDefaultDates = !args.checkIn;
    const checkIn = args.checkIn || DEFAULT_SEARCH_DATE();
    const checkOut = args.checkOut || DEFAULT_CHECKOUT_DATE(checkIn);
    const agg = await aggregateHotelSearch({
      destination: args.destination,
      checkIn,
      checkOut,
      adults: args.adults || 1,
      rooms: args.rooms || 1
    });

    return {
      results: agg.results,
      resultsType: 'hotels',
      providerStatus: agg.providerStatus,
      toolResultPayload: {
        resultCount: agg.results.length,
        providerStatus: agg.providerStatus,
        usedDefaultDates,
        searchedCheckIn: checkIn,
        searchedCheckOut: checkOut,
        cheapest: agg.results[0]
          ? { name: agg.results[0].name, price: agg.results[0].price, currency: agg.results[0].currency, stars: agg.results[0].stars }
          : null
      }
    };
  } catch (err) {
    console.error('Hotel tool execution error:', err.message);
    return { toolResultPayload: { error: 'search_failed' } };
  }
};

export const resolveToolCall = async (toolCall, messages, context = {}, options = {}) => {
  const isHotel = toolCall.function.name === 'search_hotels';

  let args;
  try {
    args = JSON.parse(toolCall.function.arguments);
  } catch {
    args = {};
  }

  const { toolResultPayload, results = null, resultsType = null, providerStatus = null, pendingSearch = undefined } = isHotel
    ? await executeHotelTool(args, options)
    : await executeFlightTool(args, options);

  const lastUserMessage = [...(messages || [])].reverse().find(item => item?.role === 'user')?.content || '';
  const language = inferConversationLanguage(lastUserMessage, (messages || []).map(item => ({ role: item.role, text: item.content })));
  const copy = directCopy(language);
  const noun = isHotel ? 'hotel' : 'flight';
  const fallbackText = results?.length
    ? (isHotel ? copy.foundHotel(results.length) : copy.foundFlight(results.length))
    : (isHotel ? copy.failedHotel : copy.failedFlight);
  const fallbackType = results?.length ? `${noun}_results` : 'error';

  const client = getOpenAIClient();
  if (!client) {
    return { text: fallbackText, type: fallbackType, quickReplies: getContextualQuickReplies(context), results, resultsType, providerStatus, pendingSearch };
  }

  const pass2Messages = [
    ...messages,
    { role: 'assistant', content: null, tool_calls: [toolCall] },
    { role: 'tool', tool_call_id: toolCall.id, content: JSON.stringify(toolResultPayload) }
  ];

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: pass2Messages,
      temperature: 0.75,
      max_tokens: 700,
      response_format: { type: 'json_object' }
    });
    const parsed = JSON.parse(completion.choices[0].message.content);
    return {
      text: parsed.message || parsed.text || fallbackText,
      type: parsed.type || fallbackType,
      quickReplies: Array.isArray(parsed.quickReplies) && parsed.quickReplies.length
        ? parsed.quickReplies.slice(0, 4)
        : getContextualQuickReplies(context),
      results,
      resultsType,
      providerStatus,
      pendingSearch
    };
  } catch (err) {
    console.error('Vi tool pass-2 error:', err.message);
    return { text: fallbackText, type: fallbackType, quickReplies: getContextualQuickReplies(context), results, resultsType, providerStatus, pendingSearch };
  }
};

export const generateViResponseWithTools = async (userMessage, context = {}, conversationHistory = [], options = {}) => {
  const plan = await planTurn(userMessage, context, conversationHistory, options);

  if (plan.kind === 'direct') return plan.response;
  if (plan.kind === 'tool') return resolveToolCall(plan.toolCall, plan.messages, context, options);

  const reply = await generateViResponse(userMessage, context, conversationHistory);
  return { ...reply, results: null, resultsType: null, providerStatus: null };
};

const generateFallbackResponse = (userMessage, context, conversationHistory = []) => {
  const language = inferConversationLanguage(userMessage, conversationHistory);
  const lower = (userMessage || '').toLowerCase();
  const { user, currentTrip, tripPhase } = context;
  const userName = user?.name?.split(' ')[0] || '';
  const dest     = currentTrip?.destination?.name || '';

  if (language === 'ru') {
    if (/(экстр|срочно|помоги|помощ)/i.test(lower)) {
      return {
        text: `**Экстренные номера**\n- Международный: **112**\n- США: 911 · Великобритания: 999 · Австралия: 000\n\n${dest ? `Если вы в ${dest}, сохраните номер отеля и контакты ближайшего консульства.` : ''}\n\nЧто произошло? Я помогу с больницей, консульством или полицией.`,
        type: 'emergency',
        quickReplies: ['Ближайшее консульство', 'Найти больницу', 'Потерян паспорт']
      };
    }
    return {
      text: `Помогу${userName ? `, ${userName}` : ''}. Могу спланировать маршрут, подобрать перелёт или отель, помочь с транспортом, документами, местами рядом и подготовкой к поездке. Что делаем сейчас?`,
      type: 'general',
      quickReplies: currentTrip ? ['Маршрут поездки', 'Найти перелёт', 'Найти отель', 'Что рядом'] : ['Спланировать поездку', 'Найти перелёт', 'Найти отель']
    };
  }

  if (language === 'uk') {
    if (/(екстр|терміново|допомож|допомог)/i.test(lower)) {
      return {
        text: `**Екстрені номери**\n- Міжнародний: **112**\n- США: 911 · Велика Британія: 999 · Австралія: 000\n\n${dest ? `Якщо ви в ${dest}, збережіть номер готелю та контакти найближчого консульства.` : ''}\n\nЩо сталося? Допоможу з лікарнею, консульством або поліцією.`,
        type: 'emergency',
        quickReplies: ['Найближче консульство', 'Знайти лікарню', 'Втрачено паспорт']
      };
    }
    return {
      text: `Допоможу${userName ? `, ${userName}` : ''}. Можу спланувати маршрут, підібрати переліт або готель, допомогти з транспортом, документами, місцями поруч і підготовкою до подорожі. Що робимо зараз?`,
      type: 'general',
      quickReplies: currentTrip ? ['Маршрут подорожі', 'Знайти переліт', 'Знайти готель', 'Що поруч'] : ['Спланувати подорож', 'Знайти переліт', 'Знайти готель']
    };
  }

  if (/^(hi|hello|hey|good (morning|afternoon|evening))/i.test(lower)) {
    return {
      text: `Hi${userName ? ` ${userName}` : ''}! 👋 How can I help with your travel plans today?`,
      type: 'greeting',
      quickReplies: getContextualQuickReplies(context)
    };
  }

  if (/(emergency|sos|urgent|help me)/.test(lower)) {
    return {
      text: `**Emergency numbers**\n- International: **112**\n- US: 911 · UK: 999 · AU: 000\n\n${dest ? `In ${dest}, save your accommodation's front desk and nearest embassy contact in your phone.` : ''}\n\nWhat happened - can I help you find a hospital, embassy, or police?`,
      type: 'emergency',
      quickReplies: ['Nearest embassy', 'Hospital info', 'Lost passport', 'Local police']
    };
  }

  if (/(pack|luggage|bring|suitcase)/.test(lower)) {
    const d = currentTrip?.dates?.duration_days || 5;
    return {
      text: `Here's a tight ${d}-day packing list${dest ? ` for ${dest}` : ''}:\n\n- Travel docs + photocopies + 2 backup payment cards\n- Phone, charger, **universal adapter**, power bank\n- Medications + small first-aid kit\n- ${Math.ceil(d * 0.7)} tops, ${Math.ceil(d * 0.5)} bottoms, 1 layer, 1 rain shell\n- Comfortable walking shoes + 1 nicer pair\n\nWant a destination-specific tweak?`,
      type: 'packing',
      quickReplies: ['Weather in ' + (dest || 'destination'), 'Electronics list', 'What to wear', 'Toiletries']
    };
  }

  if (/(weather|climate|forecast)/.test(lower)) {
    return {
      text: `For accurate forecasts${dest ? ` in ${dest}` : ''}, check **Weather.com** or **AccuWeather** a few days before you travel - long-range forecasts drift a lot.\n\nGeneral rule: pack one layer warmer than you think and a light rain shell.`,
      type: 'weather',
      quickReplies: ['Packing tips', 'Best time to visit', 'What to wear']
    };
  }

  if (/(restaurant|food|eat|cuisine|dinner)/.test(lower)) {
    return {
      text: `Quick way to eat well${dest ? ` in ${dest}` : ''}:\n\n- Search **Google Maps** with "open now" + rating 4.5+ filter\n- Ask your host or front desk for two picks - pick the smaller one\n- Skip anywhere with a host on the street pulling people in\n- Lunch menus are usually a steal at fine-dining spots\n\nWhat kind of vibe - casual local, romantic, or splurge?`,
      type: 'recommendation',
      quickReplies: ['Local favorites', 'Budget eats', 'Romantic dinner', 'Brunch spots']
    };
  }

  if (/(transport|taxi|getting around|metro|subway|uber)/.test(lower)) {
    return {
      text: `Getting around${dest ? ` ${dest}` : ''}:\n\n- **Public transit** is almost always fastest in cities - grab a day pass\n- **Uber/Bolt/Grab** for late nights or with luggage\n- Avoid airport taxi touts - use the official rank or pre-booked transfer\n- Download offline maps before you land\n\nFlying in soon?`,
      type: 'transport',
      quickReplies: ['Airport transfer', 'Day pass info', 'Car rental tips']
    };
  }

  if (/(my trip|trip detail|itinerary|where am i going)/.test(lower) && currentTrip) {
    return {
      text: `**Your trip to ${dest}**\n- Dates: ${currentTrip.dates?.start_date || 'TBD'} → ${currentTrip.dates?.end_date || 'TBD'}\n- Duration: ${currentTrip.dates?.duration_days || 0} days\n- Travelers: ${currentTrip.guests?.total || 1}\n- Budget: ${currentTrip.budget || 'Standard'}\n\nHow can I help you prep?`,
      type: 'trip_details',
      quickReplies: tripPhase === 'before'
        ? ['Packing list', 'Local customs', 'Top experiences', 'Visa info']
        : ['Nearby places', 'Emergency info', 'Restaurant tips', 'Transport']
    };
  }

  return {
    text: `Happy to help${userName ? `, ${userName}` : ''}! I can do:\n\n- **Plan** itineraries day-by-day\n- **Pack** lists tailored to your trip\n- **Recommend** restaurants, neighborhoods, activities\n- **Prep** for visas, customs, currency, transit\n- **Help on-trip** with directions, nearby spots, emergencies\n\nWhat are you working on?`,
    type: 'general',
    quickReplies: getContextualQuickReplies(context)
  };
};

const SERVICE_QUICK_REPLY_LABELS = {
  esim: 'Check eSIM plans',
  car: 'Browse rental cars',
  hotel: 'Find a stay',
  tours: 'See tours',
  flight: 'Find flights'
};

const getContextualQuickReplies = (context) => {
  const { user, currentTrip, tripPhase, serviceSignals } = context;

  const base = !user
    ? ['Travel tips', 'Popular destinations', 'How to plan']
    : currentTrip
    ? tripPhase === 'before'
      ? ['Packing list', 'Local customs', 'Top experiences', 'Visa info']
      : tripPhase === 'during'
      ? ['Nearby places', 'Restaurant tips', 'Emergency help', 'Transport']
      : ['Plan a new trip', 'Share experience', 'Travel tips']
    : ['Plan a trip', 'My trips', 'Travel tips', 'Inspire me'];

  const topSignal = Array.isArray(serviceSignals) && serviceSignals[0];
  const serviceReply = topSignal && SERVICE_QUICK_REPLY_LABELS[topSignal.service];
  if (!serviceReply) return base;

  return [...base.slice(0, 3), serviceReply];
};

export { inferConversationLanguage };
export default { generateViResponse, generateViResponseWithTools, detectToolCall, resolveToolCall, planTurn };
