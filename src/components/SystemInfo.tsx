import React from 'react';
import { DeviceStatus } from '../types';

interface SystemInfoProps {
  deviceStatus: DeviceStatus | null;
}

export function SystemInfo({ deviceStatus }: SystemInfoProps) {
  if (!deviceStatus) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-zinc-500">Waiting for device info...</p>
      </div>
    );
  }

  const infoList = [
    { label: 'Device Name', value: deviceStatus.DeviceName },
    { label: 'Firmware Version', value: deviceStatus.firmware },
    { label: 'Hardware', value: deviceStatus.Hardware },
    { label: 'UUID', value: deviceStatus.uuid },
    { label: 'MAC Address', value: deviceStatus.MAC },
    { label: 'IP Address', value: deviceStatus.apcli0 },
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-8">
      <div className="bg-[#111] border border-[#222] rounded-2xl p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-8 tracking-wide">System Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {infoList.map((item, idx) => (
            <div key={idx} className="bg-[#0a0a0a] border border-[#222] p-4 rounded-lg flex flex-col gap-1">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">{item.label}</span>
              <span className="text-zinc-200 font-mono text-sm truncate" title={item.value || 'N/A'}>
                {item.value || 'N/A'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
