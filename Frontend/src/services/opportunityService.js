import { refreshAccessToken, getAccessToken as getStoredToken } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const analyzeTripOpportunities = async (tripId, token, payload = {}) => {
  const makeRequest = (authToken) => fetch(`${API_BASE_URL}/api/opportunities/${tripId}/analyze`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
    },
    credentials: 'include',
    body: JSON.stringify(payload)
  });

  let response = await makeRequest(token);
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) response = await makeRequest(getStoredToken());
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `HTTP ${response.status}`);
  }
  return data;
};

export default { analyzeTripOpportunities };
