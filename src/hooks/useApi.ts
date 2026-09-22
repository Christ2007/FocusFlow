import { buildApiUrl } from '@/lib/apiConfig';

export const useApi = () => {
  const apiCall = async (endpoint: string, options: RequestInit = {}, timeoutMs = 5000) => {
    const url = buildApiUrl(endpoint);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const config: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
        ...options,
      };

      const response = await fetch(url, config);
      clearTimeout(timer);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  };

  return { apiCall };
};
