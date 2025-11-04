import { createSupabaseServerClient } from '@/src/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { domain_name, request_details } = await req.json();

  if (!domain_name || !request_details) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('quote_submissions')
    .insert([{ domain_name, request_details }]);

  if (error) {
    console.error('Error inserting data:', error);
    return NextResponse.json({ error: 'Failed to submit quote' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Quote submitted successfully' }, { status: 200 });
}
