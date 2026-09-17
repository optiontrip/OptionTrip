// Whole-trip lifecycle intelligence for Vi.
// Keeps recommendations useful before, during and after travel instead of treating
// every conversation as a one-off booking funnel.
export const VI_TRIP_PHASES = Object.freeze({
  discover: ['inspire', 'destination fit', 'seasonality', 'budget reality', 'entry feasibility'],
  plan: ['dates', 'route', 'transport mix', 'stays', 'activities', 'total trip budget'],
  compare: ['real price', 'total cost', 'flexible dates', 'nearby airports', 'cabin', 'cancellation'],
  book: ['booking confidence', 'baggage', 'seat', 'payment', 'cancellation terms'],
  prepare: ['visa', 'passport', 'insurance', 'eSIM', 'packing', 'airport transfer', 'currency'],
  travel: ['live itinerary', 'weather', 'local transit', 'food', 'activities', 'shopping', 'disruptions'],
  remember: ['visited places', 'favorites', 'reviews', 'trip memories', 'preference learning'],
  return: ['price watch', 'repeat destinations', 'next-trip ideas', 'loyalty value']
});

export const VI_PREFERENCE_DIMENSIONS = Object.freeze([
  'budget_style', 'cabin_preference', 'airline_preference', 'airport_preference',
  'hotel_style', 'cancellation_flexibility', 'pace', 'food', 'museums', 'markets',
  'shopping', 'nightlife', 'nature', 'beaches', 'road_trips', 'public_transit',
  'accessibility', 'dietary_needs', 'seat_preference', 'baggage_pattern'
]);

export const buildViLifecyclePrompt = ({ phase, destination, preferences = {} } = {}) => {
  const phaseKey = VI_TRIP_PHASES[phase] ? phase : 'plan';
  const priorities = VI_TRIP_PHASES[phaseKey].join(', ');
  const known = Object.entries(preferences)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .slice(0, 12)
    .map(([key, value]) => `${key}=${Array.isArray(value) ? value.join('/') : value}`)
    .join(', ');

  return [
    `Trip lifecycle phase: ${phaseKey}. Prioritize: ${priorities}.`,
    destination ? `Destination in focus: ${destination}.` : '',
    known ? `Known traveler preferences: ${known}. Never ask again for facts already known.` : '',
    'Proactively surface the next 1-3 genuinely useful needs for this phase, including non-monetized advice when it improves the trip.',
    'Ask a preference question only when its answer materially changes the recommendation. Learn from the answer for later trip decisions.',
    'Think in total trip cost and traveler time, not isolated sticker prices.'
  ].filter(Boolean).join('\n');
};
