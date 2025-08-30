import { createBrowserClient } from '@supabase/ssr';

// Singleton instance to avoid multiple clients
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

// Function to clear potentially corrupted auth data
function clearAuthData() {
  if (typeof window !== 'undefined') {
    try {
      // Clear all supabase related items from localStorage
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });
      console.log('Cleared potentially corrupted auth data');
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }
}

export function createClient() {
  // Return existing instance if it exists
  if (supabaseClient) {
    return supabaseClient;
  }

  try {
    // Create new instance only if it doesn't exist
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      }
    );

    return supabaseClient;
  } catch (error) {
    console.error('Error creating Supabase client, clearing auth data:', error);
    // If there's an error (likely due to corrupted session data), clear it and try again
    clearAuthData();
    
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      }
    );

    return supabaseClient;
  }
}