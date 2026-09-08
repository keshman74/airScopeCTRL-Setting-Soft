export interface PlayerStatus {
  type: string;
  ch: string;
  mode: string;
  loop: string;
  eq: string;
  status: string;
  curpos: string;
  offset_pts: string;
  totlen: string;
  Title: string;
  Artist: string;
  Album: string;
  alarmflag: string;
  plicount: string;
  plicurr: string;
  vol: string;
  mute: string;
}

export interface DeviceStatus {
  uuid: string;
  DeviceName: string;
  GroupId: string;
  MAC: string;
  STA_MAC: string;
  Hardware: string;
  Version: string;
  project: string;
  apcli0: string;
  eth2: string;
  language: string;
  battery: string;
  battery_percent: string;
  firmware: string;
  Netmask: string;
  Gateway: string;
  ESSID: string;
}

export type ViewMode = 'playback' | 'eq' | 'system' | 'terminal' | 'advanced';
