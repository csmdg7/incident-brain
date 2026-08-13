import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Flame, 
  Cpu, 
  Terminal, 
  FileText, 
  ShieldAlert, 
  Zap, 
  Globe, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cluster: string;
  setCluster: (cluster: string) => void;
  activeIncidentsCount: number;
  criticalIncidentsCount: number;
  onTriggerChaos: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  cluster,
  setCluster,
  activeIncidentsCount,
  criticalIncidentsCount,
  onTriggerChaos
}) => {
  const [timeUtc, setTimeUtc] = useState<string>('');
  const [timeLocal, setTimeLocal] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeUtc(now.toUTCString().split(' ')[4] + ' UTC');
      setTimeLocal(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { id: 'incidents', label: 'Incident Feed', icon: ShieldAlert, badge: activeIncidentsCount },
    { id: 'telemetry', label: 'Telemetry HUD', icon: Activity },
    { id: 'ai-assistant', label: 'AI Root Cause', icon: Zap },
    { id: 'logs', label: 'Live Log Tail', icon: Terminal },
    { id: 'postmortem', label: 'Post-Mortems', icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0b1326]/90 backdrop-blur-xl border-b border-[#2d3449]">
      {/* Top Utility Ribbon */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between text-xs font-mono border-b border-white/5">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${criticalIncidentsCount > 0 ? 'bg-red-400' : 'bg-emerald-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${criticalIncidentsCount > 0 ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
            </span>
            <span className="text-[#cbc3d7] uppercase tracking-wider font-bold">
              SYS STATUS: {criticalIncidentsCount > 0 ? (
                <span className="text-[#ff5451] font-bold">{criticalIncidentsCount} P0 ACTIVE CRITICAL</span>
              ) : activeIncidentsCount > 0 ? (
                <span className="text-amber-400 font-bold">{activeIncidentsCount} ACTIVE INCIDENTS</span>
              ) : (
                <span className="text-[#4edea3]">ALL CLUSTERS OPERATIONAL</span>
              )}
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-2 text-[#cbc3d7]">
            <Globe className="w-3.5 h-3.5 text-[#d0bcff]" />
            <span>Region:</span>
            <select 
              value={cluster} 
              onChange={(e) => setCluster(e.target.value)}
              className="bg-[#131b2e] text-[#dae2fd] border border-[#2d3449] rounded px-2 py-0.5 focus:outline-none focus:border-[#d0bcff] cursor-pointer"
            >
              <option value="us-east-prod-01">us-east-prod-01 (N. Virginia)</option>
              <option value="eu-west-k8s-02">eu-west-k8s-02 (Frankfurt)</option>
              <option value="ap-south-mesh">ap-south-mesh (Singapore)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-[#cbc3d7]">
            <Clock className="w-3.5 h-3.5 text-[#d0bcff]" />
            <span className="text-[#dae2fd] font-semibold">{timeLocal}</span>
            <span className="text-[#cbc3d7]/60">({timeUtc})</span>
          </div>

          <button
            onClick={onTriggerChaos}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-red-600/30 to-amber-600/30 hover:from-red-600/50 hover:to-amber-600/50 border border-red-500/50 text-red-200 px-2.5 py-1 rounded text-xs font-semibold tracking-wider transition duration-150 group shadow-lg shadow-red-950/20 active:scale-95"
            title="Simulate active production incident / chaos monkey failure"
          >
            <Flame className="w-3.5 h-3.5 text-red-400 group-hover:animate-bounce" />
            <span>TRIGGER CHAOS</span>
          </button>
        </div>
      </div>

      {/* Main Header Brand & Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Logo Branding */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#a078ff] to-[#6d3bd7] p-0.5 shadow-lg shadow-[#a078ff]/20">
            <div className="w-full h-full bg-[#0b1326] rounded-[7px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#d0bcff] fill-[#d0bcff]/20" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold font-sora tracking-tight text-white">
                INCIDENT<span className="text-[#d0bcff]">.BRAIN</span>
              </h1>
              <span className="bg-[#a078ff]/20 text-[#d0bcff] text-[10px] font-mono px-1.5 py-0.5 rounded border border-[#a078ff]/30 uppercase tracking-widest font-bold">
                SRE v2.4
              </span>
            </div>
            <p className="text-xs text-[#cbc3d7] font-mono">Autonomous AI Operations & Cluster Diagnostics</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 bg-[#131b2e] p-1 rounded-lg border border-[#2d3449] overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium font-mono transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#222a3d] text-white border border-[#a078ff]/40 shadow-sm shadow-[#a078ff]/10'
                    : 'text-[#cbc3d7] hover:text-white hover:bg-[#171f33]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#d0bcff]' : 'text-[#cbc3d7]'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    criticalIncidentsCount > 0 ? 'bg-red-500 text-white' : 'bg-[#a078ff] text-white'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
