import { Incident, LogEntry, Playbook, ServiceHealth, ClusterNode, PostMortem } from '../types';

export const INITIAL_SERVICES: ServiceHealth[] = [
  {
    name: 'payment-gateway-v2',
    status: 'critical',
    latency: 1840,
    errorRate: 14.8,
    cpu: 92,
    memory: 88,
    instances: 12,
    dependencies: ['auth-service', 'postgres-primary-db', 'stripe-connector']
  },
  {
    name: 'auth-service',
    status: 'degraded',
    latency: 420,
    errorRate: 3.2,
    cpu: 78,
    memory: 74,
    instances: 8,
    dependencies: ['redis-cache-cluster', 'postgres-primary-db']
  },
  {
    name: 'order-processing-engine',
    status: 'degraded',
    latency: 680,
    errorRate: 6.1,
    cpu: 84,
    memory: 81,
    instances: 16,
    dependencies: ['payment-gateway-v2', 'inventory-service', 'kafka-event-bus']
  },
  {
    name: 'inventory-service',
    status: 'healthy',
    latency: 38,
    errorRate: 0.02,
    cpu: 34,
    memory: 45,
    instances: 6,
    dependencies: ['postgres-replica-db']
  },
  {
    name: 'kafka-event-bus',
    status: 'healthy',
    latency: 12,
    errorRate: 0.00,
    cpu: 48,
    memory: 62,
    instances: 5,
    dependencies: []
  },
  {
    name: 'redis-cache-cluster',
    status: 'critical',
    latency: 1250,
    errorRate: 18.5,
    cpu: 99,
    memory: 96,
    instances: 4,
    dependencies: []
  },
  {
    name: 'user-profile-api',
    status: 'healthy',
    latency: 45,
    errorRate: 0.05,
    cpu: 28,
    memory: 38,
    instances: 6,
    dependencies: ['auth-service', 'redis-cache-cluster']
  },
  {
    name: 'ingress-nginx-gateway',
    status: 'degraded',
    latency: 310,
    errorRate: 4.8,
    cpu: 72,
    memory: 65,
    instances: 20,
    dependencies: ['auth-service', 'order-processing-engine', 'payment-gateway-v2']
  }
];

