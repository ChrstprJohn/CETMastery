import axios from 'axios';
import { supabase } from './supabase.js';
import { attachAccessToken } from './auth-service.js';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use((config) => attachAccessToken(config, supabase));
