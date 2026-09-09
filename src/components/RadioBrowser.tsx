import React, { useState, useEffect } from 'react';
import { Search, Play, Radio, Loader2 } from 'lucide-react';

interface RadioStation {
  stationuuid: string;
  name: string;
  url_resolved: string;
  favicon: string;
  tags: string;
  country: string;
}

interface RadioBrowserProps {
  sendCommand: (cmd: string) => void;
}

export function RadioBrowser({ sendCommand }: RadioBrowserProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RadioStation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use a fixed reliable node or round-robin for simplicity
  const API_BASE = 'https://de1.api.radio-browser.info/json/stations/search';

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}?name=${encodeURIComponent(query)}&limit=15&hidebroken=true&order=clickcount&reverse=true`);
      if (!res.ok) throw new Error('Failed to fetch stations');
      const data = await res.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Error fetching radio stations');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="pt-6 border-t border-[#222]">
      <div className="flex items-center gap-2 mb-4">
        <Radio size={16} className="text-emerald-400" />
        <h3 className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">Radio Browser Directory</h3>
      </div>
      
      <div className="flex flex-col gap-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-zinc-500" />
            </div>
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search thousands of web radio stations..." 
              className="w-full bg-[#0a0a0a] border border-[#333] rounded-md pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors" 
            />
          </div>
          <button 
            type="submit" 
            disabled={isSearching || !query.trim()}
            className="bg-[#1a1a1a] hover:bg-[#2a2a2a] disabled:opacity-50 disabled:cursor-not-allowed text-zinc-300 border border-[#333] px-4 py-2 rounded-md transition-colors text-sm flex items-center justify-center gap-2 min-w-[100px]"
          >
            {isSearching ? <Loader2 size={16} className="animate-spin" /> : 'Search'}
          </button>
        </form>

        {error && (
          <p className="text-red-400 text-xs">{error}</p>
        )}

        {results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {results.map((station) => (
              <div key={station.stationuuid} className="bg-[#0a0a0a] border border-[#222] rounded-lg p-3 flex items-center gap-3 hover:border-[#444] transition-colors group">
                <div className="w-10 h-10 shrink-0 bg-[#1a1a1a] rounded flex items-center justify-center overflow-hidden">
                  {station.favicon ? (
                    <img src={station.favicon} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <Radio size={20} className="text-zinc-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-zinc-200 truncate" title={station.name}>{station.name}</h4>
                  <p className="text-[10px] text-zinc-500 truncate uppercase">{station.country || 'Unknown Location'}</p>
                </div>
                <button 
                  onClick={() => sendCommand(`setPlayerCmd:play:${station.url_resolved}`)}
                  className="w-8 h-8 shrink-0 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-emerald-500 hover:text-white"
                  title="Play Station"
                >
                  <Play size={14} className="ml-0.5" fill="currentColor" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Custom scrollbar styles for the results container */}
        <style dangerouslySetInnerHTML={{__html: `
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: #111; rounded: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
        `}} />
      </div>
    </div>
  );
}
