import React, { useState, useEffect } from 'react';
import { DeviceStatus, PlayerStatus } from '../types';
import { Save, AlertTriangle, LogOut, RotateCcw } from 'lucide-react';

interface AdvancedSettingsProps {
  deviceStatus: DeviceStatus | null;
  playerStatus: PlayerStatus | null;
  sendCommand: (cmd: string) => Promise<any>;
}

export function AdvancedSettings({ deviceStatus, playerStatus, sendCommand }: AdvancedSettingsProps) {
  const [deviceName, setDeviceName] = useState('');
  const [ssid, setSsid] = useState('');

  useEffect(() => {
    if (deviceStatus) {
      setDeviceName(deviceStatus.DeviceName || '');
      setSsid(deviceStatus.ESSID || '');
    }
  }, [deviceStatus]);

  const handleSaveDeviceName = () => {
    if (deviceName.trim()) {
      sendCommand(`setDeviceName:${deviceName}`);
    }
  };

  const handleSaveSsid = () => {
    if (ssid.trim()) {
      sendCommand(`setSSID:${ssid}`);
    }
  };

  const handleSwitchMode = (mode: string) => {
    sendCommand(`setPlayerCmd:switchmode:${mode}`);
  };

  const handleReboot = () => {
    if (window.confirm('Are you sure you want to reboot the device?')) {
      sendCommand('reboot');
    }
  };

  const handleFactoryReset = () => {
    if (window.confirm('WARNING: This will erase all settings and restore factory defaults! Continue?')) {
      sendCommand('restoreToDefault');
    }
  };

  const currentMode = playerStatus?.mode || '';

  return (
    <div className="max-w-4xl mx-auto py-12 px-8">
      <div className="bg-[#111] border border-[#222] rounded-2xl p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-8 tracking-wide">Advanced Settings</h2>
        
        <div className="space-y-12">
          
          {/* Input Source Selection */}
          <section>
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-4">Input Source Selection</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {[
                { id: 'wifi', numericMode: '10', label: 'Wi-Fi / Network' },
                { id: 'line-in', numericMode: '40', label: 'Line In / Aux' },
                { id: 'bluetooth', numericMode: '41', label: 'Bluetooth' },
                { id: 'optical', numericMode: '43', label: 'Optical' },
                { id: 'udisk', numericMode: '11', label: 'USB' } // note: udisk mode can vary, 11 or 43 sometimes
              ].map(src => {
                const isActive = currentMode === src.numericMode || (src.id === 'udisk' && (currentMode === '43' || currentMode === '11'));
                return (
                  <button
                    key={src.id}
                    onClick={() => handleSwitchMode(src.id)}
                    className={`px-4 py-4 rounded-xl text-sm font-medium transition-all border ${
                      isActive 
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                        : 'bg-[#0a0a0a] border-[#333] hover:border-[#555] hover:bg-[#151515] text-zinc-300'
                    }`}
                  >
                    {src.label}
                  </button>
                )
              })}
            </div>
          </section>

          {/* Network & Device Info Configuration */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest">Device Name</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="e.g. Living Room"
                  className="flex-1 bg-[#0a0a0a] border border-[#333] rounded-md px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
                <button onClick={handleSaveDeviceName} className="bg-[#222] hover:bg-[#333] text-zinc-200 px-4 py-2 rounded-md transition-colors">
                  <Save size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest">SoftAP SSID (Hotspot)</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ssid}
                  onChange={(e) => setSsid(e.target.value)}
                  placeholder="e.g. Arylic_Audio"
                  className="flex-1 bg-[#0a0a0a] border border-[#333] rounded-md px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
                <button onClick={handleSaveSsid} className="bg-[#222] hover:bg-[#333] text-zinc-200 px-4 py-2 rounded-md transition-colors">
                  <Save size={18} />
                </button>
              </div>
            </div>
          </section>

          {/* System Control */}
          <section className="border-t border-[#222] pt-8">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-4">System Actions</h3>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={handleReboot}
                className="flex items-center gap-2 bg-amber-950/30 text-amber-500 border border-amber-900/50 hover:bg-amber-900/40 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <RotateCcw size={18} />
                Reboot Device
              </button>
              
              <button 
                onClick={handleFactoryReset}
                className="flex items-center gap-2 bg-red-950/30 text-red-500 border border-red-900/50 hover:bg-red-900/40 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <AlertTriangle size={18} />
                Factory Reset
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
