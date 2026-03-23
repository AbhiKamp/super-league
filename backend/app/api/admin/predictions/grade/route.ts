import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { handleError } from '../../../../../lib/errorHandler';

// 1. THE MAGIC FIX: Helper to read the Auth Header from the frontend!
async function getSupabaseClient(request: Request) {
  const cookieStore = await cookies();
  const authHeader = request.headers.get('Authorization'); 

  return createServerClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_ANON_KEY as string, {
    cookies: { getAll() { return cookieStore.getAll() }, setAll() {} },
    global: {
      headers: {
        Authorization: authHeader || '', 
      },
    },
  });
}

// --- THE FREQUENCY ALGORITHM ---
function getFrequencyMap(arr: string[] | null) {
  const map: Record<string, number> = {};
  for (const item of (arr || [])) {
    map[item] = (map[item] || 0) + 1;
  }
  return map;
}

function calculatePlayerPoints(predicted: string[], actual: string[], pointsPerMatch: number) {
  const predMap = getFrequencyMap(predicted);
  const actMap = getFrequencyMap(actual);
  let points = 0;

  for (const [playerId, predictedCount] of Object.entries(predMap)) {
    if (actMap[playerId]) {
      const matches = Math.min(predictedCount, actMap[playerId]);
      points += matches * pointsPerMatch;
    }
  }
  return points;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.match_id) throw { status: 400, message: "match_id is required for grading." };

    // 2. USE THE HELPER HERE
    const supabase = await getSupabaseClient(request);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw { status: 401, message: "Unauthorized" };

    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('home_score, away_score, scorers, assists, status')
      .eq('id', body.match_id)
      .single();

    if (matchError || !match) throw { status: 404, message: "Match not found." };
    if (match.status !== 'completed') throw { status: 400, message: "Match must be marked 'completed' before grading." };

    const { data: predictions, error: predError } = await supabase
      .from('predictions')
      .select('*')
      .eq('match_id', body.match_id);

    if (predError) throw predError;
    if (!predictions || predictions.length === 0) {
      return NextResponse.json({ success: true, message: "No predictions found for this match." });
    }

    // --- 4. THE NEW GRADING LOOP ---
    const gradePromises = predictions.map(async (prediction) => {
      let totalPoints = 0;

      const predHome = prediction.predicted_home_score;
      const predAway = prediction.predicted_away_score;
      const actHome = match.home_score;
      const actAway = match.away_score;

      // Stage A: Scoreline Logic
      if (predHome === actHome && predAway === actAway) {
        totalPoints += 300; // 300 Points: Exact score
      } else {
        const predDiff = predHome - predAway;
        const actDiff = actHome - actAway;
        
        // 100 Points: Correct Result (Win/Loss/Draw) but wrong exact score
        if (
          (predDiff > 0 && actDiff > 0) || // Both predicted home win
          (predDiff < 0 && actDiff < 0) || // Both predicted away win
          (predDiff === 0 && actDiff === 0) // Both predicted draw
        ) {
          const basePoints = 100;
          // Penalty: 10 points deducted per wrong goal
          const goalError = Math.abs(predHome - actHome) + Math.abs(predAway - actAway);
          const penalty = goalError * 10;
          
          totalPoints += (basePoints - penalty); 
        }
      }

      // Stage B: Player Actions Logic
      totalPoints += calculatePlayerPoints(prediction.predicted_scorers, match.scorers || [], 100); // 100 per goal
      totalPoints += calculatePlayerPoints(prediction.predicted_assists, match.assists || [], 50); // 50 per assist

      // Update prediction row
      return supabase
        .from('predictions')
        .update({ points_awarded: totalPoints })
        .eq('id', prediction.id);
    });

    await Promise.all(gradePromises);

    // --- 5. AUTOMATIC GLOBAL LEADERBOARD UPDATE ---
    const uniqueUsers = [...new Set(predictions.map(p => p.user_id))];
    
    const profilePromises = uniqueUsers.map(async (userId) => {
      const { data: userPreds } = await supabase
        .from('predictions')
        .select('points_awarded')
        .eq('user_id', userId);
        
      const totalScore = (userPreds || []).reduce((acc, curr) => acc + (curr.points_awarded || 0), 0);
      
      return supabase
        .from('user_profiles')
        .update({ points: totalScore })
        .eq('id', userId);
    });

    await Promise.all(profilePromises);

    return NextResponse.json({ 
      success: true, 
      message: `Successfully graded ${predictions.length} predictions and updated the global leaderboard!` 
    });

  } catch (error) {
    return handleError(error, "Grade Predictions Engine");
  }
}