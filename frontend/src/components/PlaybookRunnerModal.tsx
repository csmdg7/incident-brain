import React, { useState, useEffect } from 'react';
import { Playbook, Incident } from '../types';
import { 
  Terminal, 
  CheckCircle2, 
  X, 
  Loader2, 
  AlertTriangle, 
  ShieldCheck, 
  Check
} from 'lucide-react';

interface PlaybookRunnerModalProps {
  playbook: Playbook;
  incident: Incident;
  onClose: () => void;
  onComplete: () => void;
}

export const PlaybookRunnerModal: React.FC<PlaybookRunnerModalProps> = ({
  playbook,
  incident,
  onClose,
  onComplete
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [executedLogs, setExecutedLogs] = useState<string[]>([]);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  useEffect(() => {
    if (currentStepIndex < playbook.commands.length) {
      const command = playbook.commands[currentStepIndex];
      const timer = setTimeout(() => {
        setExecutedLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] EXEC: ${command}`,
          `[${new Date().toLocaleTimeString()}] SUCCESS: Exit code 0 (Duration: ${Math.floor(Math.random() * 400 + 100)}ms)`
        ]);
        setCurrentStepIndex(prev => prev + 1);
      }, 1200);

      return () => clearTimeout(timer);
    } else {
      setIsFinished(true);
    }
  }, [currentStepIndex, playbook.commands]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-panel max-w-2xl w-full rounded-2xl border border-[#2d3449] space-y-5 p-6 shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#00a572]/20 border border-[#4edea3]/40 flex items-center justify-center text-[#4edea3]">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold font-sora text-white">
                Executing Runbook: {playbook.id}
              </h3>
              <p className="text-xs font-mono text-[#cbc3d7]">
                Target: <strong className="text-white">{incident.service}</strong> on <strong className="text-white">{incident.cluster}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#cbc3d7] hover:text-white hover:bg-[#131b2e] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Command Progress Stepper */}
        <div className="space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between text-[#cbc3d7]">
            <span>Command Progress</span>
            <span className="font-bold text-[#4edea3]">
              Step {Math.min(currentStepIndex + 1, playbook.commands.length)} of {playbook.commands.length}
            </span>
          </div>

          <div className="w-full bg-[#0b1326] h-2 rounded-full overflow-hidden border border-[#2d3449]">
            <div 
              className="bg-gradient-to-r from-[#00a572] to-[#4edea3] h-full rounded-full transition-all duration-300"
              style={{ width: `${(currentStepIndex / playbook.commands.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Live Terminal Output */}
        <div className="bg-[#060e20] p-4 rounded-xl border border-[#2d3449] font-mono text-xs space-y-2 h-64 overflow-y-auto">
          {executedLogs.map((log, i) => (
            <div 
              key={i} 
              className={`leading-relaxed ${
                log.includes('SUCCESS') ? 'text-[#4edea3]' : log.includes('EXEC') ? 'text-amber-300 font-bold' : 'text-[#dae2fd]'
              }`}
            >
              {log}
            </div>
          ))}

          {!isFinished && (
            <div className="flex items-center space-x-2 text-[#d0bcff] animate-pulse pt-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Executing current command batch...</span>
            </div>
          )}

          {isFinished && (
            <div className="bg-[#00a572]/20 border border-[#4edea3]/40 p-3 rounded-lg text-[#4edea3] space-y-1 mt-4">
              <div className="flex items-center space-x-2 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Runbook Execution Completed Successfully!</span>
              </div>
              <p className="text-[11px] text-[#cbc3d7]">
                Automated Verification: {playbook.automatedVerification || 'HTTP 503 error rates verified < 0.1% for 3 consecutive windows.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs font-mono text-[#cbc3d7]">
            {isFinished ? 'Incident status auto-updated to MITIGATED' : 'SRE Command Execution Sandbox'}
          </span>

          {isFinished ? (
            <button
              onClick={() => {
                onComplete();
                onClose();
              }}
              className="flex items-center space-x-2 bg-gradient-to-r from-[#00a572] to-[#4edea3] text-[#003824] px-5 py-2 rounded-lg font-mono text-xs font-bold shadow-lg shadow-[#4edea3]/20 transition active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Confirm & Close</span>
            </button>
          ) : (
            <button
              disabled
              className="bg-[#222a3d] text-[#cbc3d7] px-4 py-2 rounded-lg font-mono text-xs cursor-not-allowed opacity-50"
            >
              Running...
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
