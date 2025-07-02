// public/js/supabaseClient.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://natjhcqynqziccssnwim.supabase.co'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hdGpoY3F5bnF6aWNjc3Nud2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1MzE0MTksImV4cCI6MjA2MTEwNzQxOX0.Gz1qQoD1Yxky5eIh2hyB_-mwd-HbFqSkh6jL54Aew4w'; // Replace with your Supabase Anon Key

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
