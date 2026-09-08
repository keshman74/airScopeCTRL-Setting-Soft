/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ViewMode } from './types';
import { useLinkplay } from './hooks/useLinkplay';
import { Sidebar } from './components/Sidebar';
import { ConnectionView } from './components/ConnectionView';
import { PlaybackView } from './components/PlaybackView';
import { EQSettings } from './components/EQSettings';
import { AdvancedSettings } from './components/AdvancedSettings';
import { SystemInfo } from './components/SystemInfo';
import { TerminalView } from './components/TerminalView';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('playback');
  const { 
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
    sendTcpCommand
  } = useLinkplay();

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-zinc-200 overflow-hidden font-sans">
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        isConnected={isConnected}
        onDisconnect={disconnect}
      />
      
      <main className="flex-1 h-full overflow-y-auto">
        {!isConnected ? (
          <ConnectionView onConnect={connect} error={error} />
        ) : (
          <div className="h-full">
            {currentView === 'playback' && (
              <PlaybackView status={playerStatus} metaInfo={metaInfo} sendCommand={sendCommand} sendTcpCommand={sendTcpCommand} />
            )}
            {currentView === 'eq' && (
              <EQSettings status={playerStatus} sendCommand={sendCommand} sendTcpCommand={sendTcpCommand} />
            )}
            {currentView === 'advanced' && (
              <AdvancedSettings deviceStatus={deviceStatus} playerStatus={playerStatus} sendCommand={sendCommand} />
            )}
            {currentView === 'system' && (
              <SystemInfo deviceStatus={deviceStatus} />
            )}
            {currentView === 'terminal' && (
              <TerminalView sendCommand={sendCommand} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

