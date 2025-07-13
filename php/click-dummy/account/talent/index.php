<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Talent Dashboard - Emma Johnson", "Talent", "Professional Model", "Account");
?>

<div class="d-flex">
    <?php echo renderSidebar('Account', getTalentSidebarItems(), 'talent/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Account', 'href' => '../index.php'],
            ['label' => 'Talent Dashboard']
        ]);
        
        echo createHeroSection(
            "Emma Johnson",
            "Professional fashion model with international experience and diverse portfolio",
            "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=1200&h=300&fit=crop",
            [
                ['label' => 'Update Availability', 'icon' => 'fas fa-calendar', 'style' => 'primary'],
                ['label' => 'View Portfolio', 'icon' => 'fas fa-images', 'style' => 'info'],
                ['label' => 'Switch Account Type', 'icon' => 'fas fa-exchange-alt', 'style' => 'secondary']
            ]
        );
        ?>
        
        <!-- Account Type Badge -->
        <div class="row mb-3">
            <div class="col-12">
                <div class="alert alert-success d-flex align-items-center">
                    <i class="fas fa-user me-3 fs-4"></i>
                    <div>
                        <strong>Talent Account Active</strong>
                        <p class="mb-0 small">You're viewing the talent dashboard focused on your modeling career and bookings.</p>
                    </div>
                    <a href="../index.php" class="btn btn-outline-success btn-sm ms-auto">Switch Account Type</a>
                </div>
            </div>
        </div>
        
        <!-- Talent Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Bookings This Month', '12', 'fas fa-calendar-check', 'primary');
            echo createStatCard('Portfolio Images', '89', 'fas fa-images', 'success');
            echo createStatCard('Monthly Earnings', '$28K', 'fas fa-dollar-sign', 'info');
            echo createStatCard('Client Rating', '4.8★', 'fas fa-star', 'warning');
            ?>
        </div>
        
        <!-- Main Dashboard Content -->
        <div class="row">
            <!-- Left Column -->
            <div class="col-lg-8">
                <!-- Digital Comp Card -->
                <?php echo createCard(
                    "Digital Comp Card",
                    '
                    <div class="row">
                        <div class="col-md-4">
                            <img src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&h=400&fit=crop&crop=face" 
                                 class="img-fluid rounded" alt="Emma Johnson">
                        </div>
                        <div class="col-md-8">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <h6 class="text-primary">Personal Details</h6>
                                    <div class="small">
                                        <div class="d-flex justify-content-between">
                                            <span>Height:</span>
                                            <strong>5\'10" (178cm)</strong>
                                        </div>
                                        <div class="d-flex justify-content-between">
                                            <span>Weight:</span>
                                            <strong>125 lbs (57kg)</strong>
                                        </div>
                                        <div class="d-flex justify-content-between">
                                            <span>Dress Size:</span>
                                            <strong>US 2 / EU 34</strong>
                                        </div>
                                        <div class="d-flex justify-content-between">
                                            <span>Shoe Size:</span>
                                            <strong>US 8 / EU 38</strong>
                                        </div>
                                        <div class="d-flex justify-content-between">
                                            <span>Hair:</span>
                                            <strong>Blonde</strong>
                                        </div>
                                        <div class="d-flex justify-content-between">
                                            <span>Eyes:</span>
                                            <strong>Blue</strong>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <h6 class="text-success">Career Stats</h6>
                                    <div class="small">
                                        <div class="d-flex justify-content-between">
                                            <span>Experience:</span>
                                            <strong>5+ Years</strong>
                                        </div>
                                        <div class="d-flex justify-content-between">
                                            <span>Specialties:</span>
                                            <strong>Fashion, Editorial</strong>
                                        </div>
                                        <div class="d-flex justify-content-between">
                                            <span>Markets:</span>
                                            <strong>NY, LA, Milan</strong>
                                        </div>
                                        <div class="d-flex justify-content-between">
                                            <span>Languages:</span>
                                            <strong>EN, ES, IT</strong>
                                        </div>
                                        <div class="d-flex justify-content-between">
                                            <span>Agency:</span>
                                            <strong>Elite Model Mgmt</strong>
                                        </div>
                                        <div class="d-flex justify-content-between">
                                            <span>Status:</span>
                                            <span class="badge bg-success">Available</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="mt-3">
                                <h6 class="text-info">Skills & Experience</h6>
                                <div class="d-flex flex-wrap gap-1">
                                    <span class="badge bg-light text-dark">High Fashion</span>
                                    <span class="badge bg-light text-dark">Editorial</span>
                                    <span class="badge bg-light text-dark">Runway</span>
                                    <span class="badge bg-light text-dark">Commercial</span>
                                    <span class="badge bg-light text-dark">Beauty</span>
                                    <span class="badge bg-light text-dark">Fitness</span>
                                    <span class="badge bg-light text-dark">Swim</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    ',
                    '<a href="profile/index.php" class="btn btn-outline-primary me-2">Edit Profile</a><a href="comp-card/download.php" class="btn btn-outline-success">Download PDF</a>'
                ); ?>

                <!-- Recent Bookings -->
                <div class="mt-4">
                    <?php
                    $headers = ['Client', 'Project', 'Date', 'Type', 'Fee', 'Status'];
                    $rows = [
                        ['Vogue Paris', 'Spring Editorial', 'Dec 15', 'Editorial', '$3,500', '<span class="badge bg-success">Completed</span>'],
                        ['Calvin Klein', 'Underwear Campaign', 'Dec 10', 'Commercial', '$5,200', '<span class="badge bg-success">Completed</span>'],
                        ['Nike', 'Athletic Wear', 'Dec 5', 'Commercial', '$4,800', '<span class="badge bg-success">Completed</span>'],
                        ['H&M', 'Summer Collection', 'Dec 20', 'Commercial', '$2,800', '<span class="badge bg-warning">Confirmed</span>'],
                        ['Zara', 'Fashion Week', 'Dec 25', 'Editorial', '$3,200', '<span class="badge bg-info">Pending</span>']
                    ];
                    echo createDataTable('Recent Bookings', $headers, $rows, false);
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
                            <i class="fas fa-calendar me-2"></i> Update Availability
                        </button>
                        <button class="btn btn-success">
                            <i class="fas fa-camera me-2"></i> Upload Photos
                        </button>
                        <button class="btn btn-info">
                            <i class="fas fa-envelope me-2"></i> Messages
                        </button>
                        <button class="btn btn-warning">
                            <i class="fas fa-file-alt me-2"></i> Applications
                        </button>
                    </div>
                    '
                ); ?>

                <!-- Availability This Week -->
                <div class="mt-3">
                    <?php echo createCard(
                        "This Week\'s Schedule",
                        '
                        <div class="row g-2 text-center mb-3">
                            <div class="col">
                                <div class="bg-light p-2 rounded">
                                    <small class="d-block fw-bold">Mon</small>
                                    <small class="text-success">Available</small>
                                </div>
                            </div>
                            <div class="col">
                                <div class="bg-light p-2 rounded">
                                    <small class="d-block fw-bold">Tue</small>
                                    <small class="text-success">Available</small>
                                </div>
                            </div>
                            <div class="col">
                                <div class="bg-primary p-2 rounded text-white">
                                    <small class="d-block fw-bold">Wed</small>
                                    <small>H&M Shoot</small>
                                </div>
                            </div>
                            <div class="col">
                                <div class="bg-light p-2 rounded">
                                    <small class="d-block fw-bold">Thu</small>
                                    <small class="text-success">Available</small>
                                </div>
                            </div>
                            <div class="col">
                                <div class="bg-warning p-2 rounded">
                                    <small class="d-block fw-bold">Fri</small>
                                    <small class="text-dark">Casting</small>
                                </div>
                            </div>
                            <div class="col">
                                <div class="bg-light p-2 rounded">
                                    <small class="d-block fw-bold">Sat</small>
                                    <small class="text-muted">Personal</small>
                                </div>
                            </div>
                            <div class="col">
                                <div class="bg-light p-2 rounded">
                                    <small class="d-block fw-bold">Sun</small>
                                    <small class="text-muted">Rest</small>
                                </div>
                            </div>
                        </div>
                        <div class="text-center">
                            <small class="text-muted">Next Week: 4 days available</small>
                        </div>
                        '
                    ); ?>
                </div>

                <!-- Recent Portfolio -->
                <div class="mt-3">
                    <?php echo createCard(
                        "Featured Portfolio",
                        '
                        <div class="row g-2 mb-3">
                            <div class="col-6">
                                <img src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=150&h=100&fit=crop" class="img-fluid rounded" alt="Fashion">
                            </div>
                            <div class="col-6">
                                <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=150&h=100&fit=crop" class="img-fluid rounded" alt="Commercial">
                            </div>
                            <div class="col-6">
                                <img src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=150&h=100&fit=crop" class="img-fluid rounded" alt="Beauty">
                            </div>
                            <div class="col-6">
                                <img src="https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=150&h=100&fit=crop" class="img-fluid rounded" alt="Editorial">
                            </div>
                        </div>
                        <div class="text-center">
                            <small class="text-muted">89 total images</small>
                        </div>
                        ',
                        '<a href="portfolio/index.php" class="btn btn-outline-primary btn-sm">Full Portfolio</a>'
                    ); ?>
                </div>

                <!-- Earnings Summary -->
                <div class="mt-3">
                    <?php echo createCard(
                        "Earnings Summary",
                        '
                        <div class="mb-3">
                            <div class="d-flex justify-content-between mb-2">
                                <span class="small">This Month</span>
                                <strong class="text-success">$28,300</strong>
                            </div>
                            <div class="progress mb-2" style="height: 6px;">
                                <div class="progress-bar bg-success" style="width: 85%"></div>
                            </div>
                            <small class="text-muted">85% of monthly goal ($33K)</small>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between small">
                                <span>Last Month</span>
                                <span class="text-muted">$32,100</span>
                            </div>
                            <div class="d-flex justify-content-between small">
                                <span>Year to Date</span>
                                <span class="text-muted">$284,500</span>
                            </div>
                            <div class="d-flex justify-content-between small">
                                <span>Avg per Booking</span>
                                <span class="text-muted">$3,650</span>
                            </div>
                        </div>
                        '
                    ); ?>
                </div>

                <!-- Pending Applications -->
                <div class="mt-3">
                    <?php echo createCard(
                        "Pending Applications",
                        '
                        <div class="mb-3">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-clock text-warning me-3"></i>
                                <div class="flex-grow-1">
                                    <strong class="d-block">Versace Campaign</strong>
                                    <small class="text-muted">Luxury fashion shoot in Milan</small>
                                </div>
                                <small class="text-muted">2d</small>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-clock text-warning me-3"></i>
                                <div class="flex-grow-1">
                                    <strong class="d-block">Dior Fragrance</strong>
                                    <small class="text-muted">Beauty campaign for new perfume</small>
                                </div>
                                <small class="text-muted">5d</small>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-check text-success me-3"></i>
                                <div class="flex-grow-1">
                                    <strong class="d-block">Coach Handbags</strong>
                                    <small class="text-muted">Selected for final casting</small>
                                </div>
                                <small class="text-muted">1w</small>
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