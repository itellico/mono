<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Professional Dashboard - Marcus Photography Studio", "Professional", "Service Provider", "Account");
?>

<div class="d-flex">
    <?php echo renderSidebar('Account', getProfessionalSidebarItems(), 'professional/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Account', 'href' => '../index.php'],
            ['label' => 'Professional Dashboard']
        ]);
        
        echo createHeroSection(
            "Marcus Photography Studio",
            "Fashion & commercial photographer specializing in high-end campaigns and editorial work",
            "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=1200&h=300&fit=crop",
            [
                ['label' => 'New Booking', 'icon' => 'fas fa-calendar-plus', 'style' => 'primary'],
                ['label' => 'Portfolio', 'icon' => 'fas fa-images', 'style' => 'info'],
                ['label' => 'Switch Account Type', 'icon' => 'fas fa-exchange-alt', 'style' => 'secondary']
            ]
        );
        ?>
        
        <!-- Account Type Badge -->
        <div class="row mb-3">
            <div class="col-12">
                <div class="alert alert-info d-flex align-items-center">
                    <i class="fas fa-camera me-3 fs-4"></i>
                    <div>
                        <strong>Professional Account Active</strong>
                        <p class="mb-0 small">You're viewing the professional service provider dashboard focused on individual business management.</p>
                    </div>
                    <a href="../index.php" class="btn btn-outline-info btn-sm ms-auto">Switch Account Type</a>
                </div>
            </div>
        </div>
        
        <!-- Professional Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Active Bookings', '18', 'fas fa-calendar-check', 'primary');
            echo createStatCard('Portfolio Items', '127', 'fas fa-images', 'success');
            echo createStatCard('Monthly Earnings', '$45K', 'fas fa-dollar-sign', 'info');
            echo createStatCard('Client Rating', '4.9★', 'fas fa-star', 'warning');
            ?>
        </div>
        
        <!-- Main Dashboard Content -->
        <div class="row">
            <!-- Left Column -->
            <div class="col-lg-8">
                <!-- Upcoming Bookings -->
                <?php echo createCard(
                    "Upcoming Bookings",
                    '
                    <div class="row g-3">
                        <div class="col-md-6">
                            <div class="card border-primary h-100">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-start mb-3">
                                        <div>
                                            <h6 class="fw-bold text-primary">Calvin Klein Campaign</h6>
                                            <small class="text-muted">Fashion Photography</small>
                                        </div>
                                        <span class="badge bg-success">Confirmed</span>
                                    </div>
                                    <p class="small text-muted mb-3">Studio and location shoot for Calvin Klein\'s summer collection featuring multiple models.</p>
                                    <div class="mb-3">
                                        <div class="d-flex justify-content-between small">
                                            <span>Shoot Date</span>
                                            <span class="fw-bold">Dec 18-19</span>
                                        </div>
                                        <div class="d-flex justify-content-between small">
                                            <span>Duration</span>
                                            <span class="fw-bold">2 Days</span>
                                        </div>
                                        <div class="d-flex justify-content-between small">
                                            <span>Fee</span>
                                            <span class="fw-bold text-success">$8,500</span>
                                        </div>
                                    </div>
                                    <div class="d-flex gap-2">
                                        <span class="badge bg-light text-dark">Studio</span>
                                        <span class="badge bg-light text-dark">Location</span>
                                        <span class="badge bg-light text-dark">Models</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card border-warning h-100">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-start mb-3">
                                        <div>
                                            <h6 class="fw-bold text-warning">H&M Editorial</h6>
                                            <small class="text-muted">Commercial Photography</small>
                                        </div>
                                        <span class="badge bg-warning">Pending</span>
                                    </div>
                                    <p class="small text-muted mb-3">E-commerce product photography for H&M\'s online catalog and promotional materials.</p>
                                    <div class="mb-3">
                                        <div class="d-flex justify-content-between small">
                                            <span>Shoot Date</span>
                                            <span class="fw-bold">Dec 22</span>
                                        </div>
                                        <div class="d-flex justify-content-between small">
                                            <span>Duration</span>
                                            <span class="fw-bold">1 Day</span>
                                        </div>
                                        <div class="d-flex justify-content-between small">
                                            <span>Fee</span>
                                            <span class="fw-bold text-success">$3,200</span>
                                        </div>
                                    </div>
                                    <div class="d-flex gap-2">
                                        <span class="badge bg-light text-dark">Studio</span>
                                        <span class="badge bg-light text-dark">Product</span>
                                        <span class="badge bg-light text-dark">E-commerce</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    ',
                    '<a href="bookings/index.php" class="btn btn-outline-primary">View All Bookings</a>'
                ); ?>

                <!-- Recent Portfolio Work -->
                <div class="mt-4">
                    <?php echo createCard(
                        "Recent Portfolio Work",
                        '
                        <div class="row g-3">
                            <div class="col-md-4">
                                <div class="card h-100">
                                    <img src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=300&h=200&fit=crop" class="card-img-top" alt="Fashion Shoot">
                                    <div class="card-body p-2">
                                        <h6 class="card-title small mb-1">Vogue Editorial</h6>
                                        <p class="card-text small text-muted mb-1">High fashion editorial shoot</p>
                                        <div class="d-flex justify-content-between">
                                            <small class="text-muted">Nov 2024</small>
                                            <small class="text-success">Featured</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="card h-100">
                                    <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=200&fit=crop" class="card-img-top" alt="Product Shoot">
                                    <div class="card-body p-2">
                                        <h6 class="card-title small mb-1">Nike Campaign</h6>
                                        <p class="card-text small text-muted mb-1">Athletic wear product shots</p>
                                        <div class="d-flex justify-content-between">
                                            <small class="text-muted">Oct 2024</small>
                                            <small class="text-primary">Commercial</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="card h-100">
                                    <img src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=300&h=200&fit=crop" class="card-img-top" alt="Portrait Shoot">
                                    <div class="card-body p-2">
                                        <h6 class="card-title small mb-1">Corporate Portraits</h6>
                                        <p class="card-text small text-muted mb-1">Executive headshots series</p>
                                        <div class="d-flex justify-content-between">
                                            <small class="text-muted">Oct 2024</small>
                                            <small class="text-info">Corporate</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        ',
                        '<a href="portfolio/index.php" class="btn btn-outline-primary">View Full Portfolio</a>'
                    ); ?>
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
                            <i class="fas fa-calendar-plus me-2"></i> Add Availability
                        </button>
                        <button class="btn btn-success">
                            <i class="fas fa-upload me-2"></i> Upload Work
                        </button>
                        <button class="btn btn-info">
                            <i class="fas fa-envelope me-2"></i> Client Messages
                        </button>
                        <button class="btn btn-warning">
                            <i class="fas fa-cog me-2"></i> Service Packages
                        </button>
                    </div>
                    '
                ); ?>

                <!-- Service Packages -->
                <div class="mt-3">
                    <?php echo createCard(
                        "Service Packages",
                        '
                        <div class="mb-3">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <strong class="text-primary">Fashion Editorial</strong>
                                <span class="badge bg-primary">$2,500/day</span>
                            </div>
                            <p class="small text-muted mb-2">High-end fashion photography with full studio and lighting setup</p>
                            <small class="text-success">● Most Popular</small>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <strong class="text-info">Commercial Product</strong>
                                <span class="badge bg-info">$1,800/day</span>
                            </div>
                            <p class="small text-muted mb-2">E-commerce and catalog photography for brands and retailers</p>
                            <small class="text-muted">● Available</small>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <strong class="text-success">Portrait Session</strong>
                                <span class="badge bg-success">$1,200/session</span>
                            </div>
                            <p class="small text-muted mb-2">Professional headshots and corporate portraits</p>
                            <small class="text-muted">● Available</small>
                        </div>
                        '
                    ); ?>
                </div>

                <!-- Availability Calendar -->
                <div class="mt-3">
                    <?php echo createCard(
                        "This Week\'s Availability",
                        '
                        <div class="row g-2 text-center">
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
                                <div class="bg-danger p-2 rounded text-white">
                                    <small class="d-block fw-bold">Wed</small>
                                    <small>Booked</small>
                                </div>
                            </div>
                            <div class="col">
                                <div class="bg-danger p-2 rounded text-white">
                                    <small class="d-block fw-bold">Thu</small>
                                    <small>Booked</small>
                                </div>
                            </div>
                            <div class="col">
                                <div class="bg-warning p-2 rounded">
                                    <small class="d-block fw-bold">Fri</small>
                                    <small class="text-dark">Pending</small>
                                </div>
                            </div>
                            <div class="col">
                                <div class="bg-light p-2 rounded">
                                    <small class="d-block fw-bold">Sat</small>
                                    <small class="text-success">Available</small>
                                </div>
                            </div>
                            <div class="col">
                                <div class="bg-light p-2 rounded">
                                    <small class="d-block fw-bold">Sun</small>
                                    <small class="text-muted">Off</small>
                                </div>
                            </div>
                        </div>
                        ',
                        '<a href="calendar/index.php" class="btn btn-outline-primary btn-sm">Manage Calendar</a>'
                    ); ?>
                </div>

                <!-- Recent Inquiries -->
                <div class="mt-3">
                    <?php echo createCard(
                        "Recent Inquiries",
                        '
                        <div class="mb-3">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-envelope text-primary me-3"></i>
                                <div class="flex-grow-1">
                                    <strong class="d-block">Fashion Week Shoot</strong>
                                    <small class="text-muted">Luxury brand seeking photographer</small>
                                </div>
                                <small class="text-muted">2h</small>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-star text-warning me-3"></i>
                                <div class="flex-grow-1">
                                    <strong class="d-block">Client Review</strong>
                                    <small class="text-muted">5-star rating from Calvin Klein</small>
                                </div>
                                <small class="text-muted">1d</small>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-handshake text-success me-3"></i>
                                <div class="flex-grow-1">
                                    <strong class="d-block">Booking Confirmed</strong>
                                    <small class="text-muted">H&M editorial project approved</small>
                                </div>
                                <small class="text-muted">2d</small>
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