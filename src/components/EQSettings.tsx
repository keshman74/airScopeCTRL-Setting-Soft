import React, { useState } from 'react';
import { PlayerStatus } from '../types';

interface EQSettingsProps {
  status: PlayerStatus | null;
  sendCommand: (cmd: string) => void;
}

const EQ_PRESETS = [
  { id: 0, name: 'Flat / Off' },
  { id: 1, name: 'Classic' },
  { id: 2, name: 'Pop' },
  { id: 3, name: 'Jazz' },
  { id: 4, name: 'Vocal' },
  { id: 5, name: 'Dance' }
];

export function EQSettings({ status, sendCommand }: EQSettingsProps) {
  const currentEq = status?.eq ? parseInt(status.eq, 10) : 0;

  const setEqMode = (mode: number) => {
    sendCommand(`setPlayerCmd:equalizer:${mode}`);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-8">
      <div className="bg-[#111] border border-[#222] rounded-2xl p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-8 tracking-wide">Equalizer Presets</h2>
        
        <p className="text-zinc-400 mb-8">
          Select a predefined equalizer profile. (Direct Bass/Treble adjustments are only supported via the mobile app or DSP tool for most Linkplay modules).
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {EQ_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setEqMode(preset.id)}
              className={`py-6 px-4 rounded-xl border transition-all ${
                currentEq === preset.id
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                  : 'bg-[#0a0a0a] border-[#333] text-zinc-300 hover:border-[#555] hover:bg-[#151515]'
              }`}
            >
              <div className="text-lg">{preset.name}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
