import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { handleError } from '../../../lib/errorHandler';

export const revalidate = 0; 

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const division = searchParams.get('division') || 'mens';

    const { data, error } = await supabase
      .from('teams')
      .select('id, name, logo_url')
      .eq('division', division) // MAGIC LINE
      .order('name', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    return handleError(error, 'Fetch Teams');
  }
}