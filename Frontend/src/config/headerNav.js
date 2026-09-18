export const PRIMARY_HEADER_NAV = Object.freeze([
  { id: 'home', type: 'route', to: '/', labelKey: 'common.home', fallback: 'Home' },
  { id: 'destinations', type: 'route', to: '/destinations', serviceLabel: 'destinations', fallback: 'Destination ideas' },
  { id: 'plan-day', type: 'route', to: '/plan-my-day', serviceLabel: 'plan_day', fallback: 'Plan my day' },
  { id: 'where-go', type: 'route', to: '/where-can-i-go', serviceLabel: 'where_go', fallback: 'Where can I go?' },
  { id: 'tours', type: 'route', to: '/tours', serviceLabel: 'activities', fallback: 'Tours & activities' },
  { id: 'blog', type: 'external', href: 'https://blog.optiontrip.com', labelKey: 'common.blog', fallback: 'Blog' },
  { id: 'about', type: 'route', to: '/about', labelKey: 'common.about', fallback: 'About us' },
]);
