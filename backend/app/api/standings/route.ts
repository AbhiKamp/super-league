import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// This function handles the GET request for /api/standings
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('league_standings')
      .select('*')
      .order('rank', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "League standings retrieved successfully",
      data: {
        seasonId: "season-2026",
        seasonName: "College Football League 2026",
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