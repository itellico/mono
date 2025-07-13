import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface DockerService {
  name: string;
  status: 'running' | 'stopped' | 'error' | 'unknown';
  uptime: string;
  ports: string;
  health: 'healthy' | 'unhealthy' | 'starting' | 'unknown';
  cpuUsage?: number;
  memoryUsage?: number;
}

export interface DockerStats {
  totalContainers: number;
  runningContainers: number;
  services: DockerService[];
  healthySystems: number;
  criticalIssues: string[];
}

/**
 * itellico Mono Docker Service Monitor
 * Monitors all Docker services for the itellico Mono
 */
export class DockerMonitor {
  private expectedServices = [
    'mono-postgres',
    'mono-redis', 
    'mono-mailpit',
    'mono-n8n',
    'mono-temporal',
    'mono-temporal-web',
    'mono-grafana',
    'mono-prometheus',
    'mono-redis-insight'
  ];

  /**
   * Get comprehensive Docker service status
   */
  async getDockerStats(): Promise<DockerStats> {
    try {
      const [containers, serviceStatuses] = await Promise.all([
        this.getContainerStats(),
        this.getServiceStatuses()
      ]);

      const runningContainers = serviceStatuses.filter(s => s.status === 'running').length;
      const healthySystems = serviceStatuses.filter(s => s.health === 'healthy').length;
      const criticalIssues = this.identifyCriticalIssues(serviceStatuses);

      return {
        totalContainers: containers.total,
        runningContainers,
        services: serviceStatuses,
        healthySystems,
        criticalIssues
      };
    } catch (error) {
      return this.getEmptyStats();
    }
  }

  /**
   * Get basic container statistics
   */
  private async getContainerStats(): Promise<{ total: number; running: number }> {
    try {
      const { stdout } = await execAsync('docker ps -a --format "{{.Status}}"');
      const statuses = stdout.trim().split('\n').filter(s => s);
      
      const running = statuses.filter(status => 
        status.toLowerCase().includes('up') || 
        status.toLowerCase().includes('running')
      ).length;

      return { total: statuses.length, running };
    } catch (error) {
      return { total: 0, running: 0 };
    }
  }

  /**
   * Get detailed service statuses for itellico Mono services
   */
  private async getServiceStatuses(): Promise<DockerService[]> {
    const services: DockerService[] = [];

    for (const serviceName of this.expectedServices) {
      try {
        const service = await this.getServiceStatus(serviceName);
        services.push(service);
      } catch (error) {
        services.push({
          name: serviceName,
          status: 'unknown',
          uptime: 'N/A',
          ports: 'N/A',
          health: 'unknown'
        });
      }
    }

    return services;
  }

  /**
   * Get status for a specific service
   */
  private async getServiceStatus(serviceName: string): Promise<DockerService> {
    try {
      // Get container info
      const { stdout } = await execAsync(
        `docker ps -a --filter "name=${serviceName}" --format "{{.Status}}|{{.Ports}}"`
      );

      if (!stdout.trim()) {
        return {
          name: serviceName,
          status: 'stopped',
          uptime: 'Not running',
          ports: 'N/A',
          health: 'unhealthy'
        };
      }

      const [status, ports] = stdout.trim().split('|');
      const isRunning = status.toLowerCase().includes('up');
      
      // Extract uptime from status
      const uptimeMatch = status.match(/Up ([^,]+)/i);
      const uptime = uptimeMatch ? uptimeMatch[1] : 'Unknown';

      // Get health status
      const health = await this.getServiceHealth(serviceName, isRunning);

      // Get resource usage for running containers
      let cpuUsage: number | undefined;
      let memoryUsage: number | undefined;

      if (isRunning) {
        const resources = await this.getServiceResources(serviceName);
        cpuUsage = resources.cpu;
        memoryUsage = resources.memory;
      }

      return {
        name: serviceName,
        status: isRunning ? 'running' : 'stopped',
        uptime,
        ports: ports || 'N/A',
        health,
        cpuUsage,
        memoryUsage
      };
    } catch (error) {
      return {
        name: serviceName,
        status: 'error',
        uptime: 'Error',
        ports: 'N/A',
        health: 'unknown'
      };
    }
  }

