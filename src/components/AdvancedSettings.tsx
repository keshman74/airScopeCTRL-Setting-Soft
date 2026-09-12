import React, { useState, useEffect } from 'react';
import { DeviceStatus, PlayerStatus, UartStatus, SysInfo } from '../types';
import { Save, AlertTriangle, RotateCcw, Settings, Wifi, Bluetooth, Network } from 'lucide-react';

interface AdvancedSettingsProps {
  deviceStatus: DeviceStatus | null;
  playerStatus: PlayerStatus | null;
  uartStatus?: UartStatus;
  sysInfo?: SysInfo | null;
  sendCommand: (cmd: string) => Promise<any>;
  sendTcpCommand?: (cmd: string) => void;
  updateUartStatus?: (updates: Partial<UartStatus>) => void;
}

export function AdvancedSettings({ deviceStatus, playerStatus, uartStatus, sysInfo, sendCommand, sendTcpCommand, updateUartStatus }: AdvancedSettingsProps) {
  const [deviceName, setDeviceName] = useState('');
  const [pinCode, setPinCode] = useState('');
  
  const [maxVolume, setMaxVolume] = useState<number | null>(null);
  const [fixedVolume, setFixedVolume] = useState<number | null>(null);
  const [volStep, setVolStep] = useState<number | null>(null);
  const [muteDelay, setMuteDelay] = useState<number | null>(null);
  
  const [led, setLed] = useState<boolean>(true);
  const [pmt, setPmt] = useState<boolean>(true);
  const [asw, setAsw] = useState<boolean>(false);
  const [vos, setVos] = useState<boolean>(false);
  const [sop, setSop] = useState<boolean>(false);
  const [pinOn, setPinOn] = useState<boolean>(false);
  
  const [staticIp, setStaticIp] = useState('');
  const [staticMask, setStaticMask] = useState('255.255.255.0');
  const [staticGw, setStaticGw] = useState('');
  const [staticDns, setStaticDns] = useState('8.8.8.8');

  useEffect(() => {
    if (uartStatus?.deviceName) {
      setDeviceName(uartStatus.deviceName);
    } else if (sysInfo?.DeviceName) {
      setDeviceName(sysInfo.DeviceName);
    } else if (deviceStatus?.DeviceName) {
      setDeviceName(deviceStatus.DeviceName);
    }
    
    if (uartStatus?.pin) setPinCode(uartStatus.pin);
    if (uartStatus?.mxv !== undefined && maxVolume === null) setMaxVolume(uartStatus.mxv);
    if (uartStatus?.vof !== undefined && fixedVolume === null) setFixedVolume(uartStatus.vof);
    if (uartStatus?.vst !== undefined && volStep === null) setVolStep(uartStatus.vst);
    if (uartStatus?.dly !== undefined && muteDelay === null) setMuteDelay(uartStatus.dly);
    
    if (uartStatus?.led !== undefined) setLed(uartStatus.led);
    if (uartStatus?.pmt !== undefined) setPmt(uartStatus.pmt);
    if (uartStatus?.asw !== undefined) setAsw(uartStatus.asw);
    if (uartStatus?.vos !== undefined) setVos(uartStatus.vos);
    if (uartStatus?.sop !== undefined) setSop(uartStatus.sop);
    if (uartStatus?.pinOn !== undefined) setPinOn(uartStatus.pinOn);

    if (uartStatus?.ip && !staticIp) {
      setStaticIp(uartStatus.ip);
      const parts = uartStatus.ip.split('.');
      if (parts.length === 4) {
        setStaticGw(`${parts[0]}.${parts[1]}.${parts[2]}.1`);
      }
    }
  }, [deviceStatus, uartStatus]);

  const handleSaveVolumeSettings = () => {
    if (updateUartStatus) {
      const updates: Partial<UartStatus> = {};
      if (maxVolume !== null) updates.mxv = maxVolume;
      if (fixedVolume !== null) updates.vof = fixedVolume;
      if (volStep !== null) updates.vst = volStep;
      updateUartStatus(updates);
    }
    if (sendTcpCommand) {
      if (maxVolume !== null) sendTcpCommand(`MCU+PAS+RAKOIT:MXV:${maxVolume}&`);
      if (fixedVolume !== null) sendTcpCommand(`MCU+PAS+RAKOIT:VOF:${fixedVolume}&`);
      if (volStep !== null) sendTcpCommand(`MCU+PAS+RAKOIT:VST:${volStep}&`);
      alert("Volume limits and steps saved.");
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
    if (updateUartStatus) updateUartStatus({ deviceName });
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
    if (updateUartStatus) updateUartStatus({ pin: pinCode });
    if (pinCode.trim() && sendTcpCommand) {
      sendTcpCommand(`MCU+PAS+RAKOIT:COD:${pinCode}&`);
    }
  };

  const handleTogglePin = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    if (sendTcpCommand) {
      if (window.confirm("Device will reboot to apply PIN code setting. Continue?")) {
        setPinOn(checked);
        if (updateUartStatus) updateUartStatus({ pinOn: checked });
        sendTcpCommand(`MCU+PAS+RAKOIT:COE:${checked ? '1' : '0'}&`);
      }
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
            <h4 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest flex items-center justify-between">
              <span>Device Name</span>
              <span className="text-emerald-400 font-normal normal-case">{uartStatus?.deviceName || deviceStatus?.DeviceName || 'Unknown'}</span>
            </h4>
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
                <Network size={18} className="text-zinc-400" />
                <span className="text-sm font-medium text-zinc-300">IP Address</span>
              </div>
              <span className="text-sm font-mono text-zinc-400">
                {sysInfo?.apcli0 || sysInfo?.eth2 || uartStatus?.ip || (deviceStatus?.apcli0 && deviceStatus.apcli0 !== '0.0.0.0' ? deviceStatus.apcli0 : (deviceStatus?.eth2 && deviceStatus.eth2 !== '0.0.0.0' ? deviceStatus.eth2 : 'Unknown'))}
              </span>
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
                checked={pinOn}
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

        {/* Device Behavior */}
        <div className="bg-[#111] border border-[#222] rounded-2xl p-8 space-y-6">
          <h3 className="text-lg font-semibold text-white mb-6">Device Behavior</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">LED / Display</div>
                <div className="text-xs text-zinc-500">Front panel indicators</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={led}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setLed(checked);
                    if (updateUartStatus) updateUartStatus({ led: checked });
                    if (sendTcpCommand) sendTcpCommand(`MCU+PAS+RAKOIT:LED:${checked ? '1' : '0'}&`);
                  }}
                />
                <div className="w-11 h-6 bg-[#333] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#222]">
              <div>
                <div className="text-sm font-medium text-white">Voice Prompts</div>
                <div className="text-xs text-zinc-500">Reboots device when changed</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={pmt}
                  onChange={(e) => {
                    if (window.confirm('Device will reboot to apply Voice Prompts setting. Continue?')) {
                      const checked = e.target.checked;
                      setPmt(checked);
                      if (updateUartStatus) updateUartStatus({ pmt: checked });
                      if (sendTcpCommand) sendTcpCommand(`MCU+PMT+00${checked ? '1' : '0'}`);
                    }
                  }}
                />
                <div className="w-11 h-6 bg-[#333] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#222]">
              <div>
                <div className="text-sm font-medium text-white">Auto Switch Mode</div>
                <div className="text-xs text-zinc-500">Return to prev source if lost</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={asw}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setAsw(checked);
                    if (updateUartStatus) updateUartStatus({ asw: checked });
                    if (sendTcpCommand) sendTcpCommand(`MCU+PAS+RAKOIT:ASW:${checked ? '1' : '0'}&`);
                  }}
                />
                <div className="w-11 h-6 bg-[#333] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#222]">
              <div>
                <div className="text-sm font-medium text-white">Volume Sync</div>
                <div className="text-xs text-zinc-500">Sync master vol to slaves</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={vos}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setVos(checked);
                    if (updateUartStatus) updateUartStatus({ vos: checked });
                    if (sendTcpCommand) sendTcpCommand(`MCU+PAS+RAKOIT:VOS:${checked ? '1' : '0'}&`);
                  }}
                />
                <div className="w-11 h-6 bg-[#333] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#222]">
              <div>
                <div className="text-sm font-medium text-white">Standby On Power</div>
                <div className="text-xs text-zinc-500">Enter standby mode automatically</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={sop}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSop(checked);
                    if (updateUartStatus) updateUartStatus({ sop: checked });
                    if (sendTcpCommand) sendTcpCommand(`MCU+SOP+00${checked ? '1' : '0'}`);
                  }}
                />
                <div className="w-11 h-6 bg-[#333] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="pt-4 border-t border-[#222]">
              <h4 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest flex justify-between mb-2">
                <span>Auto-Mute Delay</span>
                <span className="text-emerald-400">{muteDelay !== null ? muteDelay : '--'}</span>
              </h4>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  min="0" 
                  max="32767" 
                  value={muteDelay !== null ? muteDelay : 0}
                  onChange={(e) => setMuteDelay(parseInt(e.target.value, 10))}
                  placeholder="ms"
                  className="flex-1 bg-[#0a0a0a] border border-[#333] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button onClick={() => {
                  if (updateUartStatus && muteDelay !== null) updateUartStatus({ dly: muteDelay });
                  if (sendTcpCommand) sendTcpCommand(`MCU+PAS+RAKOIT:DLY:${muteDelay}&`);
                }} className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-zinc-300 border border-[#333] px-3 py-2 rounded-md transition-colors text-sm">Save</button>
              </div>
              <p className="text-[10px] text-zinc-600 mt-1">Delay before muting when no audio (0-32767)</p>
            </div>

            {uartStatus?.lst && uartStatus.lst.length > 0 && (
              <div className="pt-4 border-t border-[#222]">
                <h4 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-2">Power On Mode (Source)</h4>
                <select
                  value={uartStatus?.pom || ''}
                  onChange={(e) => sendTcpCommand && sendTcpCommand(`MCU+PAS+RAKOIT:POM:${e.target.value}&`)}
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Default (Remember Last)</option>
                  {uartStatus.lst.map(src => (
                    <option key={src} value={src}>{src}</option>
                  ))}
                </select>
                <p className="text-[10px] text-zinc-600 mt-1">Select the input source active upon power on.</p>
              </div>
            )}
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
              min="30" 
              max="100" 
              value={maxVolume !== null ? maxVolume : 100}
              onChange={(e) => setMaxVolume(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-[#333] rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <p className="text-xs text-zinc-600">Caps the maximum adjustable volume to protect speakers (30-100%).</p>
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
          
          <div className="space-y-4 pt-4 border-t border-[#222]">
            <h4 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest flex justify-between">
              <span>Volume Step (VST)</span>
              <span className="text-emerald-400">{volStep !== null ? volStep : '--'}</span>
            </h4>
            <input 
              type="range" 
              min="1" 
              max="20" 
              value={volStep !== null ? volStep : 5}
              onChange={(e) => setVolStep(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-[#333] rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <p className="text-xs text-zinc-600">Adjusts how much the volume changes per click.</p>
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
