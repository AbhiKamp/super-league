import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 0; // Changed to 0 for instant testing

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const division = searchParams.get('division') || 'mens';

    const { data, error } = await supabase
      .from('league_standings')
      .select('*')
      .eq('division', division) // MAGIC LINE
      .order('rank', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "League standings retrieved successfully",
      data: {
        seasonId: "season-2026",
        seasonName: `College Football League 2026 (${division})`,
        standings: data
      }
    });

  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch standings" },
      { status: 500 }
    );
  }
}