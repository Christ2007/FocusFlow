// Centralized API base URL config for the frontend
// Priority:
// 1) Vite env: import.meta.env.VITE_API_BASE_URL (e.g., http://192.168.173.75:5000/api)
// 2) Fallback to current host on port 5000: http://<hostname>:5000/api

const fromEnv = import.meta.env?.VITE_API_BASE_URL?.toString().trim();

// Runtime-safe hostname resolution (browser only)
const fallbackBase = (() => {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:5000/api`;
  }
  // Last resort fallback (e.g., during build)
  return 'http://localhost:5000/api';
})();

export const API_BASE_URL: string = fromEnv && fromEnv.length > 0 ? fromEnv : fallbackBase;

export function buildApiUrl(endpoint: string): string {
  const base = API_BASE_URL.replace(/\/+$/, '');
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
}
