import { createClient } from "@supabase/supabase-js";

// Regular client setup (public-facing, uses ANON key)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL; // Ensure this is set in your environment variables
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Public ANON key for general client operations

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Admin client setup (server-side only, uses Service Role key)
// Make sure to use environment variables that are not exposed to the frontend
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service Role Key for elevated access

// This export is intended for server-side use only where elevated access is required
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default supabase;
