# Temporal Integration in itellico Mono

## Overview

itellico Mono features a sophisticated Temporal integration that provides workflow orchestration, background job processing, and AI/LLM execution at enterprise scale. This integration enables reliable, scalable, and observable workflow execution with complete multi-tenant isolation.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        itellico Mono                            │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (Next.js)                                            │
│  ├─ ReactFlow Visual Editor                                    │
│  └─ Workflow Monitoring Dashboard                              │
├─────────────────────────────────────────────────────────────────┤
│  API Layer (Fastify + Next.js)                                │
│  ├─ Workflow API Routes (/api/v1/workflows)                   │
│  ├─ LLM Execution API (/api/v1/llm)                          │
│  └─ Webhook Processing (/api/v1/webhooks)                     │
├─────────────────────────────────────────────────────────────────┤
│  Temporal Integration Layer                                    │
│  ├─ Namespace Manager (Multi-tenant isolation)               │
│  ├─ Worker Manager (Centralized worker orchestration)        │
│  ├─ ReactFlow Bridge (Visual → Temporal conversion)          │
│  └─ Queue Management (Background job processing)              │
├─────────────────────────────────────────────────────────────────┤
│  Temporal Server Infrastructure                               │
│  ├─ Temporal Server (Port 7233)                              │
│  ├─ Temporal Web UI (Port 8080)                              │
│  └─ PostgreSQL Backend                                        │
└─────────────────────────────────────────────────────────────────┘
```

## Key Features

### 1. Multi-Tenant Namespace Isolation

**Complete tenant isolation** through dedicated Temporal namespaces:

- **Platform Namespace**: `mono-platform` for system-wide operations
- **Tenant Namespaces**: `mono-tenant-{tenantId}` for isolated workflow execution
- **Automatic provisioning** of namespaces for new tenants
- **Configurable retention policies** (Platform: 1 year, Tenant: 90 days)

```typescript
// Example: Tenant namespace creation
const namespaceManager = TemporalNamespaceManager.getInstance();
await namespaceManager.ensureTenantNamespace(123);
// Creates: mono-tenant-123
```

### 2. Visual Workflow Builder Integration

**Revolutionary ReactFlow → Temporal conversion** enabling visual workflow design:

#### Supported Node Types
- **StartNode**: Workflow entry points and triggers
- **ApprovalNode**: Human-in-the-loop approval processes
- **WaitNode**: Time-based delays and scheduling
- **DecisionNode**: Conditional branching and logic
- **EmailNode**: Email and notification delivery
- **UpdateRecordNode**: Database operations
- **WebhookNode**: External API integrations
- **EndNode**: Workflow completion and cleanup

#### Visual Editor Features
- **Drag-and-drop interface** with 8 specialized node types
- **Real-time validation** of workflow logic
- **Template library** for common business processes
- **Version control** and workflow history
- **Live execution monitoring** with visual feedback

```typescript
// ReactFlow definition converted to Temporal workflow
const workflowDefinition = {
  nodes: [
    { id: 'start', type: 'StartNode', data: { trigger: 'manual' } },
    { id: 'approval', type: 'ApprovalNode', data: { approvers: ['admin'] } },
    { id: 'email', type: 'EmailNode', data: { template: 'welcome' } },
    { id: 'end', type: 'EndNode', data: { status: 'completed' } }
  ],
  edges: [/* connections */]
};
```

### 3. AI/LLM Workflow Orchestration

**Enterprise-grade AI integration** with comprehensive provider support:

#### Supported Providers
- **OpenAI**: GPT-4, GPT-3.5-turbo, DALL-E, Whisper
- **Anthropic**: Claude-3 (Opus, Sonnet, Haiku)
- **Mistral**: Mistral Large, Medium, Small

#### LLM Workflow Features
- **Multi-provider execution** with automatic failover
- **Template-based prompts** with variable substitution
- **Batch processing** with configurable concurrency
- **Usage tracking** and cost management
- **Rate limiting** per tenant and provider
- **Streaming responses** for real-time interaction

```typescript
// LLM workflow execution
const llmWorkflow = await client.workflow.start(llmExecutionWorkflow, {
  args: [{
    provider: 'openai',
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'Process this data...' }],
    tenantId: '123',
    scope: 'customer-service'
  }],
  workflowId: `llm-execution-${Date.now()}`,
  taskQueue: 'llm-processing'
});
```

### 4. Queue Management System

**Advanced background job processing** with tenant-aware queuing:

#### Queue Types
```typescript
const JOB_QUEUES = {
  // Tenant-specific queues
  TENANT_OPTIMIZE_IMAGE: (tenantId) => `tenant-${tenantId}-process-image`,
  TENANT_SEND_EMAIL: (tenantId) => `tenant-${tenantId}-send-email`,
  
  // Global platform queues
  GLOBAL_HOUSEKEEPING: 'global-housekeeping',
  GLOBAL_CLEANUP_ORPHANED: 'global-cleanup-orphaned',
  
  // Legacy support
  OPTIMIZE_IMAGE: 'process-image'
};
```

#### Job Processing Capabilities
- **Media optimization**: Image, video, document processing
- **Email delivery**: Template-based email campaigns
- **Housekeeping**: Automated cleanup and maintenance
- **Backup operations**: Scheduled data backups
- **Integration processing**: Webhook and API integrations

## Technical Implementation

### Core Components

#### 1. Namespace Manager (`namespace-manager.ts`)
```typescript
class TemporalNamespaceManager {
  // Create platform namespace with 1-year retention
  async createPlatformNamespace(): Promise<void>
  
