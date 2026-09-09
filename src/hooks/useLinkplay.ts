import { useState, useCallback, useEffect, useRef } from 'react';
import { PlayerStatus, DeviceStatus, MetaInfo, UartStatus, SysInfo } from '../types';

export function useLinkplay() {
  const [ip, setIp] = useState<string>('');
  const [protocol, setProtocol] = useState<'http' | 'https'>('http');
  const [isConnected, setIsConnected] = useState(false);
  const [isTcpConnected, setIsTcpConnected] = useState(false);
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null);
  const [metaInfo, setMetaInfo] = useState<MetaInfo | null>(null);
  
  // New State variables for UART and System
  const [uartStatus, setUartStatus] = useState<UartStatus>({
    bass: 0, treble: 0, mid: 0, balance: 0, vbs: false,
    eqe: false, cfe: false, cff: 0, peqList: '', eqs: 0,
    vst: 0, vof: 0, vog: 0, deviceNet: '', rssiWifi: '',
    rssiBt: '', ip: '', time: '', pinOn: false, pin: '', deviceName: ''
  });
  const [sysInfo, setSysInfo] = useState<SysInfo | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const pollIntervalRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize WebSocket connection for TCP
  const initWebSocket = useCallback((targetIp: string) => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    // Use secure websocket if the page itself is loaded over https (though it usually won't be in this preview context)
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'connect_tcp', ip: targetIp, port: 8899 }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'tcp_status') {
          setIsTcpConnected(msg.status === 'connected');
          if (msg.status === 'connected') {
            // Request full system info when TCP connects
            ws.send(JSON.stringify({ type: 'send_tcp', command: 'MCU+INF+GET' }));
            ws.send(JSON.stringify({ type: 'send_tcp', command: 'MCU+PLP+GET' }));
            // Query a bunch of UART states to hydrate UI
            ['BAS', 'TRE', 'MID', 'BAL', 'VBS', 'PEQ', 'EQS'].forEach((cmd, idx) => {
              setTimeout(() => {
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({ type: 'send_tcp', command: `MCU+PAS+RAKOIT:${cmd}&` }));
                }
              }, idx * 200); // Stagger requests slightly as per Arylic best practices
            });
          }
        } else if (msg.type === 'tcp_data') {
          const text = msg.data as string;
          console.log('[TCP Received]', text);
          
          // Strip any binary headers and find AXX+
          const axxIndex = text.indexOf('AXX+');
          if (axxIndex !== -1) {
            const payload = text.substring(axxIndex);
            
            // Handle Volume: AXX+VOL+050
            if (payload.startsWith('AXX+VOL+')) {
              const volVal = parseInt(payload.substring(8, 11), 10).toString();
              setPlayerStatus(prev => prev ? { ...prev, vol: volVal } : null);
            }
            // Handle Mute: AXX+MUT+001
            else if (payload.startsWith('AXX+MUT+')) {
              const muteVal = payload.substring(8, 11);
              setPlayerStatus(prev => prev ? { ...prev, mute: muteVal === '001' ? '1' : '0' } : null);
            }
            // Handle Play/Pause: AXX+PLY+001
            else if (payload.startsWith('AXX+PLY+')) {
              const playVal = payload.substring(8, 11);
              setPlayerStatus(prev => prev ? { ...prev, status: playVal === '001' ? 'play' : 'pause' } : null);
            }
            // Handle Playback Mode: AXX+PLP+001
            else if (payload.startsWith('AXX+PLP+')) {
              const loopVal = parseInt(payload.substring(8, 11), 10).toString();
              setPlayerStatus(prev => prev ? { ...prev, loop: loopVal } : null);
            }
            // Handle Metadata: AXX+MEA+DAT{ "title": "...", "artist": "..." }&
            else if (payload.startsWith('AXX+MEA+DAT')) {
              try {
                const jsonStart = payload.indexOf('{');
                const jsonEnd = payload.lastIndexOf('}');
                if (jsonStart !== -1 && jsonEnd !== -1) {
                  const jsonStr = payload.substring(jsonStart, jsonEnd + 1);
                  const data = JSON.parse(jsonStr);
                  
                  setMetaInfo(prev => ({
                    Title: data.title || prev?.Title || '',
                    Artist: data.artist || prev?.Artist || '',
                    Album: data.album || prev?.Album || '',
                    albumArtURI: prev?.albumArtURI
                  }));
                  
                  setPlayerStatus(prev => prev ? {
                    ...prev,
                    Title: data.title || prev.Title,
                    Artist: data.artist || prev.Artist,
                    Album: data.album || prev.Album
                  } : null);
                }
              } catch (e) {
                console.error("Failed to parse AXX+MEA+DAT JSON", e);
              }
            }
            // Handle Progress: AXX+SNG+INF{"curpos":"3996","totlen":"229000","status":"play","loop":"0"}&
            else if (payload.startsWith('AXX+SNG+INF')) {
              try {
                const jsonStart = payload.indexOf('{');
                const jsonEnd = payload.lastIndexOf('}');
                if (jsonStart !== -1 && jsonEnd !== -1) {
                  const data = JSON.parse(payload.substring(jsonStart, jsonEnd + 1));
                  setPlayerStatus(prev => prev ? { 
                    ...prev, 
                    curpos: data.curpos || prev.curpos, 
                    totlen: data.totlen || prev.totlen, 
                    status: data.status || prev.status,
                    loop: data.loop || prev.loop 
                  } : null);
                }
              } catch(e) {}
            }
            // Handle System Info: AXX+INF+INF{"uuid":"..."}
            else if (payload.startsWith('AXX+INF+INF')) {
              try {
                const jsonStart = payload.indexOf('{');
                const jsonEnd = payload.lastIndexOf('}');
                if (jsonStart !== -1 && jsonEnd !== -1) {
                  const data = JSON.parse(payload.substring(jsonStart, jsonEnd + 1));
                  setSysInfo(data);
                }
              } catch(e) {}
            }
            // Handle UART Passthrough Responses: AXX+PAS+RAKOIT:BAS:2&
            else if (payload.startsWith('AXX+PAS+RAKOIT:')) {
              const uartData = payload.substring(15).split('&')[0];
              const parts = uartData.split(':');
              if (parts.length >= 2) {
                const cmd = parts[0];
                const val = parts.slice(1).join(':'); // Rejoin in case of things like time "12:00:00"
                
                setUartStatus(prev => {
                  const newState = { ...prev };
                  if (cmd === 'BAS') newState.bass = parseInt(val, 10);
                  else if (cmd === 'TRE') newState.treble = parseInt(val, 10);
                  else if (cmd === 'MID') newState.mid = parseInt(val, 10);
                  else if (cmd === 'BAL') newState.balance = parseInt(val, 10);
                  else if (cmd === 'VBS') newState.vbs = val === '1';
                  else if (cmd === 'EQE') newState.eqe = val === '1';
                  else if (cmd === 'CFE') newState.cfe = val === '1';
                  else if (cmd === 'CFF') newState.cff = parseInt(val, 10);
                  else if (cmd === 'PEQ') newState.peqList = val;
                  else if (cmd === 'EQS') newState.eqs = parseInt(val, 10);
                  else if (cmd === 'VST') newState.vst = parseInt(val, 10);
                  else if (cmd === 'VOF') newState.vof = parseInt(val, 10);
                  else if (cmd === 'VOG') newState.vog = parseInt(val, 10);
                  else if (cmd === 'STA') newState.deviceNet = val;
                  else if (cmd === 'WSS') newState.rssiWifi = val;
                  else if (cmd === 'BSS') newState.rssiBt = val;
                  else if (cmd === 'IPA') newState.ip = val;
                  else if (cmd === 'TME') newState.time = val;
                  else if (cmd === 'COE') newState.pinOn = val === '1';
                  else if (cmd === 'COD') newState.pin = val;
                  else if (cmd === 'NAM') {
                    // NAM hex decode
                    try {
                      const bytes = new Uint8Array(val.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
                      newState.deviceName = new TextDecoder().decode(bytes);
                    } catch(e) {}
                  }
                  return newState;
                });
              }
            }
          }
        } else if (msg.type === 'tcp_error') {
          console.error('[TCP Error]', msg.error);
        }
      } catch (err) {
        // Not JSON
      }
    };

    ws.onclose = () => {
      setIsTcpConnected(false);
    };

    wsRef.current = ws;
  }, []);

  const sendCommand = useCallback(async (command: string): Promise<any> => {
    if (!ip) {
      setError('IP Address is required');
      return null;
    }
    try {
      const url = `/api/proxy?ip=${encodeURIComponent(ip)}&protocol=${protocol}&command=${encodeURIComponent(command)}`;
      const res = await fetch(url, { method: 'GET' });
      
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      }

      const text = await res.text();
      try {
        const json = JSON.parse(text);
        return json;
      } catch (e) {
        return text;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect. The cloud server cannot reach your local network IP. Download the app to run locally.');
      setIsConnected(false);
      return null;
    }
  }, [ip, protocol]);

  const sendTcpCommand = useCallback((command: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && isTcpConnected) {
      wsRef.current.send(JSON.stringify({ type: 'send_tcp', command }));
    } else {
      console.warn("TCP socket not connected, cannot send command:", command);
    }
  }, [isTcpConnected]);

  const fetchStatus = useCallback(async () => {
    if (!ip) return;
    try {
      const pStatus = await sendCommand('getPlayerStatus');
      if (pStatus && typeof pStatus === 'object') {
        setPlayerStatus(pStatus);
        setIsConnected(true);
        setError(null);
        
        if (pStatus.status === 'play') {
          const mInfo = await sendCommand('getMetaInfo');
          if (mInfo && typeof mInfo === 'object') {
            // Some linkplay devices return relative URLs for album art. Prepend the IP if so.
            if (mInfo.albumArtURI && mInfo.albumArtURI.startsWith('/')) {
              mInfo.albumArtURI = `${protocol}://${ip}${mInfo.albumArtURI}`;
            }
            setMetaInfo(mInfo);
          }
        }
      }
      
      const dStatus = await sendCommand('getDeviceStatus');
      if (dStatus && typeof dStatus === 'object') {
        setDeviceStatus(dStatus);
      }
    } catch (e) {
      // error handled in sendCommand
    }
  }, [ip, protocol, sendCommand]);

  const connect = useCallback((newIp: string, newProtocol: 'http' | 'https' = 'http') => {
    setIp(newIp);
    setProtocol(newProtocol);
    setIsPolling(true);
    initWebSocket(newIp);
  }, [initWebSocket]);

  const disconnect = useCallback(() => {
    setIp('');
    setIsConnected(false);
    setIsTcpConnected(false);
    setIsPolling(false);
    setPlayerStatus(null);
    setDeviceStatus(null);
    setMetaInfo(null);
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isPolling) {
      fetchStatus();
      pollIntervalRef.current = window.setInterval(fetchStatus, 3000);
    } else {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    }
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isPolling, fetchStatus]);

  return {
    ip,
    isConnected,
    isTcpConnected,
    playerStatus,
    deviceStatus,
    metaInfo,
    uartStatus,
    sysInfo,
    error,
    connect,
    disconnect,
    sendCommand,
    sendTcpCommand,
    fetchStatus
  };
}
