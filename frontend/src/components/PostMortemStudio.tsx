import React, { useState } from 'react';
import { PostMortem, Incident } from '../types';
import { 
  FileText, 
  Sparkles, 
  Download, 
  Copy, 
  Check, 
  Calendar, 
  User, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  ListTodo
} from 'lucide-react';

interface PostMortemStudioProps {
  postMortem: PostMortem;
  incidents: Incident[];
  onGeneratePostMortemForIncident: (incident: Incident) => void;
  isGenerating: boolean;
}

export const PostMortemStudio: React.FC<PostMortemStudioProps> = ({
  postMortem,
  incidents,
  onGeneratePostMortemForIncident,
  isGenerating
}) => {
  const [selectedIncId, setSelectedIncId] = useState<string>(incidents[0]?.id || '');
  const [copied, setCopied] = useState<boolean>(false);
  const [actionItems, setActionItems] = useState(postMortem.actionItems);

  const toggleActionItem = (id: string) => {
    setActionItems(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: item.status === 'Completed' ? 'In Progress' : 'Completed'
        };
      }
      return item;
    }));
  };

  const handleCopyMarkdown = () => {
    const mdText = `# ${postMortem.title}
**Date:** ${postMortem.date} | **Author:** ${postMortem.author} | **Incident:** ${postMortem.incidentId}

## Executive Summary
${postMortem.executiveSummary}

## Root Cause Analysis
${postMortem.rootCause}

## Impact
- Users Affected: ${postMortem.impactMetrics.usersAffected}
- Failed Requests: ${postMortem.impactMetrics.failedRequests}
- P99 Peak Latency: ${postMortem.impactMetrics.p99PeakLatency}

## Action Items
${actionItems.map(a => `- [${a.status === 'Completed' ? 'x' : ' '}] (${a.priority}) ${a.task} (@${a.owner})`).join('\n')}`;

    navigator.clipboard.writeText(mdText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Generator Selector */}
      <div className="glass-panel p-5 rounded-xl border border-[#2d3449] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <FileText className="w-6 h-6 text-[#d0bcff]" />
          <div>
            <h3 className="text-base font-bold font-sora text-white">
              Blameless AI Post-Mortem Generator
            </h3>
            <p className="text-xs font-mono text-[#cbc3d7]">
              Generate executive post-incident reviews, timelines, and action items with Gemini AI.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={selectedIncId}
            onChange={(e) => setSelectedIncId(e.target.value)}
            className="bg-[#0b1326] text-xs font-mono text-white border border-[#2d3449] rounded-lg px-3 py-2 focus:outline-none focus:border-[#d0bcff]"
          >
            {incidents.map((inc) => (
              <option key={inc.id} value={inc.id}>
                {inc.id} - {inc.service} ({inc.status})
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              const targetInc = incidents.find(i => i.id === selectedIncId);
              if (targetInc) onGeneratePostMortemForIncident(targetInc);
            }}
            disabled={isGenerating}
            className="flex items-center space-x-2 bg-gradient-to-r from-[#a078ff] to-[#6d3bd7] hover:from-[#9062ff] hover:to-[#5e2cc4] text-white px-4 py-2 rounded-lg font-mono text-xs font-bold transition active:scale-95 disabled:opacity-50 whitespace-nowrap"
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Generating...' : 'Generate Report'}</span>
          </button>
        </div>
      </div>

      {/* Post Mortem Document View */}
      <div className="glass-panel p-8 rounded-xl border border-[#2d3449] space-y-6">
        {/* Document Header */}
        <div className="pb-6 border-b border-white/10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-3 text-xs font-mono text-[#cbc3d7]">
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-[#d0bcff]" /> {postMortem.date}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-[#d0bcff]" /> {postMortem.author}</span>
            </div>
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center space-x-1.5 bg-[#131b2e] hover:bg-[#222a3d] text-white border border-[#2d3449] px-3 py-1.5 rounded-lg text-xs font-mono transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Markdown!' : 'Copy Markdown Report'}</span>
            </button>
          </div>

          <h1 className="text-xl font-bold font-sora text-white">
            {postMortem.title}
          </h1>
        </div>

        {/* Executive Summary & Root Cause */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#0b1326] p-5 rounded-xl border border-[#2d3449] space-y-2 font-mono text-xs">
            <h4 className="font-sora font-bold text-[#d0bcff] uppercase tracking-wider text-xs">
              1. Executive Summary
            </h4>
            <p className="text-[#dae2fd] leading-relaxed">
              {postMortem.executiveSummary}
            </p>
          </div>

          <div className="bg-[#0b1326] p-5 rounded-xl border border-[#2d3449] space-y-2 font-mono text-xs">
            <h4 className="font-sora font-bold text-red-400 uppercase tracking-wider text-xs">
              2. Technical Root Cause
            </h4>
            <p className="text-[#dae2fd] leading-relaxed">
              {postMortem.rootCause}
            </p>
          </div>
        </div>

        {/* Impact Metrics Banner */}
        <div className="bg-[#131b2e] p-4 rounded-xl border border-[#2d3449] grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
          <div>
            <span className="text-[#cbc3d7] text-[11px]">Users Impacted:</span>
            <p className="font-bold text-white text-sm mt-0.5">{postMortem.impactMetrics.usersAffected}</p>
          </div>
          <div>
            <span className="text-[#cbc3d7] text-[11px]">Failed Requests:</span>
            <p className="font-bold text-red-400 text-sm mt-0.5">{postMortem.impactMetrics.failedRequests}</p>
          </div>
          <div>
            <span className="text-[#cbc3d7] text-[11px]">P99 Latency Peak:</span>
            <p className="font-bold text-amber-300 text-sm mt-0.5">{postMortem.impactMetrics.p99PeakLatency}</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-3 font-mono text-xs">
          <h4 className="font-sora font-bold text-[#d0bcff] uppercase tracking-wider text-xs">
            3. Detailed Timeline
          </h4>
          <div className="space-y-2 bg-[#0b1326] p-4 rounded-xl border border-[#2d3449]">
            {postMortem.timeline.map((item, idx) => (
              <div key={idx} className="flex items-start space-x-3">
                <span className="text-[#d0bcff] font-bold shrink-0">{item.time}</span>
                <span className="text-[#dae2fd]">{item.note}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Items */}
        <div className="space-y-3 font-mono text-xs">
          <h4 className="font-sora font-bold text-[#4edea3] uppercase tracking-wider text-xs flex items-center gap-2">
            <ListTodo className="w-4 h-4" />
            <span>4. Action Items & Remediation Tasks</span>
          </h4>

          <div className="space-y-2">
            {actionItems.map((action) => (
              <div 
                key={action.id}
                onClick={() => toggleActionItem(action.id)}
                className="cursor-pointer bg-[#0b1326] hover:bg-[#131b2e] p-3 rounded-lg border border-[#2d3449] flex items-center justify-between gap-4 transition"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-5 h-5 rounded flex items-center justify-center ${
                    action.status === 'Completed' ? 'bg-[#4edea3] text-[#003824]' : 'bg-[#222a3d] border border-[#2d3449]'
                  }`}>
                    {action.status === 'Completed' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span className={`text-xs ${action.status === 'Completed' ? 'line-through text-[#cbc3d7]/60' : 'text-white font-medium'}`}>
                    {action.task}
                  </span>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <span className="text-[11px] text-[#cbc3d7]">@{action.owner}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    action.priority === 'P0' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {action.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
