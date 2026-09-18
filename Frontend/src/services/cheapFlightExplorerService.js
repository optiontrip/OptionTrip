const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const codesFrom = (value) => {
  const list = Array.isArray(value) ? value : [value];
  return list
    .map(item => typeof item === 'string' ? item : item?.iataCode)
    .map(code => String(code || '').trim().toUpperCase())
    .filter(code => /^[A-Z]{3}$/.test(code));
};

const fetchCheapData = async (path, params) => {
  const response = await fetch(`${API_URL}${path}?${params.toString()}`);
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to load cheapest monthly routes');
  }
  return data.data;
};

export const searchCheapRoutePairsByMonth = async ({ pairs, month, returnMonth = null }) => {
  const normalizedPairs = (Array.isArray(pairs) ? pairs : [])
    .map(pair => {
      const origin = String(pair?.origin || '').trim().toUpperCase();
      const destination = String(pair?.destination || '').trim().toUpperCase();
      return /^[A-Z]{3}$/.test(origin) && /^[A-Z]{3}$/.test(destination) && origin !== destination
        ? `${origin}-${destination}`
        : null;
    })
    .filter(Boolean);

  if (!normalizedPairs.length || !month) {
    throw new Error('Select valid route pairs and a month');
  }

  const params = new URLSearchParams({ pairs: normalizedPairs.join(','), month });
  if (returnMonth) params.set('returnMonth', returnMonth);
  return fetchCheapData('/api/flights/cheap-route-pairs', params);
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
  return fetchCheapData('/api/flights/cheap-routes', params);
};