export const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'INC-9042',
    title: 'Payment Gateway Connection Pool Exhaustion & Redis Cache Lock Thrashing',
    service: 'payment-gateway-v2',
    severity: 'P0-CRITICAL',
    status: 'ACTIVE',
    cluster: 'us-east-prod-01',
    createdAt: '12 mins ago',
    updatedAt: 'Just now',
    impact: '14.8% payment checkout failures across Global Region. Revenue loss estimate ~$4,200/min.',
    errorRate: '14.8%',
    p99Latency: '1,840ms',
    summary: 'HikariCP connection pool timed out after 30,000ms. Redis LFU key eviction policy stalled auth-service token verification.',
    rootCauseCandidate: 'DbPoolExhaustion: Max connections (100) exceeded due to unindexed SQL query on payment_method_records table + Redis eviction lock contention.',
    aiDiagnosis: {
      rootCause: 'Connection Pool Starvation in payment-gateway-v2 triggered by a missing composite index on transactions(tenant_id, created_at) following v2.14.0 release.',
      confidence: 96,
      affectedComponents: ['payment-gateway-v2', 'redis-cache-cluster', 'auth-service'],
      immediateSteps: [
         'Scale payment-gateway-v2 deployment pods from 12 to 24 to increase aggregate connection capacity.',
         'Flush expired token keys in Redis cluster pool 0 using non-blocking SCAN/UNLINK.',
         'Apply hotfix query patch or bump HikariCP connection timeout to 45s.'
      ],
      playbookRecommendation: 'PLAYBOOK-AUTOSCALE-AND-DRAIN-REDIS'
    },
    timeline: [
      { id: 't1', time: '02:32:00', event: 'Datadog Alert: p99 latency > 1500ms on payment-gateway-v2', type: 'alert' },
      { id: 't2', time: '02:32:45', event: 'PagerDuty incident INC-9042 created and assigned to On-Call SRE (Primary)', type: 'system' },
      { id: 't3', time: '02:33:10', event: 'Incident Brain AI detected 504 Gateway Timeouts & 100% Postgres pool utilization', type: 'ai' },
      { id: 't4', time: '02:35:00', event: 'Automated diagnostic snapshot captured: 1,420 thread stack traces exported', type: 'action', author: 'sre-bot-auto' },
      { id: 't5', time: '02:40:12', event: 'Incident Brain recommended Playbook #PB-402 (Connection Pool Boost & Pod Scaling)', type: 'ai' }
    ],
    logsSample: [
      '2026-08-13T02:41:02.112Z [ERROR] [payment-gateway-v2-7f8d9b4c-x9z2] HikariPool-1 - Connection is not available, request timed out after 30005ms.',
      '2026-08-13T02:41:02.890Z [WARN] [auth-service-589f6b-k2l1] Redis READ timeout on cluster node 10.0.12.4:6379 after 1500ms. Fallback to DB initiated.',
      '2026-08-13T02:41:03.450Z [ERROR] [payment-gateway-v2-7f8d9b4c-x9z2] org.postgresql.util.PSQLException: FATAL: remaining connection slots reserved for non-replication superuser connections',
      '2026-08-13T02:41:04.001Z [FATAL] [order-processing-engine-99a1-m4] Outbound call to payment-gateway-v2 returned HTTP 503 Service Unavailable (Duration: 1845ms)'
    ],
    recommendedPlaybookId: 'PB-402',
    metrics: {
      timestamps: ['02:20', '02:25', '02:30', '02:35', '02:40', '02:44'],
      latencyMs: [120, 140, 480, 1250, 1790, 1840],
      errorPercentage: [0.01, 0.02, 2.4, 8.9, 12.5, 14.8],
      rps: [4200, 4150, 3900, 3200, 2800, 2450]
    }
  },
  {
    id: 'INC-9041',
    title: 'High Ingress Nginx HTTP 502 Bad Gateway Spike on Order API',
    service: 'order-processing-engine',
    severity: 'P1-HIGH',
    status: 'INVESTIGATING',
    cluster: 'eu-west-k8s-02',
    createdAt: '28 mins ago',
    updatedAt: '3 mins ago',
    impact: '6.1% request degradation for EU storefront checkout flows.',
    errorRate: '6.1%',
    p99Latency: '680ms',
    summary: 'Upstream HTTP keepalive timeout mismatch between Nginx ingress and Node.js process runtime causing connection reset by peer.',
    timeline: [
      { id: 't10', time: '02:16:00', event: 'Prometheus alert: Nginx ingress 5xx rate > 5%', type: 'alert' },
      { id: 't11', time: '02:18:20', event: 'SRE On-call acknowledged incident via Slack #ops-incidents', type: 'action', author: 'alex.sre' },
      { id: 't12', time: '02:22:00', event: 'Incident Brain correlated deployment v2.13.9 release with socket resets', type: 'ai' }
    ],
    logsSample: [
      '2026-08-13T02:38:11.200Z [WARN] [ingress-nginx] *102931 upstream prematurely closed connection while reading response header from upstream, client: 172.56.12.9',
      '2026-08-13T02:38:12.441Z [ERROR] [order-processing-engine] ECONNRESET socket hung up during keep-alive idle phase.'
    ],
    recommendedPlaybookId: 'PB-105',
    metrics: {
      timestamps: ['02:00', '02:10', '02:20', '02:30', '02:40', '02:44'],
      latencyMs: [80, 85, 210, 450, 620, 680],
      errorPercentage: [0.0, 0.1, 1.2, 4.5, 5.8, 6.1],
      rps: [8500, 8400, 8100, 7800, 7500, 7400]
    }
  },
  {
    id: 'INC-9038',
    title: 'Kafka Consumer Lag Growing on Inventory Sync Topic',
    service: 'inventory-service',
    severity: 'P2-MEDIUM',
    status: 'MITIGATED',
    cluster: 'us-east-prod-01',
    createdAt: '1 hr ago',
    updatedAt: '15 mins ago',
    impact: 'Inventory stock updates delayed by ~180 seconds. No user-facing hard errors.',
    errorRate: '0.02%',
    p99Latency: '38ms',
    summary: 'Consumer partition rebalance loop caused by long GC pauses in Java consumer pods. Rebalanced successfully after garbage collection tuning.',
    timeline: [
      { id: 't20', time: '01:40:00', event: 'Kafka Consumer Lag exceeded 250,000 messages', type: 'alert' },
      { id: 't21', time: '01:55:00', event: 'Auto-scaled consumer group partition instances from 3 to 6', type: 'action', author: 'k8s-hpa' },
      { id: 't22', time: '02:10:00', event: 'Consumer lag reduced back to normal limits (< 500 msgs)', type: 'status' }
    ],
    logsSample: [
      '2026-08-13T01:42:01.000Z [INFO] [inventory-service] Kafka Consumer rebalance triggered for group inventory-sync-v1',
      '2026-08-13T01:56:00.000Z [INFO] [inventory-service] Successfully assigned 6 partitions to 6 consumer threads.'
    ],
    recommendedPlaybookId: 'PB-201',
    metrics: {
      timestamps: ['01:30', '01:45', '02:00', '02:15', '02:30', '02:44'],
      latencyMs: [35, 42, 48, 40, 37, 38],
      errorPercentage: [0.0, 0.05, 0.1, 0.02, 0.02, 0.02],
      rps: [1200, 1250, 1220, 1210, 1200, 1200]
    }
  }
];

