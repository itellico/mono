<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Platform Operations - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'operations/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Operations']
        ]);
        
        echo createHeroSection(
            "Platform Operations",
            "Monitor and manage platform-wide operations, maintenance, and system health",
            "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=300&fit=crop",
            [
                ['label' => 'System Health Check', 'icon' => 'fas fa-heartbeat', 'style' => 'primary'],
                ['label' => 'Maintenance Mode', 'icon' => 'fas fa-tools', 'style' => 'warning'],
                ['label' => 'Performance Report', 'icon' => 'fas fa-chart-line', 'style' => 'info']
            ]
        );
        ?>
        
        <!-- Operations Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('System Uptime', '99.8%', 'fas fa-server', 'success');
            echo createStatCard('Active Tenants', '12', 'fas fa-building', 'primary');
            echo createStatCard('Background Jobs', '234', 'fas fa-cogs', 'info');
            echo createStatCard('Error Rate', '0.02%', 'fas fa-exclamation-triangle', 'warning');
            ?>
        </div>
        
        <div class="row mb-4">
            <!-- System Status -->
            <div class="col-md-8">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">System Status Overview</h5>
                        <span class="badge bg-success">All Systems Operational</span>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6 class="fw-bold mb-3">Core Services</h6>
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div class="d-flex align-items-center">
                                            <i class="fas fa-server text-success me-2"></i>
                                            <span>API Server</span>
                                        </div>
                                        <span class="badge bg-success">Healthy</span>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div class="d-flex align-items-center">
                                            <i class="fas fa-database text-success me-2"></i>
                                            <span>Database</span>
                                        </div>
                                        <span class="badge bg-success">Healthy</span>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div class="d-flex align-items-center">
                                            <i class="fas fa-memory text-success me-2"></i>
                                            <span>Redis Cache</span>
                                        </div>
                                        <span class="badge bg-success">Healthy</span>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div class="d-flex align-items-center">
                                            <i class="fas fa-envelope text-success me-2"></i>
                                            <span>Email Service</span>
                                        </div>
                                        <span class="badge bg-success">Healthy</span>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <h6 class="fw-bold mb-3">External Services</h6>
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div class="d-flex align-items-center">
                                            <i class="fas fa-credit-card text-success me-2"></i>
                                            <span>Payment Gateway</span>
                                        </div>
                                        <span class="badge bg-success">Healthy</span>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div class="d-flex align-items-center">
                                            <i class="fas fa-cloud text-success me-2"></i>
                                            <span>File Storage</span>
                                        </div>
                                        <span class="badge bg-success">Healthy</span>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div class="d-flex align-items-center">
                                            <i class="fas fa-project-diagram text-warning me-2"></i>
                                            <span>N8N Workflows</span>
                                        </div>
                                        <span class="badge bg-warning">Degraded</span>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div class="d-flex align-items-center">
                                            <i class="fas fa-chart-bar text-success me-2"></i>
                                            <span>Analytics</span>
                                        </div>
                                        <span class="badge bg-success">Healthy</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <hr>
                        
                        <h6 class="fw-bold mb-3">Performance Metrics</h6>
                        <div class="row">
                            <div class="col-md-3">
                                <div class="text-center">
                                    <div class="h4 text-success">125ms</div>
                                    <small class="text-muted">Avg Response Time</small>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="text-center">
                                    <div class="h4 text-primary">1,245</div>
                                    <small class="text-muted">Requests/min</small>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="text-center">
                                    <div class="h4 text-info">67%</div>
                                    <small class="text-muted">CPU Usage</small>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="text-center">
                                    <div class="h4 text-warning">82%</div>
                                    <small class="text-muted">Memory Usage</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Operations Actions -->
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Operations Actions</h5>
                    </div>
                    <div class="card-body">
                        <div class="d-grid gap-2 mb-3">
                            <button class="btn btn-danger" onclick="enableMaintenanceMode()">
                                <i class="fas fa-tools me-2"></i> Enable Maintenance Mode
                            </button>
                            <button class="btn btn-warning" onclick="restartServices()">
                                <i class="fas fa-sync me-2"></i> Restart Services
                            </button>
                            <button class="btn btn-info" onclick="clearCaches()">
                                <i class="fas fa-broom me-2"></i> Clear All Caches
                            </button>
                            <button class="btn btn-secondary" onclick="databaseMaintenance()">
                                <i class="fas fa-database me-2"></i> Database Maintenance
                            </button>
                        </div>
                        
                        <hr>
                        
                        <h6>Emergency Actions</h6>
                        <div class="d-grid gap-2">
                            <button class="btn btn-outline-danger btn-sm" onclick="emergencyShutdown()">
                                <i class="fas fa-power-off me-2"></i> Emergency Shutdown
                            </button>
                            <button class="btn btn-outline-warning btn-sm" onclick="rollbackDeployment()">
                                <i class="fas fa-undo me-2"></i> Rollback Deployment
                            </button>
                            <button class="btn btn-outline-info btn-sm" onclick="scalingActions()">
                                <i class="fas fa-expand-arrows-alt me-2"></i> Auto-Scale Resources
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="card mt-3">
                    <div class="card-header">
                        <h5 class="mb-0">Background Jobs</h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <small>Email Queue</small>
                                <small class="fw-bold">45 pending</small>
                            </div>
                            <div class="progress mt-1" style="height: 4px;">
                                <div class="progress-bar bg-primary" style="width: 25%"></div>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <small>Image Processing</small>
                                <small class="fw-bold">12 active</small>
                            </div>
                            <div class="progress mt-1" style="height: 4px;">
                                <div class="progress-bar bg-success" style="width: 75%"></div>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <small>Data Sync</small>
                                <small class="fw-bold">3 running</small>
                            </div>
                            <div class="progress mt-1" style="height: 4px;">
                                <div class="progress-bar bg-info" style="width: 60%"></div>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <small>Analytics Processing</small>
                                <small class="fw-bold">89 queued</small>
                            </div>
                            <div class="progress mt-1" style="height: 4px;">
                                <div class="progress-bar bg-warning" style="width: 40%"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card mt-3">
                    <div class="card-header">
                        <h5 class="mb-0">Recent Operations</h5>
                    </div>
                    <div class="card-body">
                        <div class="timeline">
                            <div class="d-flex mb-3">
                                <div class="bg-success rounded-circle me-3" style="width: 8px; height: 8px; margin-top: 6px;"></div>
                                <div class="flex-grow-1">
                                    <small class="fw-bold">System Health Check</small><br>
                                    <small class="text-muted">All systems operational</small><br>
                                    <small class="text-muted">15 minutes ago</small>
                                </div>
                            </div>
                            <div class="d-flex mb-3">
                                <div class="bg-info rounded-circle me-3" style="width: 8px; height: 8px; margin-top: 6px;"></div>
                                <div class="flex-grow-1">
                                    <small class="fw-bold">Cache Cleared</small><br>
                                    <small class="text-muted">Redis cache flushed</small><br>
                                    <small class="text-muted">2 hours ago</small>
                                </div>
                            </div>
                            <div class="d-flex mb-3">
                                <div class="bg-warning rounded-circle me-3" style="width: 8px; height: 8px; margin-top: 6px;"></div>
                                <div class="flex-grow-1">
                                    <small class="fw-bold">N8N Service Restart</small><br>
                                    <small class="text-muted">Workflow service restarted</small><br>
                                    <small class="text-muted">6 hours ago</small>
                                </div>
                            </div>
                            <div class="d-flex mb-3">
                                <div class="bg-primary rounded-circle me-3" style="width: 8px; height: 8px; margin-top: 6px;"></div>
                                <div class="flex-grow-1">
                                    <small class="fw-bold">Database Backup</small><br>
                                    <small class="text-muted">Daily backup completed</small><br>
                                    <small class="text-muted">1 day ago</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Operations Log -->
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Operations Log</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Operation</th>
                                <th>User</th>
                                <th>Status</th>
                                <th>Duration</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>2024-01-15 14:32:15</td>
                                <td>System Health Check</td>
                                <td>System</td>
                                <td><span class="badge bg-success">Success</span></td>
                                <td>2.3s</td>
                                <td>All services operational</td>
                            </tr>
                            <tr>
                                <td>2024-01-15 12:15:42</td>
                                <td>Cache Clear</td>
                                <td>Admin User</td>
                                <td><span class="badge bg-success">Success</span></td>
                                <td>1.1s</td>
                                <td>Redis cache flushed (2.3GB freed)</td>
                            </tr>
                            <tr>
                                <td>2024-01-15 08:45:12</td>
                                <td>N8N Service Restart</td>
                                <td>Admin User</td>
                                <td><span class="badge bg-warning">Warning</span></td>
                                <td>45.2s</td>
                                <td>Service restarted due to memory leak</td>
                            </tr>
                            <tr>
                                <td>2024-01-15 03:00:00</td>
                                <td>Database Backup</td>
                                <td>System</td>
                                <td><span class="badge bg-success">Success</span></td>
                                <td>12m 34s</td>
                                <td>Daily backup completed (5.7GB)</td>
                            </tr>
                            <tr>
                                <td>2024-01-14 16:23:55</td>
                                <td>Deployment</td>
                                <td>CI/CD Pipeline</td>
                                <td><span class="badge bg-success">Success</span></td>
                                <td>3m 12s</td>
                                <td>Version 2.1.0 deployed successfully</td>
                            </tr>
                            <tr>
                                <td>2024-01-14 14:12:33</td>
                                <td>Maintenance Mode</td>
                                <td>Admin User</td>
                                <td><span class="badge bg-info">Info</span></td>
                                <td>15m 23s</td>
                                <td>Planned maintenance window</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
