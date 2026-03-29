import React, { useState } from 'react'; 
import { useLeague } from '../context/LeagueContext';
import { useApi } from '../hooks/useApi';
import { NewsArticle } from '../components/NewsArticle';
import { Loader2 } from 'lucide-react';
import { Loader } from '../components/Loader';

export function Vault() {
  const { division } = useLeague();
  const [selectedCategory, setSelectedCategory] = useState('Latest News');
  
  // 2. Extract 'error' here so the if(error) block works!
  const { data: newsResp, loading, error } = useApi(`/news?category=${selectedCategory}`);
  
  // 3. Keep the naming consistent!
  const newsList = newsResp?.data || [];  

  if (loading) {
    return <Loader text="Fetching Latest Stories..." />;
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-red-500/80 space-y-4">
        <span className="font-black tracking-[0.3em] uppercase text-sm">Publishing Server Offline</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between px-2 gap-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase">Onion Newsletter</h2>
          <p className="text-zinc-400 mt-1 font-medium">Satire, reports, and exclusive stories.</p>
        </div>
        
        <div className="flex gap-2">
          {/* THE DROPDOWN */}
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-black border border-white/10 text-white text-sm rounded-lg focus:ring-[#E8C881] focus:border-[#E8C881] block p-2.5 outline-none cursor-pointer"
          >
            <option value="Latest News">Latest News</option>
            <option value="Official Editorial">Official Editorial</option>
            <option value="Match Reports">Match Reports</option>
            <option value="Satire">Satire</option>
            <option value="Features">Features</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Use newsList here! */}
        {newsList.map(article => (
          <NewsArticle key={article.id} article={article} />
        ))}
        
        {/* Fallback if the category is empty */}
        {newsList.length === 0 && (
           <p className="text-zinc-500 italic mt-4">No articles found in this category.</p>
        )}
      </div>
    </div>
  );
}