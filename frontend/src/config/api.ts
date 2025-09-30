const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Validate API URL format
if (!API_BASE_URL.startsWith('http')) {
  console.error('Invalid API_BASE_URL format:', API_BASE_URL);
}

export { API_BASE_URL };