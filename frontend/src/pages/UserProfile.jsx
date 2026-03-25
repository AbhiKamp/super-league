import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLeague } from '../context/LeagueContext';
import { supabase } from '../lib/supabase';
import { GlassPanel } from '../components/GlassPanel';
import { Send, User, LogOut } from 'lucide-react';
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
    </div>
  );
}
