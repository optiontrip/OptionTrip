export const PRIMARY_HEADER_NAV = Object.freeze([
  { id: 'flights', type: 'route', to: '/flights', serviceLabel: 'flights', fallback: 'Flights' },
  { id: 'stays', type: 'route', to: '/hotels', serviceLabel: 'stays', fallback: 'Hotels' },
  { id: 'cars', type: 'route', to: '/car-rental', serviceLabel: 'cars', fallback: 'Car rental' },
  { id: 'tours', type: 'route', to: '/tours', serviceLabel: 'activities', fallback: 'Tours & activities' },
  { id: 'esim', type: 'route', to: '/esim', serviceLabel: 'esim', fallback: 'eSIM' },
]);
