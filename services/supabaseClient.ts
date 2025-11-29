
import { createClient } from '@supabase/supabase-js';

// Credentials provided by user
const SUPABASE_URL = 'https://jynkwvdfmplllrsquuzz.supabase.co';

// USING SERVICE ROLE KEY (God Mode) for Admin Dashboard
// This bypasses RLS and allows full access to storage/db
// We prioritize the environment variable if it exists (for secure deployments)
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5bmt3dmRmbXBsbGxyc3F1dXp6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzkxNjQyNiwiZXhwIjoyMDc5Mjc2NDI2fQ.0hS504w5GPUPk6jiKg4UlenqqH6H8jz9vyNkTZiPFeU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false, // Service role clients usually don't need session persistence
    autoRefreshToken: false,
  }
});
