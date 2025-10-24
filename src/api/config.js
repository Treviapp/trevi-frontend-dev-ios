import axios from 'axios';

// 🧭 Force local backend for testing
const API_BASE_URL = 'https://09bde9465c47.ngrok-free.app/api';

// 🛰️ Axios client for all API requests
const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  validateStatus: () => true,
});

// 🧩 Helper to log base URL
const logBaseURL = () => {
  console.log('🔗 Using API Base URL:', API_BASE_URL);
};

export { API_BASE_URL, client, logBaseURL };

