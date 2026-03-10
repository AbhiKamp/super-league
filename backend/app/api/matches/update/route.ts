import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// The secret key we set in .env.local (admin123admin123)
const ADMIN_KEY = process.env.ADMIN_SECRET_KEY;

export async function POST(request: Request) {
  try {
    // 1. Security Check: Verify the Admin Key in the headers
    const authHeader = request.headers.get('x-admin-key');
    
    if (authHeader !== ADMIN_KEY) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Invalid admin key" },
        { status: 401 }
      );
    }

    // 2. Parse the incoming JSON body
    const body = await request.json();
    const { matchId, home_score, away_score, status } = body;

    // Validate that we at least have a matchId
    if (!matchId) {
      return NextResponse.json(
        { success: false, message: "matchId is required" },
        { status: 400 }
      );
    }

    // 3. Update the database
    const { data, error } = await supabase
      .from('matches')
      .update({ 
        home_score: home_score, 
        away_score: away_score, 
        status: status 
      })
      .eq('id', matchId)
      .select(); // Returns the updated row

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Match updated successfully",
      data: data
    });

  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update match" },
      { status: 500 }
    );
  }
}