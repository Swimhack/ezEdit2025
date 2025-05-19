import { createClient } from '@supabase/supabase-js';

export const supa = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // use SERVICE-ROLE on server
); 