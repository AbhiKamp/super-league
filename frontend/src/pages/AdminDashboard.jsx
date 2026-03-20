import React, { useState,useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Users, Shield, Calendar, Newspaper, Activity, LogOut, Swords } from 'lucide-react';
import { GlassPanel } from '../components/GlassPanel';
import LiveController from '../components/admin/LiveController';
import ManagePlayers from '../components/admin/ManagePlayers';
import ScheduleMatches from '../components/admin/ScheduleMatches';

// Placeholder components for your modules
const ManageTeams = () => <div className="p-8"><h2 className="text-2xl font-black">Manage Teams</h2><p>Data table goes here...</p></div>;
const ManageNews = () => <div className="p-8"><h2 className="text-2xl font-black">Manage News</h2><p>Data table goes here...</p></div>;

export function AdminDashboard() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('live');
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) {
        setCheckingRole(false);
        return;
      }

      // Check the user_roles table!
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (data) {
        setIsAdmin(true);
      }
      setCheckingRole(false);
    }
    
    checkAdminStatus();
  }, [user]);

  if (checkingRole) return <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500 font-bold uppercase tracking-widest">Verifying Clearance...</div>;
  
  // The Ultimate Kick-Out: No user OR not an admin!
  if (!user || !isAdmin) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-10 space-y-4">
      <h1 className="text-4xl font-black text-red-500 uppercase tracking-widest">403 Forbidden</h1>
      <p className="text-zinc-500 tracking-widest uppercase text-sm">You do not have command clearance.</p>
    </div>
  );


  const tabs = [
    { id: 'live', label: 'Live Matches', icon: Activity, color: 'text-red-500' },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'teams', label: 'Teams', icon: Shield },
    { id: 'players', label: 'Players', icon: Users },
    { id: 'news', label: 'Newsletter', icon: Newspaper },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex pt-20">
      
      {/* SIDEBAR */}
      <div className="w-64 border-r border-white/10 bg-black/50 p-6 flex flex-col">
        <h1 className="text-xl font-black uppercase tracking-widest mb-10 text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">
          Admin Command
        </h1>
        
        <nav className="flex-1 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold uppercase tracking-wider text-sm transition-all duration-300 ${
                  isActive 
                    ? 'bg-white text-black' 
                    : 'text-zinc-500 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-black' : tab.color || 'text-zinc-500'} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <button 
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-red-500 font-bold uppercase tracking-wider text-sm transition-colors mt-auto"
        >
          <LogOut size={18} /> Sign Out
        </button>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 p-8 overflow-y-auto">
        <GlassPanel className="min-h-full border border-white/10 bg-black/60">
          {activeTab === 'live' && <LiveController />}
          {activeTab === 'schedule' && <ScheduleMatches />}
          {activeTab === 'teams' && <ManageTeams />}
          {activeTab === 'players' && <ManagePlayers />}
          {activeTab === 'news' && <ManageNews />}
        </GlassPanel>
      </div>

    </div>
  );
}