import React, { useState } from 'react';
import { Incident, Playbook, SeverityLevel, IncidentStatus } from '../types';
import { 
  AlertOctagon, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Cpu, 
  Sparkles, 
  Play, 
  ArrowRight, 
  Terminal, 
  TrendingUp, 
  Search, 
  Filter,
  Check,
  FileCheck,
  RefreshCw,
  Copy
} from 'lucide-react';

interface IncidentFeedProps {
  incidents: Incident[];
  selectedIncident: Incident | null;
  onSelectIncident: (incident: Incident) => void;
  playbooks: Playbook[];
  onExecutePlaybook: (playbook: Playbook, incident: Incident) => void;
  onDiagnoseWithAi: (incident: Incident) => void;
  onAnalyzeIncident: (incident: Incident) => Promise<void> | void;
  onApproveExecute: (incident: Incident) => Promise<any> | any;
  onReportFailure: (incident: Incident) => Promise<any> | any;
  onResolveIncident: (incidentId: string) => void;
  onGeneratePostMortem: (incident: Incident) => void;
  isAiLoading: boolean;
  isAgentLoading: boolean;
}

export const IncidentFeed: React.FC<IncidentFeedProps> = ({
  incidents,
  selectedIncident,
  onSelectIncident,
  playbooks,
  onExecutePlaybook,
  onDiagnoseWithAi,
  onAnalyzeIncident,
  onApproveExecute,
  onReportFailure,
  onResolveIncident,
  onGeneratePostMortem,
  isAiLoading,
  isAgentLoading
}) => {
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedLog, setCopiedLog] = useState<boolean>(false);

  const filteredIncidents = incidents.filter(inc => {
    const matchesSeverity = severityFilter === 'ALL' || inc.severity === severityFilter;
    const matchesStatus = statusFilter === 'ALL' || inc.status === statusFilter;
    const matchesSearch = searchQuery === '' || 
      inc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesStatus && matchesSearch;
  });

  const getSeverityBadgeClass = (severity: SeverityLevel) => {
    switch (severity) {
      case 'P0-CRITICAL':
        return 'bg-red-500/10 text-[#ff5451] border-l-4 border-l-[#ff5451] border-r border-t border-b border-[#ff5451]/30';
      case 'P1-HIGH':
        return 'bg-amber-500/10 text-amber-400 border-l-4 border-l-amber-400 border-r border-t border-b border-amber-400/30';
      case 'P2-MEDIUM':
        return 'bg-yellow-500/10 text-yellow-300 border-l-4 border-l-yellow-300 border-r border-t border-b border-yellow-300/30';
      case 'P3-LOW':
        return 'bg-emerald-500/10 text-[#4edea3] border-l-4 border-l-[#4edea3] border-r border-t border-b border-[#4edea3]/30';
      default:
        return 'bg-slate-800 text-slate-300 border-l-4 border-l-slate-400';
    }
  };

  const getStatusBadge = (status: IncidentStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40">ACTIVE OUTAGE</span>;
      case 'INVESTIGATING':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">INVESTIGATING</span>;
      case 'MITIGATED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">MITIGATED</span>;
      case 'RESOLVED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">RESOLVED</span>;
    }
  };

  const activePlaybook = selectedIncident?.recommendedPlaybookId 
    ? playbooks.find(p => p.id === selectedIncident.recommendedPlaybookId) 
    : playbooks[0];

  const handleCopyLogs = (logs: string[]) => {
    navigator.clipboard.writeText(logs.join('\n'));
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Search & Filter Header */}
      <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 border border-[#2d3449]">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#cbc3d7]" />
          <input
            type="text"
            placeholder="Search incident ID, service, error..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0b1326] text-xs font-mono text-[#dae2fd] pl-9 pr-3 py-2 rounded-lg border border-[#2d3449] focus:outline-none focus:border-[#d0bcff]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Severity Filter */}
          <div className="flex items-center space-x-1.5 text-xs font-mono">
            <span className="text-[#cbc3d7]">Severity:</span>
            <div className="flex bg-[#0b1326] p-1 rounded-lg border border-[#2d3449]">
              {['ALL', 'P0-CRITICAL', 'P1-HIGH', 'P2-MEDIUM', 'P3-LOW'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2 py-1 rounded text-[11px] font-bold transition ${
                    severityFilter === sev 
                      ? 'bg-[#a078ff] text-white' 
                      : 'text-[#cbc3d7] hover:text-white'
                  }`}
                >
                  {sev === 'ALL' ? 'ALL' : sev.split('-')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1.5 text-xs font-mono">
            <span className="text-[#cbc3d7]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0b1326] text-xs font-mono text-[#dae2fd] border border-[#2d3449] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#d0bcff]"
            >
              <option value="ALL">ALL STATUSES</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INVESTIGATING">INVESTIGATING</option>
              <option value="MITIGATED">MITIGATED</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Incident Feed List, Right = Selected Incident Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Incident List Column */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-[#cbc3d7] px-1">
            <span className="font-bold uppercase tracking-wider text-[#d0bcff]">
              Active Incidents ({filteredIncidents.length})
            </span>
            <span>Real-time Telemetry Stream</span>
          </div>

          <div className="space-y-3 max-h-[720px] overflow-y-auto pr-1">
            {filteredIncidents.length === 0 ? (
              <div className="glass-panel p-8 text-center rounded-xl space-y-2 border border-[#2d3449]">
                <CheckCircle className="w-8 h-8 text-[#4edea3] mx-auto" />
                <p className="text-sm font-sora font-semibold text-white">No Incidents Found</p>
                <p className="text-xs text-[#cbc3d7]">All systems matching filter criteria are operating within normal parameters.</p>
              </div>
            ) : (
              filteredIncidents.map((incident) => {
                const isSelected = selectedIncident?.id === incident.id;
                const isP0 = incident.severity === 'P0-CRITICAL';

                return (
                  <div
                    key={incident.id}
                    onClick={() => onSelectIncident(incident)}
                    className={`cursor-pointer rounded-xl p-4 transition duration-150 relative overflow-hidden ${
                      isP0 ? 'animate-scan-critical glass-card-critical' : 'glass-panel-interactive'
                    } ${
                      isSelected 
                        ? 'ring-2 ring-[#a078ff] bg-[#171f33]' 
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getSeverityBadgeClass(incident.severity)}`}>
                          {incident.severity}
                        </span>
                        <span className="text-xs font-mono font-semibold text-[#d0bcff]">
                          {incident.id}
                        </span>
                      </div>
                      <div>{getStatusBadge(incident.status)}</div>
                    </div>

                    <h3 className="mt-2 text-sm font-semibold font-sora text-white line-clamp-2">
                      {incident.title}
                    </h3>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#cbc3d7] pt-2 border-t border-white/5">
                      <div className="flex items-center space-x-1.5">
                        <Cpu className="w-3.5 h-3.5 text-[#d0bcff]" />
                        <span className="text-white font-semibold">{incident.service}</span>
                      </div>
                      <div className="flex items-center space-x-3 text-[11px]">
                        <span className="text-red-400 font-bold">Err: {incident.errorRate}</span>
                        <span className="text-amber-300 font-bold">P99: {incident.p99Latency}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Incident Inspector Panel */}
        <div className="lg:col-span-7">
          {selectedIncident ? (
            <div className="glass-panel rounded-xl p-6 space-y-6 border border-[#2d3449] sticky top-24">
              {/* Header Details */}
              <div className="space-y-3 pb-4 border-b border-white/10">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase ${getSeverityBadgeClass(selectedIncident.severity)}`}>
                      {selectedIncident.severity}
                    </span>
                    <span className="text-sm font-mono text-[#d0bcff] font-bold">
                      {selectedIncident.id}
                    </span>
                    <span className="text-xs text-[#cbc3d7] font-mono">
                      • {selectedIncident.cluster}
                    </span>
                  </div>
                  <div>{getStatusBadge(selectedIncident.status)}</div>
                </div>

                <h2 className="text-lg font-bold font-sora text-white">
                  {selectedIncident.title}
                </h2>

                <p className="text-xs text-[#cbc3d7] font-mono leading-relaxed bg-[#0b1326]/60 p-3 rounded-lg border border-[#2d3449]">
                  <strong className="text-white">Impact Assessment:</strong> {selectedIncident.impact}
                </p>
              </div>

              {/* AI Diagnostic Box */}
              <div className="bg-gradient-to-r from-[#3c0091]/30 via-[#1d1b32]/80 to-[#131b2e] p-4 rounded-xl border border-[#a078ff]/30 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-[#d0bcff] animate-pulse" />
                    <span className="text-xs font-bold font-sora tracking-wider text-[#d0bcff] uppercase">
                      Incident Brain AI Root Cause Engine
                    </span>
                  </div>
                  <button
                    onClick={() => onDiagnoseWithAi(selectedIncident)}
                    disabled={isAiLoading}
                    className="flex items-center space-x-1 bg-[#a078ff]/20 hover:bg-[#a078ff]/30 text-[#d0bcff] border border-[#a078ff]/40 px-2.5 py-1 rounded text-xs font-mono font-semibold transition active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isAiLoading ? 'animate-spin' : ''}`} />
                    <span>{isAiLoading ? 'Analyzing...' : 'Re-Diagnose'}</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => onAnalyzeIncident(selectedIncident)}
                    disabled={isAgentLoading}
                    className="flex items-center space-x-1 bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] hover:from-[#7c3aed] hover:to-[#5b21b6] text-white border border-[#a078ff]/40 px-3 py-2 rounded-lg text-xs font-mono font-bold transition active:scale-95 disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isAgentLoading ? 'animate-spin' : ''}`} />
                    <span>{isAgentLoading ? 'Analyzing...' : 'Analyze & Resolve'}</span>
                  </button>

                  {selectedIncident.agentDecision?.selected_tool && (
                    <>
                      <button
                        onClick={() => onApproveExecute(selectedIncident)}
                        className="flex items-center space-x-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-3 py-2 rounded-lg text-xs font-mono font-bold transition active:scale-95"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Approve & Execute</span>
                      </button>

                      <button
                        onClick={() => onReportFailure(selectedIncident)}
                        className="flex items-center space-x-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 px-3 py-2 rounded-lg text-xs font-mono font-bold transition active:scale-95"
                      >
                        <AlertOctagon className="w-3.5 h-3.5" />
                        <span>Report Failure</span>
                      </button>
                    </>
                  )}
                </div>

                {selectedIncident.aiDiagnosis ? (
                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between bg-[#0b1326]/80 p-2.5 rounded-lg border border-white/5">
                      <span className="text-[#cbc3d7]">Confidence Level:</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-[#222a3d] h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-[#4edea3] h-full rounded-full transition-all duration-500" 
                            style={{ width: `${selectedIncident.aiDiagnosis.confidence}%` }}
                          />
                        </div>
                        <span className="font-bold text-[#4edea3]">
                          {selectedIncident.aiDiagnosis.confidence}%
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[#cbc3d7] font-bold block mb-1">Root Cause Hypothesis:</span>
                      <p className="text-white bg-[#0b1326]/60 p-2.5 rounded border border-[#2d3449] leading-relaxed">
                        {selectedIncident.aiDiagnosis.rootCause}
                      </p>
                    </div>

                    <div>
                      <span className="text-[#cbc3d7] font-bold block mb-1">Recommended Immediate Mitigation:</span>
                      <ul className="space-y-1 list-disc list-inside text-emerald-300">
                        {selectedIncident.aiDiagnosis.immediateSteps.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 space-y-2">
                    <p className="text-xs text-[#cbc3d7]">Click Re-Diagnose to analyze current telemetry and log stack trace with Gemini AI.</p>
                  </div>
                )}
              </div>

              {/* Recommended Playbook Launcher */}
              {activePlaybook && (
                <div className="glass-panel p-4 rounded-xl border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Terminal className="w-4 h-4 text-[#4edea3]" />
                      <span className="text-xs font-bold font-mono text-[#4edea3] uppercase">
                        Recommended Automation Playbook ({activePlaybook.id})
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      RISK: {activePlaybook.riskLevel}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold font-sora text-white">
                    {activePlaybook.title}
                  </h4>
                  <p className="text-xs text-[#cbc3d7] font-mono">
                    {activePlaybook.description}
                  </p>

                  <div className="bg-[#0b1326] p-2.5 rounded font-mono text-[11px] text-emerald-400 space-y-1 border border-[#2d3449]">
                    {activePlaybook.commands.map((cmd, i) => (
                      <div key={i} className="truncate">$ {cmd}</div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-[#cbc3d7] font-mono">
                      Est. Recovery: &lt; 90s
                    </span>
                    <button
                      onClick={() => onExecutePlaybook(activePlaybook, selectedIncident)}
                      disabled={selectedIncident.status === 'RESOLVED'}
                      className="flex items-center space-x-1.5 bg-gradient-to-r from-[#00a572] to-[#4edea3] hover:from-[#008f62] hover:to-[#3cb886] text-[#003824] px-4 py-2 rounded-lg font-mono font-bold text-xs shadow-lg shadow-[#4edea3]/20 active:scale-95 transition disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Execute Playbook</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Timeline & Logs */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <h4 className="text-xs font-bold font-sora uppercase text-[#d0bcff]">
                    Incident Event Timeline
                  </h4>
                  <span className="text-[11px] font-mono text-[#cbc3d7]">
                    {selectedIncident.timeline.length} updates recorded
                  </span>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {selectedIncident.timeline.map((item) => (
                    <div key={item.id} className="flex items-start space-x-3 text-xs font-mono">
                      <span className="text-[#cbc3d7]/60 whitespace-nowrap pt-0.5">{item.time}</span>
                      <div className="w-2 h-2 rounded-full bg-[#d0bcff] mt-1.5 shrink-0" />
                      <p className="text-[#dae2fd] leading-relaxed">{item.event}</p>
                    </div>
                  ))}
                </div>

                {/* Log Stack Trace Sample */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold font-sora uppercase text-[#d0bcff]">
                      Recent Pod Stack Trace
                    </h4>
                    <button
                      onClick={() => handleCopyLogs(selectedIncident.logsSample)}
                      className="flex items-center space-x-1 text-[11px] font-mono text-[#cbc3d7] hover:text-white"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedLog ? 'Copied!' : 'Copy Stack Trace'}</span>
                    </button>
                  </div>

                  <div className="bg-[#060e20] p-3 rounded-lg font-mono text-[11px] text-red-300 space-y-1.5 border border-[#2d3449] max-h-36 overflow-y-auto">
                    {selectedIncident.logsSample.map((line, idx) => (
                      <div key={idx} className="leading-relaxed font-mono whitespace-pre-wrap break-all">
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => onGeneratePostMortem(selectedIncident)}
                  className="flex items-center space-x-2 bg-[#222a3d] hover:bg-[#2d3449] text-white px-3.5 py-2 rounded-lg font-mono text-xs font-semibold border border-white/10 transition active:scale-95"
                >
                  <FileCheck className="w-4 h-4 text-[#d0bcff]" />
                  <span>Generate Post-Mortem</span>
                </button>

                {selectedIncident.status !== 'RESOLVED' && (
                  <button
                    onClick={() => onResolveIncident(selectedIncident.id)}
                    className="flex items-center space-x-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-4 py-2 rounded-lg font-mono text-xs font-bold transition active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>Mark as Resolved</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-panel p-12 text-center rounded-xl border border-[#2d3449]">
              <AlertTriangle className="w-10 h-10 text-[#d0bcff] mx-auto mb-3" />
              <p className="text-base font-sora font-semibold text-white">Select an Incident to Inspect</p>
              <p className="text-xs text-[#cbc3d7] max-w-sm mx-auto mt-1">
                Choose an incident from the feed to view real-time diagnostics, Gemini AI root cause analysis, stack traces, and run remediation playbooks.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
