import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
    try {
        // Fetch live matches from Supabase, ordered by date
        const { data, error } = await supabase
            .from('matches')
            .select('*')
            .order('date', { ascending: true }); // Orders from oldest/upcoming to furthest in the future

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: "League schedule retrieved successfully",
            data: {
                matches: data
            }
        });

    } catch (error) {
        console.error("Database error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch schedule" },
            { status: 500 }
        );
    }
}
