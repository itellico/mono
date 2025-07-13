<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Support Tickets - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'support/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Support Tickets']
        ]);
        
        echo createHeroSection(
            "Support Ticket Management",
            "Monitor and manage customer support requests across all tenants",
            "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=300&fit=crop",
            [
                ['label' => 'Create Ticket', 'icon' => 'fas fa-plus', 'style' => 'primary'],
                ['label' => 'Export Reports', 'icon' => 'fas fa-download', 'style' => 'light']
            ]
        );
        ?>
        
        <!-- Support Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Open Tickets', '47', 'fas fa-ticket-alt', 'primary');
            echo createStatCard('Resolved Today', '23', 'fas fa-check-circle', 'success');
            echo createStatCard('Avg. Response', '2.4h', 'fas fa-clock', 'info');
            echo createStatCard('Satisfaction', '96.8%', 'fas fa-star', 'warning');
            ?>
        </div>
        
        <!-- Ticket Categories -->
        <div class="row mb-4">
            <div class="col-md-4">
                <div class="card h-100">
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-3">
                            <i class="fas fa-bug fa-2x text-danger me-3"></i>
                            <div>
                                <h5 class="card-title mb-1">Technical Issues</h5>
                                <p class="text-muted small mb-0">Bugs, errors, and technical problems</p>
                            </div>
                        </div>
                        <div class="mb-3">
                            <span class="badge bg-danger me-1">18 Open</span>
                            <span class="badge bg-success">45 Resolved</span>
                        </div>
                        <ul class="list-unstyled small">
                            <li><i class="fas fa-exclamation-triangle text-warning me-2"></i> API Rate Limiting Issues</li>
                            <li><i class="fas fa-exclamation-triangle text-warning me-2"></i> Upload Failures</li>
                            <li><i class="fas fa-check text-success me-2"></i> Search Performance</li>
                            <li><i class="fas fa-check text-success me-2"></i> Email Delivery</li>
                        </ul>
                        <button class="btn btn-outline-danger btn-sm w-100">View Tickets</button>
                    </div>
                </div>
            </div>
            
            <div class="col-md-4">
                <div class="card h-100">
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-3">
                            <i class="fas fa-question-circle fa-2x text-info me-3"></i>
                            <div>
                                <h5 class="card-title mb-1">General Inquiries</h5>
                                <p class="text-muted small mb-0">Questions about features and usage</p>
                            </div>
                        </div>
                        <div class="mb-3">
                            <span class="badge bg-info me-1">12 Open</span>
                            <span class="badge bg-success">89 Resolved</span>
                        </div>
                        <ul class="list-unstyled small">
                            <li><i class="fas fa-question text-info me-2"></i> Feature Requests</li>
                            <li><i class="fas fa-question text-info me-2"></i> How-to Questions</li>
                            <li><i class="fas fa-check text-success me-2"></i> Account Setup</li>
                            <li><i class="fas fa-check text-success me-2"></i> Integration Help</li>
                        </ul>
                        <button class="btn btn-outline-info btn-sm w-100">View Tickets</button>
                    </div>
                </div>
            </div>
            
            <div class="col-md-4">
                <div class="card h-100">
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-3">
                            <i class="fas fa-credit-card fa-2x text-warning me-3"></i>
                            <div>
                                <h5 class="card-title mb-1">Billing & Payments</h5>
                                <p class="text-muted small mb-0">Payment issues and billing inquiries</p>
                            </div>
                        </div>
                        <div class="mb-3">
                            <span class="badge bg-warning me-1">8 Open</span>
                            <span class="badge bg-success">34 Resolved</span>
                        </div>
                        <ul class="list-unstyled small">
                            <li><i class="fas fa-exclamation-triangle text-warning me-2"></i> Payment Failures</li>
                            <li><i class="fas fa-question text-info me-2"></i> Invoice Questions</li>
                            <li><i class="fas fa-check text-success me-2"></i> Refund Requests</li>
                            <li><i class="fas fa-check text-success me-2"></i> Plan Upgrades</li>
                        </ul>
                        <button class="btn btn-outline-warning btn-sm w-100">View Tickets</button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Recent Tickets -->
        <?php
        $headers = ['Ticket ID', 'Subject', 'Tenant', 'Priority', 'Status', 'Agent', 'Created', 'Actions'];
        $rows = [
            ['#SUP-1234', 'API Authentication Errors', 'Go Models NYC', '<span class="badge bg-danger">High</span>', '<span class="badge bg-warning">In Progress</span>', 'John Doe', '2 hours ago'],
            ['#SUP-1235', 'Upload File Size Limit', 'Elite Models', '<span class="badge bg-warning">Medium</span>', '<span class="badge bg-info">Open</span>', 'Unassigned', '4 hours ago'],
            ['#SUP-1236', 'Payment Gateway Issues', 'Voice Talent Hub', '<span class="badge bg-danger">High</span>', '<span class="badge bg-warning">In Progress</span>', 'Jane Smith', '6 hours ago'],
            ['#SUP-1237', 'Feature Request: Bulk Import', 'Pet Stars Pro', '<span class="badge bg-info">Low</span>', '<span class="badge bg-info">Open</span>', 'Unassigned', '1 day ago'],
            ['#SUP-1238', 'Email Notifications Not Working', 'Kids Talent Hub', '<span class="badge bg-warning">Medium</span>', '<span class="badge bg-success">Resolved</span>', 'Mike Johnson', '1 day ago'],
            ['#SUP-1239', 'Dashboard Loading Slowly', 'Fitness Models Plus', '<span class="badge bg-warning">Medium</span>', '<span class="badge bg-warning">In Progress</span>', 'Sarah Wilson', '2 days ago'],
            ['#SUP-1240', 'Integration Documentation', 'Creative Photographers', '<span class="badge bg-info">Low</span>', '<span class="badge bg-info">Open</span>', 'Unassigned', '3 days ago'],
            ['#SUP-1241', 'Billing Cycle Questions', 'Dance Academy Pro', '<span class="badge bg-info">Low</span>', '<span class="badge bg-success">Resolved</span>', 'David Kim', '3 days ago']
        ];
        echo createDataTable('Recent Support Tickets', $headers, $rows);
        ?>
    </div>
</div>

<?php echo renderFooter(); ?>