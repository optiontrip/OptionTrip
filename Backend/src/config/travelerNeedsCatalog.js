// Planning lenses are opt-in and should never be inferred from unrelated profile data.
export const TRAVELER_NEEDS_CATALOG = Object.freeze({
  accessibility: {
    label: 'Accessibility-aware travel',
    needs: ['step_free_routes', 'accessible_stays', 'accessible_transport', 'assistance', 'accessible_activities'],
  },
  business: {
    label: 'Business travel',
    needs: ['schedule_reliability', 'airport_transfer', 'workspace', 'connectivity', 'flexible_booking', 'receipts'],
  },
  family: {
    label: 'Family travel',
    needs: ['family_stays', 'child_friendly_transport', 'family_activities', 'practical_breaks'],
  },
  solo: {
    label: 'Solo travel',
    needs: ['safety_context', 'social_options', 'single_room_value', 'late_arrival_planning'],
  },
  budget: {
    label: 'Budget travel',
    needs: ['total_trip_cost', 'public_transport', 'hostels', 'free_activities', 'deal_comparison'],
  },
  premium: {
    label: 'Premium travel',
    needs: ['premium_cabin', 'premium_stays', 'private_transfer', 'concierge_experiences'],
  },
});

export const getTravelerNeedsCatalog = () => Object.entries(TRAVELER_NEEDS_CATALOG).map(([key, value]) => ({
  key,
  label: value.label,
  needs: [...value.needs],
}));
