import React, { useState } from 'react';
import { ServiceHealth, ClusterNode } from '../types';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Server, 
  Network, 
  ArrowUpRight, 
  AlertCircle, 
  CheckCircle2, 
  Zap, 
  Sliders, 
  RefreshCw,
  Gauge
} from 'lucide-react';

interface TelemetryHudProps {
  services: ServiceHealth[];
  nodes: ClusterNode[];
  onSimulateSpike: (serviceName: string) => void;
  onResetServices: () => void;
}

export const TelemetryHud: React.FC<TelemetryHudProps> = ({
  services,
  nodes,
  onSimulateSpike,
  onResetServices
}) => {
  const [selectedService, setSelectedService] = useState<ServiceHealth | null>(services[0] || null);

  const healthyCount = services.filter(s => s.status === 'healthy').length;
  const degradedCount = services.filter(s => s.status === 'degraded').length;
  const criticalCount = services.filter(s => s.status === 'critical').length;

  const totalRps = services.reduce((acc, s) => acc + (s.status === 'critical' ? 2450 : 8200), 0);
  const avgLatency = Math.round(services.reduce((acc, s) => acc + s.latency, 0) / services.length);
  const avgErrorRate = (services.reduce((acc, s) => acc + s.errorRate, 0) / services.length).toFixed(2);

  const getStatusColor = (status: 'healthy' | 'degraded' | 'critical') => {
    switch (status) {
      case 'healthy':
        return 'text-[#4edea3] bg-[#4edea3]/10 border-[#4edea3]/30';
      case 'degraded':
        return 'text-amber-300 bg-amber-500/10 border-amber-500/30';
      case 'critical':
        return 'text-[#ff5451] bg-[#ff5451]/10 border-[#ff5451]/30';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* HUD Top Stats Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl space-y-1 border border-[#2d3449]">
          <div className="flex items-center justify-between text-xs font-mono text-[#cbc3d7]">
            <span>TOTAL THROUGHPUT</span>
            <Activity className="w-4 h-4 text-[#d0bcff]" />
          </div>
          <p className="text-2xl font-bold font-sora text-white">{totalRps.toLocaleString()} <span className="text-xs font-mono font-normal text-[#cbc3d7]">RPS</span></p>
          <p className="text-[11px] font-mono text-[#4edea3] flex items-center">
            <ArrowUpRight className="w-3 h-3 mr-0.5" /> +4.2% vs last hour
          </p>
        </div>

        <div className="glass-panel p-4 rounded-xl space-y-1 border border-[#2d3449]">
          <div className="flex items-center justify-between text-xs font-mono text-[#cbc3d7]">
            <span>GLOBAL P99 LATENCY</span>
            <Gauge className="w-4 h-4 text-amber-400" />
          </div>
          <p className={`text-2xl font-bold font-sora ${avgLatency > 500 ? 'text-[#ff5451]' : 'text-amber-300'}`}>
            {avgLatency} <span className="text-xs font-mono font-normal text-[#cbc3d7]">ms</span>
          </p>
          <p className="text-[11px] font-mono text-[#cbc3d7]">Target SLA: &lt; 200ms</p>
        </div>

        <div className="glass-panel p-4 rounded-xl space-y-1 border border-[#2d3449]">
          <div className="flex items-center justify-between text-xs font-mono text-[#cbc3d7]">
            <span>GLOBAL ERROR RATE</span>
            <AlertCircle className="w-4 h-4 text-[#ff5451]" />
          </div>
          <p className={`text-2xl font-bold font-sora ${Number(avgErrorRate) > 1 ? 'text-[#ff5451]' : 'text-[#4edea3]'}`}>
            {avgErrorRate}%
          </p>
          <p className="text-[11px] font-mono text-[#cbc3d7]">HTTP 5xx & 499 errors</p>
        </div>

        <div className="glass-panel p-4 rounded-xl space-y-1 border border-[#2d3449]">
          <div className="flex items-center justify-between text-xs font-mono text-[#cbc3d7]">
            <span>CLUSTER HEALTH</span>
            <Server className="w-4 h-4 text-[#4edea3]" />
          </div>
          <p className="text-2xl font-bold font-sora text-white">
            {healthyCount}/{services.length} <span className="text-xs font-mono font-normal text-[#cbc3d7]">SERVICES</span>
          </p>
          <p className="text-[11px] font-mono text-red-400">
            {criticalCount} Critical • {degradedCount} Degraded
          </p>
        </div>
      </div>

      {/* Main Microservices Mesh & Dependencies */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Service Grid */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-sora text-white uppercase tracking-wider flex items-center gap-2">
              <Network className="w-4 h-4 text-[#d0bcff]" />
              <span>Microservice Topology Mesh</span>
            </h3>
            <button
              onClick={onResetServices}
              className="text-xs font-mono text-[#cbc3d7] hover:text-white flex items-center gap-1 bg-[#131b2e] px-2.5 py-1 rounded border border-[#2d3449]"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Telemetry Baseline</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {services.map((service) => {
              const isSelected = selectedService?.name === service.name;

              return (
                <div
                  key={service.name}
                  onClick={() => setSelectedService(service)}
                  className={`glass-panel-interactive p-4 rounded-xl cursor-pointer space-y-3 relative overflow-hidden ${
                    isSelected ? 'ring-2 ring-[#a078ff] bg-[#171f33]' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold font-sora text-white">
                        {service.name}
                      </h4>
                      <p className="text-[11px] font-mono text-[#cbc3d7]">
                        {service.instances} active pods running
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(service.status)}`}>
                      {service.status}
                    </span>
                  </div>

                  {/* Telemetry Gauges */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-white/5">
                    <div>
                      <span className="text-[#cbc3d7] text-[10px]">Latency:</span>
                      <p className={`font-bold ${service.latency > 500 ? 'text-[#ff5451]' : 'text-white'}`}>
                        {service.latency} ms
                      </p>
                    </div>
                    <div>
                      <span className="text-[#cbc3d7] text-[10px]">Error Rate:</span>
                      <p className={`font-bold ${service.errorRate > 1 ? 'text-[#ff5451]' : 'text-[#4edea3]'}`}>
                        {service.errorRate}%
                      </p>
                    </div>
                  </div>

                  {/* CPU / Memory Progress bars */}
                  <div className="space-y-1.5 text-[10px] font-mono pt-1">
                    <div className="flex justify-between text-[#cbc3d7]">
                      <span>CPU Utilization</span>
                      <span className={service.cpu > 85 ? 'text-[#ff5451] font-bold' : ''}>{service.cpu}%</span>
                    </div>
                    <div className="w-full bg-[#0b1326] h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${service.cpu > 85 ? 'bg-[#ff5451]' : service.cpu > 70 ? 'bg-amber-400' : 'bg-[#4edea3]'}`}
                        style={{ width: `${service.cpu}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[#cbc3d7]">
                      <span>RAM Utilization</span>
                      <span className={service.memory > 85 ? 'text-[#ff5451] font-bold' : ''}>{service.memory}%</span>
                    </div>
                    <div className="w-full bg-[#0b1326] h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${service.memory > 85 ? 'bg-[#ff5451]' : service.memory > 70 ? 'bg-amber-400' : 'bg-[#4edea3]'}`}
                        style={{ width: `${service.memory}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Service Details & Chaos Injection */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-sm font-bold font-sora text-white uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#d0bcff]" />
            <span>Service Inspection & Chaos</span>
          </h3>

          {selectedService ? (
            <div className="glass-panel p-5 rounded-xl space-y-5 border border-[#2d3449]">
              <div className="pb-3 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#d0bcff] font-bold">INSPECTING</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusColor(selectedService.status)}`}>
                    {selectedService.status}
                  </span>
                </div>
                <h3 className="text-base font-bold font-sora text-white mt-1">
                  {selectedService.name}
                </h3>
              </div>

              {/* Dependencies List */}
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-[#cbc3d7] block">Downstream Dependencies:</span>
                {selectedService.dependencies.length > 0 ? (
                  <div className="space-y-1">
                    {selectedService.dependencies.map(dep => (
                      <div key={dep} className="flex items-center space-x-2 text-xs font-mono bg-[#0b1326] p-2 rounded border border-[#2d3449]">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#d0bcff]" />
                        <span className="text-white">{dep}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-mono text-[#cbc3d7]/60">No downstream dependencies registered.</p>
                )}
              </div>

              {/* Chaos Load Injector Button */}
              <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl space-y-3">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-red-400" />
                  <span className="text-xs font-bold font-sora text-red-300 uppercase">
                    Chaos Resilience Test
                  </span>
                </div>
                <p className="text-xs font-mono text-[#cbc3d7] leading-relaxed">
                  Inject artificial synthetic load spike (+500% RPS) and memory pressure on <strong className="text-white">{selectedService.name}</strong> to test auto-scaling and alert triggers.
                </p>
                <button
                  onClick={() => onSimulateSpike(selectedService.name)}
                  className="w-full py-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white rounded-lg font-mono font-bold text-xs shadow-lg shadow-red-950/40 transition active:scale-95"
                >
                  Inject Traffic Spike on {selectedService.name}
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-8 text-center rounded-xl border border-[#2d3449]">
              <p className="text-xs font-mono text-[#cbc3d7]">Select a microservice card from the mesh to inspect telemetry.</p>
            </div>
          )}

          {/* K8s Cluster Nodes Inspector */}
          <div className="glass-panel p-4 rounded-xl space-y-3 border border-[#2d3449]">
            <h4 className="text-xs font-bold font-sora text-[#d0bcff] uppercase tracking-wider flex items-center justify-between">
              <span>Kubernetes Worker Nodes</span>
              <span className="text-[10px] text-[#cbc3d7]">us-east-1</span>
            </h4>

            <div className="space-y-2">
              {nodes.map((node) => (
                <div key={node.id} className="bg-[#0b1326] p-2.5 rounded-lg border border-[#2d3449] space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold truncate max-w-[180px]">{node.name}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                      node.status === 'Pressure' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {node.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] text-[#cbc3d7]">
                    <div>CPU: <strong className={node.cpuPercent > 85 ? 'text-red-400' : 'text-white'}>{node.cpuPercent}%</strong></div>
                    <div>RAM: <strong className={node.memPercent > 85 ? 'text-red-400' : 'text-white'}>{node.memPercent}%</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
