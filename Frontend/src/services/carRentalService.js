const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const prepareCarRentalSearch = async ({
  pickupLocation,
  dropoffLocation,
  pickupDate,
  returnDate,
  driverAge = 30,
  countryCode = '',
  locale = 'en',
}) => {
  if (!String(pickupLocation || '').trim()) return null;

  const response = await fetch(`${API_URL}/api/travel/cars/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pickupLocation,
      dropoffLocation: dropoffLocation || pickupLocation,
      pickupDate,
      returnDate,
      driverAge,
      countryCode,
      locale,
    }),
  });

  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload.error || payload.reason || 'Car rental search handoff failed');
  }

  return payload;
};
