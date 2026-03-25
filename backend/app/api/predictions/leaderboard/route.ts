export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { handleError } from '../../../../lib/errorHandler';

export async function GET() {
  try {
    const cookieStore = await cookies();
    
    // We can safely use the standard ANON key because user_profiles is public!
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        cookies: { getAll() { return cookieStore.getAll() }, setAll() {} },
      }
    );

    // 1. Fetch the top 100 users straight from the profiles table
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('id, nickname, real_name, email, points, team_flair_id')
      .gt('points', 0)
      .order('points', { ascending: false }) // Highest points first!
      .limit(100);

    if (error) throw error;

    // 2. Format it to match exactly what your frontend expects
    const overall = profiles.map(p => ({
      user_id: p.id,
      username: p.nickname || p.real_name || p.email?.split('@')[0] || `Fan_${p.id.substring(0, 5)}`,
      total_points: p.points || 0,
      team_flair: p.team_flair_id || null
    }));

    // 3. Return the contract
    return NextResponse.json({
      success: true,
      data: {
        overall: overall,
        top_scorers_predictor: [], // Left empty since the UI doesn't use it
        top_assists_predictor: []  // Left empty since the UI doesn't use it
      }
    });

  } catch (error) {
    console.error("Leaderboard Fetch Error:", error);
    return handleError(error, "Fetch Leaderboards");
  }
}