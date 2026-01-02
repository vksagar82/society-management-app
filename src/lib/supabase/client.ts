import { createClient } from "@supabase/supabase-js";

// Browser client
export const createBrowserClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SOCIETY_MMGTSUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SOCIETY_MMGTSUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

// Server client
export const createServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SOCIETY_MMGTSUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
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
