import { useState, useEffect } from 'react';
import { LeagueProvider } from './context/LeagueContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './Layout';
import { Loader } from './components/Loader';
import { Onboarding } from './pages/Onboarding';

// 1. IMPORT YOUR NEW ADMIN PAGES!
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';

function AuthGuard() {
  const { user, profile, loading } = useAuth();
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    // Keep minimal artificial delay to prevent raw state flashing
    const timer = setTimeout(() => setInitialLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading || initialLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <Loader className="w-24 h-24 mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
        <h2 className="text-xl sm:text-2xl font-black tracking-[0.2em] text-white/90 uppercase animate-pulse">
          Loading...
        </h2>
      </div>
    );
  }

  // Force onboarding if logged in but profile is incomplete (no nickname set yet)
  if (user && (!profile || !profile.nickname || !profile.team_flair_id)) {
    return <Onboarding />;
  }

  // Allow app access to everyone (Login happens voluntarily or on restricted pages)
  return (
    <LeagueProvider>
      <Layout />
    </LeagueProvider>
  );
}

function App() {
  // 2. THE SECRET DOOR ROUTER
  const path = window.location.pathname;

  if (path === '/hq-login') {
    return (
      <AuthProvider>
        <AdminLogin />
      </AuthProvider>
    );
  }

  if (path === '/admin') {
    return (
      <AuthProvider>
        {/* We wrap this in LeagueProvider so your useApi hook can still read the division! */}
        <LeagueProvider> 
          <AdminDashboard />
        </LeagueProvider>
      </AuthProvider>
    );
  }

  // 3. THE NORMAL STUDENT APP
  return (
    <AuthProvider>
      <AuthGuard />
    </AuthProvider>
  );
}

export default App;