// Centralized API base URL config for the frontend
const fromEnv = import.meta.env?.VITE_API_BASE_URL?.toString().trim();

export const API_BASE_URL: string = fromEnv && fromEnv.length > 0 ? fromEnv : '/api';

export function buildApiUrl(endpoint: string): string {
  const base = API_BASE_URL.replace(/\/+$/, '');
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
}
