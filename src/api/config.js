import axios from 'axios';

// 🧭 Local backend for testing (make sure Laravel is running)
const API_BASE_URL = 'http://192.168.1.62:8000/api';

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