function enableMaintenanceMode() {
    if (confirm('Enable Maintenance Mode?\n\nThis will temporarily disable access for all users except platform administrators. Continue?')) {
        alert('Maintenance Mode Enabled\n\n- All user access disabled\n- Maintenance page displayed\n- Only platform admins can access\n- Background jobs paused');
    }
}

function restartServices() {
    if (confirm('Restart Platform Services?\n\nThis will cause a brief service interruption. Continue?')) {
        alert('Services Restart Initiated\n\n- API server restarting\n- Background jobs paused\n- Services will be back online in ~30 seconds\n- Users will see temporary maintenance message');
    }
}

function clearCaches() {
    if (confirm('Clear All Caches?\n\nThis may temporarily slow down response times. Continue?')) {
        alert('Cache Clear Completed\n\n- Redis cache cleared\n- Application cache cleared\n- CDN cache invalidated\n- Performance will normalize in 5-10 minutes');
    }
}

function databaseMaintenance() {
    if (confirm('Run Database Maintenance?\n\nThis will optimize tables and rebuild indexes. Continue?')) {
        alert('Database Maintenance Started\n\n- Table optimization in progress\n- Index rebuilding\n- Query performance analysis\n- Estimated completion: 15 minutes');
    }
}

function emergencyShutdown() {
    if (confirm('EMERGENCY SHUTDOWN?\n\nThis will immediately shut down all services. This action should only be used in critical situations. Continue?')) {
        alert('Emergency Shutdown Initiated\n\n⚠️ ALL SERVICES SHUTTING DOWN\n- Immediate service termination\n- All user sessions terminated\n- Background jobs stopped\n- Manual restart required');
    }
}

function rollbackDeployment() {
    if (confirm('Rollback to Previous Deployment?\n\nThis will revert to the last stable version. Continue?')) {
        alert('Deployment Rollback Initiated\n\n- Rolling back to version 2.0.8\n- Code reverting to previous state\n- Database migrations rolling back\n- Estimated completion: 5 minutes');
    }
}

function scalingActions() {
    alert('Auto-Scaling Analysis\n\nCurrent Resource Usage:\n- CPU: 67% (within normal range)\n- Memory: 82% (approaching limit)\n- Disk I/O: 34% (normal)\n\nRecommendation:\n- Consider adding memory to reduce cache pressure\n- Current auto-scaling rules are adequate');
}
</script>

<?php echo renderFooter(); ?>