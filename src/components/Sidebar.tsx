import React from 'react';
import { ViewMode } from '../types';
import { PlayCircle, Sliders, Info, TerminalSquare, Power } from 'lucide-react';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  isConnected: boolean;
  onDisconnect: () => void;
}

export function Sidebar({ currentView, onViewChange, isConnected, onDisconnect }: SidebarProps) {
  const navItems = [
    { id: 'playback', label: 'Playback', icon: PlayCircle },
    { id: 'eq', label: 'Audio & EQ', icon: Sliders },
    { id: 'system', label: 'System Info', icon: Info },
    { id: 'terminal', label: 'Raw Terminal', icon: TerminalSquare },
  ] as const;

  return (
    <div className="w-64 bg-[#111] border-r border-[#222] flex flex-col h-full shrink-0">
      <div className="p-6 border-b border-[#222]">
        <h1 className="text-xl font-bold tracking-widest text-zinc-100 uppercase">Arylic<span className="text-zinc-500">Ctrl</span></h1>
        <div className="flex items-center gap-2 mt-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
          <span className="text-xs text-zinc-400 font-medium tracking-wide">
            {isConnected ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 ${
                isActive 
                  ? 'bg-[#222] text-zinc-100 shadow-inner' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#1a1a1a]'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-emerald-400' : ''} />
              <span className="font-medium text-sm tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {isConnected && (
        <div className="p-4 border-t border-[#222]">
          <button
            onClick={onDisconnect}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-colors"
          >
            <Power size={18} />
            <span className="font-medium text-sm tracking-wide">Disconnect</span>
          </button>
        </div>
      )}
    </div>
  );
}
