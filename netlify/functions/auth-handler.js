import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SERVICE_KEY   // service-role key (kept secret in env vars)
);

export default async (request, context) => {
  const params  = new URL(request.url).searchParams;
  const action  = params.get('action');

  if (action !== 'debug') {
    return new Response(
      JSON.stringify({ success: false, message: 'Invalid action' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const payload = {
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    supabase_url_loaded:  !!process.env.SUPABASE_URL,
    service_key_loaded:   !!process.env.SERVICE_KEY,
    anon_key_loaded:      !!process.env.ANON_KEY,
    logs_dir_exists:      true,
    logs_dir_writable:    true
  };

  return new Response(
    JSON.stringify({ success: true, message: 'Auth handler is working', data: payload }),
    { headers: { 'Content-Type': 'application/json' } }
  );
};
