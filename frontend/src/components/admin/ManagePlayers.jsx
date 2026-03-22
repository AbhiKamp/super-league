import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { UserPlus, Trash2, Copy, Check, UploadCloud } from 'lucide-react';
import { supabase } from '../../lib/supabase';
const API_URL = import.meta.env.VITE_API_URL || '/api';

const initialFormState = { 
  first_name: '', last_name: '', team_id: '', position: '', alt_positions: '', jersey_number: '', overall_rating: 50, 
  play_style_name: '', play_style_desc: '',
  bio: { height: '', weight: '', preferredFoot: 'Right', weakFoot: 3, skillMoves: 3 },
  stats: { 
    pace: { total: 50, acceleration: 50, sprintSpeed: 50 },
    shooting: { total: 50, finishing: 50, shotPower: 50, positioning: 50 },
    passing: { total: 50, vision: 50, crossing: 50, shortPass: 50 },
    dribbling: { total: 50, agility: 50, balance: 50, ballControl: 50 },
    defending: { total: 50, standTackle: 50, interceptions: 50 },
    physicality: { total: 50, jumping: 50, stamina: 50, strength: 50 }
  }
};

export default function ManagePlayers() {
  const { data: playersResp, refetch: refetchPlayers } = useApi('/players'); 
  const { data: teamsResp } = useApi('/teams?all=true'); 
  
  const players = playersResp?.data || [];
  const teams = teamsResp?.data || [];

  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [activeFormTab, setActiveFormTab] = useState('basic');
  const [imageFile, setImageFile] = useState(null);
  const [playStyleImageFile, setPlayStyleImageFile] = useState(null); // NEW: Image state for PlayStyle
  const [form, setForm] = useState(initialFormState);

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStatChange = (category, field, value) => {
    setForm(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        [category]: { ...prev.stats[category], [field]: parseInt(value) || 0 }
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      let finalImageUrl = null;
      let finalPlayStyleUrl = null;

      // Upload main player image
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('player-images').upload(fileName, imageFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('player-images').getPublicUrl(fileName);
        finalImageUrl = publicUrl;
      }

      // NEW: Upload PlayStyle Icon
      if (playStyleImageFile) {
        const fileExt = playStyleImageFile.name.split('.').pop();
        const fileName = `ps_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const { error: psUploadError } = await supabase.storage.from('player-images').upload(fileName, playStyleImageFile);
        if (psUploadError) throw psUploadError;
        const { data: { publicUrl } } = supabase.storage.from('player-images').getPublicUrl(fileName);
        finalPlayStyleUrl = publicUrl;
      }

      // Convert PlayStyle Data into array
      const playStylesArray = [];
      if (form.play_style_name) {
        playStylesArray.push({
          name: form.play_style_name.trim(),
          description: form.play_style_desc.trim(),
          icon_url: finalPlayStyleUrl
        });
      }

      const altPositionsArray = form.alt_positions.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);

      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        team_id: form.team_id,
        position: form.position.toUpperCase(),
        jersey_number: parseInt(form.jersey_number) || null,
        image_url: finalImageUrl, 
        overall_rating: parseInt(form.overall_rating) || 50,
        attributes: {
          bio: { ...form.bio, altPositions: altPositionsArray },
          playStyles: playStylesArray,
          stats: {
            Pace: { total: form.stats.pace.total, subs: { Acceleration: form.stats.pace.acceleration, "Sprint Speed": form.stats.pace.sprintSpeed } },
            Shooting: { total: form.stats.shooting.total, subs: { Finishing: form.stats.shooting.finishing, "Shot Power": form.stats.shooting.shotPower, Positioning: form.stats.shooting.positioning } },
            Passing: { total: form.stats.passing.total, subs: { Vision: form.stats.passing.vision, Crossing: form.stats.passing.crossing, "Short Pass": form.stats.passing.shortPass } },
            Dribbling: { total: form.stats.dribbling.total, subs: { Agility: form.stats.dribbling.agility, Balance: form.stats.dribbling.balance, "Ball Control": form.stats.dribbling.ballControl } },
            Defending: { total: form.stats.defending.total, subs: { Interceptions: form.stats.defending.interceptions, "Stand Tackle": form.stats.defending.standTackle } },
            Physicality: { total: form.stats.physicality.total, subs: { Jumping: form.stats.physicality.jumping, Stamina: form.stats.physicality.stamina, Strength: form.stats.physicality.strength } }
          }
        }
      };

      const res = await fetch(`${API_URL}/admin/players`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        alert("Player added to Database!");
        refetchPlayers();
        setImageFile(null);
        setPlayStyleImageFile(null); // Reset PS image
        setForm(initialFormState);
        setActiveFormTab('basic');
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.message}`);
      }
    } catch (err) {
      alert("Failed to add player. Check console for details.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this player?")) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`${API_URL}/admin/players?id=${id}`, { 
        method: 'DELETE', credentials: 'include', headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      refetchPlayers();
    } catch (err) {
      alert("Failed to delete.");
    }
  };

  const statGroups = [
    { id: 'pace', title: 'Pace', subs: [{ id: 'acceleration', label: 'Acceleration' }, { id: 'sprintSpeed', label: 'Sprint Speed' }] },
    { id: 'shooting', title: 'Shooting', subs: [{ id: 'finishing', label: 'Finishing' }, { id: 'shotPower', label: 'Shot Power' }, { id: 'positioning', label: 'Positioning' }] },
    { id: 'passing', title: 'Passing', subs: [{ id: 'vision', label: 'Vision' }, { id: 'crossing', label: 'Crossing' }, { id: 'shortPass', label: 'Short Pass' }] },
    { id: 'dribbling', title: 'Dribbling', subs: [{ id: 'agility', label: 'Agility' }, { id: 'balance', label: 'Balance' }, { id: 'ballControl', label: 'Ball Control' }] },
    { id: 'defending', title: 'Defending', subs: [{ id: 'standTackle', label: 'Stand Tackle' }, { id: 'interceptions', label: 'Interceptions' }] },
    { id: 'physicality', title: 'Physicality', subs: [{ id: 'jumping', label: 'Jumping' }, { id: 'stamina', label: 'Stamina' }, { id: 'strength', label: 'Strength' }] }
  ];

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/40">
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-300 flex items-center gap-2">
            <UserPlus size={16} className="text-[#E8C881]" /> Create EA FC Player
          </h3>
          <div className="flex bg-black rounded-lg border border-white/10 overflow-hidden">
            <button type="button" onClick={() => setActiveFormTab('basic')} className={`px-4 py-2 text-xs font-bold uppercase tracking-widest ${activeFormTab === 'basic' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>Basic</button>
            <button type="button" onClick={() => setActiveFormTab('bio')} className={`px-4 py-2 text-xs font-bold uppercase tracking-widest ${activeFormTab === 'bio' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>Bio & PlayStyles</button>
            <button type="button" onClick={() => setActiveFormTab('stats')} className={`px-4 py-2 text-xs font-bold uppercase tracking-widest ${activeFormTab === 'stats' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>Attributes</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* TAB 1: BASIC INFO */}
          {activeFormTab === 'basic' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-left-4">
              <input type="text" placeholder="First Name" required value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} className="col-span-1 md:col-span-2 bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#E8C881]/50" />
              <input type="text" placeholder="Last Name" required value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} className="col-span-1 md:col-span-2 bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#E8C881]/50" />
              <select required value={form.team_id} onChange={e => setForm({...form, team_id: e.target.value})} className="col-span-1 md:col-span-2 bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#E8C881]/50 appearance-none">
                <option value="" disabled>Select Team...</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <input type="text" placeholder="Position (e.g. ST)" required value={form.position} onChange={e => setForm({...form, position: e.target.value})} className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#E8C881]/50" />
              <input type="number" placeholder="Jersey No." required value={form.jersey_number} onChange={e => setForm({...form, jersey_number: e.target.value})} className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#E8C881]/50" />
              
              <div className="col-span-1 md:col-span-3 bg-black/50 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-3">
                <UploadCloud size={20} className="text-zinc-500" />
                <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="w-full text-sm text-zinc-400 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-white/10 file:text-white hover:file:bg-white/20" />
              </div>
              <input type="number" placeholder="OVR (1-99)" min="1" max="99" required value={form.overall_rating} onChange={e => setForm({...form, overall_rating: e.target.value})} className="bg-[#E8C881]/20 text-[#E8C881] placeholder:text-[#E8C881]/50 font-black border border-[#E8C881]/30 rounded-xl px-4 py-3 outline-none focus:border-[#E8C881]" />
            </div>
          )}

          {/* TAB 2: BIO & PLAYSTYLES */}
          {activeFormTab === 'bio' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-left-4">
              {/* LEFT: Bio */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500 border-b border-white/10 pb-2">Physical Bio</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Height</label>
                    <input type="text" placeholder="e.g. 182cm / 6'0''" value={form.bio.height} onChange={e => setForm({...form, bio: {...form.bio, height: e.target.value}})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#E8C881]/50" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Weight</label>
                    <input type="text" placeholder="e.g. 76kg" value={form.bio.weight} onChange={e => setForm({...form, bio: {...form.bio, weight: e.target.value}})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#E8C881]/50" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Preferred Foot</label>
                    <select value={form.bio.preferredFoot} onChange={e => setForm({...form, bio: {...form.bio, preferredFoot: e.target.value}})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#E8C881]/50 appearance-none">
                      <option value="Right">Right</option><option value="Left">Left</option><option value="Both">Both</option>
                    </select>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-1/2">
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Weak Foot</label>
                      <input type="number" min="1" max="5" value={form.bio.weakFoot} onChange={e => setForm({...form, bio: {...form.bio, weakFoot: parseInt(e.target.value)}})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#E8C881]/50 text-center" />
                    </div>
                    <div className="w-1/2">
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Skill Moves</label>
                      <input type="number" min="1" max="5" value={form.bio.skillMoves} onChange={e => setForm({...form, bio: {...form.bio, skillMoves: parseInt(e.target.value)}})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#E8C881]/50 text-center" />
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Alt Positions (Comma Separated)</label>
                  <input type="text" placeholder="e.g. LW, CF" value={form.alt_positions} onChange={e => setForm({...form, alt_positions: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#E8C881]/50" />
                </div>
              </div>

              {/* RIGHT: Signature PlayStyle (NEW UI) */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-[#E8C881] border-b border-[#E8C881]/20 pb-2">Signature PlayStyle (Optional)</h4>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">PlayStyle Name</label>
                  <input type="text" placeholder="e.g. Finesse Shot+" value={form.play_style_name} onChange={e => setForm({...form, play_style_name: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#E8C881]/50" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Description</label>
                  <textarea placeholder="e.g. Faster finesse shots with max curve and accuracy" value={form.play_style_desc} onChange={e => setForm({...form, play_style_desc: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#E8C881]/50 h-20 resize-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">PlayStyle Icon Image</label>
                  <div className="bg-black/50 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-3">
                    <UploadCloud size={20} className="text-zinc-500" />
                    <input type="file" accept="image/*" onChange={e => setPlayStyleImageFile(e.target.files[0])} className="w-full text-sm text-zinc-400 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#E8C881]/10 file:text-[#E8C881] hover:file:bg-[#E8C881]/20 cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: IN-DEPTH ATTRIBUTES */}
          {activeFormTab === 'stats' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-in slide-in-from-left-4">
              {statGroups.map(group => (
                <div key={group.id} className="bg-black/50 border border-white/10 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                    <h4 className="font-black uppercase tracking-widest text-[#E8C881] text-sm">{group.title}</h4>
                    <input type="number" min="1" max="99" value={form.stats[group.id].total} onChange={e => handleStatChange(group.id, 'total', e.target.value)} className="w-12 bg-transparent text-right font-black text-xl outline-none" />
                  </div>
                  <div className="space-y-3">
                    {group.subs.map(sub => (
                      <div key={sub.id} className="flex justify-between items-center text-xs">
                        <span className="text-zinc-400 font-bold">{sub.label}</span>
                        <input type="number" min="1" max="99" value={form.stats[group.id][sub.id]} onChange={e => handleStatChange(group.id, sub.id, e.target.value)} className="w-10 bg-white/5 border border-white/10 rounded px-1 py-1 text-center outline-none focus:border-[#E8C881]" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-white/5">
            <button type="submit" disabled={loading} className="w-full md:w-auto px-8 bg-[#E8C881] text-black font-black uppercase tracking-widest py-3 rounded-xl hover:bg-[#F9D992] transition-colors">
              {loading ? "Processing..." : "Publish Player"}
            </button>
          </div>
        </form>
      </div>

      {/* PLAYER ROSTER TABLE */}
      <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_2fr_1fr] gap-4 p-4 border-b border-white/10 text-[10px] font-black tracking-widest text-zinc-500 uppercase bg-black/60">
          <div>Name</div><div>Team</div><div>OVR / Pos</div><div>No.</div><div>UUID</div><div className="text-right">Actions</div>
        </div>
        <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
          {players.map(p => (
            <div key={p.id} className="grid grid-cols-[2fr_1.5fr_1fr_1fr_2fr_1fr] gap-4 p-4 items-center hover:bg-white/5 transition-colors text-sm">
              <div className="font-bold flex items-center gap-2">
                {p.image_url ? <img src={p.image_url} className="w-6 h-6 rounded-full object-cover" /> : <div className="w-6 h-6 rounded-full bg-white/10" />}
                {p.first_name} {p.last_name}
              </div>
              <div className="text-zinc-400">{teams.find(t => t.id === p.team_id)?.name || 'Free Agent'}</div>
              <div className="font-mono flex items-center gap-2">
                <span className="text-[#E8C881] font-black">{p.overall_rating || 50}</span> 
                <span className="text-zinc-500 text-xs">{p.position}</span>
              </div>
              <div className="font-mono text-zinc-300">{p.jersey_number || '-'}</div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-zinc-500 truncate w-24">{p.id}</span>
                <button onClick={() => handleCopy(p.id)} className="text-zinc-400 hover:text-white" title="Copy ID">
                  {copiedId === p.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => handleDelete(p.id)} className="text-red-500/50 hover:text-red-500"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}