import React from 'react';
import { Calendar } from 'lucide-react';

export default function MatchCard({ match, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="bg-[#1A1820] border border-white/5 hover:border-white/20 rounded-2xl p-6 cursor-pointer hover:bg-white/5 transition-all group relative overflow-hidden"
    >
      <div className="flex justify-between items-center text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6">
        <span className="flex items-center gap-2">
          <Calendar size={14} /> 
          {new Date(match.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
        <span className={match.status === 'live' ? 'text-red-500 animate-pulse' : 'text-zinc-400'}>
          {match.status === 'live' ? `LIVE • ${match.minute || "1'"}` : match.status}
        </span>
      </div>

      <div className="flex items-center justify-between gap-4">
        {/* Home Team */}
        <div className="flex-1 text-right">
          <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white truncate">
            {match.home?.name || 'TBA'}
          </h3>
        </div>
        
        {/* Score / VS */}
        <div className="bg-black/60 px-6 py-3 rounded-xl border border-white/10 font-black text-3xl tabular-nums text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500 shadow-xl shrink-0">
          {match.status === 'scheduled' ? 'VS' : `${match.home_score || 0} - ${match.away_score || 0}`}
        </div>

        {/* Away Team */}
        <div className="flex-1 text-left">
          <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-zinc-400 truncate">
            {match.away?.name || 'TBA'}
          </h3>
        </div>
      </div>
    </div>
  );
}