// config.js
const SUPABASE_URL = 'https://xzpmrgqvtnohqsxcsrss.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6cG1yZ3F2dG5vaHFzeGNzcnNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3Nzk5NDEsImV4cCI6MjA4MDM1NTk0MX0.4Ris9cuEAAO3Jumze1q7YHTqdm1uUu7c8zqHe5GcJs0'; // Replace with your anon key

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);