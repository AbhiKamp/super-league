import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { handleError } from '../../../../lib/errorHandler';

// --- FREQUENCY ALGORITHMS ---
function getFrequencyMap(arr: string[] | null) {
  const map: Record<string, number> = {};
  for (const item of (arr || [])) {
    map[item] = (map[item] || 0) + 1;
  }
  return map;
}

function getCorrectPicks(predicted: string[], actual: string[]) {
  const predMap = getFrequencyMap(predicted);
  const actMap = getFrequencyMap(actual);
  let matches = 0;
  for (const [playerId, predictedCount] of Object.entries(predMap)) {
    if (actMap[playerId]) {
      matches += Math.min(predictedCount, actMap[playerId]);
    }
  }
  return matches;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!, // No more dangerous Admin Service Key needed!
      {
        cookies: { getAll() { return cookieStore.getAll() }, setAll() {} },
      }
    );

    // 1. THE BEAUTIFUL JOIN: Fetch predictions, matches, AND user profiles in one shot!
    const { data: predictions, error: predError } = await supabase
      .from('predictions')
      .select(`
        user_id, 
        points_awarded, 
        predicted_scorers, 
        predicted_assists,
        matches!inner(status, scorers, assists),
        user_profiles(nickname, real_name, email)
      `)
      .eq('matches.status', 'completed');

    if (predError) throw predError;

    // 2. THE AGGREGATION ENGINE
    const statsMap: Record<string, any> = {};

    predictions?.forEach((p: any) => {
      const userId = p.user_id;
      
      // Initialize the user's scorecard if it doesn't exist yet
      if (!statsMap[userId]) {
        
        // Smart Name Selector: Prefers their custom nickname, falls back to Google real name, then email
        const profile = p.user_profiles || {};
        const displayName = profile.nickname || profile.real_name || profile.email?.split('@')[0] || `Fan_${userId.substring(0, 5)}`;

        statsMap[userId] = {
          user_id: userId,
          username: displayName,
          total_points: 0,
          correct_scorer_picks: 0,
          correct_assist_picks: 0
        };
      }

      // Add their points
      statsMap[userId].total_points += (p.points_awarded || 0);

      // Add their exact counts for the sub-leaderboards
      const matchData = p.matches; 
      if (matchData) {
        statsMap[userId].correct_scorer_picks += getCorrectPicks(p.predicted_scorers, matchData.scorers);
        statsMap[userId].correct_assist_picks += getCorrectPicks(p.predicted_assists, matchData.assists);
      }
    });

    // 3. SORTING THE THREE BOARDS
    const allStats = Object.values(statsMap);

    const overall = [...allStats]
      .sort((a, b) => b.total_points - a.total_points)
      .map(s => ({ user_id: s.user_id, username: s.username, total_points: s.total_points }));

    const topScorers = [...allStats]
      .sort((a, b) => b.correct_scorer_picks - a.correct_scorer_picks)
      .map(s => ({ user_id: s.user_id, username: s.username, correct_scorer_picks: s.correct_scorer_picks }));

    const topAssists = [...allStats]
      .sort((a, b) => b.correct_assist_picks - a.correct_assist_picks)
      .map(s => ({ user_id: s.user_id, username: s.username, correct_assist_picks: s.correct_assist_picks }));

    // 4. RETURN THE CONTRACT
    return NextResponse.json({
      success: true,
      data: {
        overall: overall.slice(0, 100),
        top_scorers_predictor: topScorers.slice(0, 50),
        top_assists_predictor: topAssists.slice(0, 50)
      }
    });

  } catch (error) {
    return handleError(error, "Fetch Leaderboards");
  }
}