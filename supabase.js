import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://kuzogsqliihqpjucqqdt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1em9nc3FsaWlocXBqdWNxcWR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwOTMxMjYsImV4cCI6MjA5ODY2OTEyNn0.UdgP451o2iB0nm-OMs1oOO8aUwTZSA51OMEHhzRgB8w";

export const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);