  // Create tenant namespace with 90-day retention
  async createTenantNamespace(tenantId: number): Promise<void>
  
  // Get tenant-specific client
  async getTenantClient(tenantId: number): Promise<WorkflowClient>
}
```

#### 2. Worker Manager (`worker-manager.ts`)
```typescript
class TemporalWorkerManager {
  // Create and start workers for namespace
  async createWorker(namespace: string, taskQueue: string): Promise<Worker>
  
  // Health monitoring and management
  async getWorkerHealth(): Promise<WorkerHealthStatus[]>
  
  // Graceful shutdown procedures
  async shutdown(): Promise<void>
}
```

#### 3. ReactFlow Bridge (`reactflow-bridge.ts`)
```typescript
class ReactFlowTemporalBridge {
  // Convert ReactFlow nodes to Temporal workflow steps
  convertFlowToWorkflow(definition: ReactFlowDefinition): WorkflowStep[]
  
  // Execute visual workflow via Temporal
  async executeReactFlowWorkflow(definition: ReactFlowDefinition): Promise<WorkflowHandle>
}
```

### Workflow Implementations

#### 1. Dynamic ReactFlow Workflow (`dynamic-workflow.ts`)
```typescript
export async function reactFlowDynamicWorkflow(input: DynamicWorkflowInput): Promise<any> {
  const { steps, tenantId, input: workflowInput } = input;
  
  // Execute steps sequentially with variable propagation
  for (const step of steps) {
    const result = await executeWorkflowStep(step, stepInput);
    variables = { ...variables, ...result.result };
  }
  
  return { success: true, results: stepResults };
}
```

#### 2. LLM Execution Workflow (`llm-execution.ts`)
```typescript
export async function llmExecutionWorkflow(input: LLMExecutionInput): Promise<LLMExecutionResult> {
  // Validate configuration and check limits
  await activities.validateConfig(input);
  
  // Process template with variables
  const processedPrompt = await activities.processTemplate(input);
  
  // Execute LLM request with retry logic
  const result = await activities.executePrompt(processedPrompt);
  
  // Track usage and costs
  await activities.logUsage(result.usage);
  
  return result;
}
```

### Activity Implementations

#### Workflow Activities (`workflow-activities.ts`)
- `initializeWorkflow`: Workflow setup and validation
- `requestApproval`: Human approval process initiation
- `sendEmail`: Email delivery via configured providers
- `callWebhook`: External API integration calls
- `updateDatabase`: Tenant-isolated database operations
- `evaluateCondition`: Decision logic evaluation
- `executeBackup`: Automated backup operations

#### LLM Activities (`llm-activities.ts`)
- `validateConfig`: LLM provider configuration validation
- `processTemplate`: Prompt template processing and variable substitution
- `executePrompt`: LLM API calls with error handling
- `logUsage`: Usage statistics and cost tracking

## Configuration and Setup

### Environment Variables
```bash
# Temporal connection
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default

# Multi-tenant configuration
TEMPORAL_PLATFORM_NAMESPACE=mono-platform
TEMPORAL_TENANT_NAMESPACE_PREFIX=mono-tenant-

# LLM Provider APIs
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=ant-...
MISTRAL_API_KEY=ms-...
```

### Docker Configuration
```yaml
# docker-compose.services.yml
temporal:
  image: temporalio/auto-setup:1.22.4
  ports:
    - "7233:7233"
  environment:
    - DB=postgresql
    - POSTGRES_SEEDS=host.docker.internal
    
temporal-ui:
  image: temporalio/ui:2.21.3
  ports:
    - "8080:8080"
  environment:
    - TEMPORAL_ADDRESS=temporal:7233
