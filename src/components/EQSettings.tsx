import React, { useState, useEffect } from 'react';
import { PlayerStatus } from '../types';
import { Sliders, Waves } from 'lucide-react';

interface EQSettingsProps {
  status: PlayerStatus | null;
  sendCommand: (cmd: string) => void;
  sendTcpCommand?: (cmd: string) => void;
}

export function EQSettings({ status, sendCommand, sendTcpCommand }: EQSettingsProps) {
  const [bass, setBass] = useState(0);
  const [treble, setTreble] = useState(0);
  const [mid, setMid] = useState(0);
  const [balance, setBalance] = useState(0);
  const [vbs, setVbs] = useState(false);
  
  // Note: We don't get these detailed values back from HTTP getPlayerStatus,
  // so this relies purely on what the user sets in the app, or future TCP parsing.
  // In a full implementation, the TCP parser in useLinkplay would listen to AXX+BAS+...
  
  const handleSliderRelease = (type: 'bass' | 'treble' | 'mid' | 'balance', value: number) => {
    if (sendTcpCommand) {
      if (type === 'bass') sendTcpCommand(`MCU+PAS+RAKOIT:BAS:${value}&`);
      if (type === 'treble') sendTcpCommand(`MCU+PAS+RAKOIT:TRE:${value}&`);
      if (type === 'mid') sendTcpCommand(`MCU+PAS+RAKOIT:MID:${value}&`);
      if (type === 'balance') sendTcpCommand(`MCU+PAS+RAKOIT:BAL:${value}&`);
    } else {
      // Fallback to HTTP for basic EQ if TCP isn't available
      if (type === 'bass' || type === 'treble') {
        sendCommand(`setPlayerCmd:EqSet:${type === 'bass' ? 'Bass' : 'Treble'}:${value}`);
      }
    }
  };

  const handleToggleVbs = () => {
    const newVal = !vbs;
    setVbs(newVal);
    if (sendTcpCommand) {
      sendTcpCommand(`MCU+PAS+RAKOIT:VBS:${newVal ? '1' : '0'}&`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-8 space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-emerald-500/10 rounded-xl">
          <Sliders className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Audio & UART EQ</h2>
          <p className="text-zinc-400 text-sm">Advanced UART TCP Audio Controls</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-[#111] border border-[#222] rounded-2xl p-8 space-y-8">
          <h3 className="text-lg font-semibold text-white mb-6">Tone Control</h3>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-zinc-400">Bass</label>
                <span className="text-xs font-mono text-zinc-500">{bass > 0 ? `+${bass}` : bass} dB</span>
              </div>
              <input
                type="range"
                min="-10"
                max="10"
                value={bass}
                onChange={(e) => setBass(parseInt(e.target.value))}
                onMouseUp={(e) => handleSliderRelease('bass', parseInt((e.target as HTMLInputElement).value))}
                onTouchEnd={(e) => handleSliderRelease('bass', parseInt((e.target as HTMLInputElement).value))}
                className="w-full h-2 bg-[#222] rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between mt-2 text-[10px] text-zinc-600 font-mono">
                <span>-10</span>
                <span>0</span>
                <span>+10</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-zinc-400">Middle</label>
                <span className="text-xs font-mono text-zinc-500">{mid > 0 ? `+${mid}` : mid} dB</span>
              </div>
              <input
                type="range"
                min="-10"
                max="10"
                value={mid}
                onChange={(e) => setMid(parseInt(e.target.value))}
                onMouseUp={(e) => handleSliderRelease('mid', parseInt((e.target as HTMLInputElement).value))}
                onTouchEnd={(e) => handleSliderRelease('mid', parseInt((e.target as HTMLInputElement).value))}
                className="w-full h-2 bg-[#222] rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between mt-2 text-[10px] text-zinc-600 font-mono">
                <span>-10</span>
                <span>0</span>
                <span>+10</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-zinc-400">Treble</label>
                <span className="text-xs font-mono text-zinc-500">{treble > 0 ? `+${treble}` : treble} dB</span>
              </div>
              <input
                type="range"
                min="-10"
                max="10"
                value={treble}
                onChange={(e) => setTreble(parseInt(e.target.value))}
                onMouseUp={(e) => handleSliderRelease('treble', parseInt((e.target as HTMLInputElement).value))}
                onTouchEnd={(e) => handleSliderRelease('treble', parseInt((e.target as HTMLInputElement).value))}
                className="w-full h-2 bg-[#222] rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between mt-2 text-[10px] text-zinc-600 font-mono">
                <span>-10</span>
                <span>0</span>
                <span>+10</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#111] border border-[#222] rounded-2xl p-8 space-y-8">
          <h3 className="text-lg font-semibold text-white mb-6">Output Settings</h3>
          
          <div className="space-y-8">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-zinc-400">L/R Balance</label>
                <span className="text-xs font-mono text-zinc-500">
                  {balance === 0 ? 'Center' : balance > 0 ? `R ${balance}` : `L ${Math.abs(balance)}`}
                </span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                step="5"
                value={balance}
                onChange={(e) => setBalance(parseInt(e.target.value))}
                onMouseUp={(e) => handleSliderRelease('balance', parseInt((e.target as HTMLInputElement).value))}
                onTouchEnd={(e) => handleSliderRelease('balance', parseInt((e.target as HTMLInputElement).value))}
                className="w-full h-2 bg-[#222] rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between mt-2 text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
                <span>Left</span>
                <span>Center</span>
                <span>Right</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#1a1a1a] border border-[#333] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${vbs ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#2a2a2a] text-zinc-500'}`}>
                  <Waves size={18} />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Virtual Bass</div>
                  <div className="text-xs text-zinc-500">Enhanced low-frequency depth</div>
                </div>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={vbs}
                  onChange={handleToggleVbs}
                />
                <div className="w-11 h-6 bg-[#333] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="text-xs text-zinc-500 leading-relaxed border-t border-[#222] pt-6">
              <p>Note: These settings utilize the internal UART API via TCP bridge. Ensure you have the "Secure Connection" disabled if TCP commands fail, or check your device chip support (BP10XX platform required for UART passthrough).</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
