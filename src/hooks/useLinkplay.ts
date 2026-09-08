import { useState, useCallback, useEffect, useRef } from 'react';
import { PlayerStatus, DeviceStatus, MetaInfo } from '../types';

export function useLinkplay() {
  const [ip, setIp] = useState<string>('');
  const [protocol, setProtocol] = useState<'http' | 'https'>('http');
  const [isConnected, setIsConnected] = useState(false);
  const [isTcpConnected, setIsTcpConnected] = useState(false);
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null);
  const [metaInfo, setMetaInfo] = useState<MetaInfo | null>(null);
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
            // Handle Metadata: AXX+MEA+DAT{ "title": "...", "artist": "..." }&
            else if (payload.startsWith('AXX+MEA+DAT')) {
              try {
                // Extract JSON part between '{' and '}'
                const jsonStart = payload.indexOf('{');
                const jsonEnd = payload.lastIndexOf('}');
                if (jsonStart !== -1 && jsonEnd !== -1) {
                  const jsonStr = payload.substring(jsonStart, jsonEnd + 1);
                  const data = JSON.parse(jsonStr);
                  
                  setMetaInfo(prev => ({
                    Title: data.title || prev?.Title || '',
                    Artist: data.artist || prev?.Artist || '',
                    Album: data.album || prev?.Album || '',
                    albumArtURI: prev?.albumArtURI // Keep existing cover art until HTTP updates it
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
    error,
    connect,
    disconnect,
    sendCommand,
    sendTcpCommand,
    fetchStatus
  };
}