  /**
   * Get health status for a service
   */
  private async getServiceHealth(serviceName: string, isRunning: boolean): Promise<DockerService['health']> {
    if (!isRunning) {
      return 'unhealthy';
    }

    try {
      // Check if container has health check
      const { stdout } = await execAsync(
        `docker inspect ${serviceName} --format "{{.State.Health.Status}}"`
      );

      const healthStatus = stdout.trim().toLowerCase();
      
      if (healthStatus === 'healthy') return 'healthy';
      if (healthStatus === 'unhealthy') return 'unhealthy';
      if (healthStatus === 'starting') return 'starting';
      
      // If no health check defined, assume healthy if running
      return 'healthy';
    } catch (error) {
      // If health check fails or not defined, consider healthy if running
      return 'healthy';
    }
  }

  /**
   * Get resource usage for a service
   */
  private async getServiceResources(serviceName: string): Promise<{ cpu: number; memory: number }> {
    try {
      const { stdout } = await execAsync(
        `docker stats ${serviceName} --no-stream --format "{{.CPUPerc}}|{{.MemPerc}}"`
      );

      const [cpuStr, memStr] = stdout.trim().split('|');
      
      const cpu = parseFloat(cpuStr.replace('%', '')) || 0;
      const memory = parseFloat(memStr.replace('%', '')) || 0;

      return { cpu, memory };
    } catch (error) {
      return { cpu: 0, memory: 0 };
    }
  }

  /**
   * Identify critical issues with services
   */
  private identifyCriticalIssues(services: DockerService[]): string[] {
    const issues: string[] = [];

    // Check for stopped critical services
    const criticalServices = ['mono-postgres', 'mono-redis'];
    const stoppedCritical = services.filter(s => 
      criticalServices.includes(s.name) && s.status !== 'running'
    );

    stoppedCritical.forEach(service => {
      issues.push(`Critical service ${service.name} is not running`);
    });

    // Check for unhealthy services
    const unhealthyServices = services.filter(s => s.health === 'unhealthy');
    unhealthyServices.forEach(service => {
      issues.push(`Service ${service.name} is unhealthy`);
    });

    // Check for high resource usage
    const highResourceServices = services.filter(s => 
      (s.cpuUsage && s.cpuUsage > 80) || (s.memoryUsage && s.memoryUsage > 90)
    );
    
    highResourceServices.forEach(service => {
      if (service.cpuUsage && service.cpuUsage > 80) {
        issues.push(`Service ${service.name} has high CPU usage: ${service.cpuUsage.toFixed(1)}%`);
      }
      if (service.memoryUsage && service.memoryUsage > 90) {
        issues.push(`Service ${service.name} has high memory usage: ${service.memoryUsage.toFixed(1)}%`);
      }
    });

    return issues;
  }

  /**
   * Get empty stats for error cases
   */
  private getEmptyStats(): DockerStats {
    return {
      totalContainers: 0,
      runningContainers: 0,
      services: this.expectedServices.map(name => ({
        name,
        status: 'unknown',
        uptime: 'N/A',
        ports: 'N/A',
        health: 'unknown'
      })),
      healthySystems: 0,
      criticalIssues: ['Docker monitoring unavailable']
    };
  }

  /**
   * Quick health check for all services
   */
  async getQuickHealthCheck(): Promise<{
    allHealthy: boolean;
    runningCount: number;
    totalCount: number;
    issues: string[];
  }> {
    const stats = await this.getDockerStats();
    
    return {
      allHealthy: stats.criticalIssues.length === 0,
      runningCount: stats.runningContainers,
      totalCount: stats.totalContainers,
      issues: stats.criticalIssues
    };
  }
}

// Export singleton instance
export const dockerMonitor = new DockerMonitor();