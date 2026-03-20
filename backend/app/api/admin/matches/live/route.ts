import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { handleError } from '../../../../../lib/errorHandler'; // Adjust path if needed

// 1. THE MAGIC FIX: Teach the client to read the Auth Header!
async function getSupabaseClient(request: Request) {
  const cookieStore = await cookies();
  const authHeader = request.headers.get('Authorization'); // Grab the VIP Pass from the frontend!

  return createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    cookies: { getAll() { return cookieStore.getAll() }, setAll() {} },
    global: {
      headers: {
        Authorization: authHeader || '', // Force Supabase to use the token!
      },
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { match_id, action, player_id, team_id, minute } = body;

    if (!match_id || !action) {
      throw { status: 400, message: "match_id and action are required." };
    }

    // 2. PASS THE REQUEST IN HERE
    const supabase = await getSupabaseClient(request); 

    // Security check
    // 1. Get the User
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // 2. KICK OUT NOBODIES FIRST!
    if (authError || !user) {
      throw { status: 401, message: "Unauthorized: Please log in." };
    }

    // 3. NOW check if they are an Admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    // 4. Kick out logged-in students who aren't admins
    if (!roleData) {
      throw { status: 403, message: "Forbidden: Admin clearance required." };
    }

    // 1. Fetch the current state of the match
    const { data: match, error: matchErr } = await supabase
      .from('matches')
      .select('*')
      .eq('id', match_id)
      .single();

    if (matchErr || !match) throw { status: 404, message: "Match not found." };

    let updatePayload: any = { updated_at: new Date().toISOString() };
    let responseMessage = "Match updated.";

    // 2. THE ACTION SWITCHBOARD
    switch (action) {
      case 'add_goal':
        if (!player_id || !team_id) throw { status: 400, message: "player_id and team_id required for a goal." };
        
        // Is the player who scored on the home team?
        const isHomePlayer = match.home_team_id === team_id;
        
        // If it's an OWN GOAL, give the point to the OTHER team!
        if (body.is_own_goal) {
          updatePayload.home_score = !isHomePlayer ? (match.home_score || 0) + 1 : match.home_score;
          updatePayload.away_score = isHomePlayer ? (match.away_score || 0) + 1 : match.away_score;
        } else {
          // Normal goal: give the point to the player's team
          updatePayload.home_score = isHomePlayer ? (match.home_score || 0) + 1 : match.home_score;
          updatePayload.away_score = !isHomePlayer ? (match.away_score || 0) + 1 : match.away_score;
        }
        
        // Append to scorers JSON array so your Prediction engine can grade it
        const currentScorers = match.scorers || [];
        updatePayload.scorers = [...currentScorers, player_id];

        // If there is an assist, log it!
        if (body.assist_id) {
          const currentAssists = match.assists || [];
          updatePayload.assists = [...currentAssists, body.assist_id];
        }
        
        updatePayload.status = 'live';
        
        // Insert into the goals table (You can add 'is_own_goal' and 'minute' to this table later if you want!)
        await supabase.from('goals').insert([{ match_id, player_id, team_id }]);
        
        responseMessage = body.is_own_goal ? "Own Goal registered!" : "Goal registered successfully!";
        break;

      case 'add_assist':
        if (!player_id) throw { status: 400, message: "player_id required for an assist." };
        const currentAssists = match.assists || [];
        updatePayload.assists = [...currentAssists, player_id];
        responseMessage = "Assist registered successfully!";
        break;

      case 'update_time':
        // Just sets the status to live so the frontend shows the red blinking dot
        updatePayload.status = 'live';
        responseMessage = "Match is now LIVE!";
        break;

      case 'close_match':
        // Blow the final whistle
        updatePayload.status = 'completed';
        responseMessage = "Match officially closed! Ready for grading.";
        break;

      default:
        throw { status: 400, message: "Unknown action type." };
    }

    // 3. Execute the final Match update
    const { data: updatedMatch, error: updateErr } = await supabase
      .from('matches')
      .update(updatePayload)
      .eq('id', match_id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    return NextResponse.json({ 
      success: true, 
      message: responseMessage, 
      data: updatedMatch 
    });

  } catch (error) {
    return handleError(error, "Live Match Controller");
  }
}