export const INITIAL_PLAYBOOKS: Playbook[] = [
  {
    id: 'PB-402',
    title: 'Emergency Connection Pool Scale & Thread Drain',
    description: 'Increases HikariCP / DB max connections dynamically and scales deployment pod replicas to absorb connection spikes.',
    targetService: 'payment-gateway-v2',
    riskLevel: 'MEDIUM',
    commands: [
      'kubectl scale deployment/payment-gateway-v2 --replicas=24 -n production',
      'kubectl set env deployment/payment-gateway-v2 DB_MAX_POOL_SIZE=150 DB_TIMEOUT_MS=45000',
      'redis-cli -h redis-cluster.internal SCAN 0 MATCH "token:*" COUNT 1000 | xargs redis-cli UNLINK',
      'kubectl rollout status deployment/payment-gateway-v2 --timeout=120s'
    ],
    estimatedImpact: 'Immediate 60% latency reduction. Restores checkout success rates within 90 seconds.',
    automatedVerification: 'Check if payment-gateway-v2 HTTP 503 error rate drops below 0.5% for 3 consecutive 10s windows.'
  },
  {
    id: 'PB-105',
    title: 'Align Nginx Ingress Keepalive & Socket Timeout',
    description: 'Applies config map patch to set upstream keepalive timeout to 65s matching backend Node.js http server defaults.',
    targetService: 'order-processing-engine',
    riskLevel: 'LOW',
    commands: [
      'kubectl patch configmap ingress-nginx-controller -n ingress-nginx --type merge -p \'{"data":{"upstream-keepalive-timeout":"65s"}}\'',
      'kubectl rollout restart deployment/ingress-nginx-controller -n ingress-nginx',
      'curl -I https://api.prod.system.internal/healthz'
    ],
    estimatedImpact: 'Eliminates HTTP 502 socket hung up errors caused by premature TCP FIN packets.',
    automatedVerification: 'Verify ingress 502 bad gateway rate decreases to 0.00%.'
  },
  {
    id: 'PB-201',
    title: 'Kafka Consumer Partition Re-Assign & JVM Heap Bump',
    description: 'Bumps consumer pod RAM memory requests to prevent Stop-The-World G1GC pauses during heavy batch processing.',
    targetService: 'inventory-service',
    riskLevel: 'LOW',
    commands: [
      'kubectl set resources deployment/inventory-service -c consumer --limits=memory=4Gi,cpu=2000m',
      'kubectl annotate deployment/inventory-service SRE_RUNBOOK_EXEC="PB-201" --overwrite'
    ],
    estimatedImpact: 'Clears partition consumer lag within 3 minutes.',
    automatedVerification: 'Monitor kafka_consumergroup_lag gauge < 1000.'
  },
  {
    id: 'PB-999',
    title: 'Chaos Rollback & Emergency Circuit Breaker',
    description: 'Isolates failing microservices, enables circuit breaker fallback responses, and rolls back to last known good git commit.',
    targetService: 'all-services',
    riskLevel: 'HIGH',
    commands: [
      'kubectl rollout undo deployment/payment-gateway-v2 -n production',
      'kubectl rollout undo deployment/order-processing-engine -n production',
      'envoy-cli --host 10.0.0.1 enable-circuit-breaker --service payment-gateway-v2 --threshold 50'
    ],
    estimatedImpact: 'Instantly stops cascade failures across downstream services.',
    automatedVerification: 'Verify global error rate returns to baseline (< 0.1%).'
  }
];

