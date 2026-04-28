import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Token provider set by ClerkTokenSync in App.tsx
let _tokenProvider: (() => Promise<string | null>) | null = null;

export function setClerkTokenProvider(fn: () => Promise<string | null>) {
  _tokenProvider = fn;
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  global: {
    fetch: async (url: RequestInfo | URL, options: RequestInit = {}) => {
      const token = _tokenProvider ? await _tokenProvider() : null;
      const headers = new Headers(options.headers);
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return fetch(url, { ...options, headers });
    },
  },
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
