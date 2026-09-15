export const VI_TRAVEL_MAP_CONTRACT = Object.freeze({
  states: ['visited', 'planned', 'wishlist'],
  entities: ['country', 'city', 'place', 'route'],
  privacy: ['private', 'selected_trip', 'public'],
  sourceTrips: true,
  postTripUpdate: true,
  futureRecommendationSignal: true,
});

export default VI_TRAVEL_MAP_CONTRACT;
