// This file uses environment variables for Supabase configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use environment variables for Supabase URL and key
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://lgwywyrakwzoztcutxkc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnd3l3eXJha3d6b3p0Y3V0eGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwMjgzMTEsImV4cCI6MjA2MTYwNDMxMX0.plHlNeWSyuPHueo4KIhNXaXploDFENB6jTMVKGZZfXQ";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

console.log("Connecting to Supabase at:", SUPABASE_URL);
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);