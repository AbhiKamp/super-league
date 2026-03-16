import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { handleError } from '../../../../lib/errorHandler';

async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    cookies: { getAll() { return cookieStore.getAll() }, setAll() {} },
  });
}

// CREATE A MATCH (Schedule a new game)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = await getSupabaseClient();

    const { data, error } = await supabase
      .from('matches')
      .insert([{
        home_team_id: body.home_team_id,
        away_team_id: body.away_team_id,
        date: body.date,
        venue: body.venue,
        status: 'scheduled', // Default status for new games
        home_score: 0,
        away_score: 0
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, message: "Match scheduled successfully", data });
  } catch (error) {
    return handleError(error, "Admin Create Match");
  }
}

// UPDATE A MATCH (Reschedule date/venue or fix teams)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.id) throw { status: 400, message: "Match ID is required for updates." };

    const supabase = await getSupabaseClient();

    const { data, error } = await supabase
      .from('matches')
      .update({
        home_team_id: body.home_team_id,
        away_team_id: body.away_team_id,
        date: body.date,
        venue: body.venue
      })
      .eq('id', body.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, message: "Match rescheduled successfully", data });
  } catch (error) {
    return handleError(error, "Admin Update Match");
  }
}

// DELETE A MATCH (Cancel a game entirely from the database)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) throw { status: 400, message: "Match ID is required for deletion." };

    const supabase = await getSupabaseClient();

    const { error } = await supabase
      .from('matches')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true, message: "Match deleted successfully" });
  } catch (error) {
    return handleError(error, "Admin Delete Match");
  }
}