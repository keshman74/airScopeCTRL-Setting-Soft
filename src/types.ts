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
  bass?: string;
  treble?: string;
}

export interface MetaInfo {
  Title: string;
  Artist: string;
  Album: string;
  albumArtURI?: string;
}

export interface UartStatus {
  bass: number;
  treble: number;
  mid: number;
  balance: number;
  vbs: boolean;
  eqe: boolean;
  cfe: boolean;
  cff: number;
  peqList: string;
  eqs: number;
  vst: number;
  vof: number;
  vog: number;
  mxv: number;
  deviceNet: string;
  rssiWifi: string;
  rssiBt: string;
  ip: string;
  time: string;
  pinOn: boolean;
  pin: string;
  deviceName: string;
}

export interface SysInfo {
  [key: string]: string;
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
