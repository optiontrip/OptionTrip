const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const codesFrom = (value) => {
  const list = Array.isArray(value) ? value : [value];
  return list
    .map(item => typeof item === 'string' ? item : item?.iataCode)
    .map(code => String(code || '').trim().toUpperCase())
    .filter(code => /^[A-Z]{3}$/.test(code));
};

export const searchCheapRoutesByMonth = async ({ origins, destinations, month, returnMonth = null }) => {
  const originCodes = codesFrom(origins);
  const destinationCodes = codesFrom(destinations);

  if (!originCodes.length || !destinationCodes.length || !month) {
    throw new Error('Select valid departure and destination airports and a month');
  }

  const params = new URLSearchParams({
    origins: originCodes.join(','),
    destinations: destinationCodes.join(','),
    month,
  });
  if (returnMonth) params.set('returnMonth', returnMonth);

  const response = await fetch(`${API_URL}/api/flights/cheap-routes?${params.toString()}`);
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to load cheapest monthly routes');
  }
  return data.data;
};
