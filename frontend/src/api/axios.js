import axios from 'axios';

// In production, VITE_API_URL should be set to your deployed backend URL
// e.g. https://your-backend.onrender.com/api
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

export default API;
