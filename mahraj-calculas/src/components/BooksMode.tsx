import React, { useState } from 'react';
import { Search, ExternalLink, Globe, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';

type OpenLibraryDoc = {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
};

export function BooksMode() {
  const [internetQuery, setInternetQuery] = useState('');
  const [internetResults, setInternetResults] = useState<OpenLibraryDoc[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const handleInternetSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!internetQuery.trim()) return;
    
    setIsSearching(true);
    setSearchError('');
    try {
      const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(internetQuery)}&limit=15`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setInternetResults(data.docs || []);
    } catch (err) {
      setSearchError('Failed to fetch books from the internet.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 relative z-10 w-full h-full font-sans text-white overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-1 items-center justify-center pt-2 pb-4 shrink-0">
        <div className="h-10 w-10 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 flex items-center justify-center mb-1 text-cyan-400">
           <Globe size={20} />
        </div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-sky-300 bg-clip-text text-transparent">World Library</h2>
        <p className="text-xs text-zinc-400">Search millions of books globally</p>
      </div>

      {/* Internet Search */}
      <form onSubmit={handleInternetSearch} className="relative shrink-0 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500" size={18} />
          <input 
            type="text" 
            placeholder="Search titles, authors, or topics..." 
            value={internetQuery}
            onChange={e => setInternetQuery(e.target.value)}
            className="w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-zinc-600 shadow-inner block"
          />
        </div>
        <button
          type="submit"
          disabled={isSearching || !internetQuery.trim()}
          className="bg-cyan-500 hover:bg-cyan-400 text-cyan-950 px-5 rounded-2xl font-bold active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] flex items-center gap-2"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Internet Results List */}
      <div className="flex-1 overflow-y-auto pr-1 pb-16 space-y-4 custom-scrollbar">
        {isSearching ? (
          <div className="flex flex-col items-center justify-center h-full text-cyan-500 gap-4 mt-20">
            <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            <p className="animate-pulse text-sm font-medium">Delving into the archives...</p>
          </div>
        ) : searchError ? (
          <div className="flex flex-col items-center justify-center h-full text-red-400 mt-20">
            <p className="bg-red-500/10 px-4 py-2 rounded-xl border border-red-500/20">{searchError}</p>
          </div>
        ) : internetResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 mt-20">
            <BookOpen size={48} className="mb-4 opacity-20" />
            <p className="text-zinc-400">Discover your next favorite read.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {internetResults.map((book, index) => (
              <motion.div 
                key={book.key ? `book-${book.key}-${index}` : `book-idx-${index}`}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-3 hover:border-cyan-500/40 hover:bg-zinc-800/60 transition-all group flex items-stretch gap-3 shadow-sm hover:shadow-[0_0_15px_rgba(6,182,212,0.1)]"
              >
                {/* Book Cover */}
                <div className="w-16 h-24 shrink-0 bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700/50 flex items-center justify-center relative shadow-sm">
                  {book.cover_i ? (
                    <img 
                      src={`https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`} 
                      alt={book.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <BookOpen size={24} className="text-zinc-600" />
                  )}
                  <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-lg pointer-events-none"></div>
                </div>

                <div className="flex-1 flex flex-col justify-between py-0.5">
                  <div>
                    <h3 className="font-bold text-cyan-50 text-sm leading-snug line-clamp-2 md:group-hover:text-cyan-300 transition-colors">{book.title}</h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {book.author_name?.[0] && (
                        <span className="text-zinc-400 text-xs truncate max-w-[150px]">
                          {book.author_name[0]}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    {book.first_publish_year ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-800 border border-zinc-700/50 text-zinc-400">
                        {book.first_publish_year}
                      </span>
                    ) : (
                      <span />
                    )}
                    <a 
                      href={`https://openlibrary.org${book.key}`}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 flex items-center gap-1.5 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-cyan-950 border border-cyan-500/30 font-bold rounded-lg px-3 py-1.5 text-xs transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      <ExternalLink size={14} />
                      Open
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
