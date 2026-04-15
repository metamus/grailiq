import axios from 'axios';
import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

/** Axios instance configured with base URL and Supabase auth interceptor */
export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Auth interceptor — inject Supabase session token
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Response interceptor — handle common errors
//
// Only redirect to /sign-in if the Supabase session itself is actually missing
// or expired. If the session is valid but the API returns 401, that's an API
// bug or a tier/permission issue — don't boot the user out of the app.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // No Supabase session at all — genuine auth failure, send to sign-in.
        // Preserve the current URL so we can bounce back after sign-in.
        const current = window.location.pathname + window.location.search;
        if (!window.location.pathname.startsWith('/sign-in')) {
          window.location.href = `/sign-in?next=${encodeURIComponent(current)}`;
        }
      }
      // Otherwise: session is valid, API is misbehaving. Let the caller handle
      // the 401 (show inline error, fall back, etc.) instead of logging out.
    }
    return Promise.reject(error);
  },
);
