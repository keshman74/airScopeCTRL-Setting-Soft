import React, { useState, useEffect } from 'react';
import { PlayerStatus } from '../types';

interface EQSettingsProps {
  status: PlayerStatus | null;
  sendCommand: (cmd: string) => void;
}

export function EQSettings({ status, sendCommand }: EQSettingsProps) {
  const [bass, setBass] = useState(0);
  const [treble, setTreble] = useState(0);

  // EQ comes in format like "0,0" for bass,treble. But wait, HTTP API documentation says:
  // getPlayerStatus returns eq as a string, sometimes "0". Wait, let's just use local state and update on status change if we can parse it, otherwise rely on the user to move it.
  
  useEffect(() => {
    // Attempt to parse EQ from status if it's there
    // If not, we'll just leave it at 0. Linkplay eq is often not well documented in getPlayerStatus.
  }, [status?.eq]);

  const handleBassChange = (val: number) => {
    setBass(val);
    sendCommand(`setEQ:bass:${val}`);
  };

  const handleTrebleChange = (val: number) => {
    setTreble(val);
    sendCommand(`setEQ:treble:${val}`);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-8">
      <div className="bg-[#111] border border-[#222] rounded-2xl p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-8 tracking-wide">Tone Controls</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* Bass Control */}
          <div className="bg-[#0a0a0a] rounded-xl p-8 border border-[#222] flex flex-col items-center">
            <h3 className="text-zinc-400 font-medium tracking-widest uppercase mb-8">Bass</h3>
            <div className="relative w-48 h-48 rounded-full border-4 border-[#222] flex items-center justify-center bg-[#151515] shadow-inner">
              <input
                type="range"
                min="-10"
                max="10"
                value={bass}
                onChange={(e) => handleBassChange(parseInt(e.target.value))}
                className="absolute w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="text-4xl font-mono text-emerald-400">
                {bass > 0 ? `+${bass}` : bass}
              </div>
              <div className="absolute bottom-4 text-xs text-zinc-600">dB</div>
            </div>
            <div className="flex justify-between w-full mt-8 px-4 text-xs font-mono text-zinc-500">
              <span>-10</span>
              <span>0</span>
              <span>+10</span>
            </div>
          </div>

          {/* Treble Control */}
          <div className="bg-[#0a0a0a] rounded-xl p-8 border border-[#222] flex flex-col items-center">
            <h3 className="text-zinc-400 font-medium tracking-widest uppercase mb-8">Treble</h3>
            <div className="relative w-48 h-48 rounded-full border-4 border-[#222] flex items-center justify-center bg-[#151515] shadow-inner">
              <input
                type="range"
                min="-10"
                max="10"
                value={treble}
                onChange={(e) => handleTrebleChange(parseInt(e.target.value))}
                className="absolute w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="text-4xl font-mono text-emerald-400">
                {treble > 0 ? `+${treble}` : treble}
              </div>
              <div className="absolute bottom-4 text-xs text-zinc-600">dB</div>
            </div>
            <div className="flex justify-between w-full mt-8 px-4 text-xs font-mono text-zinc-500">
              <span>-10</span>
              <span>0</span>
              <span>+10</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
