import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 0; // Turn off caching temporarily so you can test the toggle instantly!

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ADDED request: Request to read the URL!
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const division = searchParams.get('division') || 'mens';

    // 1. Fetch Top 4 Standings (Filtered)
    const { data: standings, error: standingsErr } = await supabase
      .from('league_standings')
      .select('*')
      .eq('division', division) 
      .order('rank', { ascending: true })
      .limit(4);

    // If Supabase gets mad, it will print the exact reason in your backend terminal!
    if (standingsErr) {
      console.error("Supabase Standings Error:", standingsErr.message);
    }
    // 2. Fetch Latest 5 News Items
    const { data: news } = await supabase
      .from('newsletter')
      .select('*')
      .order('date', { ascending: false })
      .limit(5);

    // 3. Fetch Top Scorer & Top Assist (Filtered)
    const { data: scorers } = await supabase
      .from('top_scorers')
      .select('*')
      .eq('division', division) // MAGIC LINE
      .order('goalsScored', { ascending: false })
      .limit(1);

    const assistsResp = await supabase
      .from('top_scorers')
      .select('*')
      .eq('division', division) // MAGIC LINE
      .order('assists', { ascending: false })
      .limit(1);
    
    const assists = assistsResp.error ? scorers : assistsResp.data;

    // 4. Fetch the most recent Live/Upcoming match from Schedule (Filtered)
    const { data: schedule } = await supabase
      .from('league_schedule')
      .select('*')
      .eq('division', division) // MAGIC LINE
      .order('date', { ascending: true })
      .limit(1);

    // Provide a mocked live match if the database schedule is empty
    const liveMatch = schedule && schedule.length > 0 ? {
      homeTeam: schedule[0].home_team || "Team A",
      awayTeam: schedule[0].away_team || "Team B",
      homeScore: schedule[0].status === 'completed' ? schedule[0].home_score : 0,
      awayScore: schedule[0].status === 'completed' ? schedule[0].away_score : 0,
      minute: schedule[0].status === 'live' ? "45+" : schedule[0].time || "18:00",
      homeForm: ['W','D','L','W','W'],
      awayForm: ['L','L','D','W','L']
    } : {
      homeTeam: division === 'womens' ? "KULASTHREE FC" : "BETA FC",
      awayTeam: division === 'womens' ? "FAAAH UTD" : "CHARLIE UTD",
      homeScore: 2,
      awayScore: 1,
      minute: "72",
      homeForm: ['W','D','W','L','W'],
      awayForm: ['L','L','D','W','L']
    };

    // 5. Mock Fantasy Leaderboard points
    const fantasyTop = [
      { id: 1, name: "Sreerag", points: 8520 },
      { id: 2, name: "Pranav", points: 8150 },
      { id: 3, name: "Alen", points: 7900 }
    ];

    // Build the aggregated dashboard payload
    return NextResponse.json({
      success: true,
      data: {
        standings: standings || [],
        news: news || [],
        topScorer: scorers?.[0] ? { name: scorers[0].name, club: scorers[0].club, stat: scorers[0].goalsScored } : null,
        topAssist: assists?.[0] ? { name: assists[0].name, club: assists[0].club, stat: assists[0].assists || 0 } : null,
        liveMatch: liveMatch,
        fantasyTop: fantasyTop
      }
    });

  } catch (error) {
    console.error("Dashboard fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to aggregate dashboard data" },
      { status: 500 }
    );
  }
}