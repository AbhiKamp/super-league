import { useState, useEffect } from 'react';
import { LeagueProvider, useLeague } from './context/LeagueContext'; // Added useLeague!
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './Layout';
import { Loader } from './components/Loader';
import { Onboarding } from './pages/Onboarding';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';

function AuthGuard() {
  const { user, profile, loading } = useAuth();
  const { setView, setSelectedArticle } = useLeague(); // Bring in our League controls
  const [initialLoading, setInitialLoading] = useState(true);

  // 1. URL INTERCEPTOR
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedArticleId = params.get('article');

    if (sharedArticleId) {
      // Send them to the vault/news view
      setView('article'); 
      // Set the article ID (ArticleView will fetch the rest of the data!)
      setSelectedArticle({ id: sharedArticleId }); 
      
      // Clean up the URL bar so it looks pretty again
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const timer = setTimeout(() => setInitialLoading(false), 800);
    return () => clearTimeout(timer);
  }, [setView, setSelectedArticle]);

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

  if (user && (!profile?.nickname || !profile?.team_flair_id)) {
    return <Onboarding />;
  }

  return <Layout />;
}

function App() {
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
        <LeagueProvider> 
          <AdminDashboard />
        </LeagueProvider>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <LeagueProvider>
        <AuthGuard />
      </LeagueProvider>
    </AuthProvider>
  );
}

export default App;