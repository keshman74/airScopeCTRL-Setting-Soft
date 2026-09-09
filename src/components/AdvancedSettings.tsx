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
  
  useEffect(() => {
    if (uartStatus?.deviceName) {
      setDeviceName(uartStatus.deviceName);
    } else if (deviceStatus?.DeviceName) {
      setDeviceName(deviceStatus.DeviceName);
    }
    
    if (uartStatus?.pin) {
      setPinCode(uartStatus.pin);
    }
  }, [deviceStatus, uartStatus]);

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
