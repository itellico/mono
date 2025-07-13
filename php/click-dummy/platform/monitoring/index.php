<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("System Monitoring - Platform Admin", "Super Admin", "Platform Administrator", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'monitoring/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'System Monitoring']
        ]);
        
        echo createHeroSection(
            "System Monitoring",
            "Real-time platform health monitoring, performance metrics, and infrastructure oversight",
            "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=300&fit=crop",
            [
                ['label' => 'View Alerts', 'icon' => 'fas fa-exclamation-triangle', 'style' => 'warning'],
                ['label' => 'Generate Report', 'icon' => 'fas fa-file-alt', 'style' => 'info'],
                ['label' => 'System Status', 'icon' => 'fas fa-heartbeat', 'style' => 'success']
            ]
        );
        ?>
        
        <!-- System Health Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('System Uptime', '99.9%', 'fas fa-server', 'success');
            echo createStatCard('Active Tenants', '1,847', 'fas fa-building', 'primary');
            echo createStatCard('Response Time', '89ms', 'fas fa-clock', 'info');
            echo createStatCard('Error Rate', '0.02%', 'fas fa-exclamation-circle', 'warning');
            ?>
        </div>
        
        <!-- Real-time Metrics -->
        <div class="row mb-4">
            <div class="col-lg-8">
                <?php echo createCard(
                    "Real-time Performance Metrics",
                    '
                    <div class="mb-3">
                        <div class="btn-group btn-group-sm" role="group">
                            <button type="button" class="btn btn-outline-primary active">CPU Usage</button>
                            <button type="button" class="btn btn-outline-primary">Memory</button>
                            <button type="button" class="btn btn-outline-primary">Network</button>
                            <button type="button" class="btn btn-outline-primary">Database</button>
                        </div>
                    </div>
                    <div style="height: 300px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                        <div class="text-center">
                            <i class="fas fa-chart-area fa-3x text-muted mb-3"></i>
                            <h5 class="text-muted">Real-time Metrics Chart</h5>
                            <p class="text-muted">Current CPU: 23% • Memory: 67% • Network: 12MB/s</p>
                            <div class="mt-3">
                                <span class="badge bg-success me-2">Normal Load</span>
                                <span class="badge bg-info">All Systems Operational</span>
                            </div>
                        </div>
                    </div>
                    '
                ); ?>
            </div>
            <div class="col-lg-4">
                <?php echo createCard(
                    "System Status",
                    '
                    <div class="mb-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <strong>API Gateway</strong><br>
                                <small class="text-muted">Response time: 45ms</small>
                            </div>
                            <span class="badge bg-success">Healthy</span>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <strong>Database Cluster</strong><br>
                                <small class="text-muted">Query time: 12ms</small>
                            </div>
                            <span class="badge bg-success">Healthy</span>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <strong>Redis Cache</strong><br>
                                <small class="text-muted">Hit rate: 94%</small>
                            </div>
                            <span class="badge bg-success">Healthy</span>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <strong>File Storage</strong><br>
                                <small class="text-muted">Usage: 67%</small>
                            </div>
                            <span class="badge bg-warning text-dark">Monitor</span>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <strong>Email Service</strong><br>
                                <small class="text-muted">Queue: 23 pending</small>
                            </div>
                            <span class="badge bg-success">Healthy</span>
                        </div>
                    </div>
                    <hr>
                    <div class="text-center">
                        <span class="badge bg-success">All Systems Operational</span>
                    </div>
                    '
                ); ?>
            </div>
        </div>
        
        <!-- Infrastructure Overview -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Infrastructure Overview</h5>
                    </div>
                    <div class="card-body">
                        <div class="row g-4">
                            <!-- Web Servers -->
                            <div class="col-md-6 col-lg-3">
                                <div class="text-center">
                                    <i class="fas fa-server fa-2x text-primary mb-3"></i>
                                    <h6>Web Servers</h6>
                                    <div class="mb-2">
                                        <strong>8</strong> active nodes<br>
                                        <small class="text-muted">Load balanced</small>
                                    </div>
                                    <div class="progress mb-2" style="height: 6px;">
                                        <div class="progress-bar bg-primary" style="width: 23%"></div>
                                    </div>
                                    <small class="text-muted">23% CPU usage</small>
                                </div>
                            </div>
                            
                            <!-- Database -->
                            <div class="col-md-6 col-lg-3">
                                <div class="text-center">
                                    <i class="fas fa-database fa-2x text-success mb-3"></i>
                                    <h6>Database</h6>
                                    <div class="mb-2">
                                        <strong>3</strong> replicas<br>
                                        <small class="text-muted">PostgreSQL cluster</small>
                                    </div>
                                    <div class="progress mb-2" style="height: 6px;">
                                        <div class="progress-bar bg-success" style="width: 45%"></div>
                                    </div>
                                    <small class="text-muted">45% connections used</small>
                                </div>
                            </div>
                            
                            <!-- Cache -->
                            <div class="col-md-6 col-lg-3">
                                <div class="text-center">
                                    <i class="fas fa-memory fa-2x text-info mb-3"></i>
                                    <h6>Cache Layer</h6>
                                    <div class="mb-2">
                                        <strong>6</strong> Redis nodes<br>
                                        <small class="text-muted">Distributed cache</small>
                                    </div>
                                    <div class="progress mb-2" style="height: 6px;">
                                        <div class="progress-bar bg-info" style="width: 67%"></div>
                                    </div>
                                    <small class="text-muted">67% memory used</small>
                                </div>
                            </div>
                            
                            <!-- Storage -->
                            <div class="col-md-6 col-lg-3">
                                <div class="text-center">
                                    <i class="fas fa-hdd fa-2x text-warning mb-3"></i>
                                    <h6>File Storage</h6>
                                    <div class="mb-2">
                                        <strong>2.4TB</strong> used<br>
                                        <small class="text-muted">S3 distributed</small>
                                    </div>
                                    <div class="progress mb-2" style="height: 6px;">
                                        <div class="progress-bar bg-warning" style="width: 67%"></div>
                                    </div>
                                    <small class="text-muted">67% capacity used</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Recent Alerts and Logs -->
        <div class="row">
            <div class="col-lg-6">
                <?php
                $alertHeaders = ['Time', 'Service', 'Alert Type', 'Status'];
                $alertRows = [
                    ['14:23', 'File Storage', '<span class="badge bg-warning text-dark">High Usage</span>', '<span class="badge bg-success">Resolved</span>'],
                    ['13:45', 'Database', '<span class="badge bg-info">Slow Query</span>', '<span class="badge bg-success">Resolved</span>'],
                    ['12:30', 'API Gateway', '<span class="badge bg-danger">Rate Limit</span>', '<span class="badge bg-success">Resolved</span>'],
                    ['11:15', 'Cache', '<span class="badge bg-warning text-dark">Memory High</span>', '<span class="badge bg-warning text-dark">Monitoring</span>'],
                    ['09:22', 'Email Service', '<span class="badge bg-info">Queue Backup</span>', '<span class="badge bg-success">Resolved</span>']
                ];
                echo createDataTable('Recent Alerts', $alertHeaders, $alertRows, false);
                ?>
            </div>
            <div class="col-lg-6">
                <?php echo createCard(
                    "System Metrics Summary",
                    '
                    <div class="mb-3">
                        <div class="d-flex justify-content-between">
                            <span class="small">System Uptime</span>
                            <span class="fw-bold text-success">99.97%</span>
                        </div>
                        <div class="progress mb-2" style="height: 6px;">
                            <div class="progress-bar bg-success" style="width: 99%"></div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="d-flex justify-content-between">
                            <span class="small">Average Response Time</span>
                            <span class="fw-bold">89ms</span>
                        </div>
                        <div class="progress mb-2" style="height: 6px;">
                            <div class="progress-bar bg-primary" style="width: 85%"></div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="d-flex justify-content-between">
                            <span class="small">Error Rate</span>
                            <span class="fw-bold text-success">0.02%</span>
                        </div>
                        <div class="progress mb-2" style="height: 6px;">
                            <div class="progress-bar bg-success" style="width: 2%"></div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="d-flex justify-content-between">
                            <span class="small">Cache Hit Rate</span>
                            <span class="fw-bold">94%</span>
                        </div>
                        <div class="progress mb-2" style="height: 6px;">
                            <div class="progress-bar bg-info" style="width: 94%"></div>
                        </div>
                    </div>
                    <hr>
                    <div class="row text-center">
                        <div class="col-6">
                            <strong class="text-primary">2.4TB</strong><br>
                            <small class="text-muted">Data Stored</small>
                        </div>
                        <div class="col-6">
                            <strong class="text-success">1,847</strong><br>
                            <small class="text-muted">Active Tenants</small>
                        </div>
                    </div>
                    '
                ); ?>
            </div>
        </div>
    </div>
</div>

<?php echo renderFooter(); ?>