import React, { useEffect, useState } from 'react';
import { useLeague } from '../context/LeagueContext';
import { ArrowLeft, Loader2, Shield, Star, Hexagon } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const getStatColor = (val) => {
  if (val >= 80) return 'bg-[#00e676]';
  if (val >= 70) return 'bg-[#ffc400]';
  if (val >= 60) return 'bg-[#ff9100]';
  return 'bg-[#ff1744]';
};

// Fallback data so the app doesn't crash before you update your database!
const defaultAttributes = {
  bio: { height: "—", weight: "—", preferredFoot: "Right", weakFoot: 3, skillMoves: 3, altPositions: [] },
  stats: {
    Pace: { total: 0, subs: { Acceleration: 0, 'Sprint Speed': 0 } },
    Shooting: { total: 0, subs: { Positioning: 0, Finishing: 0, 'Shot Power': 0 } },
    Passing: { total: 0, subs: { Vision: 0, Crossing: 0, 'Short Pass': 0 } },
    Dribbling: { total: 0, subs: { Agility: 0, Balance: 0, 'Ball Control': 0 } },
    Defending: { total: 0, subs: { Interceptions: 0, 'Stand Tackle': 0 } },
    Physicality: { total: 0, subs: { Jumping: 0, Stamina: 0, Strength: 0 } }
  },
  playStyles: []
};

export default function PlayerProfile() {
  const { setView } = useLeague();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('selectedPlayer');
    if (!raw) { setView('teams'); return; }

    const base = JSON.parse(raw);

    fetch(`${API_BASE_URL}/players/${base.id}`)
      .then(r => r.json())
      .then(res => {
        if (res.success) setPlayer(res.data);
        else setError('Failed to load player.');
      })
      .catch(() => setError('Failed to load player.'))
      .finally(() => setLoading(false));
  }, []);

  const handleBack = () => {
    sessionStorage.removeItem('selectedPlayer');
    setView('teams'); // Or 'roster' depending on your routing
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-zinc-500 animate-pulse space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-white/20" />
        <span className="font-black tracking-[0.3em] uppercase text-sm">Loading Player...</span>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-zinc-500 space-y-4">
        <Shield className="w-12 h-12 text-zinc-700" />
        <span className="font-black tracking-[0.3em] uppercase text-sm">{error || 'Player not found'}</span>
        <button onClick={handleBack} className="text-xs text-zinc-400 hover:text-white uppercase tracking-widest font-bold transition-colors">
          Back to Teams
        </button>
      </div>
    );
  }

  // Merge database attributes with the fallback safely
  const attrs = player.attributes || defaultAttributes;
  const stats = attrs.stats || defaultAttributes.stats;
  const bio = attrs.bio || defaultAttributes.bio;
  const styles = attrs.playStyles || [];

  return (
    <div className="w-full bg-[#0F0E13] min-h-screen text-white p-4 md:p-8 font-sans pb-20 animate-in fade-in duration-300">
      
      <button onClick={handleBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 group">
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        Back to Squad
      </button>

      <div className="flex flex-col xl:flex-row gap-8 max-w-7xl mx-auto">
        
        {/* LEFT COLUMN: The Gold Card & Bio */}
        <div className="flex flex-col lg:flex-row xl:flex-col gap-6 w-full xl:w-1/3">
          
          <div className="flex gap-6 items-start">
            {/* The Gold Card */}
            <div className="w-48 h-64 rounded-xl bg-gradient-to-br from-[#E8C881] via-[#C9A050] to-[#966E2D] p-1 shadow-2xl relative overflow-hidden shrink-0 flex flex-col items-center">
              <div className="absolute top-3 left-3 flex flex-col items-center text-[#2A1E04]">
                <span className="text-3xl font-black leading-none">{player.overall_rating || 50}</span>
                <span className="text-sm font-bold">{player.position || 'RES'}</span>
              </div>
              
              {player.image_url ? (
                 <img src={player.image_url} alt={player.name} className="w-full h-full object-cover mt-8 drop-shadow-lg opacity-80 mix-blend-multiply" />
              ) : (
                 <Shield className="w-24 h-24 text-[#2A1E04]/50 mt-16" />
              )}
             
              <div className="absolute bottom-2 w-full flex justify-center gap-2 text-[#2A1E04] font-bold text-[10px] uppercase">
                <div className="flex flex-col items-center"><span>PAC</span><span>{stats.Pace?.total || 0}</span></div>
                <div className="flex flex-col items-center"><span>SHO</span><span>{stats.Shooting?.total || 0}</span></div>
                <div className="flex flex-col items-center"><span>PAS</span><span>{stats.Passing?.total || 0}</span></div>
                <div className="flex flex-col items-center"><span>DRI</span><span>{stats.Dribbling?.total || 0}</span></div>
                <div className="flex flex-col items-center"><span>DEF</span><span>{stats.Defending?.total || 0}</span></div>
                <div className="flex flex-col items-center"><span>PHY</span><span>{stats.Physicality?.total || 0}</span></div>
              </div>
            </div>

            <div className="flex flex-col mt-4">
              <span className="text-3xl font-bold text-gray-300 leading-tight">{player.first_name}</span>
              <span className="text-5xl font-black leading-none">{player.last_name}</span>
            </div>
          </div>

          {/* Bio Data Panel */}
          <div className="bg-[#1A1820] rounded-2xl p-6 grid grid-cols-2 gap-y-6 border border-white/5">
            <div>
              <p className="text-xs text-gray-400 mb-1">Position</p>
              <span className="bg-white/10 px-2 py-1 rounded text-sm font-bold">{player.position || '—'}</span>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Weak Foot</p>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => <Star key={i} size={14} className={i < bio.weakFoot ? "fill-white text-white" : "text-gray-600"} />)}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Skill Moves</p>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => <Star key={i} size={14} className={i < bio.skillMoves ? "fill-white text-white" : "text-gray-600"} />)}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Preferred Foot</p>
              <p className="font-bold">{bio.preferredFoot}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Height</p>
              <p className="font-bold">{bio.height}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Weight</p>
              <p className="font-bold">{bio.weight}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-400 mb-2">Alt Positions</p>
              <div className="flex gap-2">
                {bio.altPositions?.map(pos => (
                  <span key={pos} className="bg-white/10 px-2 py-1 rounded text-xs font-bold">{pos}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: The 6 Attribute Bars & Playstyles */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-[#1A1820] rounded-2xl p-6 border border-white/5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Object.entries(stats).map(([category, data]) => (
                <div key={category} className="flex flex-col gap-3">
                  <div className="flex justify-between items-center border-b border-white/10 pb-1">
                    <span className="font-bold text-lg">{category}</span>
                    <span className="font-black text-xl">{data.total}</span>
                  </div>
                  {data.subs && Object.entries(data.subs).map(([statName, val]) => (
                    <div key={statName} className="flex flex-col gap-1 text-sm">
                      <div className="flex justify-between text-gray-400">
                        <span>{statName}</span>
                        <span className="text-white font-medium">{val}</span>
                      </div>
                      <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full ${getStatColor(val)}`} style={{ width: `${val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {styles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {styles.map(style => (
                <div key={style.name} className="bg-[#1A1820] rounded-xl p-4 border border-white/5 flex flex-col gap-2 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-2">
                    <Hexagon size={20} className="text-[#E8C881]" />
                    <span className="font-bold">{style.name}</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{style.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}