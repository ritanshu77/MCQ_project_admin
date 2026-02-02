const getApiBaseUrl = () => {
  let url = import.meta.env.API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:3001' : '/api');
  // Remove trailing slash if present to avoid double slashes (e.g. domain.com//api)
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  return url;
};

export const API_BASE_URL = getApiBaseUrl();
