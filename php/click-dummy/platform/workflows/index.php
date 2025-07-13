<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Workflows - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'workflows/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Workflows']
        ]);
        
        echo createHeroSection(
            "Workflow Automation",
            "Manage automated workflows and business process automation",
            "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=300&fit=crop",
            [
                ['label' => 'Create Workflow', 'icon' => 'fas fa-plus', 'style' => 'primary'],
                ['label' => 'Import Template', 'icon' => 'fas fa-upload', 'style' => 'light']
            ]
        );
        ?>
        
        <!-- Workflow Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Active Workflows', '23', 'fas fa-project-diagram', 'primary');
            echo createStatCard('Executions Today', '1,432', 'fas fa-play', 'success');
            echo createStatCard('Success Rate', '98.7%', 'fas fa-check-circle', 'info');
            echo createStatCard('Avg. Duration', '2.3s', 'fas fa-clock', 'warning');
            ?>
        </div>
        
        <!-- Workflow Categories -->
        <div class="row mb-4">
            <div class="col-md-4">
                <div class="card h-100">
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-3">
                            <i class="fas fa-user-plus fa-2x text-primary me-3"></i>
                            <div>
                                <h5 class="card-title mb-1">User Onboarding</h5>
                                <p class="text-muted small mb-0">Automated user registration and setup processes</p>
                            </div>
                        </div>
                        <div class="mb-3">
                            <span class="badge bg-primary me-1">8 Workflows</span>
                            <span class="badge bg-success">234 Runs/Day</span>
                        </div>
                        <ul class="list-unstyled small">
                            <li><i class="fas fa-check text-success me-2"></i> Welcome Email Sequence</li>
                            <li><i class="fas fa-check text-success me-2"></i> Profile Setup Reminders</li>
                            <li><i class="fas fa-check text-success me-2"></i> Account Verification</li>
                            <li><i class="fas fa-check text-success me-2"></i> First Project Guidance</li>
                        </ul>
                        <button class="btn btn-outline-primary btn-sm w-100">Manage Workflows</button>
                    </div>
                </div>
            </div>
            
            <div class="col-md-4">
                <div class="card h-100">
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-3">
                            <i class="fas fa-envelope fa-2x text-success me-3"></i>
                            <div>
                                <h5 class="card-title mb-1">Notifications</h5>
                                <p class="text-muted small mb-0">Email, SMS, and in-app notification workflows</p>
                            </div>
                        </div>
                        <div class="mb-3">
                            <span class="badge bg-success me-1">12 Workflows</span>
                            <span class="badge bg-info">1,234 Runs/Day</span>
                        </div>
                        <ul class="list-unstyled small">
                            <li><i class="fas fa-check text-success me-2"></i> Application Updates</li>
                            <li><i class="fas fa-check text-success me-2"></i> Message Notifications</li>
                            <li><i class="fas fa-check text-success me-2"></i> Booking Confirmations</li>
                            <li><i class="fas fa-check text-success me-2"></i> Payment Reminders</li>
                        </ul>
                        <button class="btn btn-outline-success btn-sm w-100">Manage Workflows</button>
                    </div>
                </div>
            </div>
            
            <div class="col-md-4">
                <div class="card h-100">
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-3">
                            <i class="fas fa-chart-line fa-2x text-info me-3"></i>
                            <div>
                                <h5 class="card-title mb-1">Analytics</h5>
                                <p class="text-muted small mb-0">Automated reporting and data processing workflows</p>
                            </div>
                        </div>
                        <div class="mb-3">
                            <span class="badge bg-info me-1">6 Workflows</span>
                            <span class="badge bg-warning">48 Runs/Day</span>
                        </div>
                        <ul class="list-unstyled small">
                            <li><i class="fas fa-check text-success me-2"></i> Daily Reports</li>
                            <li><i class="fas fa-check text-success me-2"></i> Revenue Analytics</li>
                            <li><i class="fas fa-check text-success me-2"></i> User Activity Tracking</li>
                            <li><i class="fas fa-check text-success me-2"></i> Performance Monitoring</li>
                        </ul>
                        <button class="btn btn-outline-info btn-sm w-100">Manage Workflows</button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Workflows Table -->
        <?php
        $headers = ['Workflow', 'Trigger', 'Status', 'Executions', 'Success Rate', 'Last Run', 'Actions'];
        $rows = [
            ['New User Welcome', 'User Registration', '<span class="badge bg-success">Active</span>', '2,341', '99.2%', '5 min ago'],
            ['Payment Reminder', 'Payment Due', '<span class="badge bg-success">Active</span>', '456', '97.8%', '1 hour ago'],
            ['Application Status Update', 'Status Change', '<span class="badge bg-success">Active</span>', '1,234', '98.5%', '2 min ago'],
            ['Daily Revenue Report', 'Schedule (Daily)', '<span class="badge bg-success">Active</span>', '30', '100%', '6 hours ago'],
            ['Booking Confirmation', 'Booking Created', '<span class="badge bg-success">Active</span>', '789', '99.7%', '15 min ago'],
            ['Profile Incomplete Reminder', 'Schedule (Weekly)', '<span class="badge bg-success">Active</span>', '234', '95.2%', '2 days ago'],
            ['System Health Check', 'Schedule (Hourly)', '<span class="badge bg-success">Active</span>', '168', '98.8%', '30 min ago'],
            ['Tenant Onboarding', 'Tenant Created', '<span class="badge bg-warning">Paused</span>', '12', '91.7%', '1 week ago']
        ];
        echo createDataTable('Active Workflows', $headers, $rows);
        ?>
    </div>
</div>

<?php echo renderFooter(); ?>