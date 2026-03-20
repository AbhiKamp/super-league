import { useLeague } from '../context/LeagueContext';
import { useApi } from '../hooks/useApi';
import { GlassPanel } from '../components/GlassPanel';
import { FormGuide } from '../components/FormGuide';

function MatchCard({ title, team1, team2, note1, note2 }) {
  return (
    <div className="bg-white/[0.03] border border-white/10 p-4 rounded-2xl relative overflow-hidden group hover:bg-white/10 transition-all backdrop-blur-md">
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-white/40 to-transparent"></div>
      <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3">{title}</h3>
      <div className="space-y-2">
        <div className="flex justify-between items-center bg-black/40 rounded-lg p-2 px-3 border border-white/5">
          <span className="font-bold text-white text-sm truncate mr-2">{team1}</span>
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest whitespace-nowrap">{note1}</span>
        </div>
        <div className="flex justify-between items-center bg-black/40 rounded-lg p-2 px-3 border border-white/5">
          <span className="font-bold text-white text-sm truncate mr-2">{team2}</span>
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest whitespace-nowrap">{note2}</span>
        </div>
      </div>
    </div>
  );
}

function WomensBracket() {
  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-12">
      <div className="text-center space-y-4">
        <h2 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">
          Road to Final
        </h2>
        <p className="text-zinc-400 font-medium tracking-widest uppercase">
          Women's Division Playoff Bracket
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
        
        {/* Stage 1 */}
        <div className="space-y-6">
          <h3 className="text-center font-black text-zinc-500 uppercase tracking-widest text-sm border-b border-white/10 pb-4">1. Qualifiers</h3>
          <MatchCard 
            title="Qualifier 1" 
            team1="Kulasthree FC" note1=""
            team2="FAAAH United" note2=""
            borderClass="border-yellow-500/20"
            gradClass="from-yellow-500/50"
            textClass="text-yellow-500"
          />
          <MatchCard 
            title="Qualifier 2" 
            team1="DILF" note1=""
            team2="Red Wolves" note2=""
            borderClass="border-yellow-500/20"
            gradClass="from-yellow-500/50"
            textClass="text-yellow-500"
          />
        </div>

        {/* Stage 2 */}
        <div className="space-y-6">
          <h3 className="text-center font-black text-zinc-500 uppercase tracking-widest text-sm border-b border-white/10 pb-4">2. Eliminator</h3>
          <div className="hidden lg:block h-[112px]"></div>
          <MatchCard 
            title="Eliminator 1" 
            team1="Loser of Q1" note1=""
            team2="Loser of Q2" note2=""
            borderClass="border-red-500/20"
            gradClass="from-red-500/50"
            textClass="text-red-500"
          />
        </div>

        {/* Stage 3 */}
        <div className="space-y-6">
          <h3 className="text-center font-black text-zinc-500 uppercase tracking-widest text-sm border-b border-white/10 pb-4">3. Semifinals</h3>
          <MatchCard 
            title="Semifinal 1" 
            team1="Fivestars" note1=""
            team2="Winner of Q1" note2=""
            borderClass="border-cyan-400/20"
            gradClass="from-cyan-400/50"
            textClass="text-cyan-400"
          />
          <MatchCard 
            title="Semifinal 2" 
            team1="Winner of Q2" note1=""
            team2="Winner of E1" note2=""
            borderClass="border-cyan-400/20"
            gradClass="from-cyan-400/50"
            textClass="text-cyan-400"
          />
        </div>

        {/* Stage 4 */}
        <div className="space-y-6">
          <h3 className="text-center font-black text-zinc-500 uppercase tracking-widest text-sm border-b border-white/10 pb-4">4. Finals</h3>
          <MatchCard 
            title="Final" 
            team1="Winner of Semi 1" note1="Champion"
            team2="Winner of Semi 2" note2="Runner Up"
            borderClass="border-yellow-300/30"
            gradClass="from-yellow-300/60"
            textClass="text-yellow-300"
          />
          <MatchCard 
            title="Losers Final" 
            team1="Loser of Semi 1" note1="3rd Place"
            team2="Loser of Semi 2" note2=""
            borderClass="border-zinc-400/20"
            gradClass="from-zinc-400/50"
            textClass="text-zinc-400"
          />
        </div>

      </div>
    </div>
  );
}

