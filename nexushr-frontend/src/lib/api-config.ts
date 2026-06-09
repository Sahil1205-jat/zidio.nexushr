/**
 * API Configuration
 * Automatically switches between local and production endpoints
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
};

export default API_BASE_URL;
