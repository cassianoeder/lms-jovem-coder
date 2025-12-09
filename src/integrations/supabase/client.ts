import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Validate environment variables
if (!SUPABASE_URL) {
  console.warn("Supabase URL is missing. Please set VITE_SUPABASE_URL in your .env file");
}

if (!SUPABASE_PUBLISHABLE_KEY) {
  console.warn("Supabase Publishable Key is missing. Please set VITE_SUPABASE_PUBLISHABLE_KEY in your .env file");
}

let supabaseInstance: any;

// Only create the client if both values are present
if (SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY) {
  try {
    // Validate URL format
    new URL(SUPABASE_URL);
    supabaseInstance = createClient<Database>(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          storage: localStorage,
          persistSession: true,
          autoRefreshToken: true,
        }
      }
    );
  } catch (error) {
    console.error("Invalid Supabase URL format:", SUPABASE_URL);
    // Create a dummy client to prevent complete failure
    supabaseInstance = {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
        signUp: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
        signOut: () => Promise.resolve({ error: null }),
      },
      from: () => ({
        select: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
        insert: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
        update: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
        delete: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
        eq: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
        in: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
        single: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
        maybeSingle: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
        order: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
      }),
      rpc: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
    };
  }
} else {
  // Create a dummy client when credentials are missing
  supabaseInstance = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
      signUp: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from: () => ({
      select: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
      insert: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
      update: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
      delete: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
      eq: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
      in: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
      single: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
      maybeSingle: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
      order: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
    }),
    rpc: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
  };
}

export const supabase = supabaseInstance;