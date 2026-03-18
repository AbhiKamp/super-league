import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { handleError } from '../../../../lib/errorHandler';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ match_id: string }> } // Awaitable params for Next.js 15+
) {
  try {
    const { match_id } = await params;

    const cookieStore = await cookies();
    const supabase = createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      cookies: { getAll() { return cookieStore.getAll() }, setAll() {} },
    });

    // 1. Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw { status: 401, message: "Unauthorized" };

    // 2. Fetch only THIS user's prediction for THIS specific match
    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', user.id)
      .eq('match_id', match_id)
      .maybeSingle(); // maybeSingle doesn't throw an error if no prediction is found

    if (error) throw error;

    // If data is null, they haven't predicted yet, which is totally fine!
    return NextResponse.json({ 
      success: true, 
      has_predicted: !!data,
      data: data || null 
    });

  } catch (error) {
    return handleError(error, "Fetch User Prediction");
  }
}