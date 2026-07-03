const SUPABASE_URL = "DEINE_SUPABASE_URL";
const SUPABASE_KEY = "DEIN_SUPABASE_ANON_KEY";

export const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);
