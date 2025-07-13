<?php
require_once '../includes/header.php';
require_once '../includes/sidebar.php';
require_once '../includes/components.php';
require_once '../includes/footer.php';

echo renderHeader("Platform Dashboard - itellico Mono", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => 'index.php'],
            ['label' => 'Dashboard']
        ]);
        
        echo createHeroSection(
            "Platform Administration",
            "Manage all tenants, revenue, and system-wide settings",
            "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=300&fit=crop",
            [
                ['label' => 'System Status', 'icon' => 'fas fa-heartbeat', 'style' => 'success'],
                ['label' => 'View Logs', 'icon' => 'fas fa-file-alt', 'style' => 'light']
            ]
        );
        ?>
        
        <!-- Platform Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Active Tenants', '12', 'fas fa-building', 'primary');
            echo createStatCard('Total Revenue', '$847.2K', 'fas fa-dollar-sign', 'success');
            echo createStatCard('API Requests', '2.4M', 'fas fa-plug', 'info');
            echo createStatCard('System Health', '98.7%', 'fas fa-heartbeat', 'warning');
            ?>
        </div>
        
        <!-- Quick Actions -->
        <div class="row mb-4">
            <div class="col-md-8">
                <?php echo createCard(
                    "Recent Activity",
                    '
                    <div class="timeline">
                        <div class="mb-3 d-flex align-items-center">
                            <div class="bg-success rounded-circle me-3" style="width: 8px; height: 8px;"></div>
                            <div>
                                <strong>New Tenant Registered</strong><br>
                                <small class="text-muted">Voice Talent Hub signed up for Pro plan</small><br>
                                <small class="text-muted">2 hours ago</small>
                            </div>
                        </div>
                        <div class="mb-3 d-flex align-items-center">
                            <div class="bg-warning rounded-circle me-3" style="width: 8px; height: 8px;"></div>
                            <div>
                                <strong>Revenue Milestone</strong><br>
                                <small class="text-muted">Monthly revenue exceeded $850K</small><br>
                                <small class="text-muted">6 hours ago</small>
                            </div>
                        </div>
                        <div class="mb-3 d-flex align-items-center">
                            <div class="bg-info rounded-circle me-3" style="width: 8px; height: 8px;"></div>
                            <div>
                                <strong>System Update</strong><br>
                                <small class="text-muted">Deployed v2.1.0 with enhanced security</small><br>
                                <small class="text-muted">1 day ago</small>
                            </div>
                        </div>
                    </div>
                    '
                ); ?>
            </div>
            <div class="col-md-4">
                <?php echo createCard(
                    "Quick Actions",
                    '
                    <div class="d-grid gap-2">
                        <a href="tenants/index.php" class="btn btn-outline-primary">
                            <i class="fas fa-building me-2"></i> Manage Tenants
                        </a>
                        <a href="revenue/index.php" class="btn btn-outline-success">
                            <i class="fas fa-chart-line me-2"></i> View Revenue
                        </a>
                        <a href="monitoring/index.php" class="btn btn-outline-info">
                            <i class="fas fa-heartbeat me-2"></i> System Health
                        </a>
                        <a href="support/index.php" class="btn btn-outline-warning">
                            <i class="fas fa-ticket-alt me-2"></i> Support Tickets
                        </a>
                    </div>
                    '
                ); ?>
            </div>
        </div>
        
        <!-- System Overview -->
        <div class="row mb-4">
            <div class="col-md-6">
                <?php echo createCard(
                    "System Performance",
                    '
                    <canvas id="usageChart" style="height: 300px;"></canvas>
                    '
                ); ?>
            </div>
            <div class="col-md-6">
                <?php echo createCard(
                    "Tenant Distribution",
                    '
                    <canvas id="analyticsChart" style="height: 300px;"></canvas>
                    '
                ); ?>
            </div>
        </div>
        
        <!-- Tenant Overview Table -->
        <?php
        $headers = ['Tenant', 'Plan', 'Users', 'Revenue', 'Status', 'Last Active'];
        $rows = [
            ['Go Models NYC', 'Enterprise', '2,450', '$125,000', '<span class="badge bg-success">Active</span>', '2 min ago'],
            ['Elite Model Management', 'Pro', '1,890', '$89,500', '<span class="badge bg-success">Active</span>', '15 min ago'],
            ['Voice Talent Hub', 'Pro', '756', '$45,200', '<span class="badge bg-success">Active</span>', '1 hour ago'],
            ['Pet Stars Pro', 'Standard', '342', '$18,750', '<span class="badge bg-success">Active</span>', '3 hours ago'],
            ['Kids Talent Hub', 'Standard', '198', '$12,400', '<span class="badge bg-warning">Trial</span>', '1 day ago']
        ];
        echo createDataTable('Active Tenants Overview', $headers, $rows);
        ?>
    </div>
</div>

<?php echo renderFooter(); ?>