export function Standings() {
  const { division } = useLeague();
  const { data: apiResponse, loading, error } = useApi('/standings');
  
  if (division === 'womens') {
    return <WomensBracket />;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 animate-pulse">
        <span className="text-zinc-500 font-black tracking-widest uppercase text-sm">
          Loading Live Standings...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="text-red-500/80 font-black tracking-widest uppercase text-sm">
          Database Connection Failed
        </span>
      </div>
    );
  }

  // Support both isolated data object arrays or encapsulated wrappers
  const standings = apiResponse?.data?.standings || apiResponse?.data || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex items-end justify-between px-2">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase">League Standings</h2>
          <p className="text-zinc-400 mt-1 font-medium">Top 4 qualify for the playoffs.</p>
        </div>
      </div>

      <GlassPanel className="overflow-x-auto">
        <div className="min-w-[800px] w-full">
          <div className="grid grid-cols-[4rem_1.5fr_3rem_3rem_3rem_3rem_3rem_3rem_3rem_4rem_10rem] gap-2 p-4 border-b border-white/10 text-xs font-bold tracking-wider text-zinc-500 bg-black/60 uppercase">
            <div className="text-center">Rank</div>
            <div>Club</div>
            <div className="text-center">MP</div>
            <div className="text-center">W</div>
            <div className="text-center">D</div>
            <div className="text-center">L</div>
            <div className="text-center">GF</div>
            <div className="text-center">GA</div>
            <div className="text-center text-zinc-300">GD</div>
            <div className="text-center text-white">Pts</div>
            <div className="pl-4">Form</div>
          </div>
          
          <div className="flex flex-col">
            {standings.map((team, idx) => {
              const promotes = idx < 4;
              return (
                <div 
                  key={team.teamId} // Changed from team.club
                  className={`
                    grid grid-cols-[4rem_1.5fr_3rem_3rem_3rem_3rem_3rem_3rem_3rem_4rem_10rem] gap-2 p-4 items-center 
                    ${idx !== standings.length - 1 ? 'border-b border-white/5' : ''} 
                    hover:bg-white/5 transition-colors
                    ${promotes ? 'bg-white/[0.02]' : ''}
                  `}
                >
                  <div className="font-mono text-xl font-bold text-center text-zinc-400">{team.rank}</div>
                  
                  {/* Changed to teamName */}
                  <div className="font-bold text-lg">{team.teamName}</div>
                  
                  {/* Mapped all stats to team.stats object with optional chaining */}
                  <div className="text-center text-zinc-400">{team.stats?.matchesPlayed || 0}</div>
                  <div className="text-center text-zinc-400">{team.stats?.won || 0}</div>
                  <div className="text-center text-zinc-400">{team.stats?.drawn || 0}</div>
                  <div className="text-center text-zinc-400">{team.stats?.lost || 0}</div>
                  <div className="text-center text-zinc-400">{team.stats?.goalsFor || 0}</div>
                  <div className="text-center text-zinc-400">{team.stats?.goalsAgainst || 0}</div>
                  
                  {/* Safely handle Goal Difference */}
                  <div className="text-center font-mono text-zinc-300">
                    {team.stats?.goalDifference > 0 ? `+${team.stats?.goalDifference}` : (team.stats?.goalDifference || 0)}
                  </div>
                  
                  {/* Points */}
                  <div className="text-center font-black text-2xl">{team.stats?.points || 0}</div>
                  
                  <div className="pl-4 hidden sm:block">
                    <FormGuide form={team.form || []} />
                  </div>
                  {/* Small form indicator for tiny screens */}
                  <div className="pl-4 block sm:hidden text-xs tracking-widest text-zinc-400">
                    {(team.form || []).join('')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
