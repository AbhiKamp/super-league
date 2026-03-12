import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { handleError } from '../../../lib/errorHandler'; 

// Cache this public route for 60 seconds to keep the app blazing fast
export const revalidate = 60; 

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      }
    );

    // Fetch from our upgraded view that now includes 'assists'
    const { data, error } = await supabase
      .from('top_scorers')
      .select('*')
      .order('goalsScored', { ascending: false }) // Primary sort by goals
      .limit(10); 

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Leaderboard fetched successfully",
      data: data
    });

  } catch (error) {
    return handleError(error, "Leaderboard API Fetch");
  }
}