import { createClient } from '@supabase/supabase-js';

// Credentials provided by user
const SUPABASE_URL = 'https://jynkwvdfmplllrsquuzz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5bmt3dmRmbXBsbGxyc3F1dXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MTY0MjYsImV4cCI6MjA3OTI3NjQyNn0.yoHPbCbkTXOAvVMIWbe31qVPbxQL7xFZS_ORh2mYK9E';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
