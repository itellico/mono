<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Professional Database - Go Models", "Brand Manager", "Brand Administrator", "Tenant");
?>

<div class="d-flex">
    <?php echo renderSidebar('Tenant', getTenantSidebarItems(), 'talent/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Tenant', 'href' => '../index.php'],
            ['label' => 'Professional Database']
        ]);
        
        echo createHeroSection(
            "Professional Database",
            "Manage all registered professionals in your modeling marketplace - part of the multi-brand platform",
            "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=1200&h=300&fit=crop",
            [
                ['label' => 'Add Professional', 'icon' => 'fas fa-plus', 'style' => 'success'],
                ['label' => 'Cross-Brand Search', 'icon' => 'fas fa-network-wired', 'style' => 'info'],
                ['label' => 'Export List', 'icon' => 'fas fa-download', 'style' => 'secondary']
            ]
        );
        ?>
        
        <!-- Search and Filter Bar -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-body">
                        <form class="row g-3">
                            <div class="col-md-4">
                                <input type="text" class="form-control" placeholder="Search by name or ID...">
                            </div>
                            <div class="col-md-2">
                                <select class="form-select">
                                    <option>All Categories</option>
                                    <option>Fashion Model</option>
                                    <option>Commercial Model</option>
                                    <option>Runway Model</option>
                                    <option>Editorial Model</option>
                                    <option>Plus Size Model</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <select class="form-select">
                                    <option>All Status</option>
                                    <option>Available</option>
                                    <option>Busy</option>
                                    <option>Inactive</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <select class="form-select">
                                    <option>All Locations</option>
                                    <option>New York, NY</option>
                                    <option>Los Angeles, CA</option>
                                    <option>Miami, FL</option>
                                    <option>Chicago, IL</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <button type="submit" class="btn btn-primary w-100">
                                    <i class="fas fa-search"></i> Search
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Talent Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Total Models', '2,450', 'fas fa-users', 'success');
            echo createStatCard('Available Now', '1,892', 'fas fa-check-circle', 'primary');
            echo createStatCard('Active This Month', '1,247', 'fas fa-calendar-check', 'info');
            echo createStatCard('Top Rated', '847', 'fas fa-star', 'warning');
            ?>
        </div>
        
        <!-- Talent Grid -->
        <div class="row">
            <div class="col-12">
                <?php
                $talentHeaders = ['Photo', 'Name', 'Category', 'Stats', 'Location', 'Status', 'Rating'];
                $talentRows = [
                    [
                        '<img src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=60&h=60&fit=crop&crop=face" class="rounded-circle" style="width: 50px; height: 50px; object-fit: cover;" alt="Emma">',
                        '<strong>Emma Johnson</strong><br><small class="text-muted">ID: TM001</small>',
                        '<span class="badge bg-primary">Fashion Model</span>',
                        '<small>5\'9" • Size 4<br>47 Jobs • 8 Years</small>',
                        'New York, NY',
                        '<span class="badge bg-success">Available</span>',
                        '<span class="text-warning">★★★★★</span><br><small>(4.9)</small>'
                    ],
                    [
                        '<img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=60&h=60&fit=crop&crop=face" class="rounded-circle" style="width: 50px; height: 50px; object-fit: cover;" alt="Sofia">',
                        '<strong>Sofia Martinez</strong><br><small class="text-muted">ID: TM002</small>',
                        '<span class="badge bg-info">Editorial Model</span>',
                        '<small>5\'8" • Size 2<br>62 Jobs • 6 Years</small>',
                        'Los Angeles, CA',
                        '<span class="badge bg-warning text-dark">Busy</span>',
                        '<span class="text-warning">★★★★★</span><br><small>(4.8)</small>'
                    ],
                    [
                        '<img src="https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=60&h=60&fit=crop&crop=face" class="rounded-circle" style="width: 50px; height: 50px; object-fit: cover;" alt="Isabella">',
                        '<strong>Isabella Chen</strong><br><small class="text-muted">ID: TM003</small>',
                        '<span class="badge bg-success">Runway Model</span>',
                        '<small>5\'10" • Size 0<br>35 Jobs • 4 Years</small>',
                        'Miami, FL',
                        '<span class="badge bg-success">Available</span>',
                        '<span class="text-warning">★★★★★</span><br><small>(4.9)</small>'
                    ],
                    [
                        '<img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face" class="rounded-circle" style="width: 50px; height: 50px; object-fit: cover;" alt="Aria">',
                        '<strong>Aria Thompson</strong><br><small class="text-muted">ID: TM004</small>',
                        '<span class="badge bg-warning text-dark">Commercial Model</span>',
                        '<small>5\'7" • Size 6<br>89 Jobs • 12 Years</small>',
                        'Chicago, IL',
                        '<span class="badge bg-success">Available</span>',
                        '<span class="text-warning">★★★★☆</span><br><small>(4.7)</small>'
                    ],
                    [
                        '<img src="https://images.unsplash.com/photo-1494790108755-2616b612b5c5?w=60&h=60&fit=crop&crop=face" class="rounded-circle" style="width: 50px; height: 50px; object-fit: cover;" alt="Maya">',
                        '<strong>Maya Rodriguez</strong><br><small class="text-muted">ID: TM005</small>',
                        '<span class="badge bg-danger">Plus Size Model</span>',
                        '<small>5\'6" • Size 14<br>156 Jobs • 9 Years</small>',
                        'New York, NY',
                        '<span class="badge bg-secondary">Inactive</span>',
                        '<span class="text-warning">★★★★★</span><br><small>(4.6)</small>'
                    ]
                ];
                echo createDataTable('All Talent', $talentHeaders, $talentRows, true);
                ?>
            </div>
        </div>
        
        <!-- Quick Actions Section -->
        <div class="row mt-4">
            <div class="col-md-4">
                <?php echo createCard(
                    "Quick Actions",
                    '
                    <div class="d-grid gap-2">
                        <button class="btn btn-success">
                            <i class="fas fa-plus me-2"></i> Add New Model
                        </button>
                        <button class="btn btn-info">
                            <i class="fas fa-upload me-2"></i> Bulk Import
                        </button>
                        <button class="btn btn-warning">
                            <i class="fas fa-envelope me-2"></i> Mass Message
                        </button>
                        <button class="btn btn-secondary">
                            <i class="fas fa-download me-2"></i> Export Data
                        </button>
                    </div>
                    '
                ); ?>
            </div>
            <div class="col-md-8">
                <?php echo createCard(
                    "Recent Activity",
                    '
                    <div class="mb-3">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-user-plus text-success me-3"></i>
                            <div class="flex-grow-1">
                                <strong class="d-block">New Model Registration</strong>
                                <small class="text-muted">Isabella Chen completed profile setup</small>
                            </div>
                            <small class="text-muted">2h ago</small>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-star text-warning me-3"></i>
                            <div class="flex-grow-1">
                                <strong class="d-block">5-Star Review</strong>
                                <small class="text-muted">Emma Johnson received excellent client feedback</small>
                            </div>
                            <small class="text-muted">4h ago</small>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-edit text-info me-3"></i>
                            <div class="flex-grow-1">
                                <strong class="d-block">Profile Update</strong>
                                <small class="text-muted">Sofia Martinez updated portfolio photos</small>
                            </div>
                            <small class="text-muted">6h ago</small>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-calendar-check text-primary me-3"></i>
                            <div class="flex-grow-1">
                                <strong class="d-block">Booking Completed</strong>
                                <small class="text-muted">Maya Rodriguez finished Nike campaign shoot</small>
                            </div>
                            <small class="text-muted">1d ago</small>
                        </div>
                    </div>
                    '
                ); ?>
            </div>
        </div>
    </div>
</div>

<?php echo renderFooter(); ?>