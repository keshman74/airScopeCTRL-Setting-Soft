import React from 'react';
import { DeviceStatus, SysInfo } from '../types';
import { Info } from 'lucide-react';

interface SystemInfoProps {
  deviceStatus: DeviceStatus | null;
  sysInfo?: SysInfo | null;
}

export function SystemInfo({ deviceStatus, sysInfo }: SystemInfoProps) {
  if (!deviceStatus && !sysInfo) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-zinc-500">Waiting for device info...</p>
      </div>
    );
  }

  const getValue = (key1: string, key2?: string) => {
    if (sysInfo && sysInfo[key1]) return sysInfo[key1];
    if (sysInfo && key2 && sysInfo[key2]) return sysInfo[key2];
    if (deviceStatus && (deviceStatus as any)[key1]) return (deviceStatus as any)[key1];
    if (deviceStatus && key2 && (deviceStatus as any)[key2]) return (deviceStatus as any)[key2];
    return 'N/A';
  };

  const infoList = [
    { label: 'Device Name', value: getValue('DeviceName') },
    { label: 'Firmware Version', value: getValue('firmware') },
    { label: 'MCU Version', value: getValue('mcu_ver') },
    { label: 'Hardware', value: getValue('hardware', 'Hardware') },
    { label: 'Project', value: getValue('project') },
    { label: 'UUID', value: getValue('uuid') },
    { label: 'MAC Address', value: getValue('MAC') },
    { label: 'IP Address', value: getValue('apcli0') },
    { label: 'SSID', value: getValue('essid', 'ssid') },
    { label: 'Build Release', value: getValue('Release', 'date') },
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-emerald-500/10 rounded-xl">
          <Info className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">System Information</h2>
          <p className="text-zinc-400 text-sm">Hardware and firmware details</p>
        </div>
      </div>

      <div className="bg-[#111] border border-[#222] rounded-2xl p-8 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {infoList.map((item, idx) => (
            <div key={idx} className="bg-[#0a0a0a] border border-[#222] p-4 rounded-lg flex flex-col gap-1">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">{item.label}</span>
              <span className="text-zinc-200 font-mono text-sm truncate" title={item.value}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
