export type SeverityLevel = 'P0-CRITICAL' | 'P1-HIGH' | 'P2-MEDIUM' | 'P3-LOW';
export type IncidentStatus = 'ACTIVE' | 'INVESTIGATING' | 'MITIGATED' | 'RESOLVED';
export type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'FATAL';

export interface TimelineEvent {
  id: string;
  time: string;
  event: string;
  type: 'alert' | 'action' | 'ai' | 'status' | 'system';
  author?: string;
}

export interface Incident {
  id: string;
  title: string;
  service: string;
  severity: SeverityLevel;
  status: IncidentStatus;
  cluster: string;
  createdAt: string;
  updatedAt: string;
  impact: string;
  errorRate: string;
  p99Latency: string;
  summary: string;
  rootCauseCandidate?: string;
  aiDiagnosis?: {
    rootCause: string;
    confidence: number;
    affectedComponents: string[];
    immediateSteps: string[];
    playbookRecommendation: string;
  };
  agentDecision?: {
    diagnosis?: string;
    confidence?: number;
    has_memory_match?: boolean;
    selected_tool?: string | null;
    tool_args?: Record<string, unknown>;
    recalled_memories?: Array<Record<string, unknown>>;
  };
  timeline: TimelineEvent[];
  logsSample: string[];
  recommendedPlaybookId?: string;
  metrics: {
    timestamps: string[];
    latencyMs: number[];
    errorPercentage: number[];
    rps: number[];
  };
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  service: string;
  cluster: string;
  message: string;
  traceId?: string;
  pod?: string;
}

export interface Playbook {
  id: string;
  title: string;
  description: string;
  targetService: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  commands: string[];
  estimatedImpact: string;
  automatedVerification?: string;
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'critical';
  latency: number; // in ms
  errorRate: number; // percentage
  cpu: number; // percentage
  memory: number; // percentage
  instances: number;
  dependencies: string[];
}

export interface PostMortem {
  id: string;
  incidentId: string;
  title: string;
  author: string;
  date: string;
  executiveSummary: string;
  rootCause: string;
  triggerEvent: string;
  detectionTime: string;
  resolutionTime: string;
  totalDowntime: string;
  timeline: Array<{ time: string; note: string }>;
  impactMetrics: {
    usersAffected: string;
    failedRequests: string;
    p99PeakLatency: string;
  };
  actionItems: Array<{
    id: string;
    task: string;
    owner: string;
    priority: 'P0' | 'P1' | 'P2';
    status: 'Open' | 'In Progress' | 'Completed';
  }>;
  preventativeMeasures: string[];
}

export interface AiDiagnosisResponse {
  rootCause: string;
  confidence: number;
  explanation: string;
  affectedServices: string[];
  recommendedFixes: string[];
  cliCommandsToRun: string[];
  playbookName: string;
}

export interface ClusterNode {
  id: string;
  name: string;
  zone: string;
  status: 'Ready' | 'NotReady' | 'Pressure';
  cpuPercent: number;
  memPercent: number;
  podCount: number;
}
