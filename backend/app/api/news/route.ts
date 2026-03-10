import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // Fetch live articles from Supabase, ordered by newest first
    const { data, error } = await supabase
      .from('newsletter')
      .select('id, title, summary, date, author, imageUrl:image_url')
      .order('date', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "League news retrieved successfully",
      data: {
        articles: data 
      }
    });

  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch news" },
      { status: 500 }
    );
  }
}