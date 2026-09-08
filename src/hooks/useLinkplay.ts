import { useState, useCallback, useEffect, useRef } from 'react';
import { PlayerStatus, DeviceStatus } from '../types';

export function useLinkplay() {
  const [ip, setIp] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const pollIntervalRef = useRef<number | null>(null);

  const sendCommand = useCallback(async (command: string): Promise<any> => {
    if (!ip) {
      setError('IP Address is required');
      return null;
    }
    try {
      const url = `/api/proxy?ip=${encodeURIComponent(ip)}&command=${encodeURIComponent(command)}`;
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
  }, [ip]);

  const fetchStatus = useCallback(async () => {
    if (!ip) return;
    try {
      const pStatus = await sendCommand('getPlayerStatus');
      if (pStatus && typeof pStatus === 'object') {
        setPlayerStatus(pStatus);
        setIsConnected(true);
        setError(null);
      }
      
      const dStatus = await sendCommand('getDeviceStatus');
      if (dStatus && typeof dStatus === 'object') {
        setDeviceStatus(dStatus);
      }
    } catch (e) {
      // error handled in sendCommand
    }
  }, [ip, sendCommand]);

  const connect = useCallback((newIp: string) => {
    setIp(newIp);
    setIsPolling(true);
  }, []);

  const disconnect = useCallback(() => {
    setIp('');
    setIsConnected(false);
    setIsPolling(false);
    setPlayerStatus(null);
    setDeviceStatus(null);
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
    playerStatus,
    deviceStatus,
    error,
    connect,
    disconnect,
    sendCommand,
    fetchStatus
  };
}
