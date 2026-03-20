import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { Activity, Trophy, Timer, CheckCircle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase'; // IMPORTANT: Added to grab the token!

export default function LiveController() {
  const { data: resp, refetch } = useApi('/admin/matches?status=live,scheduled');
  const { data: playersResp } = useApi('/players'); // Fetch all players for the dropdowns!
  
  const matches = resp?.data || [];
  const allPlayers = playersResp?.data || [];

  const [selectedMatch, setSelectedMatch] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // State for our new Goal Form
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalForm, setGoalForm] = useState({ 
    team_id: '', 
    player_id: '', 
    assist_id: '', 
    minute: '', 
    is_own_goal: false 
  });

  const handleAction = async (action, extraData = {}) => {
    setLoading(true);
    try {
      // 1. Grab the VIP Pass (Auth Token)
      const { data: { session } } = await supabase.auth.getSession();

      // 2. Attach the token to the manual fetch call
      const res = await fetch('/api/admin/matches/live', {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}` // The fix for the 401 Error!
        },
        body: JSON.stringify({
          match_id: selectedMatch.id,
          action,
          ...extraData
        })
      });
      
      const result = await res.json();
      if (result.success) {
        alert(result.message);
        refetch(); // Refresh list to update scores
        setShowGoalForm(false); // Close form on success
      } else {
        alert("Error: " + result.message);
      }
    } catch (err) {
      alert("Action failed. Check console.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const submitGoal = (e) => {
    e.preventDefault();
    handleAction('add_goal', goalForm);
  };

  // Filter players based on which team is selected in the dropdown
  const teamPlayers = allPlayers.filter(p => {
    const playerTeamId = p.team_id || p.teams?.id;
    return playerTeamId === goalForm.team_id;
  });

  return (
    <div className="p-6 space-y-8">
      {/* MATCH SELECTOR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {matches.map(m => (
          <button 
            key={m.id}
            onClick={() => { setSelectedMatch(m); setShowGoalForm(false); }}
            className={`p-4 rounded-xl border transition-all ${selectedMatch?.id === m.id ? 'border-white bg-white/10' : 'border-white/10 bg-black/40'}`}
          >
            <div className="flex justify-between text-xs uppercase font-black text-zinc-500 mb-2">
              <span>{m.division}</span>
              <span className={m.status === 'live' ? 'text-red-500 animate-pulse' : ''}>{m.status}</span>
            </div>
            <div className="font-bold text-lg">{m.home_team_name} vs {m.away_team_name}</div>
          </button>
        ))}
      </div>

      {/* MATCH CONTROL CENTER */}
      {selectedMatch && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 animate-in fade-in slide-in-from-bottom-4">
          <h3 className="text-center text-sm font-black uppercase tracking-widest text-zinc-500 mb-6">Control Center</h3>
          
          <div className="flex justify-center items-center gap-8 mb-10">
            <div className="text-center">
              <div className="text-4xl font-black">{selectedMatch.home_score}</div>
              <div className="text-xs font-bold text-zinc-400 uppercase mt-2">{selectedMatch.home_team_name}</div>
            </div>
            <div className="text-2xl font-black text-zinc-700">VS</div>
            <div className="text-center">
              <div className="text-4xl font-black">{selectedMatch.away_score}</div>
              <div className="text-xs font-bold text-zinc-400 uppercase mt-2">{selectedMatch.away_team_name}</div>
            </div>
          </div>

          {/* THE NEW GOAL FORM */}
          {showGoalForm ? (
            <form onSubmit={submitGoal} className="bg-black/50 border border-white/10 rounded-xl p-6 mb-6 space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-black uppercase tracking-widest text-sm">Register Goal</h4>
                <button type="button" onClick={() => setShowGoalForm(false)} className="text-zinc-500 hover:text-white"><X size={18}/></button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Select Team</label>
                  <select required value={goalForm.team_id} onChange={e => setGoalForm({...goalForm, team_id: e.target.value, player_id: '', assist_id: ''})} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none text-sm">
                    <option value="" disabled>Select Team...</option>
                    <option value={selectedMatch.home_team_id}>{selectedMatch.home_team_name} (Home)</option>
                    <option value={selectedMatch.away_team_id}>{selectedMatch.away_team_name} (Away)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Minute</label>
                  <input type="number" required placeholder="e.g. 45" value={goalForm.minute} onChange={e => setGoalForm({...goalForm, minute: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Goalscorer</label>
                  <select required disabled={!goalForm.team_id} value={goalForm.player_id} onChange={e => setGoalForm({...goalForm, player_id: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none text-sm disabled:opacity-50">
                    <option value="" disabled>Select Player...</option>
                    {teamPlayers.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Assist (Optional)</label>
                  <select disabled={!goalForm.team_id} value={goalForm.assist_id} onChange={e => setGoalForm({...goalForm, assist_id: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none text-sm disabled:opacity-50">
                    <option value="">No Assist (Solo)</option>
                    {teamPlayers.filter(p => p.id !== goalForm.player_id).map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 py-2">
                <input type="checkbox" id="own_goal" checked={goalForm.is_own_goal} onChange={e => setGoalForm({...goalForm, is_own_goal: e.target.checked})} className="w-4 h-4 accent-red-500" />
                <label htmlFor="own_goal" className="text-xs font-bold uppercase tracking-widest text-red-400">Mark as Own Goal</label>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-white text-black font-black uppercase tracking-widest py-3 rounded-lg hover:bg-zinc-200 transition-colors mt-2">
                {loading ? "Registering..." : "Confirm Goal"}
              </button>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button onClick={() => setShowGoalForm(true)} className="flex items-center justify-center gap-3 bg-white text-black py-4 rounded-xl font-black uppercase hover:bg-zinc-200 transition-colors">
                <Trophy size={18} /> Add Goal
              </button>
              <button disabled={loading} onClick={() => handleAction('update_time')} className="flex items-center justify-center gap-3 bg-zinc-800 text-white py-4 rounded-xl font-black uppercase hover:bg-zinc-700 transition-colors">
                <Timer size={18} /> Kick Off / Live
              </button>
              <button disabled={loading} onClick={() => { if(confirm("End match and lock scores?")) handleAction('close_match'); }} className="flex items-center justify-center gap-3 bg-red-600/20 text-red-500 border border-red-500/50 py-4 rounded-xl font-black uppercase hover:bg-red-600/30 transition-colors sm:col-span-2">
                <CheckCircle size={18} /> Final Whistle
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}