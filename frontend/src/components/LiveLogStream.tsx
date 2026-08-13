import React, { useState, useEffect, useRef } from 'react';
import { LogEntry, LogLevel } from '../types';
import { 
  Terminal, 
  Search, 
  Pause, 
  Play, 
  Download, 
  Trash2, 
  Copy, 
  Check, 
  Filter, 
  ArrowDown
} from 'lucide-react';

interface LiveLogStreamProps {
  logs: LogEntry[];
  onClearLogs: () => void;
}

export const LiveLogStream: React.FC<LiveLogStreamProps> = ({
  logs,
  onClearLogs
}) => {
  const [logLevelFilter, setLogLevelFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter(log => {
    const matchesLevel = logLevelFilter === 'ALL' || log.level === logLevelFilter;
    const matchesSearch = searchQuery === '' || 
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.pod && log.pod.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesLevel && matchesSearch;
  });

  const getLevelBadgeClass = (level: LogLevel) => {
    switch (level) {
      case 'FATAL':
        return 'bg-purple-900/60 text-purple-300 font-bold border border-purple-500/50';
      case 'ERROR':
        return 'bg-red-900/60 text-red-300 font-bold border border-red-500/50';
      case 'WARN':
        return 'bg-amber-900/60 text-amber-300 font-bold border border-amber-500/50';
      case 'INFO':
        return 'bg-emerald-900/60 text-emerald-300 font-bold border border-emerald-500/50';
      case 'DEBUG':
        return 'bg-slate-800 text-slate-300 border border-slate-600';
    }
  };

  const handleCopyLogs = () => {
    const text = filteredLogs.map(l => `[${l.timestamp}] [${l.level}] [${l.service}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadLogs = () => {
    const text = filteredLogs.map(l => `[${l.timestamp}] [${l.level}] [${l.service}] ${l.message}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incident-brain-logs-${Date.now()}.log`;
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      {/* Log Header Controls */}
      <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 border border-[#2d3449]">
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <Terminal className="w-5 h-5 text-[#d0bcff]" />
          <div>
            <h3 className="text-sm font-bold font-sora text-white">Live Log Stream Tailing</h3>
            <p className="text-[11px] font-mono text-[#cbc3d7]">
              {filteredLogs.length} events logged • {isStreaming ? 'Streaming ACTIVE' : 'Streaming PAUSED'}
            </p>
          </div>
        </div>

        {/* Search & Level Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#cbc3d7]" />
            <input
              type="text"
              placeholder="Search regex, pod, service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0b1326] text-xs font-mono text-white pl-8 pr-3 py-1.5 rounded-lg border border-[#2d3449] focus:outline-none focus:border-[#d0bcff]"
            />
          </div>

          <div className="flex items-center space-x-1.5 text-xs font-mono">
            <span className="text-[#cbc3d7]">Level:</span>
            <select
              value={logLevelFilter}
              onChange={(e) => setLogLevelFilter(e.target.value)}
              className="bg-[#0b1326] text-xs font-mono text-white border border-[#2d3449] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#d0bcff]"
            >
              <option value="ALL">ALL LEVELS</option>
              <option value="FATAL">FATAL</option>
              <option value="ERROR">ERROR</option>
              <option value="WARN">WARN</option>
              <option value="INFO">INFO</option>
              <option value="DEBUG">DEBUG</option>
            </select>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setIsStreaming(!isStreaming)}
              className={`p-2 rounded-lg border transition ${
                isStreaming ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}
              title={isStreaming ? 'Pause log stream' : 'Resume log stream'}
            >
              {isStreaming ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`p-2 rounded-lg border transition ${
                autoScroll ? 'bg-[#a078ff]/20 text-[#d0bcff] border-[#a078ff]/40' : 'bg-[#131b2e] text-[#cbc3d7] border-[#2d3449]'
              }`}
              title="Toggle Auto-Scroll"
            >
              <ArrowDown className="w-4 h-4" />
            </button>

            <button
              onClick={handleCopyLogs}
              className="p-2 rounded-lg bg-[#131b2e] text-[#cbc3d7] hover:text-white border border-[#2d3449] transition"
              title="Copy visible logs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={handleDownloadLogs}
              className="p-2 rounded-lg bg-[#131b2e] text-[#cbc3d7] hover:text-white border border-[#2d3449] transition"
              title="Export log bundle file"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onClearLogs}
              className="p-2 rounded-lg bg-[#131b2e] text-red-400 hover:text-red-300 border border-[#2d3449] transition"
              title="Clear terminal logs"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div 
        ref={logContainerRef}
        className="bg-[#060e20] p-4 rounded-xl border border-[#2d3449] h-[580px] overflow-y-auto font-mono text-xs space-y-1.5 shadow-2xl selection:bg-[#a078ff]/40"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-center py-20 text-[#cbc3d7]/60">
            No log entries found matching current filter rules.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="hover:bg-[#131b2e]/60 py-1 px-2 rounded flex flex-col sm:flex-row items-start sm:items-center gap-2 border-b border-white/[0.02] transition">
              <span className="text-[#cbc3d7]/60 text-[11px] shrink-0 font-mono">
                {log.timestamp}
              </span>

              <span className={`px-1.5 py-0.2 text-[10px] rounded uppercase shrink-0 font-bold ${getLevelBadgeClass(log.level)}`}>
                {log.level}
              </span>

              <span className="text-[#d0bcff] font-semibold shrink-0">
                [{log.service}]
              </span>

              {log.pod && (
                <span className="text-[#cbc3d7]/60 text-[11px] shrink-0">
                  pod/{log.pod}
                </span>
              )}

              <span className="text-[#dae2fd] break-all leading-relaxed">
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
