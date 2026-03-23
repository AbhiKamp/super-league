import React, { useState, useEffect } from 'react';
import { useLeague } from '../context/LeagueContext';
import { ArrowLeft, Calendar, Newspaper, Share2, Check, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export function ArticleView() {
  const { selectedArticle, setSelectedArticle, setView } = useLeague();
  const [copied, setCopied] = useState(false);

  // 1. FIX: Automatically set loading to TRUE if we only have an ID
  const needsFetch = !!(selectedArticle?.id && !selectedArticle?.title && !selectedArticle?.headline);
  const [loading, setLoading] = useState(needsFetch);

  // 2. FETCH FULL DATA IF SHARED VIA LINK
  // 2. FETCH FULL DATA IF SHARED VIA LINK
  useEffect(() => {
    if (needsFetch) {
      setLoading(true);
      
      // FIX: Fetch all news and quickly filter for the correct ID to avoid the 404!
      fetch(`${API_URL}/news`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            // Find the exact article from the master list
            const foundArticle = data.data.find(a => a.id === selectedArticle.id);
            
            if (foundArticle) {
              setSelectedArticle(foundArticle);
            } else {
              setSelectedArticle(null); // Clear if ID genuinely doesn't exist
            }
          } else {
            setSelectedArticle(null);
          }
        })
        .catch(err => {
          console.error("Failed to load shared article", err);
          setSelectedArticle(null);
        })
        .finally(() => setLoading(false));
    }
  }, [selectedArticle?.id, needsFetch, setSelectedArticle]);
  
  // 3. SHARE HANDLER
  const handleShare = () => {
    if (!selectedArticle?.id) return;
    const shareLink = `${window.location.origin}/?article=${selectedArticle.id}`;
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 4. SHOW LOADER WHILE FETCHING
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-zinc-500 animate-pulse">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <span className="text-xs font-black tracking-widest uppercase">Loading Article...</span>
      </div>
    );
  }

  // 5. FIXED FAILSAFE: Only kick them out if we finished loading and STILL have no title
  if (!selectedArticle || (!selectedArticle.title && !selectedArticle.headline)) {
    setView('vault');
    return null;
  }

  // SAFELY EXTRACT FIELDS
  const title = selectedArticle.title || selectedArticle.headline || 'Untitled Article';
  const summary = selectedArticle.summary || selectedArticle.snippet || '';
  const imageUrl = selectedArticle.image_url || selectedArticle.imgUrl;
  const date = selectedArticle.date || new Date().toISOString();
  const author = selectedArticle.author || 'Super League Media';
  const category = selectedArticle.category || 'Official Editorial';

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => {
            setSelectedArticle(null); // Safely clear memory before going back!
            setView('vault');
          }}
          className="group flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Back to Newsletter</span>
        </button>

        <button 
          onClick={handleShare}
          className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white border border-white/5"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Share2 size={14} />}
          <span className="hidden sm:inline">{copied ? 'Link Copied!' : 'Share Article'}</span>
          <span className="sm:hidden">{copied ? 'Copied!' : 'Share'}</span>
        </button>
      </div>

      {/* Hero Header */}
      {imageUrl ? (
        <div className="relative w-full h-[30vh] sm:h-[50vh] rounded-3xl overflow-hidden mb-10 border border-white/10 bg-black">
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="relative w-full h-48 rounded-3xl overflow-hidden mb-10 border border-white/10 bg-zinc-900 flex items-center justify-center">
          <Newspaper size={48} className="text-zinc-700" />
        </div>
      )}

      {/* Article Content */}
      <div className="max-w-3xl mx-auto px-2 sm:px-6">
        
        {/* Headline & Metadata */}
        <div className="mb-8 border-b border-white/10 pb-8 space-y-6">
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-white border border-white/20 text-black text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-full">
              {category}
            </span>
            <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase tracking-widest">
              <Calendar size={14} />
              {new Date(date).toLocaleDateString()}
            </div>
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400 tracking-tighter leading-tight drop-shadow-sm">
            {title}
          </h1>

          <div className="flex items-center gap-3 pt-2">
            <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/20 flex items-center justify-center font-black text-white">
              SL
            </div>
            <div>
              <p className="text-sm font-bold text-white tracking-wide">{author}</p>
              <p className="text-xs text-zinc-500 font-mono">Official Editorial</p>
            </div>
          </div>
        </div>

        {/* THE DYNAMIC CONTENT VIEWER */}
        <div className="prose prose-invert prose-lg max-w-none font-serif text-zinc-300">
          
          {summary && <p className="text-xl font-medium text-[#E8C881] leading-relaxed mb-8">{summary}</p>}

          {/* CHECK 1: Is it the new JSON Array from the Admin Panel? */}
          {Array.isArray(selectedArticle.content) && selectedArticle.content.length > 0 ? (
            selectedArticle.content.map((block, i) => {
              if (block.type === 'paragraph') return <p key={i} className="mb-6 leading-relaxed">{block.value}</p>;
              
              if (block.type === 'image') return (
                <figure key={i} className="my-10">
                  <img src={block.url} alt={block.alt || 'News image'} className="w-full rounded-xl border border-white/10" />
                  {block.alt && <figcaption className="text-center text-xs text-zinc-500 mt-2 uppercase tracking-widest">{block.alt}</figcaption>}
                </figure>
              );
              
              if (block.type === 'quote') return (
                <blockquote key={i} className="my-10 p-6 sm:p-8 bg-zinc-900 border-l-4 border-[#E8C881] rounded-r-xl">
                  <p className="text-xl sm:text-2xl font-bold italic text-white leading-snug">"{block.value}"</p>
                  {block.author && <footer className="text-[#E8C881] mt-4 font-black uppercase text-xs tracking-widest">— {block.author}</footer>}
                </blockquote>
              );
              
              return null;
            })
          ) : 
          
          /* CHECK 2: Is it an old legacy string? */
          typeof selectedArticle.content === 'string' && selectedArticle.content.trim() !== '' ? (
            selectedArticle.content.split('\n').map((paragraph, i) => (
              paragraph.trim() ? <p key={i} className="mb-6 leading-relaxed">{paragraph}</p> : null
            ))
          ) : (
            
          /* FALLBACK: If no content exists at all */
            <p className="italic text-zinc-500">No additional content available.</p>
          )}
          
        </div>
      </div>

    </div>
  );
}