import { createClient } from "@supabase/supabase-js";

// Browser client
export const createBrowserClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SOCIETY_MMGTSUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SOCIETY_MMGTSUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // During build time, environment variables might not be available
    if (
      typeof window === "undefined" &&
      process.env.NODE_ENV === "production"
    ) {
      // Return a mock client for build time
      return createClient("https://placeholder.supabase.co", "placeholder-key");
    }
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

// Server client
export const createServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SOCIETY_MMGTSUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    // During build time, environment variables might not be available
    if (
      process.env.NODE_ENV === "production" &&
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      // Return a mock client for build time
      return createClient("https://placeholder.supabase.co", "placeholder-key");
    }
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export const supabaseBrowser = createBrowserClient();
