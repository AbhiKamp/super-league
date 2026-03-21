import { createContext, useContext, useState } from 'react';

const LeagueContext = createContext(undefined);

export function LeagueProvider({ children }) {
  const [division, setDivision] = useState('womens'); // 'mens' | 'womens'
  
  // ADDED 'matchTimeline' and 'player-profile' to your tracker comment!
  const [view, setView] = useState('home'); // 'home' | 'matches' | 'standings' | 'teams' | 'fantasy' | 'leaderboard' | 'news' | 'legends' | 'rules' | 'login' | 'player-profile' | 'matchTimeline'
  
  const [fantasyPrediction, setFantasyPrediction] = useState(null);
  const [globalPollState, setGlobalPollState] = useState({ mens: null, womens: null });
  const [selectedArticle, setSelectedArticle] = useState(null);

  return (
    <LeagueContext.Provider value={{ 
      division, setDivision, 
      view, setView, 
      fantasyPrediction, setFantasyPrediction, 
      globalPollState, setGlobalPollState,
      selectedArticle, setSelectedArticle 
    }}>
      {children}
    </LeagueContext.Provider>
  );
}

export function useLeague() {
  const context = useContext(LeagueContext);
  if (context === undefined) {
    throw new Error('useLeague must be used within a LeagueProvider');
  }
  return context;
}