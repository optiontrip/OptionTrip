export const VI_TRIP_SERVICE_ATTACHMENT_TYPES = Object.freeze([
  'flight',
  'stay',
  'car',
  'rail',
  'bus',
  'transfer',
  'activity',
  'tour',
  'guide',
  'esim',
  'insurance',
]);

export const canAttachViTripService = (type) => VI_TRIP_SERVICE_ATTACHMENT_TYPES.includes(String(type || '').toLowerCase());

export default VI_TRIP_SERVICE_ATTACHMENT_TYPES;
