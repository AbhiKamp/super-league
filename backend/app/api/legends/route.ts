import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

    // Fetch the top 10 goal scorers from your database schema
    const { data, error } = await supabase
      .from('top_scorers')
      .select('*')
      .order('goalsScored', { ascending: false })
      .limit(10); 

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Legends fetched successfully (Cached)",
      data: data
    });

  } catch (error) {
    console.error("Legends fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch legends" },
      { status: 500 }
    );
  }
}