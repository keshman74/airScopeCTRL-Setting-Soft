import React, { useState } from 'react';
import { Send, Terminal as TerminalIcon } from 'lucide-react';

interface TerminalViewProps {
  sendCommand: (cmd: string) => Promise<any>;
}

export function TerminalView({ sendCommand }: TerminalViewProps) {
  const [command, setCommand] = useState('');
  const [logs, setLogs] = useState<{ id: number; type: 'cmd' | 'res' | 'err'; text: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [logCount, setLogCount] = useState(0);

  const addLog = (type: 'cmd' | 'res' | 'err', text: string) => {
    setLogs((prev) => [...prev, { id: logCount, type, text }]);
    setLogCount((prev) => prev + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    const cmdToRun = command.trim();
    setCommand('');
    addLog('cmd', cmdToRun);
    setIsLoading(true);

    try {
      const res = await sendCommand(cmdToRun);
      const resText = typeof res === 'object' ? JSON.stringify(res, null, 2) : String(res);
      addLog('res', resText);
    } catch (err: any) {
      addLog('err', err.message || 'Error executing command');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-8 flex flex-col h-full">
      <div className="bg-[#111] border border-[#222] rounded-2xl p-6 shadow-2xl flex flex-col h-full max-h-[80vh]">
        <div className="flex items-center gap-3 mb-6">
          <TerminalIcon className="text-emerald-400" />
          <h2 className="text-xl font-bold text-white tracking-wide">Raw HTTP API Terminal</h2>
        </div>
        
        {/* Terminal Output */}
        <div className="flex-1 bg-[#0a0a0a] rounded-lg border border-[#222] p-4 overflow-y-auto font-mono text-sm space-y-2 mb-6 shadow-inner">
          {logs.length === 0 ? (
            <div className="text-zinc-600 italic">No commands executed yet. Try "getPlayerStatus".</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className={`p-2 rounded ${
                log.type === 'cmd' ? 'bg-zinc-900 text-zinc-300' :
                log.type === 'err' ? 'bg-red-950/30 text-red-400' :
                'bg-[#151515] text-emerald-400'
              }`}>
                <span className="opacity-50 mr-2 select-none">
                  {log.type === 'cmd' ? '>' : log.type === 'res' ? '<' : '!'}
                </span>
                <span className="whitespace-pre-wrap break-all">{log.text}</span>
              </div>
            ))
          )}
          {isLoading && (
            <div className="text-zinc-500 animate-pulse">Executing...</div>
          )}
        </div>

        {/* Command Input */}
        <form onSubmit={handleSubmit} className="flex gap-4 shrink-0">
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Enter command (e.g., setPlayerCmd:play)"
            className="flex-1 bg-[#0a0a0a] border border-[#333] rounded-md px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors font-mono"
          />
          <button
            type="submit"
            disabled={!command.trim() || isLoading}
            className="bg-zinc-100 hover:bg-white disabled:opacity-50 text-zinc-900 px-6 rounded-md font-semibold flex items-center justify-center transition-colors"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
