<?php
require_once '../includes/header.php';
require_once '../includes/sidebar.php';
require_once '../includes/components.php';
require_once '../includes/footer.php';

echo renderHeader("Go Models - Brand Dashboard", "Brand Manager", "Brand Administrator", "Tenant");
?>

<div class="d-flex">
    <?php echo renderSidebar('Tenant', getTenantSidebarItems(), 'index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Tenant', 'href' => 'index.php'],
            ['label' => 'Dashboard']
        ]);
        
        echo createHeroSection(
            "Go Models",
            "Premium modeling marketplace - Part of the Multi-Brand Platform Network",
            "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&h=300&fit=crop",
            [
                ['label' => 'Add Professional', 'icon' => 'fas fa-plus', 'style' => 'success'],
                ['label' => 'Create Gig', 'icon' => 'fas fa-bullhorn', 'style' => 'primary'],
                ['label' => 'Brand Settings', 'icon' => 'fas fa-cog', 'style' => 'info']
            ]
        );
        ?>
        
        <!-- Brand Performance Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Active Professionals', '847', 'fas fa-users', 'success');
            echo createStatCard('Open Gigs', '34', 'fas fa-bullhorn', 'primary');
            echo createStatCard('Applications Today', '127', 'fas fa-file-alt', 'info');
            echo createStatCard('Monthly Revenue', '€8,200', 'fas fa-euro-sign', 'warning');
            ?>
        </div>
        
        <!-- Cross-Brand Integration Notice -->
        <div class="alert alert-info mb-4">
            <div class="d-flex align-items-center">
                <i class="fas fa-network-wired me-2"></i>
                <div>
                    <strong>Multi-Brand Integration Active</strong> - Your go-models.com brand is connected to voice-agents.com for cross-industry opportunities.
                    <a href="#" class="alert-link ms-2">Manage Integrations</a>
                </div>
            </div>
        </div>
        
        <!-- Main Dashboard Content -->
        <div class="row">
            <!-- Left Column - Recent Activity -->
            <div class="col-lg-8">
                <!-- Featured Professionals -->
                <?php echo createCard(
                    "Featured Professionals",
                    '
                    <div class="row g-3">
                        <div class="col-md-4">
                            <div class="card h-100">
                                <div class="card-body text-center">
                                    <img src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&h=100&fit=crop&crop=face" 
                                         class="rounded-circle mb-3" style="width: 80px; height: 80px; object-fit: cover;" alt="Emma">
                                    <h6 class="card-title">Emma Johnson</h6>
                                    <p class="text-muted small">Fashion Model</p>
                                    <div class="mb-2">
                                        <span class="badge bg-success me-1">Available</span>
                                        <span class="badge bg-primary">5\'9"</span>
                                    </div>
                                    <div class="d-flex justify-content-around small">
                                        <div>
                                            <strong>47</strong><br>
                                            <span class="text-muted">Jobs</span>
                                        </div>
                                        <div>
                                            <strong>4.9★</strong><br>
                                            <span class="text-muted">Rating</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card h-100">
                                <div class="card-body text-center">
                                    <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face" 
                                         class="rounded-circle mb-3" style="width: 80px; height: 80px; object-fit: cover;" alt="Sofia">
                                    <h6 class="card-title">Sofia Martinez</h6>
                                    <p class="text-muted small">Editorial Model</p>
                                    <div class="mb-2">
                                        <span class="badge bg-warning me-1">Busy</span>
                                        <span class="badge bg-primary">5\'8"</span>
                                    </div>
                                    <div class="d-flex justify-content-around small">
                                        <div>
                                            <strong>62</strong><br>
                                            <span class="text-muted">Jobs</span>
                                        </div>
                                        <div>
                                            <strong>4.8★</strong><br>
                                            <span class="text-muted">Rating</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card h-100">
                                <div class="card-body text-center">
                                    <img src="https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=100&h=100&fit=crop&crop=face" 
                                         class="rounded-circle mb-3" style="width: 80px; height: 80px; object-fit: cover;" alt="Isabella">
                                    <h6 class="card-title">Isabella Chen</h6>
                                    <p class="text-muted small">Runway Model</p>
                                    <div class="mb-2">
                                        <span class="badge bg-success me-1">Available</span>
                                        <span class="badge bg-primary">5\'10"</span>
                                    </div>
                                    <div class="d-flex justify-content-around small">
                                        <div>
                                            <strong>35</strong><br>
                                            <span class="text-muted">Jobs</span>
                                        </div>
                                        <div>
                                            <strong>4.9★</strong><br>
                                            <span class="text-muted">Rating</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    ',
                    '<a href="talent/index.php" class="btn btn-outline-success">View All Professionals</a>'
                ); ?>

                <!-- Recent Gigs -->
                <div class="mt-4">
                    <?php
                    $headers = ['Gig Title', 'Client', 'Applications', 'Deadline', 'Status'];
                    $rows = [
                        ['Vogue Summer Campaign', 'Vogue Magazine', '247', 'Dec 15', '<span class="badge bg-success">Active</span>'],
                        ['Nike Athletic Wear', 'Nike Inc.', '189', 'Dec 18', '<span class="badge bg-success">Active</span>'],
                        ['H&M Fall Collection', 'H&M Fashion', '156', 'Dec 12', '<span class="badge bg-warning">Closing Soon</span>'],
                        ['Cross-Brand Voice Project', 'voice-agents.com', '23', 'Dec 22', '<span class="badge bg-info">Cross-Brand</span>'],
                        ['Elle Editorial Feature', 'Elle Magazine', '91', 'Dec 10', '<span class="badge bg-danger">Closed</span>']
                    ];
                    echo createDataTable('Recent Gigs', $headers, $rows, false);
                    ?>
                </div>
            </div>

            <!-- Right Column - Sidebar Info -->
            <div class="col-lg-4">
                <!-- Quick Actions -->
                <?php echo createCard(
                    "Quick Actions",
                    '
                    <div class="d-grid gap-2">
                        <button class="btn btn-success">
                            <i class="fas fa-plus me-2"></i> Add Professional
                        </button>
                        <button class="btn btn-primary">
                            <i class="fas fa-bullhorn me-2"></i> Create Gig
                        </button>
                        <button class="btn btn-info">
                            <i class="fas fa-network-wired me-2"></i> Cross-Brand Setup
                        </button>
                        <button class="btn btn-warning">
                            <i class="fas fa-chart-bar me-2"></i> Brand Analytics
                        </button>
                        <button class="btn btn-secondary">
                            <i class="fas fa-cog me-2"></i> Industry Settings
                        </button>
                    </div>
                    '
                ); ?>

                <!-- Marketplace Stats -->
                <div class="mt-3">
                    <?php echo createCard(
                        "Brand Performance",
                        '
                        <div class="text-center mb-3">
                            <h4 class="text-success">4.8★</h4>
                            <small class="text-muted">Average Professional Rating</small>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <span class="small">Booking Success Rate</span>
                                <span class="fw-bold">82%</span>
                            </div>
                            <div class="progress" style="height: 6px;">
                                <div class="progress-bar bg-success" style="width: 82%"></div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <span class="small">Client Satisfaction</span>
                                <span class="fw-bold">94%</span>
                            </div>
                            <div class="progress" style="height: 6px;">
                                <div class="progress-bar bg-primary" style="width: 94%"></div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <span class="small">Application Response</span>
                                <span class="fw-bold">89%</span>
                            </div>
                            <div class="progress" style="height: 6px;">
                                <div class="progress-bar bg-info" style="width: 89%"></div>
                            </div>
                        </div>
                        '
                    ); ?>
                </div>

                <!-- Recent Activity -->
                <div class="mt-3">
                    <?php echo createCard(
                        "Recent Activity",
                        '
                        <div class="mb-3">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-user-plus text-success me-3"></i>
                                <div class="flex-grow-1">
                                    <strong class="d-block">New Professional Registered</strong>
                                    <small class="text-muted">Isabella Chen joined go-models.com</small>
                                </div>
                                <small class="text-muted">2h</small>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-network-wired text-info me-3"></i>
                                <div class="flex-grow-1">
                                    <strong class="d-block">Cross-Brand Opportunity</strong>
                                    <small class="text-muted">Voice agent needed for modeling gig</small>
                                </div>
                                <small class="text-muted">3h</small>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-bullhorn text-primary me-3"></i>
                                <div class="flex-grow-1">
                                    <strong class="d-block">New Gig Posted</strong>
                                    <small class="text-muted">Vogue Summer Campaign created</small>
                                </div>
                                <small class="text-muted">4h</small>
                            </div>
                        </div>
                        '
                    ); ?>
                </div>
            </div>
        </div>
    </div>
</div>

<?php echo renderFooter(); ?>