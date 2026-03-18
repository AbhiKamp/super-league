import React from 'react';
import { useLeague } from '../context/LeagueContext'; // Using your custom router!

// DUMMY DATA: Matches your Premier League screenshot perfectly!
const teamColor = "#E60000"; // Manchester United Red
const roster = [
  { id: '1', name: 'Altay Bayindir', position: 'Goalkeepers', number: 1, country: 'Turkey', flag: '🇹🇷', img: 'https://ui-avatars.com/api/?name=Altay+Bayindir&background=random' },
  { id: '2', name: 'Tom Heaton', position: 'Goalkeepers', number: 22, country: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', img: 'https://ui-avatars.com/api/?name=Tom+Heaton&background=random' },
  { id: '3', name: 'Diogo Dalot', position: 'Defenders', number: 2, country: 'Portugal', flag: '🇵🇹', img: 'https://ui-avatars.com/api/?name=Diogo+Dalot&background=random' },
  { id: '4', name: 'Noussair Mazraoui', position: 'Defenders', number: 3, country: 'Morocco', flag: '🇲🇦', img: 'https://ui-avatars.com/api/?name=Noussair+Mazraoui&background=random' },
  { id: '5', name: 'Matthijs de Ligt', position: 'Defenders', number: 4, country: 'Netherlands', flag: '🇳🇱', img: 'https://ui-avatars.com/api/?name=Matthijs+de+Ligt&background=random' },
  { id: '6', name: 'Harry Maguire', position: 'Defenders', number: 5, country: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', img: 'https://ui-avatars.com/api/?name=Harry+Maguire&background=random' },
];

export default function TeamRoster() {
  // Pull in setView from your context!
  const { setView } = useLeague();

  // 1. DATA GROUPING ALGORITHM
  const groupedPlayers = roster.reduce((acc, player) => {
    if (!acc[player.position]) {
      acc[player.position] = [];
    }
    acc[player.position].push(player);
    return acc;
  }, {});

  return (
    <div className="w-full bg-[#140F1F] p-4 md:p-8 text-white font-sans rounded-2xl border border-white/10">
      <h1 className="text-3xl font-bold mb-8 text-center md:text-left tracking-tight">First Team Roster</h1>

      {/* 2. RESPONSIVE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* Loop through each position category */}
        {Object.entries(groupedPlayers).map(([position, players]) => (
          <div key={position} className="flex flex-col">
            
            {/* Category Header */}
            <h2 className="text-xl font-semibold mb-4 text-white border-b border-white/10 pb-2 tracking-wider">{position}</h2>
            
            {/* 3. CATEGORY CARD */}
            <div className="flex flex-col gap-3">
              {players.map((player) => (
                
                // 4. ROUTING: Click to open player details using YOUR setup
                <div 
                  key={player.id}
                  onClick={() => setView('playerDetail')} // This will be your EA FC stats page!
                  className="flex items-center gap-4 group hover:bg-white/5 p-3 rounded-xl transition-all duration-200 border border-transparent hover:border-white/10 cursor-pointer"
                >
                  {/* 5. DYNAMIC STYLING: Circular image */}
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden shrink-0 border-2 border-transparent group-hover:border-white/20 transition-all shadow-lg"
                    style={{ backgroundColor: teamColor }} 
                  >
                    <img 
                      src={player.img} 
                      alt={player.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>

                  {/* Player Details */}
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-gray-100 tracking-wide group-hover:text-white transition-colors">
                      {player.name}
                    </span>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mt-0.5">
                      <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-xs">{player.number}</span>
                      <span className="text-xs">•</span>
                      <span>{player.flag}</span>
                      <span className="text-gray-300">{player.country}</span>
                    </div>
                  </div>
                </div>
                
              ))}
            </div>
          </div>
        ))}
        
      </div>
    </div>
  );
}