export const INITIAL_LOGS: LogEntry[] = [
  {
    id: 'log-101',
    timestamp: '02:43:58.120',
    level: 'ERROR',
    service: 'payment-gateway-v2',
    cluster: 'us-east-prod-01',
    pod: 'payment-gateway-v2-7f8d9b4c-x9z2',
    traceId: 'trace-98a1-893f21a0',
    message: 'HikariPool-1 - Connection is not available, request timed out after 30005ms.'
  },
  {
    id: 'log-102',
    timestamp: '02:43:58.450',
    level: 'ERROR',
    service: 'payment-gateway-v2',
    cluster: 'us-east-prod-01',
    pod: 'payment-gateway-v2-7f8d9b4c-x9z2',
    traceId: 'trace-98a1-893f21a0',
    message: 'PostgresException: FATAL: sorry, too many clients already. Current connections: 100/100'
  },
  {
    id: 'log-103',
    timestamp: '02:43:59.002',
    level: 'WARN',
    service: 'auth-service',
    cluster: 'us-east-prod-01',
    pod: 'auth-service-589f6b-k2l1',
    traceId: 'trace-98a1-893f21a1',
    message: 'Redis cluster node 10.0.12.4:6379 ping timeout. Retrying in 250ms (attempt 3/5).'
  },
  {
    id: 'log-104',
    timestamp: '02:43:59.340',
    level: 'FATAL',
    service: 'order-processing-engine',
    cluster: 'us-east-prod-01',
    pod: 'order-processing-engine-99a1-m4',
    traceId: 'trace-98a1-893f21a2',
    message: 'CircuitBreaker Open: payment-gateway-v2 failing > 50% requests in rolling 10s window.'
  },
  {
    id: 'log-105',
    timestamp: '02:44:00.110',
    level: 'INFO',
    service: 'ingress-nginx-gateway',
    cluster: 'us-east-prod-01',
    pod: 'ingress-nginx-controller-7419a',
    traceId: 'trace-98a1-893f21a3',
    message: 'HTTP POST /api/v2/checkout 503 1845ms - Client IP: 172.31.84.12 User-Agent: Storefront/3.1'
  },
  {
    id: 'log-106',
    timestamp: '02:44:01.005',
    level: 'ERROR',
    service: 'redis-cache-cluster',
    cluster: 'us-east-prod-01',
    pod: 'redis-node-01',
    traceId: 'trace-98a1-893f21a4',
    message: 'OOM command not allowed when used memory > maxmemory (4294967296 bytes).'
  },
  {
    id: 'log-107',
    timestamp: '02:44:02.500',
    level: 'INFO',
    service: 'user-profile-api',
    cluster: 'us-east-prod-01',
    pod: 'user-profile-api-88a2-p0',
    traceId: 'trace-98a1-893f21a5',
    message: 'HTTP GET /api/v1/user/me 200 42ms - Cache hit on session_token_881a'
  }
];

