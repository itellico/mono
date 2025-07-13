<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Tenant Management - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'tenants/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Tenant Management']
        ]);
        
        echo createHeroSection(
            "Tenant Management",
            "Oversee all marketplace tenants and their configurations",
            "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=300&fit=crop",
            [
                ['label' => 'Add Tenant', 'icon' => 'fas fa-plus', 'style' => 'primary'],
                ['label' => 'Export Data', 'icon' => 'fas fa-download', 'style' => 'light']
            ]
        );
        ?>
        
        <!-- Tenant Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Total Tenants', '12', 'fas fa-building', 'primary');
            echo createStatCard('Active This Month', '11', 'fas fa-check-circle', 'success');
            echo createStatCard('New This Week', '2', 'fas fa-plus-circle', 'info');
            echo createStatCard('Trial Accounts', '3', 'fas fa-clock', 'warning');
            ?>
        </div>
        
        <!-- Featured Tenants -->
        <div class="row mb-4">
            <div class="col-md-4">
                <div class="card h-100">
                    <div class="card-body text-center">
                        <img src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=100&h=100&fit=crop" 
                             class="rounded-circle mb-3" style="width: 80px; height: 80px; object-fit: cover;" alt="Go Models NYC">
                        <h5 class="card-title">Go Models NYC</h5>
                        <p class="text-muted small">Fashion Modeling Agency</p>
                        <div class="mb-3">
                            <span class="badge bg-success me-1">Enterprise</span>
                            <span class="badge bg-primary">2,450 Users</span>
                        </div>
                        <div class="d-flex justify-content-around text-center">
                            <div>
                                <strong class="d-block">$125K</strong>
                                <small class="text-muted">Monthly Revenue</small>
                            </div>
                            <div>
                                <strong class="d-block">98.7%</strong>
                                <small class="text-muted">Uptime</small>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer">
                        <div class="btn-group w-100">
                            <button class="btn btn-outline-primary btn-sm">Manage</button>
                            <button class="btn btn-outline-secondary btn-sm">Analytics</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-4">
                <div class="card h-100">
                    <div class="card-body text-center">
                        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" 
                             class="rounded-circle mb-3" style="width: 80px; height: 80px; object-fit: cover;" alt="Elite Model Management">
                        <h5 class="card-title">Elite Model Management</h5>
                        <p class="text-muted small">International Modeling Agency</p>
                        <div class="mb-3">
                            <span class="badge bg-info me-1">Pro</span>
                            <span class="badge bg-primary">1,890 Users</span>
                        </div>
                        <div class="d-flex justify-content-around text-center">
                            <div>
                                <strong class="d-block">$89K</strong>
                                <small class="text-muted">Monthly Revenue</small>
                            </div>
                            <div>
                                <strong class="d-block">99.2%</strong>
                                <small class="text-muted">Uptime</small>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer">
                        <div class="btn-group w-100">
                            <button class="btn btn-outline-primary btn-sm">Manage</button>
                            <button class="btn btn-outline-secondary btn-sm">Analytics</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-4">
                <div class="card h-100">
                    <div class="card-body text-center">
                        <img src="https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=100&h=100&fit=crop" 
                             class="rounded-circle mb-3" style="width: 80px; height: 80px; object-fit: cover;" alt="Voice Talent Hub">
                        <h5 class="card-title">Voice Talent Hub</h5>
                        <p class="text-muted small">Voice Acting Marketplace</p>
                        <div class="mb-3">
                            <span class="badge bg-info me-1">Pro</span>
                            <span class="badge bg-primary">756 Users</span>
                        </div>
                        <div class="d-flex justify-content-around text-center">
                            <div>
                                <strong class="d-block">$45K</strong>
                                <small class="text-muted">Monthly Revenue</small>
                            </div>
                            <div>
                                <strong class="d-block">97.8%</strong>
                                <small class="text-muted">Uptime</small>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer">
                        <div class="btn-group w-100">
                            <button class="btn btn-outline-primary btn-sm">Manage</button>
                            <button class="btn btn-outline-secondary btn-sm">Analytics</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- All Tenants Table -->
        <?php
        $headers = ['Tenant', 'Industry', 'Plan', 'Users', 'Revenue', 'Status', 'Created', 'Actions'];
        $rows = [
            ['Go Models NYC', 'Fashion', 'Enterprise', '2,450', '$125,000', '<span class="badge bg-success">Active</span>', 'Jan 2024'],
            ['Elite Model Management', 'Fashion', 'Pro', '1,890', '$89,500', '<span class="badge bg-success">Active</span>', 'Feb 2024'],
            ['Voice Talent Hub', 'Audio', 'Pro', '756', '$45,200', '<span class="badge bg-success">Active</span>', 'Mar 2024'],
            ['Pet Stars Pro', 'Animals', 'Standard', '342', '$18,750', '<span class="badge bg-success">Active</span>', 'Apr 2024'],
            ['Kids Talent Hub', 'Entertainment', 'Standard', '198', '$12,400', '<span class="badge bg-warning">Trial</span>', 'May 2024'],
            ['Fitness Models Plus', 'Sports', 'Pro', '543', '$32,100', '<span class="badge bg-success">Active</span>', 'Jun 2024'],
            ['Creative Photographers', 'Photography', 'Standard', '287', '$15,800', '<span class="badge bg-success">Active</span>', 'Jul 2024'],
            ['Dance Academy Pro', 'Entertainment', 'Pro', '421', '$28,900', '<span class="badge bg-success">Active</span>', 'Aug 2024']
        ];
        echo createDataTable('All Tenants', $headers, $rows);
        ?>
    </div>
</div>

<?php echo renderFooter(); ?>