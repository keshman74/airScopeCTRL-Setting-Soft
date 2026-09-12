import React, { useState, useEffect } from 'react';
import { PlayerStatus, UartStatus } from '../types';
import { Sliders, Waves } from 'lucide-react';

interface EQSettingsProps {
  status: PlayerStatus | null;
  uartStatus?: UartStatus;
  sendCommand: (cmd: string) => void;
  sendTcpCommand?: (cmd: string) => void;
  updateUartStatus?: (updates: Partial<UartStatus>) => void;
}

export function EQSettings({ status, uartStatus, sendCommand, sendTcpCommand, updateUartStatus }: EQSettingsProps) {
  // Use uartStatus to initialize state directly if available, rather than hardcoding 0
  const [bass, setBass] = useState(uartStatus?.bass ?? 0);
  const [treble, setTreble] = useState(uartStatus?.treble ?? 0);
  const [mid, setMid] = useState(uartStatus?.mid ?? 0);
  const [balance, setBalance] = useState(uartStatus?.balance ?? 0);
  const [vbs, setVbs] = useState(uartStatus?.vbs ?? false);
  const [eqe, setEqe] = useState(uartStatus?.eqe ?? false);
  const [cfe, setCfe] = useState(uartStatus?.cfe ?? false);
  const [cff, setCff] = useState(uartStatus?.cff ?? 50);
  const [isInteracting, setIsInteracting] = useState(false);
  
  // Sync state with device via UART responses
  useEffect(() => {
    if (uartStatus && !isInteracting) {
      if (uartStatus.bass !== undefined) setBass(uartStatus.bass);
      if (uartStatus.treble !== undefined) setTreble(uartStatus.treble);
      if (uartStatus.mid !== undefined) setMid(uartStatus.mid);
      if (uartStatus.balance !== undefined) setBalance(uartStatus.balance);
      if (uartStatus.vbs !== undefined) setVbs(uartStatus.vbs);
      if (uartStatus.eqe !== undefined) setEqe(uartStatus.eqe);
      if (uartStatus.cfe !== undefined) setCfe(uartStatus.cfe);
      if (uartStatus.cff !== undefined) setCff(uartStatus.cff);
    }
  }, [uartStatus, isInteracting]);
  
  const handleSliderRelease = (type: 'bass' | 'treble' | 'mid' | 'balance', value: number) => {
    // Optimistically update global UART state so it persists across tab switches
    if (updateUartStatus) {
      updateUartStatus({ [type]: value });
    }

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
    setTimeout(() => setIsInteracting(false), 2500); // Give device time to process and reply before syncing
  };

  const handleToggleVbs = () => {
    const newVal = !vbs;
    setVbs(newVal);
    if (updateUartStatus) updateUartStatus({ vbs: newVal });
    if (sendTcpCommand) {
      sendTcpCommand(`MCU+PAS+RAKOIT:VBS:${newVal ? '1' : '0'}&`);
    }
  };

  const handleToggleEqe = () => {
    const newVal = !eqe;
    setEqe(newVal);
    if (updateUartStatus) updateUartStatus({ eqe: newVal });
    if (sendTcpCommand) sendTcpCommand(`MCU+PAS+RAKOIT:EQE:${newVal ? '1' : '0'}&`);
  };

  const handleToggleCfe = () => {
    const newVal = !cfe;
    setCfe(newVal);
    if (updateUartStatus) updateUartStatus({ cfe: newVal });
    if (sendTcpCommand) sendTcpCommand(`MCU+PAS+RAKOIT:CFE:${newVal ? '1' : '0'}&`);
  };

  const handleCffRelease = (value: number) => {
    if (updateUartStatus) updateUartStatus({ cff: value });
    if (sendTcpCommand) sendTcpCommand(`MCU+PAS+RAKOIT:CFF:${value}&`);
    setTimeout(() => setIsInteracting(false), 2500);
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
          
          {/* Preset EQs */}
          <div className="mb-8">
            <h4 className="text-sm font-medium text-zinc-400 mb-3">Presets</h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 0, label: 'Flat' },
                { id: 1, label: 'Classical' },
                { id: 2, label: 'Pop' },
                { id: 3, label: 'Jazz' },
                { id: 4, label: 'Rock' },
                { id: 5, label: 'Vocal' },
              ].map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    if (sendTcpCommand) {
                      sendTcpCommand(`MCU+PAS+RAKOIT:EQS:${preset.id}&`);
                    }
                  }}
                  className={`py-2 px-1 text-xs font-medium rounded border transition-colors ${
                    uartStatus?.eqs === preset.id
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                      : 'bg-[#1a1a1a] text-zinc-400 border-[#333] hover:bg-[#2a2a2a] hover:border-[#444]'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

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
                onMouseDown={() => setIsInteracting(true)} onTouchStart={() => setIsInteracting(true)} onMouseUp={(e) => handleSliderRelease('bass', parseInt((e.target as HTMLInputElement).value))}
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
                onMouseDown={() => setIsInteracting(true)} onTouchStart={() => setIsInteracting(true)} onMouseUp={(e) => handleSliderRelease('mid', parseInt((e.target as HTMLInputElement).value))}
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
                onMouseDown={() => setIsInteracting(true)} onTouchStart={() => setIsInteracting(true)} onMouseUp={(e) => handleSliderRelease('treble', parseInt((e.target as HTMLInputElement).value))}
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
                onMouseDown={() => setIsInteracting(true)} onTouchStart={() => setIsInteracting(true)} onMouseUp={(e) => handleSliderRelease('balance', parseInt((e.target as HTMLInputElement).value))}
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

            <div className="p-4 rounded-xl bg-[#1a1a1a] border border-[#333] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <div className="text-sm font-medium text-white">Master EQ Enable (EQE)</div>
                  <div className="text-xs text-zinc-500">Toggle all EQ processing</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={eqe} onChange={handleToggleEqe} />
                <div className="w-11 h-6 bg-[#333] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="p-4 rounded-xl bg-[#1a1a1a] border border-[#333] flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">Crossover Filter (CFE)</div>
                  <div className="text-xs text-zinc-500">High-pass stereo, Low-pass DAC-X</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={cfe} onChange={handleToggleCfe} />
                  <div className="w-11 h-6 bg-[#333] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
              
              <div className={`transition-opacity ${cfe ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-medium text-zinc-400">Crossover Frequency</label>
                  <span className="text-xs font-mono text-zinc-500">{cff} Hz</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="300"
                  step="10"
                  value={cff}
                  onChange={(e) => setCff(parseInt(e.target.value))}
                  onMouseDown={() => setIsInteracting(true)} onTouchStart={() => setIsInteracting(true)} onMouseUp={(e) => handleCffRelease(parseInt((e.target as HTMLInputElement).value))}
                  onTouchEnd={(e) => handleCffRelease(parseInt((e.target as HTMLInputElement).value))}
                  className="w-full h-2 bg-[#222] rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
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
