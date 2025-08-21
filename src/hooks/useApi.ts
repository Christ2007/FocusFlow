import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl } from '@/lib/apiConfig';

export const useApi = () => {
  const { token } = useAuth();

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const url = buildApiUrl(endpoint);
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  };

  return { apiCall };
};
