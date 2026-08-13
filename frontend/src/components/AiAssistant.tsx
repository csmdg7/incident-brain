import React, { useState } from 'react';
import { Incident } from '../types';
import { 
  Sparkles, 
  Send, 
  Terminal, 
  Bot, 
  User, 
  Copy, 
  Check, 
  AlertOctagon, 
  Play, 
  CornerDownLeft,
  Flame,
  Code
} from 'lucide-react';

interface AiAssistantProps {
  activeIncident: Incident | null;
  onExecuteCommand: (command: string) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({
  activeIncident,
  onExecuteCommand
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: activeIncident 
        ? `[Incident Brain AI Diagnostic Engine Online]\nCurrently analyzing active incident **${activeIncident.id}**: *${activeIncident.title}* on service \`${activeIncident.service}\`.\n\nAsk me any diagnostic question, or select a suggested command below.`
        : `[Incident Brain AI Diagnostic Engine Online]\nReady to analyze infrastructure incidents, generate kubectl commands, and assist with root cause analysis.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const samplePrompts = [
    `Diagnose connection pool exhaustion on ${activeIncident?.service || 'payment-gateway-v2'}`,
    `Generate kubectl command to inspect logs for failing pods`,
    `Explain Redis LFU eviction policy locks during traffic spikes`,
    `Write a bash command to scale deployment and restart pods`
  ];

  const handleSendMessage = async (queryText?: string) => {
    const promptToUse = queryText || inputQuery;
    if (!promptToUse.trim()) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: promptToUse,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInputQuery('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptToUse,
          activeIncident,
          systemContext: {
            environment: 'Production Cloud Run Container / Kubernetes',
            currentCluster: 'us-east-prod-01'
          }
        })
      });

      const data = await res.json();
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.reply || 'No output generated from AI engine.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('AI Assistant Error:', err);
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: `[Error] Failed to communicate with Incident Brain AI engine. Verify GEMINI_API_KEY settings or try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="glass-panel p-6 rounded-xl border border-[#2d3449] space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#a078ff] to-[#6d3bd7] flex items-center justify-center p-0.5">
              <div className="w-full h-full bg-[#0b1326] rounded-[7px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#d0bcff]" />
              </div>
            </div>
            <div>
              <h2 className="text-base font-bold font-sora text-white">
                Incident Brain SRE Terminal AI
              </h2>
              <p className="text-xs font-mono text-[#cbc3d7]">
                Powered by Gemini AI • Real-time Root Cause & Diagnostic Assistant
              </p>
            </div>
          </div>

          {activeIncident && (
            <div className="hidden sm:flex items-center space-x-2 bg-[#131b2e] px-3 py-1.5 rounded-lg border border-[#2d3449] text-xs font-mono">
              <span className="text-[#cbc3d7]">Context:</span>
              <span className="text-[#d0bcff] font-bold">{activeIncident.id}</span>
              <span className="text-red-400">({activeIncident.severity})</span>
            </div>
          )}
        </div>

        {/* Chat History Container */}
        <div className="bg-[#060e20] p-4 rounded-xl border border-[#2d3449] h-[480px] overflow-y-auto space-y-4 font-mono text-xs">
          {messages.map((msg) => {
            const isAi = msg.sender === 'ai';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isAi ? 'items-start' : 'items-start flex-row-reverse'}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isAi ? 'bg-[#a078ff]/20 text-[#d0bcff] border border-[#a078ff]/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div className={`max-w-[85%] rounded-xl p-4 space-y-2 leading-relaxed ${
                  isAi 
                    ? 'bg-[#131b2e] text-[#dae2fd] border border-[#2d3449]' 
                    : 'bg-[#a078ff]/20 text-white border border-[#a078ff]/40'
                }`}>
                  <div className="flex items-center justify-between text-[10px] text-[#cbc3d7]/60 pb-1 border-b border-white/5">
                    <span className="font-bold">{isAi ? 'INCIDENT BRAIN AI' : 'SRE OPERATOR'}</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div className="whitespace-pre-wrap break-words">
                    {msg.text}
                  </div>

                  {/* If message contains shell code blocks, show quick execute button */}
                  {isAi && msg.text.includes('kubectl') && (
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          const cmdMatch = msg.text.match(/kubectl[^\n`]+/);
                          if (cmdMatch) onExecuteCommand(cmdMatch[0]);
                        }}
                        className="flex items-center space-x-1.5 bg-[#4edea3]/20 text-[#4edea3] hover:bg-[#4edea3]/30 border border-[#4edea3]/40 px-3 py-1.5 rounded text-xs font-bold transition active:scale-95"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Run Command in Sandbox Terminal</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center space-x-2 text-xs font-mono text-[#d0bcff] p-2 bg-[#131b2e] rounded-lg border border-[#2d3449] w-max">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Analyzing infrastructure telemetry with Gemini AI...</span>
            </div>
          )}
        </div>

        {/* Sample Prompt Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-mono text-[#cbc3d7]">Suggested Diagnostics:</span>
          {samplePrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt)}
              className="text-[11px] font-mono bg-[#131b2e] hover:bg-[#222a3d] text-[#dae2fd] border border-[#2d3449] px-2.5 py-1 rounded-md transition truncate max-w-xs"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="flex items-center space-x-2 pt-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Ask Incident Brain AI diagnostic questions or request kubectl commands..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="w-full bg-[#060e20] text-xs font-mono text-white placeholder-[#cbc3d7]/50 px-4 py-3 rounded-xl border border-[#2d3449] focus:outline-none focus:border-[#d0bcff] pr-10"
            />
            <CornerDownLeft className="w-4 h-4 text-[#cbc3d7]/40 absolute right-3 top-3.5" />
          </div>

          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputQuery.trim()}
            className="flex items-center space-x-2 bg-gradient-to-r from-[#a078ff] to-[#6d3bd7] hover:from-[#9062ff] hover:to-[#5e2cc4] text-white px-5 py-3 rounded-xl font-mono text-xs font-bold shadow-lg shadow-[#a078ff]/20 transition active:scale-95 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </div>
      </div>
    </div>
  );
};
