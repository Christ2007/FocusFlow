import { useCallback } from 'react';
import { buildApiUrl } from '@/lib/apiConfig';

export const useApi = () => {
  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}, timeoutMs = 5000) => {
    const url = buildApiUrl(endpoint);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const config: RequestInit = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      };

      const response = await fetch(url, config);
      const text = await response.text();

      // Guard against non-JSON responses (e.g. SPA fallback HTML on 404)
      let data;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(data?.message || `API request failed (${response.status})`);
      }

      return data;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }, []);

  return { apiCall };
};
