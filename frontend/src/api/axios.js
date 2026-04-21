import axios from 'axios';

// In production (Vercel), frontend + backend share the same domain
// so /api resolves correctly. Locally, Vite proxies /api → localhost:5000
const API = axios.create({
  baseURL: import.meta.env.PROD ? '/api' : 'http://localhost:5000/api',
});

export default API;

