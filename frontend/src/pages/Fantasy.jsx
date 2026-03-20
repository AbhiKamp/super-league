import { useState, useEffect, useMemo } from 'react';
import { useLeague } from '../context/LeagueContext';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { fetchApi } from '../hooks/useApi';
import { Send, CheckCircle2, RefreshCw, Loader2, Crown } from 'lucide-react';
import { cn } from '../utils/cn';
import { Login } from './Login';

export function Fantasy() {
  const { division } = useLeague();
  const { user } = useAuth();

  // --- Data fetching ---
  const { data: scheduleResp, loading: scheduleLoading } = useApi('/schedule');
  const { data: playersResp } = useApi('/players');
  const { data: lbResp, loading: lbLoading, refetch: refetchLb } = useApi('/predictions/leaderboard');

  // --- Form state ---
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [homeRows, setHomeRows] = useState([]);
  const [awayRows, setAwayRows] = useState([]);

  // --- Submission state ---
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Reset form when division changes
  useEffect(() => {
    setSelectedMatchId('');
    setHomeScore('');
    setAwayScore('');
    setHomeRows([]);
    setAwayRows([]);
    setSubmitted(false);
    setSubmitError(null);
  }, [division]);

  const upcomingMatches = useMemo(() =>
    (scheduleResp?.data || []).map(m => ({
      id: m.id,
      homeTeam: m.home_team || 'Team A',
      awayTeam: m.away_team || 'Team B',
      home_team_id: m.home_team_id,
      away_team_id: m.away_team_id,
    })),
  [scheduleResp]);

  const allPlayers = playersResp?.data || [];

  const selectedMatch = upcomingMatches.find(m => m.id === selectedMatchId);

  // Players for the selected match — only those from the two teams
  const matchPlayers = useMemo(() => {
    if (!selectedMatch) return allPlayers;
    return allPlayers.filter(p =>
      p.team_id === selectedMatch.home_team_id ||
      p.team_id === selectedMatch.away_team_id
    );
  }, [selectedMatch, allPlayers]);

  // Sync goal rows when scores change
  useEffect(() => {
    const hs = parseInt(homeScore) || 0;
    setHomeRows(prev => {
      if (hs === prev.length) return prev;
      if (hs > prev.length) return [...prev, ...Array.from({ length: hs - prev.length }, () => ({ scorer: '', assist: '' }))];
      return prev.slice(0, hs);
    });
  }, [homeScore]);

  useEffect(() => {
    const as = parseInt(awayScore) || 0;
    setAwayRows(prev => {
      if (as === prev.length) return prev;
      if (as > prev.length) return [...prev, ...Array.from({ length: as - prev.length }, () => ({ scorer: '', assist: '' }))];
      return prev.slice(0, as);
    });
  }, [awayScore]);

  const handleUpdateRow = (team, index, field, value) => {
    const setter = team === 'home' ? setHomeRows : setAwayRows;
    setter(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMatch || homeScore === '' || awayScore === '') return;

    setSubmitting(true);
    setSubmitError(null);

    const predicted_scorers = [...homeRows, ...awayRows]
      .map(r => r.scorer)
      .filter(Boolean);

    const predicted_assists = [...homeRows, ...awayRows]
      .map(r => r.assist)
      .filter(s => s && s !== 'Unassisted');

    try {
      await fetchApi('/predictions', {
        method: 'POST',
        body: JSON.stringify({
          match_id: selectedMatchId,
          predicted_home_score: parseInt(homeScore) || 0,
          predicted_away_score: parseInt(awayScore) || 0,
          predicted_scorers,
          predicted_assists,
        }),
      });

      setSubmitted(true);
      refetchLb(); // Refresh leaderboard after submission
    } catch (err) {
      setSubmitError('Failed to submit prediction. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setSelectedMatchId('');
    setHomeScore('');
    setAwayScore('');
    setHomeRows([]);
    setAwayRows([]);
    setSubmitError(null);
  };

  // Leaderboard data
  const leaderboard = lbResp?.data?.overall || [];

  if (scheduleLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-zinc-500 animate-pulse space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-white/20" />
        <span className="font-black tracking-[0.3em] uppercase text-sm">Loading Predictor Engine...</span>
      </div>
    );
  }

  if (!user) {
    return <div className="animate-in fade-in zoom-in-95 duration-500"><Login /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">

      {/* Header */}
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">
          Match Predictor
        </h1>
        <p className="text-zinc-400 max-w-xl mx-auto text-lg">
          Predict match outcomes to climb the global leaderboard.
        </p>

        {/* Scoring rules */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 text-left mx-auto max-w-2xl mt-4">
          <h3 className="text-lg font-black uppercase tracking-widest text-white mb-4 border-b border-white/10 pb-2">How Scoring Works</h3>
          <div className="space-y-4 text-sm font-medium text-zinc-300">
            <div>
              <p className="text-white font-bold text-base mb-1">Match Result & Scoreline</p>
              <ul className="list-disc list-inside space-y-1 ml-2 text-zinc-400">
                <li><span className="text-white font-bold">3 Points</span> — exact final score</li>
                <li><span className="text-white font-bold">1 Point</span> — correct result (win/draw/loss)</li>
              </ul>
            </div>
            <div>
              <p className="text-white font-bold text-base mb-1">Goalscorers & Assists</p>
              <ul className="list-disc list-inside space-y-1 ml-2 text-zinc-400">
                <li><span className="text-white font-bold">2 Points</span> per correct goalscorer</li>
                <li><span className="text-white font-bold">1 Point</span> per correct assist</li>
              </ul>
              <div className="mt-3 bg-black/40 p-4 rounded-xl border border-white/5 text-xs text-zinc-400 leading-relaxed relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500"></div>
                <span className="text-white font-black uppercase tracking-wider block mb-1">Frequency Strategy</span>
                You can pick the same player multiple times. The system counts totals, not order.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prediction Form */}
      {!submitted ? (
        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-10 backdrop-blur-md">

          {/* Step 1: Match */}
          <div className="mb-10">
            <h3 className="text-xl font-bold uppercase tracking-widest mb-4 text-white">1. Select Match</h3>
            {upcomingMatches.length === 0 ? (
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm py-4">No upcoming matches scheduled.</p>
            ) : (
              <select
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                className="w-full h-16 bg-black/60 border border-white/10 rounded-xl px-6 text-lg font-bold text-white appearance-none focus:outline-none focus:border-white/30 transition-colors cursor-pointer"
                required
              >
                <option value="" disabled>Choose an upcoming match...</option>
                {upcomingMatches.map(m => (
                  <option key={m.id} value={m.id} className="bg-zinc-900">
                    {m.homeTeam} vs {m.awayTeam}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedMatch && (
            <div className="animate-in fade-in zoom-in-95 duration-300 space-y-10">
              <hr className="border-white/5" />

              {/* Step 2: Score */}
              <div>
                <h3 className="text-xl font-bold uppercase tracking-widest mb-6 text-white">2. Predict Score</h3>
                <div className="flex items-center justify-center gap-4 sm:gap-8 bg-black/30 p-6 rounded-2xl border border-white/5">
                  <div className="text-right flex-1">
                    <p className="text-sm sm:text-xl font-black uppercase text-zinc-300 mb-4 truncate">{selectedMatch.homeTeam}</p>
                    <input
                      type="number" min="0" max="20"
                      value={homeScore}
                      onChange={(e) => setHomeScore(e.target.value)}
                      className="w-16 sm:w-24 h-16 sm:h-24 text-4xl sm:text-5xl text-center font-black bg-black/70 border border-white/10 rounded-2xl focus:outline-none focus:border-white/30 transition-all text-white"
                      placeholder="0" required
                    />
                  </div>
                  <div className="text-lg sm:text-2xl font-black text-zinc-600 mt-10">VS</div>
                  <div className="text-left flex-1">
                    <p className="text-sm sm:text-xl font-black uppercase text-zinc-300 mb-4 truncate">{selectedMatch.awayTeam}</p>
                    <input
                      type="number" min="0" max="20"
                      value={awayScore}
                      onChange={(e) => setAwayScore(e.target.value)}
                      className="w-16 sm:w-24 h-16 sm:h-24 text-4xl sm:text-5xl text-center font-black bg-black/70 border border-white/10 rounded-2xl focus:outline-none focus:border-white/30 transition-all text-white"
                      placeholder="0" required
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Goal events */}
              {(homeRows.length > 0 || awayRows.length > 0) && (
                <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">
                  <h3 className="text-xl font-bold uppercase tracking-widest text-white">3. Select Match Events</h3>

                  {[
                    { rows: homeRows, team: 'home', label: selectedMatch.homeTeam },
                    { rows: awayRows, team: 'away', label: selectedMatch.awayTeam },
                  ].map(({ rows, team, label }) => rows.length > 0 && (
                    <div key={team} className="space-y-4">
                      <h4 className="font-bold text-zinc-400 flex items-center gap-2 bg-white/5 p-3 rounded-xl">
                        <span className={`w-2 h-2 rounded-full ${team === 'home' ? 'bg-white' : 'bg-zinc-500'}`}></span>
                        {label} Goals ({rows.length})
                      </h4>
                      <div className="space-y-3">
                        {rows.map((row, i) => (
                          <div key={`${team}-${i}`} className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-black/40 p-4 rounded-xl border border-white/5">
                            <select
                              value={row.scorer}
                              onChange={(e) => handleUpdateRow(team, i, 'scorer', e.target.value)}
                              className="w-full h-12 bg-black/60 border border-white/10 rounded-lg px-4 text-sm font-bold text-white focus:outline-none focus:border-white/30 transition-colors"
                              required
                            >
                              <option value="" disabled>Select Goalscorer...</option>
                              {matchPlayers.map(p => (
                                <option key={p.id} value={p.id} className="bg-zinc-900">{p.name}</option>
                              ))}
                            </select>
                            <select
                              value={row.assist}
                              onChange={(e) => handleUpdateRow(team, i, 'assist', e.target.value)}
                              className="w-full h-12 bg-black/60 border border-white/10 rounded-lg px-4 text-sm font-bold text-white focus:outline-none focus:border-white/30 transition-colors"
                              required
                            >
                              <option value="" disabled>Select Assist...</option>
                              <option value="Unassisted" className="bg-zinc-900 text-zinc-400">Unassisted</option>
                              {matchPlayers.map(p => (
                                <option key={`a-${p.id}`} value={p.id} className="bg-zinc-900">{p.name}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {submitError && (
                <p className="text-red-400 font-bold text-sm text-center">{submitError}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full group h-16 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold text-lg uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <><span>Lock In Prediction</span><Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>
            </div>
          )}
        </form>
      ) : (
        /* Success state */
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-white/30 via-white to-white/30"></div>
          <CheckCircle2 className="w-16 h-16 text-white mx-auto mb-4" />
          <h3 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">Prediction Locked!</h3>
          <p className="text-zinc-400 mb-8 max-w-lg mx-auto">
            Your prediction has been saved. Points will be awarded once the match is completed and graded.
          </p>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 mx-auto px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-widest rounded-full transition-all text-sm"
          >
            <RefreshCw className="w-4 h-4" /> Predict Another Match
          </button>
        </div>
      )}

      {/* Leaderboard */}
      <div id="leaderboard" className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-10 backdrop-blur-md">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-widest text-white">Leaderboard</h2>
          <Crown className="w-6 h-6 text-zinc-500" />
        </div>

        {lbLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-600" />
          </div>
        ) : leaderboard.length === 0 ? (
          <p className="text-center text-zinc-600 font-bold uppercase tracking-widest text-sm py-8">
            No predictions graded yet. Be the first!
          </p>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => {
              const isMe = entry.user_id === user?.id;
              return (
                <div
                  key={entry.user_id}
                  className={cn(
                    "flex items-center justify-between p-4 sm:p-5 border rounded-2xl transition-all",
                    isMe
                      ? "bg-white/10 border-white/40"
                      : index === 0
                      ? "bg-white/5 border-white/20"
                      : "bg-black/40 border-white/5 hover:bg-white/5"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 flex items-center justify-center rounded-full font-black text-lg",
                      isMe ? "bg-white text-black" : index === 0 ? "bg-white text-black" : "bg-white/5 text-zinc-400"
                    )}>
                      {index + 1}
                    </div>
                    <span className="font-bold text-white text-lg">
                      {entry.username}
                      {isMe && <span className="ml-2 text-[10px] bg-white text-black px-2 py-0.5 rounded-full uppercase tracking-widest font-black">You</span>}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">
                      {entry.total_points.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest block">PTS</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
