import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLeague } from '../context/LeagueContext';
import { useApi } from '../hooks/useApi';
import { supabase } from '../lib/supabase';
import { GlassPanel } from '../components/GlassPanel';
import { Send, User, LogOut, Trophy, Medal, Target, CheckCircle2, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import teamStyles from './Teams.module.css';
import { cn } from '../utils/cn';

const getTeamColorClass = (teamName) => {
    if (!teamName) return teamStyles.defaultTeam;
    const cleanName = teamName.trim();
    const map = {
        'KFC': teamStyles.kfc,
        'HRZxKadayadis': teamStyles.hrzx,
        'MILF': teamStyles.milf,
        'BBC': teamStyles.bbc,
        'AL Balal': teamStyles.alBalal,
        'AC Nilan': teamStyles.acNilan,
        'Red Wolves': teamStyles.redWolves,
        'DILF': teamStyles.dilf,
        'FAAAH United': teamStyles.faaah,
        'KULASTHREE FC': teamStyles.kulasthree,
        'Fivestars': teamStyles.fivestars
    };
    return map[cleanName] || teamStyles.defaultTeam;
};

export function UserProfile() {
  const { user, profile, setProfile, signOut } = useAuth();
  const { setView } = useLeague();
  const { data: lbResp, loading: lbLoading } = useApi('/predictions/leaderboard');

  // Compute fantasy rank and points
  const leaderboard = lbResp?.data?.overall || [];
  const myEntry = leaderboard.find(entry => entry.user_id === user?.id);
  const myPoints = myEntry ? myEntry.total_points : 0;
  const myRank = myEntry ? leaderboard.findIndex(e => e.user_id === user?.id) + 1 : null;
  
  const [nickname, setNickname] = useState(profile?.nickname || '');
  const [flair, setFlair] = useState(profile?.team_flair_id || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [allTeams, setAllTeams] = useState([]);

  useEffect(() => {
    const fetchAllTeams = async () => {
      const { data } = await supabase.from('teams').select('*').order('name');
      if (data) setAllTeams(data);
    };
    fetchAllTeams();
  }, []);

  // --- Prediction History ---
  const [predictions, setPredictions] = useState([]);
  const [predLoading, setPredLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const API_URL = import.meta.env.VITE_API_URL || '/api';
        const res = await fetch(`${API_URL}/predictions/history`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        const result = await res.json();
        if (result.success) setPredictions(result.data || []);
      } catch (err) {
        console.error('Failed to fetch prediction history', err);
      } finally {
        setPredLoading(false);
      }
    };
    if (user) fetchHistory();
  }, [user]);

  const gradedPredictions = predictions.filter(p => p.status === 'graded');
  const totalPredPoints = gradedPredictions.reduce((sum, p) => sum + (p.points_awarded || 0), 0);
  const displayedPredictions = showAll ? predictions : predictions.slice(0, 5);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nickname.trim() || !flair) return;
    
    setSaving(true);
    setError(null);
    setSuccess(false);

    const updatedProfile = {
      nickname: nickname.trim(),
      team_flair_id: flair,
    };

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update(updatedProfile)
      .eq('id', user.id);

    if (updateError) {
      console.error("Profile saving error:", updateError.message);
      setError("Failed to update profile. Please try again.");
      setSaving(false);
      return;
    }

    setProfile({ ...profile, id: user.id, email: user.email, ...updatedProfile });
    setSaving(false);
    setSuccess(true);
    
    // Hide success message after 3 seconds
    setTimeout(() => setSuccess(false), 3000);
  };

  const hasChanges = nickname !== profile?.nickname || flair !== profile?.team_flair_id;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 w-full max-w-2xl mx-auto mt-8">
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">
          Your Profile
        </h1>
      </div>

      <GlassPanel className="p-8 sm:p-10 relative z-10 border border-white/10 bg-black/60 backdrop-blur-2xl">
        <div className="flex flex-col items-center justify-center mb-8">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white text-black flex items-center justify-center font-black text-4xl mb-4">
                {nickname ? nickname.charAt(0).toUpperCase() : <User size={40} />}
            </div>
            <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-white">{profile?.nickname || 'Unknown'}</span>
            </div>
            {profile?.team_flair_id && (
                <span className={cn("px-3 py-1 mt-2 rounded-full text-xs text-white font-bold leading-none tracking-wide shadow-custom border border-white/10", getTeamColorClass(profile.team_flair_id))}>
                    {profile.team_flair_id}
                </span>
            )}

            {/* Fantasy Stats */}
            {!lbLoading && (
              <div className="flex items-center gap-4 mt-6 w-full max-w-xs">
                <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    {myRank && myRank <= 3 && <Trophy size={14} className="text-yellow-500" />}
                    <span className="text-2xl font-black text-white">{myRank ? `#${myRank}` : '—'}</span>
                  </div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Rank</p>
                </div>
                <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Medal size={14} className="text-zinc-400" />
                    <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">{myPoints.toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Fantasy Pts</p>
                </div>
              </div>
            )}
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg mb-6 text-sm font-bold text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/20 border border-green-500/50 text-green-200 p-3 rounded-lg mb-6 text-sm font-bold text-center">
            Profile updated successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2 ml-1">
              Nickname
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. MasterPredictor99"
              className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-white font-bold placeholder-zinc-700 outline-none focus:border-white/40 transition-colors"
              required
              maxLength={20}
              minLength={3}
            />
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider mt-2 ml-1">Visible on global leaderboards.</p>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2 ml-1">
              Team Flair
            </label>
            <select
              value={flair}
              onChange={(e) => setFlair(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-white font-bold outline-none focus:border-white/40 transition-colors appearance-none"
              required
            >
              <option value="" disabled>Select a Club...</option>
              {allTeams.map((t) => (
                <option key={t.id} value={t.name} className="bg-zinc-900">
                  {t.name} ({t.division === 'womens' ? "Women's" : "Men's"})
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={saving || !nickname || !flair || !hasChanges}
            className="w-full group h-14 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            {saving ? "Saving..." : hasChanges ? "Save Changes" : "No Changes"}
            {hasChanges && !saving && <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <button 
            onClick={() => {
                signOut();
                setView('home');
            }}
            className="flex items-center gap-2 text-xs text-red-500/80 hover:text-red-400 uppercase tracking-widest font-bold transition-colors mx-auto"
            >
            <LogOut size={16} /> Log Out
            </button>
        </div>
      </GlassPanel>

      {/* PREDICTION HISTORY BREAKDOWN */}
      <GlassPanel className="p-6 sm:p-8 relative z-10 border border-white/10 bg-black/60 backdrop-blur-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black uppercase tracking-widest text-white flex items-center gap-2">
            <Target size={18} className="text-zinc-400" /> Prediction History
          </h2>
          {!predLoading && predictions.length > 0 && (
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
              {predictions.length} prediction{predictions.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Summary Stats */}
        {!predLoading && gradedPredictions.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-white">{predictions.length}</p>
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Total</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-green-400">{gradedPredictions.length}</p>
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Graded</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <p className={`text-xl font-black ${totalPredPoints >= 0 ? 'text-white' : 'text-red-400'}`}>{totalPredPoints}</p>
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Points</p>
            </div>
          </div>
        )}

        {/* Prediction Cards */}
        {predLoading ? (
          <div className="text-center py-10 text-zinc-600 text-xs font-bold uppercase tracking-widest">
            Loading predictions...
          </div>
        ) : predictions.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-white/10 rounded-xl">
            <Target size={32} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest">No predictions yet</p>
            <p className="text-zinc-700 text-[10px] mt-1">Head to Fantasy Super League to make your first prediction!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedPredictions.map((pred) => {
              const match = pred.matches;
              if (!match) return null;

              const isGraded = pred.status === 'graded';
              const pts = pred.points_awarded || 0;
              const isPositive = pts > 0;
              const isExact = isGraded && pred.predicted_home_score === match.home_score && pred.predicted_away_score === match.away_score;

              return (
                <div key={pred.id} className={cn(
                  "bg-black/40 border rounded-xl p-4 transition-all hover:bg-white/5",
                  isExact ? "border-yellow-500/30" : "border-white/5"
                )}>
                  {/* Match header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {isGraded ? (
                        <CheckCircle2 size={14} className={isPositive ? 'text-green-500' : 'text-red-500'} />
                      ) : (
                        <Clock size={14} className="text-zinc-500" />
                      )}
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                        {new Date(match.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                      {isExact && (
                        <span className="text-[9px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Exact!</span>
                      )}
                    </div>
                    {isGraded ? (
                      <span className={cn(
                        "text-sm font-black tabular-nums px-2 py-0.5 rounded-lg",
                        isPositive ? "text-green-400 bg-green-500/10" : pts === 0 ? "text-zinc-500 bg-white/5" : "text-red-400 bg-red-500/10"
                      )}>
                        {isPositive ? '+' : ''}{pts} pts
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-lg">Pending</span>
                    )}
                  </div>

                  {/* Score comparison */}
                  <div className="flex items-center justify-center gap-3">
                    {/* Home */}
                    <div className="flex-1 text-right">
                      <p className="text-xs font-bold text-zinc-300 truncate">{match.home_team_name}</p>
                    </div>

                    {/* Predicted Score */}
                    <div className="flex flex-col items-center">
                      <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mb-0.5">You</p>
                      <div className="flex items-center gap-1 bg-white/10 border border-white/10 rounded-lg px-3 py-1.5">
                        <span className="text-lg font-black text-white tabular-nums">{pred.predicted_home_score}</span>
                        <span className="text-xs text-zinc-600 font-bold">-</span>
                        <span className="text-lg font-black text-white tabular-nums">{pred.predicted_away_score}</span>
                      </div>
                    </div>

                    {/* VS divider */}
                    <div className="text-[10px] font-black text-zinc-700">vs</div>

                    {/* Actual Score */}
                    <div className="flex flex-col items-center">
                      <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mb-0.5">Actual</p>
                      <div className={cn(
                        "flex items-center gap-1 rounded-lg px-3 py-1.5 border",
                        isGraded ? "bg-white/5 border-white/10" : "bg-transparent border-dashed border-white/10"
                      )}>
                        {isGraded ? (
                          <>
                            <span className="text-lg font-black text-zinc-300 tabular-nums">{match.home_score}</span>
                            <span className="text-xs text-zinc-600 font-bold">-</span>
                            <span className="text-lg font-black text-zinc-300 tabular-nums">{match.away_score}</span>
                          </>
                        ) : (
                          <span className="text-xs text-zinc-600 font-bold px-2">TBD</span>
                        )}
                      </div>
                    </div>

                    {/* Away */}
                    <div className="flex-1 text-left">
                      <p className="text-xs font-bold text-zinc-300 truncate">{match.away_team_name}</p>
                    </div>
                  </div>

                  {/* Points Breakdown */}
                  {isGraded && pred.breakdown && pred.breakdown.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-2">Points Breakdown</p>
                      {pred.breakdown.map((item, i) => (
                        <div key={i} className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-[11px] font-bold",
                              item.points > 0 ? "text-green-400" : item.points < 0 ? "text-red-400" : "text-zinc-600"
                            )}>
                              {item.label}
                            </p>
                            <p className="text-[9px] text-zinc-600 truncate">{item.detail}</p>
                          </div>
                          <span className={cn(
                            "text-xs font-black tabular-nums whitespace-nowrap px-2 py-0.5 rounded",
                            item.points > 0 ? "text-green-400 bg-green-500/10" : item.points < 0 ? "text-red-400 bg-red-500/10" : "text-zinc-600 bg-white/5"
                          )}>
                            {item.points > 0 ? '+' : ''}{item.points}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Show More / Less */}
            {predictions.length > 5 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
              >
                {showAll ? <><ChevronUp size={14} /> Show Less</> : <><ChevronDown size={14} /> Show All ({predictions.length})</>}
              </button>
            )}
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
