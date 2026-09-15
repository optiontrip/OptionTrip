export const TRAVELPAYOUTS_PROGRAM_ALIASES = Object.freeze({
  '12go': 'twelvego',
  '12go.asia': 'twelvego',
  'trip.com': 'tripcom',
  'economy bookings': 'economybookings',
  'welcome pickups': 'welcomepickups',
  'get rent a car': 'getrentacar',
  'go city': 'gocity',
  'auto europe': 'autoeurope',
  'radical storage': 'radicalstorage',
  'intui.travel': 'intuitravel',
});

export const normalizeTravelpayoutsProgramName = name => {
  const normalized = String(name || '').trim().toLowerCase();
  return TRAVELPAYOUTS_PROGRAM_ALIASES[normalized] || normalized.replace(/[^a-z0-9]/g, '');
};
