import { Client, Connection } from '@temporalio/client';
import { DocumentationWorkflowInput, DocumentationWorkflowResult } from '../temporal/workflows/documentation-processing.workflow';
import { Config } from '../config';
import { v4 as uuidv4 } from 'uuid';

/**
 * Temporal Client Service
 * Manages workflow execution and monitoring
 */
export class TemporalClientService {
  private static instance: TemporalClientService;
  private client: Client | null = null;
  private connection: Connection | null = null;

  private constructor() {}

  public static getInstance(): TemporalClientService {
    if (!TemporalClientService.instance) {
      TemporalClientService.instance = new TemporalClientService();
    }
    return TemporalClientService.instance;
  }

  /**
   * Initialize Temporal client
   */
  public async initialize(): Promise<void> {
    if (this.client) return;

    try {
      this.connection = await Connection.connect({
        address: Config.TEMPORAL_ADDRESS || 'localhost:7233',
      });

      this.client = new Client({
        connection: this.connection,
        namespace: 'default',
      });

      console.log('✅ Temporal client initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Temporal client:', error);
      throw error;
    }
  }

  /**
   * Start documentation processing workflow
   */
  public async startDocumentationWorkflow(
    input: DocumentationWorkflowInput,
    workflowId?: string
  ): Promise<{
    workflowId: string;
    runId: string;
  }> {
    if (!this.client) {
      await this.initialize();
    }

    const id = workflowId || `doc-processing-${uuidv4()}`;

    try {
      const handle = await this.client!.workflow.start('DocumentationProcessingWorkflow', {
        taskQueue: 'documentation-queue',
        workflowId: id,
        args: [input],
        workflowIdReusePolicy: 'REJECT_DUPLICATE',
        workflowExecutionTimeout: '24 hours',
      });

      return {
        workflowId: handle.workflowId,
        runId: handle.firstExecutionRunId,
      };
    } catch (error) {
      console.error('Failed to start documentation workflow:', error);
      throw error;
    }
  }

  /**
   * Start documentation approval workflow
   */
  public async startApprovalWorkflow(
    proposal: {
      id: string;
      changes: any[];
      proposedBy: string;
      metadata: Record<string, any>;
    }
  ): Promise<{
    workflowId: string;
    runId: string;
  }> {
    if (!this.client) {
      await this.initialize();
    }

    const workflowId = `doc-approval-${proposal.id}`;

    try {
      const handle = await this.client!.workflow.start('DocumentationApprovalWorkflow', {
        taskQueue: 'documentation-queue',
        workflowId,
        args: [proposal],
        workflowIdReusePolicy: 'ALLOW_DUPLICATE',
        workflowExecutionTimeout: '7 days',
      });

      return {
        workflowId: handle.workflowId,
        runId: handle.firstExecutionRunId,
      };
    } catch (error) {
      console.error('Failed to start approval workflow:', error);
      throw error;
    }
  }

  /**
   * Get workflow status
   */
  public async getWorkflowStatus(workflowId: string): Promise<{
    status: string;
    result?: any;
    error?: string;
  }> {
    if (!this.client) {
      await this.initialize();
    }

    try {
      const handle = this.client!.workflow.getHandle(workflowId);
      const description = await handle.describe();
      
      let result = undefined;
      let error = undefined;

      if (description.status.name === 'COMPLETED') {
        try {
          result = await handle.result();
        } catch (err) {
          error = err.message;
        }
      } else if (description.status.name === 'FAILED') {
        error = 'Workflow failed';
      }

      return {
        status: description.status.name,
        result,
        error,
      };
    } catch (error) {
      console.error('Failed to get workflow status:', error);
      throw error;
    }
  }

  /**
   * Cancel a workflow
   */
  public async cancelWorkflow(workflowId: string): Promise<void> {
    if (!this.client) {
      await this.initialize();
    }

    try {
      const handle = this.client!.workflow.getHandle(workflowId);
      await handle.cancel();
    } catch (error) {
      console.error('Failed to cancel workflow:', error);
      throw error;
    }
  }

  /**
   * Signal a workflow (pause/resume)
   */
  public async signalWorkflow(
    workflowId: string,
    signal: 'pause' | 'resume' | 'cancel'
  ): Promise<void> {
    if (!this.client) {
      await this.initialize();
    }

    try {
      const handle = this.client!.workflow.getHandle(workflowId);
      await handle.signal(signal);
    } catch (error) {
      console.error('Failed to signal workflow:', error);
      throw error;
    }
  }

  /**
   * Query workflow state
   */
  public async queryWorkflow(
    workflowId: string,
    queryType: string,
    args?: any[]
  ): Promise<any> {
    if (!this.client) {
      await this.initialize();
    }

    try {
      const handle = this.client!.workflow.getHandle(workflowId);
      return await handle.query(queryType, ...(args || []));
    } catch (error) {
      console.error('Failed to query workflow:', error);
      throw error;
    }
  }

  /**
   * List running workflows
   */
  public async listWorkflows(options?: {
    query?: string;
    pageSize?: number;
  }): Promise<Array<{
    workflowId: string;
    runId: string;
    type: string;
    status: string;
    startTime: Date;
  }>> {
    if (!this.client) {
      await this.initialize();
    }

    const workflows: Array<{
      workflowId: string;
      runId: string;
      type: string;
      status: string;
      startTime: Date;
    }> = [];

    try {
      const query = options?.query || 'WorkflowType="DocumentationProcessingWorkflow"';
      const iterator = this.client!.workflow.list({
        query,
        pageSize: options?.pageSize || 100,
      });

      for await (const workflow of iterator) {
        workflows.push({
          workflowId: workflow.workflowId,
          runId: workflow.runId,
          type: workflow.type,
          status: workflow.status.name,
          startTime: workflow.startTime,
        });
      }

      return workflows;
    } catch (error) {
      console.error('Failed to list workflows:', error);
      throw error;
    }
  }

  /**
   * Close the client connection
   */
  public async close(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
      this.client = null;
    }
  }
}

// Export singleton instance
export const temporalClient = TemporalClientService.getInstance();