import React, { useState, useEffect } from 'react';
import { Incident, Playbook, ServiceHealth, LogEntry, ClusterNode, PostMortem } from './types';
import { 
  INITIAL_INCIDENTS, 
  INITIAL_SERVICES, 
  INITIAL_PLAYBOOKS, 
  INITIAL_LOGS, 
  INITIAL_NODES, 
  MOCK_POSTMORTEM 
} from './data/mockData';
import { Header } from './components/Header';
import { IncidentFeed } from './components/IncidentFeed';
import { TelemetryHud } from './components/TelemetryHud';
import { AiAssistant } from './components/AiAssistant';
import { LiveLogStream } from './components/LiveLogStream';
import { PostMortemStudio } from './components/PostMortemStudio';
import { PlaybookRunnerModal } from './components/PlaybookRunnerModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('incidents');
  const [cluster, setCluster] = useState<string>('us-east-prod-01');
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(INITIAL_INCIDENTS[0] || null);
  const [services, setServices] = useState<ServiceHealth[]>(INITIAL_SERVICES);
  const [playbooks] = useState<Playbook[]>(INITIAL_PLAYBOOKS);
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [nodes] = useState<ClusterNode[]>(INITIAL_NODES);
  const [postMortem, setPostMortem] = useState<PostMortem>(MOCK_POSTMORTEM);

  const [activePlaybookExecution, setActivePlaybookExecution] = useState<{
    playbook: Playbook;
    incident: Incident;
  } | null>(null);

  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isAgentLoading, setIsAgentLoading] = useState<boolean>(false);
  const [isPostMortemGenerating, setIsPostMortemGenerating] = useState<boolean>(false);

  // Real-time simulated log ticker
  useEffect(() => {
    const serviceNames = ['payment-gateway-v2', 'auth-service', 'order-processing-engine', 'inventory-service', 'user-profile-api'];
    const levels: Array<'INFO' | 'WARN' | 'ERROR'> = ['INFO', 'INFO', 'INFO', 'WARN', 'ERROR'];

    const interval = setInterval(() => {
      const now = new Date();
      const timestamp = now.toTimeString().split(' ')[0] + '.' + Math.floor(now.getMilliseconds()).toString().padStart(3, '0');
      const service = serviceNames[Math.floor(Math.random() * serviceNames.length)];
      const level = levels[Math.floor(Math.random() * levels.length)];

      let msg = '';
      if (level === 'INFO') {
        msg = `HTTP GET /api/v1/${service}/healthz 200 - Duration: ${Math.floor(Math.random() * 40 + 10)}ms`;
      } else if (level === 'WARN') {
        msg = `Connection pool utilization reached ${Math.floor(Math.random() * 20 + 75)}% threshold on pod-${Math.floor(Math.random() * 9 + 1)}`;
      } else {
        msg = `HikariPool timeout - request waiting for connection slot exceed 15000ms.`;
      }

      const newLog: LogEntry = {
        id: `log-${Date.now()}`,
        timestamp,
        level,
        service,
        cluster,
        pod: `${service}-${Math.floor(Math.random() * 900 + 100)}`,
        traceId: `trace-${Math.random().toString(36).substring(2, 10)}`,
        message: msg
      };

      setLogs(prev => [...prev.slice(-150), newLog]);
    }, 2500);

    return () => clearInterval(interval);
  }, [cluster]);

  // Trigger Chaos Monkey Handler
  const handleTriggerChaos = () => {
    const chaosServices = ['auth-service', 'order-processing-engine', 'user-profile-api', 'payment-gateway-v2'];
    const targetService = chaosServices[Math.floor(Math.random() * chaosServices.length)];
    const incNumber = Math.floor(Math.random() * 90 + 10);
    const newIncId = `INC-91${incNumber}`;

    const chaosTitles = [
      `Database Connection Pool Exhaustion & Thread Starvation on ${targetService}`,
      `OOMKilled Pod Eviction & Heap Memory Leak on ${targetService}`,
      `Cascading Latency Spike & Gateway Timeout 504 on ${targetService}`,
      `Redis Cluster Cache Lock Thrashing & Session Invalidation on ${targetService}`
    ];
    const chaosTitle = chaosTitles[Math.floor(Math.random() * chaosTitles.length)];

    const newIncident: Incident = {
      id: newIncId,
      title: chaosTitle,
      service: targetService,
      severity: 'P0-CRITICAL',
      status: 'ACTIVE',
      cluster,
      createdAt: 'Just now',
      updatedAt: 'Just now',
      impact: `Critical failure in ${targetService}. 18.5% error rate across cluster.`,
      errorRate: '18.5%',
      p99Latency: '2,400ms',
      summary: `Automated Chaos Injection triggered on ${targetService}. High TCP socket timeouts and pod CPU pressure detected.`,
      timeline: [
        { id: `t-${Date.now()}-1`, time: new Date().toLocaleTimeString(), event: `Chaos Injection event triggered on ${targetService}`, type: 'alert' },
        { id: `t-${Date.now()}-2`, time: new Date().toLocaleTimeString(), event: `Incident Brain AI detected P0 anomaly (p99 latency > 2000ms)`, type: 'ai' }
      ],
      logsSample: [
        `[FATAL] [${targetService}] Out of memory error: Java heap space exhausted during query processing`,
        `[ERROR] [${targetService}] HikariCP Pool connection is not available after 30000ms timeout.`
      ],
      recommendedPlaybookId: 'PB-402',
      metrics: {
        timestamps: ['10m ago', '8m ago', '5m ago', '2m ago', 'Just now'],
        latencyMs: [100, 120, 850, 1800, 2400],
        errorPercentage: [0.0, 0.1, 4.5, 12.0, 18.5],
        rps: [5000, 4800, 3200, 2100, 1800]
      }
    };

    setIncidents(prev => [newIncident, ...prev]);
    setSelectedIncident(newIncident);

    // Update service status to critical
    setServices(prev => prev.map(s => {
      if (s.name === targetService) {
        return {
          ...s,
          status: 'critical',
          latency: 2400,
          errorRate: 18.5,
          cpu: 98,
          memory: 95
        };
      }
      return s;
    }));

    setActiveTab('incidents');
  };

  // Diagnose with AI Handler
  const handleDiagnoseWithAi = async (incident: Incident) => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentTitle: incident.title,
          service: incident.service,
          logsSample: incident.logsSample,
          errorRate: incident.errorRate,
          p99Latency: incident.p99Latency,
          impact: incident.impact
        })
      });

      const data = await res.json();
      if (data && data.rootCause) {
        const updatedIncident: Incident = {
          ...incident,
          aiDiagnosis: {
            rootCause: data.rootCause,
            confidence: data.confidence || 95,
            affectedComponents: data.affectedServices || [incident.service],
            immediateSteps: data.recommendedFixes || ['Scale pod replicas', 'Flush token cache'],
            playbookRecommendation: data.playbookName || 'PB-402'
          },
          timeline: [
            ...incident.timeline,
            { id: `t-ai-${Date.now()}`, time: new Date().toLocaleTimeString(), event: `Gemini AI Root Cause Analysis updated: ${data.rootCause}`, type: 'ai' }
          ]
        };

        setIncidents(prev => prev.map(i => i.id === incident.id ? updatedIncident : i));
        setSelectedIncident(updatedIncident);
      }
    } catch (err) {
      console.error('AI Diagnosis error:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const buildErrorTrace = (incident: Incident) => {
    return [incident.summary, ...incident.logsSample].filter(Boolean).join('\n');
  };

  const handleAnalyzeIncident = async (incident: Incident) => {
    setIsAgentLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: incident.service,
          error_trace: buildErrorTrace(incident)
        })
      });

      if (!res.ok) {
        throw new Error(`Analyze request failed: ${res.status}`);
      }

      const data = await res.json();
      const nextDecision = {
        diagnosis: data.diagnosis || data.reasoning || 'No diagnosis returned.',
        confidence: Number(data.confidence || 0),
        has_memory_match: Boolean(data.has_memory_match),
        selected_tool: data.selected_tool || null,
        tool_args: data.tool_args || {},
        recalled_memories: Array.isArray(data.recalled_memories) ? data.recalled_memories : []
      };

      const updatedIncident: Incident = {
        ...incident,
        agentDecision: nextDecision,
        aiDiagnosis: {
          rootCause: nextDecision.diagnosis,
          confidence: Math.min(99, Math.max(0, Math.round(Number(nextDecision.confidence) * 100 || 0))),
          affectedComponents: Array.isArray(nextDecision.recalled_memories) && nextDecision.recalled_memories.length > 0
            ? nextDecision.recalled_memories.map((memory: any) => memory.service || incident.service)
            : [incident.service],
          immediateSteps: nextDecision.selected_tool
            ? [`Execute ${nextDecision.selected_tool} with arguments ${JSON.stringify(nextDecision.tool_args || {})}`]
            : ['Review service dependencies and retry with a guarded mitigation step.'],
          playbookRecommendation: nextDecision.selected_tool || 'Run standard warm restart and cache recovery workflow.'
        },
        timeline: [
          ...incident.timeline,
          {
            id: `t-agent-${Date.now()}`,
            time: new Date().toLocaleTimeString(),
            event: `Hindsight memory analysis completed for ${incident.service}. Recommended action: ${nextDecision.selected_tool || 'manual review'}.`,
            type: 'ai',
            author: 'incident-brain-agent'
          }
        ]
      };

      setIncidents(prev => prev.map(item => item.id === incident.id ? updatedIncident : item));
      setSelectedIncident(updatedIncident);
    } catch (err) {
      console.error('Analyze incident error:', err);
    } finally {
      setIsAgentLoading(false);
    }
  };

  const handleFeedback = async (incident: Incident, forceSuccess: boolean) => {
    const decision = incident.agentDecision || {
      selected_tool: 'restart_pod',
      tool_args: { service: incident.service }
    };

    try {
      const res = await fetch('http://localhost:8000/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: incident.service,
          error_trace: buildErrorTrace(incident),
          decision,
          force_success: forceSuccess
        })
      });

      if (!res.ok) {
        throw new Error(`Feedback request failed: ${res.status}`);
      }

      const data = await res.json();
      const updatedIncident: Incident = {
        ...incident,
        timeline: [
          ...incident.timeline,
          {
            id: `t-feedback-${Date.now()}`,
            time: new Date().toLocaleTimeString(),
            event: forceSuccess
              ? `Approved execution for ${incident.service}. ${data?.status || 'Execution accepted'} via Hindsight reinforcement.`
              : `Failure reported for ${incident.service}. Hindsight retained a negative memory and suppressed the failed mitigation path.`,
            type: 'action',
            author: 'hindsight-memory'
          }
        ]
      };

      setIncidents(prev => prev.map(item => item.id === incident.id ? updatedIncident : item));
      setSelectedIncident(updatedIncident);
      return data;
    } catch (err) {
      console.error('Feedback request error:', err);
      return null;
    }
  };

  // Execute Playbook Handler
  const handleExecutePlaybook = (playbook: Playbook, incident: Incident) => {
    setActivePlaybookExecution({ playbook, incident });
  };

  const handlePlaybookCompleted = () => {
    if (!activePlaybookExecution) return;

    const { incident } = activePlaybookExecution;

    // Update incident status
    const updatedIncident: Incident = {
      ...incident,
      status: 'MITIGATED',
      timeline: [
        ...incident.timeline,
        { id: `t-pb-${Date.now()}`, time: new Date().toLocaleTimeString(), event: `Runbook ${activePlaybookExecution.playbook.id} executed successfully by Incident Brain`, type: 'action', author: 'sre-automator' },
        { id: `t-st-${Date.now()}`, time: new Date().toLocaleTimeString(), event: `Incident status updated to MITIGATED`, type: 'status' }
      ]
    };

    setIncidents(prev => prev.map(i => i.id === incident.id ? updatedIncident : i));
    if (selectedIncident?.id === incident.id) {
      setSelectedIncident(updatedIncident);
    }

    // Recover service health telemetry
    setServices(prev => prev.map(s => {
      if (s.name === incident.service) {
        return {
          ...s,
          status: 'healthy',
          latency: 45,
          errorRate: 0.05,
          cpu: 42,
          memory: 50
        };
      }
      return s;
    }));
  };

  // Mark Incident as Resolved
  const handleResolveIncident = (incidentId: string) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === incidentId) {
        const resolved: Incident = {
          ...inc,
          status: 'RESOLVED',
          timeline: [
            ...inc.timeline,
            { id: `t-res-${Date.now()}`, time: new Date().toLocaleTimeString(), event: `Incident marked as RESOLVED by SRE Command Operator`, type: 'status' }
          ]
        };
        if (selectedIncident?.id === incidentId) setSelectedIncident(resolved);
        return resolved;
      }
      return inc;
    }));
  };

  // Generate Post-Mortem
  const handleGeneratePostMortem = async (incident: Incident) => {
    setIsPostMortemGenerating(true);
    try {
      const res = await fetch('/api/ai/postmortem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incident })
      });

      const data = await res.json();
      if (data && data.markdown) {
        setPostMortem({
          id: `PM-${incident.id}`,
          incidentId: incident.id,
          title: `Blameless Post-Mortem: ${incident.title}`,
          author: 'Incident Brain AI / SRE Command Team',
          date: new Date().toISOString().split('T')[0],
          executiveSummary: `On ${new Date().toLocaleDateString()}, service ${incident.service} suffered an outage (${incident.errorRate} error spike) impacting production workloads.`,
          rootCause: incident.aiDiagnosis?.rootCause || incident.rootCauseCandidate || 'Database connection pool starvation & thread lock contention.',
          triggerEvent: 'Peak traffic surge combined with unindexed database query load.',
          detectionTime: '02:32 UTC',
          resolutionTime: '02:56 UTC',
          totalDowntime: '24 minutes',
          timeline: incident.timeline.map(t => ({ time: t.time, note: t.event })),
          impactMetrics: {
            usersAffected: '14,280 checkout attempts impacted',
            failedRequests: incident.errorRate + ' peak request failure rate',
            p99PeakLatency: incident.p99Latency
          },
          actionItems: [
            { id: 'a1', task: `Scale ${incident.service} replica deployment baseline`, owner: 'platform-sre', priority: 'P0', status: 'In Progress' },
            { id: 'a2', task: `Add automated index static analyzer to CI pipeline`, owner: 'devops-team', priority: 'P1', status: 'Open' }
          ],
          preventativeMeasures: [
            'Implement query timeout guardrails in production.',
            'Auto-trigger PB-402 on high connection pool saturation.'
          ]
        });

        setActiveTab('postmortem');
      }
    } catch (err) {
      console.error('PostMortem error:', err);
    } finally {
      setIsPostMortemGenerating(false);
    }
  };

  // Simulate Spike on a specific service
  const handleSimulateSpike = (serviceName: string) => {
    setServices(prev => prev.map(s => {
      if (s.name === serviceName) {
        return {
          ...s,
          status: 'critical',
          latency: 1920,
          errorRate: 16.2,
          cpu: 96,
          memory: 92
        };
      }
      return s;
    }));
  };

  const handleResetServices = () => {
    setServices(INITIAL_SERVICES);
  };

  const activeIncidentsCount = incidents.filter(i => i.status === 'ACTIVE' || i.status === 'INVESTIGATING').length;
  const criticalIncidentsCount = incidents.filter(i => (i.status === 'ACTIVE' || i.status === 'INVESTIGATING') && i.severity === 'P0-CRITICAL').length;

  return (
    <div className="min-h-screen bg-[#0b1326] text-[#dae2fd] font-mono flex flex-col">
      {/* Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cluster={cluster}
        setCluster={setCluster}
        activeIncidentsCount={activeIncidentsCount}
        criticalIncidentsCount={criticalIncidentsCount}
        onTriggerChaos={handleTriggerChaos}
      />

      {/* Body Views */}
      <main className="flex-1 pb-12">
        {activeTab === 'incidents' && (
          <IncidentFeed
            incidents={incidents}
            selectedIncident={selectedIncident}
            onSelectIncident={setSelectedIncident}
            playbooks={playbooks}
            onExecutePlaybook={handleExecutePlaybook}
            onDiagnoseWithAi={handleDiagnoseWithAi}
            onAnalyzeIncident={handleAnalyzeIncident}
            onApproveExecute={(incident) => handleFeedback(incident, true)}
            onReportFailure={(incident) => handleFeedback(incident, false)}
            onResolveIncident={handleResolveIncident}
            onGeneratePostMortem={handleGeneratePostMortem}
            isAiLoading={isAiLoading}
            isAgentLoading={isAgentLoading}
          />
        )}

        {activeTab === 'telemetry' && (
          <TelemetryHud
            services={services}
            nodes={nodes}
            onSimulateSpike={handleSimulateSpike}
            onResetServices={handleResetServices}
          />
        )}

        {activeTab === 'ai-assistant' && (
          <AiAssistant
            activeIncident={selectedIncident}
            onExecuteCommand={(cmd) => {
              // Add a log for executed command
              setLogs(prev => [...prev, {
                id: `log-cmd-${Date.now()}`,
                timestamp: new Date().toLocaleTimeString(),
                level: 'INFO',
                service: 'sre-terminal',
                cluster,
                message: `[SRE-CLI] Executed: $ ${cmd}`
              }]);
              setActiveTab('logs');
            }}
          />
        )}

        {activeTab === 'logs' && (
          <LiveLogStream
            logs={logs}
            onClearLogs={() => setLogs([])}
          />
        )}

        {activeTab === 'postmortem' && (
          <PostMortemStudio
            postMortem={postMortem}
            incidents={incidents}
            onGeneratePostMortemForIncident={handleGeneratePostMortem}
            isGenerating={isPostMortemGenerating}
          />
        )}
      </main>

      {/* Playbook Execution Modal */}
      {activePlaybookExecution && (
        <PlaybookRunnerModal
          playbook={activePlaybookExecution.playbook}
          incident={activePlaybookExecution.incident}
          onClose={() => setActivePlaybookExecution(null)}
          onComplete={handlePlaybookCompleted}
        />
      )}

      {/* Footer Ribbon */}
      <footer className="border-t border-[#2d3449] bg-[#060e20] py-3 text-xs font-mono text-[#cbc3d7]">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#4edea3]"></span>
            <span>Incident Brain SRE Command Center • AI Model: <strong className="text-white">Gemini 3.6 Flash</strong></span>
          </div>
          <div>
            <span>Cluster Context: <strong className="text-[#d0bcff]">{cluster}</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
