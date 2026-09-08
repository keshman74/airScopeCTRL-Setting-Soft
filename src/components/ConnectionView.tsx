import React, { useState } from 'react';
import { Wifi, AlertCircle } from 'lucide-react';

interface ConnectionViewProps {
  onConnect: (ip: string) => void;
  error: string | null;
}

export function ConnectionView({ onConnect, error }: ConnectionViewProps) {
  const [ip, setIp] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ip.trim()) {
      onConnect(ip.trim());
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-[#0a0a0a] p-8 text-zinc-200">
      <div className="w-full max-w-md bg-[#111] border border-[#222] rounded-xl p-8 shadow-2xl">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#1a1a1a] mx-auto mb-6">
          <Wifi className="w-8 h-8 text-emerald-400" />
        </div>
        
        <h2 className="text-2xl font-semibold text-center text-white mb-2 tracking-wide">Connect Device</h2>
        <p className="text-zinc-500 text-center text-sm mb-8">
          Enter the IP address of your Linkplay / Arylic device on the local network.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="ip" className="block text-xs font-medium text-zinc-400 uppercase tracking-widest mb-2">
              Device IP Address
            </label>
            <input
              type="text"
              id="ip"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="e.g. 192.168.1.100"
              className="w-full bg-[#0a0a0a] border border-[#333] rounded-md px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors font-mono"
            />
          </div>

          {error && (
            <div className="flex gap-3 bg-red-950/40 border border-red-900/50 rounded-md p-4 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!ip.trim()}
            className="w-full bg-zinc-100 text-zinc-900 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-md font-semibold tracking-wide transition-colors"
          >
            Connect
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-[#222] text-xs text-zinc-500 text-center space-y-2">
          <p className="font-semibold text-amber-500/80">⚠️ Cloud Preview Limitation</p>
          <p>
            Because this preview runs in the cloud, it cannot directly reach local network IP addresses (like 192.168.x.x) due to network routing and browser security policies.
          </p>
          <p>
            To use this app with your device, you must export it (download ZIP) and run it locally on your own computer.
          </p>
        </div>
      </div>
    </div>
  );
}
