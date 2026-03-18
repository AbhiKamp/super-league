import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { handleError } from '../../../../../lib/errorHandler';

// --- THE FREQUENCY ALGORITHM ---
// 1. Converts an array like ["messi", "messi", "ronaldo"] into a Hash Map: { "messi": 2, "ronaldo": 1 }
function getFrequencyMap(arr: string[] | null) {
  const map: Record<string, number> = {};
  for (const item of (arr || [])) {
    map[item] = (map[item] || 0) + 1;
  }
  return map;
}

// 2. Compares the predicted map vs the actual map to calculate points
function calculatePlayerPoints(predicted: string[], actual: string[], pointsPerMatch: number) {
  const predMap = getFrequencyMap(predicted);
  const actMap = getFrequencyMap(actual);
  let points = 0;

  for (const [playerId, predictedCount] of Object.entries(predMap)) {
    if (actMap[playerId]) {
      // If they guessed he scores 3 times, but he only scores 2 times, they only get points for 2.
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

    const cookieStore = await cookies();
    const supabase = createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      cookies: { getAll() { return cookieStore.getAll() }, setAll() {} },
    });

    // 1. SECURE THE ROUTE: Admins only
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw { status: 401, message: "Unauthorized" };

    // 2. FETCH THE SOURCE OF TRUTH (The completed match data)
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('home_score, away_score, scorers, assists, status')
      .eq('id', body.match_id)
      .single();

    if (matchError || !match) throw { status: 404, message: "Match not found." };
    if (match.status !== 'completed') throw { status: 400, message: "Match must be marked 'completed' before grading." };

    // 3. FETCH THE BETS (All predictions for this match)
    const { data: predictions, error: predError } = await supabase
      .from('predictions')
      .select('*')
      .eq('match_id', body.match_id);

    if (predError) throw predError;
    if (!predictions || predictions.length === 0) {
      return NextResponse.json({ success: true, message: "No predictions found for this match." });
    }

    // 4. THE GRADING LOOP
    const gradePromises = predictions.map(async (prediction) => {
      let totalPoints = 0;

      // Stage A: Scoreline Logic
      const predHome = prediction.predicted_home_score;
      const predAway = prediction.predicted_away_score;
      const actHome = match.home_score;
      const actAway = match.away_score;

      if (predHome === actHome && predAway === actAway) {
        totalPoints += 3; // 3 Points: Exact score
      } else {
        // 1 Point: Correct Result (Win/Loss/Draw) but wrong exact score
        const predDiff = predHome - predAway;
        const actDiff = actHome - actAway;
        
        if (
          (predDiff > 0 && actDiff > 0) || // Both predicted home win
          (predDiff < 0 && actDiff < 0) || // Both predicted away win
          (predDiff === 0 && actDiff === 0) // Both predicted draw
        ) {
          totalPoints += 1;
        }
      }

      // Stage B: Player Actions Logic
      // 2 points per correct goalscorer
      totalPoints += calculatePlayerPoints(prediction.predicted_scorers, match.scorers || [], 2);
      // 1 point per correct assist
      totalPoints += calculatePlayerPoints(prediction.predicted_assists, match.assists || [], 1);

      // Stage C: Update this specific prediction's points in the database
      return supabase
        .from('predictions')
        .update({ points_awarded: totalPoints })
        .eq('id', prediction.id);
    });

    // 5. Execute all database updates in parallel using Promise.all
    await Promise.all(gradePromises);

    return NextResponse.json({ 
      success: true, 
      message: `Successfully graded ${predictions.length} predictions!` 
    });

  } catch (error) {
    return handleError(error, "Grade Predictions Engine");
  }
}