```

### Service Dependencies
```json
{
  "@temporalio/activity": "^1.11.8",
  "@temporalio/client": "^1.11.8",
  "@temporalio/worker": "^1.11.8",
  "@temporalio/workflow": "^1.11.8"
}
```

## API Endpoints

### Workflow Management
- `GET /api/v1/workflows` - List workflows with filtering
- `POST /api/v1/workflows` - Create new workflow
- `POST /api/v1/workflows/:id/execute` - Execute workflow
- `GET /api/v1/workflows/:id/executions` - Get execution history

### LLM Integration
- `POST /api/v1/llm/execute` - Execute LLM requests
- `GET /api/v1/llm/providers` - List available providers
- `GET /api/v1/llm/analytics` - Usage analytics and costs

### Webhook Processing
- `POST /api/v1/webhooks/integration/:slug` - Receive webhooks
- `GET /api/v1/webhooks/logs` - Webhook execution history

## Monitoring and Observability

### Temporal Web UI
Access the Temporal Web UI at `http://localhost:8080` for:
- **Workflow execution monitoring** with real-time status
- **Task queue management** and worker health
- **Execution history** and audit trails
- **Performance metrics** and bottleneck identification

### Prometheus Integration
Temporal metrics are exposed for Prometheus scraping:
- Workflow execution rates and durations
- Task queue depths and processing times
- Worker health and resource utilization
- Error rates and retry statistics

### Custom Dashboards
Grafana dashboards provide:
- Multi-tenant execution analytics
- LLM usage and cost tracking
- Visual workflow performance metrics
- Alert configuration for failures

## Use Cases and Examples

### 1. Customer Onboarding Workflow
```
┌─────────┐   ┌─────────────┐   ┌─────────────┐   ┌──────────┐
│  Start  │──▶│   Approval  │──▶│ Send Email  │──▶│   End    │
│ Manual  │   │   Manager   │   │  Welcome    │   │Complete  │
└─────────┘   └─────────────┘   └─────────────┘   └──────────┘
```

### 2. Document Processing Pipeline
```
┌─────────┐   ┌─────────────┐   ┌─────────────┐   ┌──────────┐
│  Start  │──▶│  AI Extract │──▶│  Database   │──▶│   End    │
│Document │   │    Text     │   │   Update    │   │Processed │
└─────────┘   └─────────────┘   └─────────────┘   └──────────┘
```

### 3. Multi-Step Approval Process
```
┌─────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌──────────┐
│  Start  │──▶│  Manager    │──▶│  Director   │──▶│   Finance   │──▶│   End    │
│Request  │   │  Approval   │   │  Approval   │   │   Approval  │   │Approved  │
└─────────┘   └─────────────┘   └─────────────┘   └─────────────┘   └──────────┘
```

## Performance and Scalability

### Horizontal Scaling
- **Worker scaling**: Add workers per tenant and task queue
- **Namespace isolation**: Complete tenant separation
- **Load balancing**: Distribute workflows across workers

### Resource Management
- **Configurable timeouts**: Activity and workflow timeouts
- **Retry policies**: Exponential backoff with maximum attempts
- **Rate limiting**: Tenant-specific execution limits

### Caching Strategy
- **Workflow definitions**: Cached for rapid execution
- **LLM responses**: Optional caching for repeated prompts
- **Activity results**: Temporal's built-in result caching

## Best Practices

### 1. Workflow Design
- **Keep workflows deterministic** - avoid random values
- **Use activities for side effects** - database operations, API calls
- **Implement proper error handling** - retry policies and compensation
- **Design for observability** - comprehensive logging and metrics

### 2. Multi-Tenant Considerations
- **Always use tenant namespaces** for isolation
- **Validate tenant access** in all activities
- **Implement tenant-specific rate limiting**
- **Monitor per-tenant resource usage**

### 3. Security
- **Encrypt sensitive workflow data**
- **Validate all external inputs**
- **Implement proper authentication** for API endpoints
- **Audit all workflow executions**

## Troubleshooting

### Common Issues

1. **Workflow Execution Failures**
   - Check Temporal Web UI for detailed error logs
   - Verify worker health and connectivity
   - Review activity timeout configurations

2. **LLM Provider Errors**
   - Validate API keys and quotas
   - Check rate limiting configuration
   - Monitor usage analytics for patterns

3. **Performance Issues**
   - Scale workers based on queue depth
   - Optimize activity execution times
   - Review Prometheus metrics for bottlenecks

### Debug Mode
```bash
# Enable debug logging
export TEMPORAL_LOG_LEVEL=debug
export LLM_DEBUG=true

# Access logs
docker logs mono-temporal-1
```

## Future Enhancements

### Planned Features
1. **Advanced scheduling** with cron expressions
2. **Workflow templates marketplace** 
3. **Real-time collaboration** on workflow design
4. **Advanced AI agents** with tool usage
5. **Cross-tenant workflow orchestration**

### Integration Roadmap
1. **Slack/Teams integration** for approvals
2. **GitHub Actions integration** for CI/CD workflows
3. **Stripe webhook processing** for payment flows
4. **Advanced analytics** with machine learning insights

## Conclusion

itellico Mono's Temporal integration provides enterprise-grade workflow orchestration with unique features like visual workflow design, multi-tenant isolation, and AI integration. This foundation enables sophisticated business process automation while maintaining scalability, reliability, and observability.

The combination of ReactFlow visual editing and Temporal's robust execution engine creates a powerful platform for building complex, reliable workflows at scale.