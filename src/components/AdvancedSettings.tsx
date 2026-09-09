import React, { useState, useEffect } from 'react';
import { DeviceStatus, PlayerStatus, UartStatus } from '../types';
import { Save, AlertTriangle, RotateCcw, Settings, Wifi, Bluetooth, Network } from 'lucide-react';

interface AdvancedSettingsProps {
  deviceStatus: DeviceStatus | null;
  playerStatus: PlayerStatus | null;
  uartStatus?: UartStatus;
  sendCommand: (cmd: string) => Promise<any>;
  sendTcpCommand?: (cmd: string) => void;
}

export function AdvancedSettings({ deviceStatus, playerStatus, uartStatus, sendCommand, sendTcpCommand }: AdvancedSettingsProps) {
  const [deviceName, setDeviceName] = useState('');
  const [pinCode, setPinCode] = useState('');
  
  const [maxVolume, setMaxVolume] = useState<number | null>(null);
  const [fixedVolume, setFixedVolume] = useState<number | null>(null);
  
  const [staticIp, setStaticIp] = useState('');
  const [staticMask, setStaticMask] = useState('255.255.255.0');
  const [staticGw, setStaticGw] = useState('');
  const [staticDns, setStaticDns] = useState('8.8.8.8');

  useEffect(() => {
    if (uartStatus?.deviceName) {
      setDeviceName(uartStatus.deviceName);
    } else if (deviceStatus?.DeviceName) {
      setDeviceName(deviceStatus.DeviceName);
    }
    
    if (uartStatus?.pin) setPinCode(uartStatus.pin);
    if (uartStatus?.mxv !== undefined && maxVolume === null) setMaxVolume(uartStatus.mxv);
    if (uartStatus?.vof !== undefined && fixedVolume === null) setFixedVolume(uartStatus.vof);

    if (uartStatus?.ip && !staticIp) {
      setStaticIp(uartStatus.ip);
      const parts = uartStatus.ip.split('.');
      if (parts.length === 4) {
        setStaticGw(`${parts[0]}.${parts[1]}.${parts[2]}.1`);
      }
    }
  }, [deviceStatus, uartStatus]);

  const handleSaveVolumeSettings = () => {
    if (sendTcpCommand) {
      if (maxVolume !== null) sendTcpCommand(`MCU+PAS+RAKOIT:MXV:${maxVolume}&`);
      if (fixedVolume !== null) sendTcpCommand(`MCU+PAS+RAKOIT:VOF:${fixedVolume}&`);
      alert("Volume limits saved.");
    }
  };

  const handleSaveStaticIp = () => {
    if (staticIp && staticMask && staticGw) {
      // type can be wifi or eth. Let's default to wifi as it's most common for this setup
      const cmd = `setStaticIP:{"type":"wifi","ip":"${staticIp}","mask":"${staticMask}","gateway":"${staticGw}","dns":[{"service":"${staticDns}"}]}`;
      sendCommand(cmd);
      alert("Static IP command sent. Device will disconnect if IP changes.");
    }
  };

  const handleSaveDeviceName = () => {
    if (deviceName.trim() && sendTcpCommand) {
      // Encode to hex for NAM command
      const hexName = Array.from(new TextEncoder().encode(deviceName))
        .map(b => b.toString(16).padStart(2, '0').toUpperCase())
        .join('');
      sendTcpCommand(`MCU+PAS+RAKOIT:NAM:${hexName}&`);
    } else if (deviceName.trim()) {
      sendCommand(`setDeviceName:${deviceName}`);
    }
  };

  const handleSavePin = () => {
    if (pinCode.trim() && sendTcpCommand) {
      sendTcpCommand(`MCU+PAS+RAKOIT:COD:${pinCode}&`);
    }
  };

  const handleTogglePin = () => {
    if (sendTcpCommand) {
      const newVal = uartStatus?.pinOn ? '0' : '1';
      sendTcpCommand(`MCU+PAS+RAKOIT:COE:${newVal}&`);
      alert("Device will reboot to apply PIN code setting.");
    }
  };

  const handleWifiSetup = () => {
    if (sendTcpCommand) {
      sendTcpCommand(`MCU+PAS+RAKOIT:WRS&`);
      alert("Device entered Wi-Fi configuration mode. Please use the mobile app to set it up.");
    }
  };

  const handleReboot = () => {
    if (window.confirm('Are you sure you want to reboot the device?')) {
      if (sendTcpCommand) {
        sendTcpCommand(`MCU+PAS+RAKOIT:SYS:REBOOT&`);
      } else {
        sendCommand('reboot');
      }
    }
  };

  const handleFactoryReset = () => {
    if (window.confirm('WARNING: This will erase all settings and restore factory defaults! Continue?')) {
      if (sendTcpCommand) {
        sendTcpCommand(`MCU+PAS+RAKOIT:SYS:RESET&`);
      } else {
        sendCommand('restoreToDefault');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-8 space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-emerald-500/10 rounded-xl">
          <Settings className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Advanced Settings</h2>
          <p className="text-zinc-400 text-sm">System configuration and connectivity</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Device Info */}
        <div className="bg-[#111] border border-[#222] rounded-2xl p-8 space-y-6">
          <h3 className="text-lg font-semibold text-white mb-6">Identity</h3>
          
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest">Device Name</h4>
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
            <p className="text-xs text-zinc-600">The name broadcasted on the network.</p>
          </div>
          
          {uartStatus?.time && (
             <div className="space-y-1 pt-4 border-t border-[#222]">
              <h4 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest">Local Time</h4>
              <p className="text-zinc-300 font-mono text-sm">{uartStatus.time}</p>
             </div>
          )}
        </div>

        {/* Connectivity */}
        <div className="bg-[#111] border border-[#222] rounded-2xl p-8 space-y-8">
          <h3 className="text-lg font-semibold text-white mb-6">Connectivity</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wifi size={18} className="text-zinc-400" />
                <span className="text-sm font-medium text-zinc-300">Wi-Fi Signal</span>
              </div>
              <span className="text-sm font-mono text-zinc-400">{uartStatus?.rssiWifi ? `${uartStatus.rssiWifi} dBm` : 'Unknown'}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bluetooth size={18} className="text-zinc-400" />
                <span className="text-sm font-medium text-zinc-300">Bluetooth Signal</span>
              </div>
              <span className="text-sm font-mono text-zinc-400">{uartStatus?.rssiBt ? `${uartStatus.rssiBt} dBm` : 'Unknown'}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Network size={18} className="text-zinc-400" />
                <span className="text-sm font-medium text-zinc-300">IP Address</span>
              </div>
              <span className="text-sm font-mono text-zinc-400">{uartStatus?.ip || deviceStatus?.apcli0 || 'Unknown'}</span>
            </div>
          </div>
          
          <div className="pt-4 border-t border-[#222]">
            <button 
              onClick={handleWifiSetup}
              className="w-full bg-[#1a1a1a] hover:bg-[#2a2a2a] text-zinc-300 border border-[#333] px-4 py-2 rounded-md transition-colors text-sm"
            >
              Trigger Wi-Fi Setup Mode
            </button>
          </div>
        </div>

        {/* Bluetooth Security */}
        <div className="bg-[#111] border border-[#222] rounded-2xl p-8 space-y-6">
          <h3 className="text-lg font-semibold text-white mb-6">Bluetooth Security</h3>
          
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#1a1a1a] border border-[#333]">
            <div>
              <div className="text-sm font-medium text-white">PIN Code Requirement</div>
              <div className="text-xs text-zinc-500">Require PIN to pair Bluetooth</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={uartStatus?.pinOn || false}
                onChange={handleTogglePin}
              />
              <div className="w-11 h-6 bg-[#333] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest">Bluetooth PIN</h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={pinCode}
                maxLength={4}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                placeholder="0000"
                className="flex-1 bg-[#0a0a0a] border border-[#333] rounded-md px-4 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono tracking-widest"
              />
              <button onClick={handleSavePin} className="bg-[#222] hover:bg-[#333] text-zinc-200 px-4 py-2 rounded-md transition-colors">
                <Save size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Volume Limits */}
        <div className="bg-[#111] border border-[#222] rounded-2xl p-8 space-y-6">
          <h3 className="text-lg font-semibold text-white mb-6">Volume Output</h3>
          
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest flex justify-between">
              <span>Maximum Volume Limit</span>
              <span className="text-emerald-400">{maxVolume !== null ? maxVolume : '--'}%</span>
            </h4>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={maxVolume !== null ? maxVolume : 100}
              onChange={(e) => setMaxVolume(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-[#333] rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <p className="text-xs text-zinc-600">Caps the maximum adjustable volume to protect speakers.</p>
          </div>

          <div className="space-y-4 pt-4 border-t border-[#222]">
            <h4 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest flex justify-between">
              <span>Fixed Output Volume (VOF)</span>
              <span className="text-emerald-400">{fixedVolume !== null && fixedVolume > 0 ? fixedVolume : 'Variable'}%</span>
            </h4>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={fixedVolume !== null ? fixedVolume : 0}
              onChange={(e) => setFixedVolume(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-[#333] rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <p className="text-xs text-zinc-600">If set above 0, the device outputs at this fixed volume and volume controls are disabled (ideal for external preamps).</p>
          </div>
          
          <button onClick={handleSaveVolumeSettings} className="w-full bg-[#1a1a1a] hover:bg-[#2a2a2a] text-zinc-300 border border-[#333] px-4 py-2 rounded-md transition-colors text-sm flex items-center justify-center gap-2">
            <Save size={16} /> Save Volume Limits
          </button>
        </div>

        {/* Network Configuration */}
        <div className="bg-[#111] border border-[#222] rounded-2xl p-8 space-y-6">
          <h3 className="text-lg font-semibold text-white mb-6">Network (Static IP)</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1 block">IP Address</label>
              <input type="text" value={staticIp} onChange={e => setStaticIp(e.target.value)} placeholder="192.168.1.100" className="w-full bg-[#0a0a0a] border border-[#333] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono" />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1 block">Subnet Mask</label>
              <input type="text" value={staticMask} onChange={e => setStaticMask(e.target.value)} placeholder="255.255.255.0" className="w-full bg-[#0a0a0a] border border-[#333] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono" />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1 block">Gateway</label>
              <input type="text" value={staticGw} onChange={e => setStaticGw(e.target.value)} placeholder="192.168.1.1" className="w-full bg-[#0a0a0a] border border-[#333] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono" />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1 block">DNS Server</label>
              <input type="text" value={staticDns} onChange={e => setStaticDns(e.target.value)} placeholder="8.8.8.8" className="w-full bg-[#0a0a0a] border border-[#333] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono" />
            </div>
          </div>
          
          <button onClick={handleSaveStaticIp} className="w-full bg-[#1a1a1a] hover:bg-[#2a2a2a] text-zinc-300 border border-[#333] px-4 py-2 rounded-md transition-colors text-sm flex items-center justify-center gap-2">
            <Save size={16} /> Apply Static IP
          </button>
        </div>

        {/* System Control */}
        <div className="bg-[#111] border border-[#222] rounded-2xl p-8 space-y-6">
          <h3 className="text-lg font-semibold text-white mb-6">System Actions</h3>
          
          <div className="space-y-4">
            <button 
              onClick={handleReboot}
              className="w-full flex items-center justify-center gap-2 bg-amber-950/30 text-amber-500 border border-amber-900/50 hover:bg-amber-900/40 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <RotateCcw size={18} />
              Reboot Device
            </button>
            
            <button 
              onClick={handleFactoryReset}
              className="w-full flex items-center justify-center gap-2 bg-red-950/30 text-red-500 border border-red-900/50 hover:bg-red-900/40 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <AlertTriangle size={18} />
              Factory Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
