<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Agency Dashboard - Elite Model Management", "Agency Admin", "Account Manager", "Account");
?>

<div class="d-flex">
    <?php echo renderSidebar('Account', getAgencySidebarItems(), 'agency/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Account', 'href' => '../index.php'],
            ['label' => 'Agency Dashboard']
        ]);
        
        echo createHeroSection(
            "Elite Model Management",
            "International modeling agency managing top-tier talent worldwide",
            "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=300&fit=crop",
            [
                ['label' => 'New Project', 'icon' => 'fas fa-plus', 'style' => 'primary'],
                ['label' => 'View Roster', 'icon' => 'fas fa-users', 'style' => 'info'],
                ['label' => 'Switch Account Type', 'icon' => 'fas fa-exchange-alt', 'style' => 'secondary']
            ]
        );
        ?>
        
        <!-- Account Type Badge -->
        <div class="row mb-3">
            <div class="col-12">
                <div class="alert alert-primary d-flex align-items-center">
                    <i class="fas fa-building me-3 fs-4"></i>
                    <div>
                        <strong>Agency Account Active</strong>
                        <p class="mb-0 small">You're viewing the agency dashboard with full team and talent management capabilities.</p>
                    </div>
                    <a href="../index.php" class="btn btn-outline-primary btn-sm ms-auto">Switch Account Type</a>
                </div>
            </div>
        </div>
        
        <!-- Agency Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Active Projects', '24', 'fas fa-project-diagram', 'primary');
            echo createStatCard('Talent Roster', '156', 'fas fa-users', 'success');
            echo createStatCard('Bookings This Month', '78', 'fas fa-calendar-check', 'info');
            echo createStatCard('Revenue (MTD)', '$247K', 'fas fa-dollar-sign', 'warning');
            ?>
        </div>
        
        <!-- Main Dashboard Content -->
        <div class="row">
            <!-- Left Column -->
            <div class="col-lg-8">
                <!-- Active Projects -->
                <?php echo createCard(
                    "Active Projects",
                    '
                    <div class="row g-3">
                        <div class="col-md-6">
                            <div class="card border-primary h-100">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-start mb-3">
                                        <div>
                                            <h6 class="fw-bold text-primary">Vogue Paris Editorial</h6>
                                            <small class="text-muted">High Fashion Shoot</small>
                                        </div>
                                        <span class="badge bg-success">Active</span>
                                    </div>
                                    <p class="small text-muted mb-3">Exclusive editorial featuring top models for Vogue Paris spring collection.</p>
                                    <div class="mb-3">
                                        <div class="d-flex justify-content-between small">
                                            <span>Models Assigned</span>
                                            <span class="fw-bold">5</span>
                                        </div>
                                        <div class="d-flex justify-content-between small">
                                            <span>Shoot Date</span>
                                            <span class="fw-bold">Dec 15</span>
                                        </div>
                                        <div class="d-flex justify-content-between small">
                                            <span>Fee</span>
                                            <span class="fw-bold text-success">$45,000</span>
                                        </div>
                                    </div>
                                    <div class="progress mb-2" style="height: 6px;">
                                        <div class="progress-bar bg-primary" style="width: 75%"></div>
                                    </div>
                                    <small class="text-muted">75% Complete</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card border-warning h-100">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-start mb-3">
                                        <div>
                                            <h6 class="fw-bold text-warning">Nike Campaign</h6>
                                            <small class="text-muted">Athletic Wear Commercial</small>
                                        </div>
                                        <span class="badge bg-warning">In Progress</span>
                                    </div>
                                    <p class="small text-muted mb-3">Global athletic wear campaign featuring diverse models for Nike\'s new collection.</p>
                                    <div class="mb-3">
                                        <div class="d-flex justify-content-between small">
                                            <span>Models Assigned</span>
                                            <span class="fw-bold">8</span>
                                        </div>
                                        <div class="d-flex justify-content-between small">
                                            <span>Shoot Date</span>
                                            <span class="fw-bold">Dec 20</span>
                                        </div>
                                        <div class="d-flex justify-content-between small">
                                            <span>Fee</span>
                                            <span class="fw-bold text-success">$125,000</span>
                                        </div>
                                    </div>
                                    <div class="progress mb-2" style="height: 6px;">
                                        <div class="progress-bar bg-warning" style="width: 45%"></div>
                                    </div>
                                    <small class="text-muted">45% Complete</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    ',
                    '<a href="../projects/index.php" class="btn btn-outline-primary">View All Projects</a>'
                ); ?>

                <!-- Team Performance -->
                <div class="mt-4">
                    <?php
                    $headers = ['Team Member', 'Role', 'Active Projects', 'Clients', 'Performance'];
                    $rows = [
                        ['Sarah Williams', 'Senior Agent', '12', '8', '<span class="text-success">Excellent</span>'],
                        ['Michael Chen', 'Talent Scout', '8', '5', '<span class="text-success">Excellent</span>'],
                        ['Emma Rodriguez', 'Project Manager', '15', '12', '<span class="text-warning">Good</span>'],
                        ['David Kim', 'Account Executive', '6', '4', '<span class="text-success">Excellent</span>'],
                        ['Lisa Thompson', 'Creative Director', '9', '7', '<span class="text-success">Excellent</span>']
                    ];
                    echo createDataTable('Team Performance', $headers, $rows, false);
                    ?>
                </div>
            </div>

            <!-- Right Column -->
            <div class="col-lg-4">
                <!-- Quick Actions -->
                <?php echo createCard(
                    "Quick Actions",
                    '
                    <div class="d-grid gap-2">
                        <button class="btn btn-primary">
                            <i class="fas fa-plus me-2"></i> New Project
                        </button>
                        <button class="btn btn-success">
                            <i class="fas fa-search me-2"></i> Find Talent
                        </button>
                        <button class="btn btn-info">
                            <i class="fas fa-calendar me-2"></i> Schedule Meeting
                        </button>
                        <button class="btn btn-warning">
                            <i class="fas fa-file-invoice me-2"></i> Generate Report
                        </button>
                    </div>
                    '
                ); ?>

                <!-- Top Performers -->
                <div class="mt-3">
                    <?php echo createCard(
                        "Top Performing Models",
                        '
                        <div class="mb-3">
                            <div class="d-flex align-items-center">
                                <img src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=40&h=40&fit=crop&crop=face" 
                                     class="rounded-circle me-3" style="width: 50px; height: 50px;" alt="Emma">
                                <div class="flex-grow-1">
                                    <strong class="d-block">Emma Johnson</strong>
                                    <small class="text-muted">8 bookings this month</small>
                                </div>
                                <div class="text-end">
                                    <strong class="text-success">$28K</strong><br>
                                    <small class="text-muted">Revenue</small>
                                </div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex align-items-center">
                                <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=40&h=40&fit=crop&crop=face" 
                                     class="rounded-circle me-3" style="width: 50px; height: 50px;" alt="Sofia">
                                <div class="flex-grow-1">
                                    <strong class="d-block">Sofia Martinez</strong>
                                    <small class="text-muted">6 bookings this month</small>
                                </div>
                                <div class="text-end">
                                    <strong class="text-success">$22K</strong><br>
                                    <small class="text-muted">Revenue</small>
                                </div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex align-items-center">
                                <img src="https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=40&h=40&fit=crop&crop=face" 
                                     class="rounded-circle me-3" style="width: 50px; height: 50px;" alt="Isabella">
                                <div class="flex-grow-1">
                                    <strong class="d-block">Isabella Chen</strong>
                                    <small class="text-muted">5 bookings this month</small>
                                </div>
                                <div class="text-end">
                                    <strong class="text-success">$19K</strong><br>
                                    <small class="text-muted">Revenue</small>
                                </div>
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
                                <i class="fas fa-handshake text-success me-3"></i>
                                <div class="flex-grow-1">
                                    <strong class="d-block">New Client Signed</strong>
                                    <small class="text-muted">Zara Fashion partnership confirmed</small>
                                </div>
                                <small class="text-muted">1h</small>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-star text-warning me-3"></i>
                                <div class="flex-grow-1">
                                    <strong class="d-block">Model Recognition</strong>
                                    <small class="text-muted">Emma featured in Vogue cover story</small>
                                </div>
                                <small class="text-muted">3h</small>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-calendar-check text-primary me-3"></i>
                                <div class="flex-grow-1">
                                    <strong class="d-block">Booking Confirmed</strong>
                                    <small class="text-muted">Nike campaign dates finalized</small>
                                </div>
                                <small class="text-muted">5h</small>
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