export const INITIAL_NODES: ClusterNode[] = [
  { id: 'node-1', name: 'ip-10-0-12-1.ec2.internal', zone: 'us-east-1a', status: 'Pressure', cpuPercent: 94, memPercent: 89, podCount: 38 },
  { id: 'node-2', name: 'ip-10-0-12-2.ec2.internal', zone: 'us-east-1a', status: 'Ready', cpuPercent: 62, memPercent: 71, podCount: 32 },
  { id: 'node-3', name: 'ip-10-0-12-3.ec2.internal', zone: 'us-east-1b', status: 'Ready', cpuPercent: 58, memPercent: 64, podCount: 29 },
  { id: 'node-4', name: 'ip-10-0-12-4.ec2.internal', zone: 'us-east-1b', status: 'Pressure', cpuPercent: 98, memPercent: 96, podCount: 42 },
  { id: 'node-5', name: 'ip-10-0-12-5.ec2.internal', zone: 'us-east-1c', status: 'Ready', cpuPercent: 41, memPercent: 52, podCount: 24 }
];

export const MOCK_POSTMORTEM: PostMortem = {
  id: 'PM-2026-0813',
  incidentId: 'INC-9042',
  title: 'Post-Mortem: Payment Checkout Outage & Database Pool Starvation',
  author: 'Incident Brain AI / SRE Command Team',
  date: '2026-08-13',
  executiveSummary: 'On August 13, 2026, payment-gateway-v2 experienced a 14.8% failure rate lasting 24 minutes due to HikariCP connection pool exhaustion triggered by an unindexed query during peak morning traffic.',
  rootCause: 'Release v2.14.0 omitted a composite index on transactions(tenant_id, created_at). Slow full-table scans held database connection leases for >30s, cascading into Redis key eviction locks and upstream HTTP 503 gateway timeouts.',
  triggerEvent: 'Morning traffic surge at 02:30 UTC combined with automated batch reconciliation jobs.',
  detectionTime: '02:32:00 UTC (Datadog P99 latency alert)',
  resolutionTime: '02:56:00 UTC (PB-402 connection pool expansion & hotfix rollout)',
  totalDowntime: '24 minutes (Partial degradation)',
  timeline: [
    { time: '02:30 UTC', note: 'Batch job launched; unindexed queries flooded Postgres connection pool.' },
    { time: '02:32 UTC', note: 'Datadog latency alert fired (p99 > 1500ms). INC-9042 created.' },
    { time: '02:33 UTC', note: 'Incident Brain AI identified DB connection pool exhaustion with 96% confidence.' },
    { time: '02:40 UTC', note: 'SRE executed Playbook PB-402, scaling pods from 12 to 24 and boosting max pool size.' },
    { time: '02:54 UTC', note: 'Hotfix patch deployed with missing database index.' },
    { time: '02:56 UTC', note: 'All systems verified stable; error rate back to 0.01%.' }
  ],
  impactMetrics: {
    usersAffected: '14,280 checkout attempts failed',
    failedRequests: '38,400 total failed API requests',
    p99PeakLatency: '1,840ms (Normal baseline: 120ms)'
  },
  actionItems: [
    { id: 'act-1', task: 'Add composite index idx_transactions_tenant_created to Postgres DB schema', owner: 'data-eng-team', priority: 'P0', status: 'Completed' },
    { id: 'act-2', task: 'Enforce automated CI index static linting for all new migrations', owner: 'platform-devs', priority: 'P1', status: 'In Progress' },
    { id: 'act-3', task: 'Update HikariPool timeout threshold from 30s to 10s with fast-fail circuit breaker', owner: 'sre-core', priority: 'P1', status: 'Open' }
  ],
  preventativeMeasures: [
    'Implement database query duration guardrails (cancel queries taking > 5 seconds in production).',
    'Pre-warm Redis cache pools prior to running morning reconciliation batches.',
    'Enable Incident Brain automated PB-402 auto-remediation mode for P0 connection pool alerts.'
  ]
};
