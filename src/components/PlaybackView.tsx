import React, { useState, useEffect } from 'react';
import { PlayerStatus, MetaInfo } from '../types';
import { Play, Pause, SkipBack, SkipForward, VolumeX, Volume2, Disc3 } from 'lucide-react';

interface PlaybackViewProps {
  status: PlayerStatus | null;
  metaInfo?: MetaInfo | null;
  sendCommand: (cmd: string) => void;
  sendTcpCommand?: (cmd: string) => void;
}

// Utility to decode Hex strings used by Linkplay for metadata
function decodeHexStr(str: string): string {
  if (!str || str.length % 2 !== 0) return str;
  // If it's a known non-hex string like "Unknown", return it
  if (!/^[0-9A-Fa-f]+$/.test(str)) return str;
  
  try {
    const bytes = new Uint8Array(str.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    return new TextDecoder().decode(bytes);
  } catch (e) {
    return str;
  }
}

export function PlaybackView({ status, metaInfo, sendCommand, sendTcpCommand }: PlaybackViewProps) {
  const [localVolume, setLocalVolume] = useState<number | null>(null);

  useEffect(() => {
    // If the slider hasn't been moved by the user for a bit, let it sync with device status
    const timer = setTimeout(() => {
      setLocalVolume(null);
    }, 4000); // Increased to 4 seconds to prevent jerking back when device takes time to respond
    return () => clearTimeout(timer);
  }, [status?.vol]);

  if (!status) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-zinc-500">Waiting for device status...</p>
      </div>
    );
  }

  const isPlaying = status.status === 'play';
  const deviceVolume = parseInt(status.vol, 10) || 0;
  const volume = localVolume !== null ? localVolume : deviceVolume;
  const isMuted = status.mute === '1';

  const decodedTitle = decodeHexStr(metaInfo?.Title || status.Title) || 'Unknown Title';
  const decodedArtist = decodeHexStr(metaInfo?.Artist || status.Artist) || 'Unknown Artist';
  const decodedAlbum = decodeHexStr(metaInfo?.Album || status.Album);
  
  const albumArt = metaInfo?.albumArtURI;

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalVolume(parseInt(e.target.value, 10));
  };

  const handleVolumeRelease = () => {
    if (localVolume !== null) {
      // Format volume to 3 digits, e.g. 050
      const volStr = localVolume.toString().padStart(3, '0');
      // Try to use TCP for instant volume setting without HTTP overhead
      if (sendTcpCommand) {
        sendTcpCommand(`MCU+VOL+${volStr}`);
      }
      // Also send via HTTP as fallback
      sendCommand(`setPlayerCmd:vol:${localVolume}`);
    }
  };

  const handleSwitchMode = (mode: string) => {
    sendCommand(`setPlayerCmd:switchmode:${mode}`);
  };

  const currentMode = status.mode || '';

  return (
    <div className="max-w-4xl mx-auto py-12 px-8">
      <div className="bg-[#111] border border-[#222] rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          
          {/* Album Art / Status Indicator */}
          <div className="w-64 h-64 shrink-0 rounded-xl bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#333] flex items-center justify-center relative overflow-hidden shadow-inner group">
            {albumArt ? (
              <img 
                src={albumArt} 
                alt="Album Art" 
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_100%)]" />
                <div className={`w-32 h-32 rounded-full border-[4px] ${isPlaying ? 'border-emerald-500/30' : 'border-zinc-800'} flex items-center justify-center`}>
                  <div className={`w-24 h-24 rounded-full ${isPlaying ? 'bg-emerald-500/20 animate-pulse' : 'bg-zinc-800/50 flex items-center justify-center'}`}>
                    {!isPlaying && <Disc3 size={32} className="text-zinc-600" />}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Track Info & Controls */}
          <div className="flex-1 w-full space-y-8">
            <div className="space-y-2 min-w-0">
              <div className="text-xs font-semibold text-emerald-400 tracking-widest uppercase truncate">
                {status.mode === '010' || status.mode === '10' ? 'Wi-Fi Streaming' : 
                 status.mode === '020' || status.mode === '20' ? 'HTTP API' :
                 status.mode === '040' || status.mode === '40' ? 'Line-In' : 
                 status.mode === '041' || status.mode === '41' ? 'Bluetooth' : 
                 status.mode === '043' || status.mode === '43' || status.mode === '040' ? 'Optical' : 
                 status.mode === '011' || status.mode === '11' ? 'USB' : 
                 status.mode === '031' || status.mode === '31' ? 'Spotify Connect' : 
                 status.mode === '032' || status.mode === '32' ? 'Tidal Connect' : 'Playing'}
              </div>
              <h2 className="text-4xl font-bold text-white truncate" title={decodedTitle}>
                {decodedTitle}
              </h2>
              <p className="text-xl text-zinc-400 truncate" title={decodedArtist}>
                {decodedArtist}
              </p>
              {decodedAlbum && (
                <p className="text-sm text-zinc-500 truncate" title={decodedAlbum}>
                  {decodedAlbum}
                </p>
              )}
            </div>

            {/* Transport Controls */}
            <div className="flex items-center gap-6">
              <button 
                onClick={() => sendCommand('setPlayerCmd:prev')}
                className="w-12 h-12 rounded-full flex items-center justify-center bg-[#1a1a1a] hover:bg-[#2a2a2a] text-zinc-400 hover:text-white transition-all border border-[#333]"
              >
                <SkipBack size={20} />
              </button>
              
              <button 
                onClick={() => sendCommand(isPlaying ? 'setPlayerCmd:pause' : 'setPlayerCmd:play')}
                className="w-16 h-16 rounded-full flex items-center justify-center bg-zinc-100 hover:bg-white text-black transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
              </button>

              <button 
                onClick={() => sendCommand('setPlayerCmd:next')}
                className="w-12 h-12 rounded-full flex items-center justify-center bg-[#1a1a1a] hover:bg-[#2a2a2a] text-zinc-400 hover:text-white transition-all border border-[#333]"
              >
                <SkipForward size={20} />
              </button>
            </div>

            {/* Volume Control */}
            <div className="pt-8 border-t border-[#222]">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => sendCommand(`setPlayerCmd:mute:${isMuted ? '0' : '1'}`)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'text-red-400 bg-red-400/10' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                
                <div className="flex-1 group relative">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={handleVolumeChange}
                    onMouseUp={handleVolumeRelease}
                    onTouchEnd={handleVolumeRelease}
                    className="w-full h-2 bg-[#222] rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
                
                <div className="w-12 text-right text-sm font-mono text-zinc-400">
                  {volume}%
                </div>
              </div>
            </div>
            
            {/* Input Sources */}
            <div className="pt-6 border-t border-[#222]">
              <h3 className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-3">Input Source</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'wifi', numericMode: '10', label: 'Wi-Fi / Net' },
                  { id: 'line-in', numericMode: '40', label: 'Line-In' },
                  { id: 'bluetooth', numericMode: '41', label: 'Bluetooth' },
                  { id: 'optical', numericMode: '43', label: 'Optical' }, // Often 43
                  { id: 'udisk', numericMode: '11', label: 'USB' },
                  { id: 'coaxial', numericMode: '45', label: 'Coaxial' },
                  { id: 'hdmi', numericMode: '49', label: 'HDMI ARC' },
                  { id: 'usbdac', numericMode: '51', label: 'PC USB' }
                ].map(src => {
                  const currentPadded = currentMode.padStart(2, '0');
                  const srcPadded = src.numericMode.padStart(2, '0');
                  const isActive = currentPadded === srcPadded || (src.id === 'udisk' && (currentPadded === '11' || currentPadded === '011'));
                  
                  return (
                    <button
                      key={src.id}
                      onClick={() => handleSwitchMode(src.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                        isActive 
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                          : 'bg-[#0a0a0a] border-[#333] hover:border-[#555] hover:bg-[#151515] text-zinc-400'
                      }`}
                    >
                      {src.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Presets (TCP/UART) */}
            <div className="pt-6">
              <h3 className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-3">Presets</h3>
              <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(preset => (
                  <button
                    key={preset}
                    onClick={() => sendCommand(`setPlayerCmd:playLocalList:${preset}`)}
                    className="aspect-square rounded-lg text-xs font-medium transition-all border bg-[#0a0a0a] border-[#333] hover:border-[#555] hover:bg-[#151515] text-zinc-400 flex items-center justify-center"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
