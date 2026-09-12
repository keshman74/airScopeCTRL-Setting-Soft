import React, { useState } from 'react';
import { Wifi, AlertCircle, Lock, Loader2 } from 'lucide-react';

interface ConnectionViewProps {
  onConnect: (ip: string, protocol: 'http' | 'https') => void;
  error: string | null;
  isConnecting?: boolean;
}

export function ConnectionView({ onConnect, error, isConnecting }: ConnectionViewProps) {
  const [ip, setIp] = useState('');
  const [protocol, setProtocol] = useState<'http' | 'https'>('http');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ip.trim()) {
      onConnect(ip.trim(), protocol);
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
              className="w-full bg-[#0a0a0a] border border-[#333] rounded-md px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors font-mono mb-4"
            />

            <div className="flex items-center justify-between p-4 rounded-md border border-[#333] bg-[#0a0a0a]">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${protocol === 'https' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#222] text-zinc-500'}`}>
                  {protocol === 'https' ? <Lock size={16} /> : <Wifi size={16} />}
                </div>
                <div>
                  <div className="text-sm font-medium text-zinc-200">Use Secure Connection</div>
                  <div className="text-xs text-zinc-500">Required for A97/A98 chips</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={protocol === 'https'}
                  onChange={(e) => setProtocol(e.target.checked ? 'https' : 'http')}
                />
                <div className="w-11 h-6 bg-[#333] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>

          {error && (
            <div className="flex gap-3 bg-red-950/40 border border-red-900/50 rounded-md p-4 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!ip.trim() || isConnecting}
            className="w-full bg-zinc-100 text-zinc-900 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-md font-semibold tracking-wide transition-colors flex justify-center items-center gap-2"
          >
            {isConnecting && <Loader2 className="w-5 h-5 animate-spin" />}
            {isConnecting ? 'Connecting...' : 'Connect'}
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
