import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { GlassPanel } from '../components/GlassPanel';
import { useApi } from '../hooks/useApi';
import { Send, User } from 'lucide-react';

export function Onboarding() {
  const { user, setProfile, signOut } = useAuth();
  const [nickname, setNickname] = useState('');
  const [flair, setFlair] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const { data: standingsResp } = useApi('/standings');
  const allTeams = standingsResp?.data?.standings || standingsResp?.data || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nickname.trim() || !flair) return;
    
    setSaving(true);
    setError(null);

    const updatedProfile = {
      nickname: nickname.trim(),
      team_flair_id: flair,
    };

    // The trigger already created the user_profiles row on signup — we just UPDATE it
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update(updatedProfile)
      .eq('id', user.id);

    if (updateError) {
      console.error("Profile saving error:", updateError.message);
      setError("Failed to save profile. Are you sure you are online?");
      setSaving(false);
      return;
    }

    setProfile({ id: user.id, email: user.email, ...updatedProfile });
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background aesthetics */}
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] -z-10 mix-blend-screen" />

      <GlassPanel className="max-w-lg w-full p-8 text-center relative z-10 border border-white/10 bg-black/60 backdrop-blur-2xl">
        <User className="w-12 h-12 text-white mx-auto mb-6" />
        <h1 className="text-3xl font-black uppercase tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">
          Welcome to Super League
        </h1>
        <p className="text-zinc-400 font-medium mb-8 text-sm">
          You logged in with {user.email}. Complete your profile to access predictions and leaderboards.
        </p>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg mb-6 text-sm font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2 ml-1">
              Choose Nickname
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
              Select Team Flair
            </label>
            <select
              value={flair}
              onChange={(e) => setFlair(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-white font-bold outline-none focus:border-white/40 transition-colors appearance-none"
              required
            >
              <option value="" disabled>Select a Club...</option>
              {allTeams.map((t) => (
                <option key={t.teamId} value={t.teamName} className="bg-zinc-900">
                  {t.teamName}
                </option>
              ))}
                </select>
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider mt-2 ml-1">Shows your allegiance next to your name.</p>
          </div>

          <button
            type="submit"
            disabled={saving || !nickname || !flair}
            className="w-full group h-14 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Enter The League"}
            <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <button 
          onClick={() => signOut()}
          className="mt-8 text-xs text-zinc-600 hover:text-white uppercase tracking-widest font-bold transition-colors"
        >
          Cancel & Log Out
        </button>
      </GlassPanel>
    </div>
  );
}
