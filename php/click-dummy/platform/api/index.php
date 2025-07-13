<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("API Management - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'api/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'API Management']
        ]);
        
        echo createHeroSection(
            "API Management",
            "Monitor and manage all API endpoints, keys, and integrations",
            "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=300&fit=crop",
            [
                ['label' => 'API Documentation', 'icon' => 'fas fa-book', 'style' => 'primary'],
                ['label' => 'Generate Key', 'icon' => 'fas fa-key', 'style' => 'light']
            ]
        );
        ?>
        
        <!-- API Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('API Endpoints', '147', 'fas fa-plug', 'primary');
            echo createStatCard('Active Keys', '234', 'fas fa-key', 'success');
            echo createStatCard('Daily Requests', '1.2M', 'fas fa-chart-line', 'info');
            echo createStatCard('Response Time', '89ms', 'fas fa-clock', 'warning');
            ?>
        </div>
        
        <!-- API Categories -->
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="card h-100">
                    <div class="card-body text-center">
                        <i class="fas fa-shield-alt fa-3x text-primary mb-3"></i>
                        <h5 class="card-title">Authentication</h5>
                        <p class="text-muted small">Login, registration, and security endpoints</p>
                        <div class="mb-3">
                            <span class="badge bg-primary">12 Endpoints</span>
                        </div>
                        <button class="btn btn-outline-primary btn-sm w-100">View Endpoints</button>
                    </div>
                </div>
            </div>
            
            <div class="col-md-3">
                <div class="card h-100">
                    <div class="card-body text-center">
                        <i class="fas fa-users fa-3x text-success mb-3"></i>
                        <h5 class="card-title">User Management</h5>
                        <p class="text-muted small">Profile, portfolio, and user data endpoints</p>
                        <div class="mb-3">
                            <span class="badge bg-success">28 Endpoints</span>
                        </div>
                        <button class="btn btn-outline-success btn-sm w-100">View Endpoints</button>
                    </div>
                </div>
            </div>
            
            <div class="col-md-3">
                <div class="card h-100">
                    <div class="card-body text-center">
                        <i class="fas fa-project-diagram fa-3x text-info mb-3"></i>
                        <h5 class="card-title">Projects & Jobs</h5>
                        <p class="text-muted small">Casting calls, applications, and project management</p>
                        <div class="mb-3">
                            <span class="badge bg-info">34 Endpoints</span>
                        </div>
                        <button class="btn btn-outline-info btn-sm w-100">View Endpoints</button>
                    </div>
                </div>
            </div>
            
            <div class="col-md-3">
                <div class="card h-100">
                    <div class="card-body text-center">
                        <i class="fas fa-chart-bar fa-3x text-warning mb-3"></i>
                        <h5 class="card-title">Analytics</h5>
                        <p class="text-muted small">Reporting, metrics, and analytics endpoints</p>
                        <div class="mb-3">
                            <span class="badge bg-warning">18 Endpoints</span>
                        </div>
                        <button class="btn btn-outline-warning btn-sm w-100">View Endpoints</button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- API Keys Table -->
        <?php
        $headers = ['API Key', 'Client', 'Permissions', 'Requests/Day', 'Status', 'Created', 'Actions'];
        $rows = [
            ['ak_1a2b3c...', 'Go Models NYC Mobile App', 'Read/Write', '45,231', '<span class="badge bg-success">Active</span>', 'Jan 2024'],
            ['ak_4d5e6f...', 'Elite Model Portal', 'Read Only', '12,845', '<span class="badge bg-success">Active</span>', 'Feb 2024'],
            ['ak_7g8h9i...', 'Voice Talent Integration', 'Read/Write', '8,932', '<span class="badge bg-success">Active</span>', 'Mar 2024'],
            ['ak_0j1k2l...', 'Analytics Dashboard', 'Analytics Only', '3,421', '<span class="badge bg-success">Active</span>', 'Apr 2024'],
            ['ak_3m4n5o...', 'Third-party Booking', 'Limited', '1,876', '<span class="badge bg-warning">Limited</span>', 'May 2024'],
            ['ak_6p7q8r...', 'Mobile App Beta', 'Read Only', '543', '<span class="badge bg-info">Testing</span>', 'Jun 2024'],
            ['ak_9s0t1u...', 'Webhook Service', 'Webhooks', '234', '<span class="badge bg-success">Active</span>', 'Jul 2024'],
            ['ak_2v3w4x...', 'Data Export Tool', 'Export Only', '89', '<span class="badge bg-secondary">Inactive</span>', 'Aug 2024']
        ];
        echo createDataTable('API Keys Management', $headers, $rows);
        ?>
    </div>
</div>

<?php echo renderFooter(); ?>