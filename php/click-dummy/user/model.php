<?php
require_once '../includes/header.php';
require_once '../includes/sidebar.php';
require_once '../includes/components.php';
require_once '../includes/footer.php';

echo renderHeader("Model Dashboard - Emma Johnson", "Emma Johnson", "Professional Model", "User");
?>

<style>
.profile-hero { 
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 2rem 0;
    margin: -20px -20px 30px -20px;
}
.profile-image {
    width: 120px;
    height: 120px;
    object-fit: cover;
    border: 4px solid rgba(255,255,255,0.3);
}
.stat-card {
    background: rgba(255,255,255,0.9);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 15px;
    color: #333;
}
.portfolio-item:hover {
    transform: translateY(-5px);
    transition: transform 0.3s ease;
}
.booking-card {
    border-left: 4px solid #28a745;
    background: #f8f9fa;
}
.availability-status {
    position: relative;
}
.availability-status::before {
    content: '';
    position: absolute;
    width: 10px;
    height: 10px;
    background: #28a745;
    border-radius: 50%;
    left: -15px;
    top: 50%;
    transform: translateY(-50%);
}
</style>

<div class="d-flex">
    <?php echo renderSidebar('User', getUserSidebarItems(), 'model.php'); ?>
    
    <div class="main-content flex-grow-1">
        <!-- Profile Hero Section -->
        <div class="profile-hero">
            <div class="container-fluid">
                <div class="row align-items-center">
                    <div class="col-md-3 text-center">
                        <img src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop&crop=face" 
                             class="rounded-circle profile-image mb-3" alt="Emma Johnson">
                        <div class="availability-status text-center">
                            <span class="badge bg-success">Available</span>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h1 class="fw-bold mb-2">Emma Johnson</h1>
                        <p class="fs-5 mb-3">Professional Fashion Model</p>
                        <div class="mb-3">
                            <span class="badge bg-light text-dark me-2">Fashion</span>
                            <span class="badge bg-light text-dark me-2">Editorial</span>
                            <span class="badge bg-light text-dark me-2">Runway</span>
                            <span class="badge bg-light text-dark me-2">Commercial</span>
                        </div>
                        <div class="row text-center">
                            <div class="col-3">
                                <div class="stat-card p-3 text-center">
                                    <h4 class="fw-bold mb-1">5'9"</h4>
                                    <small>Height</small>
                                </div>
                            </div>
                            <div class="col-3">
                                <div class="stat-card p-3 text-center">
                                    <h4 class="fw-bold mb-1">32-24-35</h4>
                                    <small>Measurements</small>
                                </div>
                            </div>
                            <div class="col-3">
                                <div class="stat-card p-3 text-center">
                                    <h4 class="fw-bold mb-1">Size 6</h4>
                                    <small>Dress Size</small>
                                </div>
                            </div>
                            <div class="col-3">
                                <div class="stat-card p-3 text-center">
                                    <h4 class="fw-bold mb-1">8.5</h4>
                                    <small>Shoe Size</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 text-center">
                        <div class="btn-group-vertical d-grid gap-2">
                            <button class="btn btn-light">
                                <i class="fas fa-edit me-2"></i> Edit Profile
                            </button>
                            <button class="btn btn-outline-light">
                                <i class="fas fa-share me-2"></i> Share Profile
                            </button>
                            <button class="btn btn-outline-light">
                                <i class="fas fa-download me-2"></i> Download Comp Card
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <?php 
        echo createBreadcrumb([
            ['label' => 'User', 'href' => 'index.php'],
            ['label' => 'Emma Johnson Profile']
        ]);
        ?>

        <!-- Dashboard Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Active Applications', '5', 'fas fa-file-alt', 'primary');
            echo createStatCard('Portfolio Views', '1,247', 'fas fa-eye', 'success');
            echo createStatCard('Jobs Completed', '47', 'fas fa-check-circle', 'info');
            echo createStatCard('Earnings (MTD)', '$8,450', 'fas fa-dollar-sign', 'warning');
            ?>
        </div>

        <!-- Main Content Row -->
        <div class="row">
            <!-- Left Column - Portfolio & Applications -->
            <div class="col-lg-8">
                <!-- Recent Portfolio -->
                <?php echo createCard(
                    "Recent Portfolio",
                    '
                    <div class="row g-3">
                        <div class="col-md-4">
                            <div class="portfolio-item">
                                <img src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=300&h=400&fit=crop" 
                                     class="img-fluid rounded" alt="Fashion Shoot">
                                <div class="mt-2">
                                    <small class="text-muted">Fashion Editorial</small>
                                    <div class="text-warning">
                                        <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="portfolio-item">
                                <img src="https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=300&h=400&fit=crop" 
                                     class="img-fluid rounded" alt="Portrait">
                                <div class="mt-2">
                                    <small class="text-muted">Portrait Session</small>
                                    <div class="text-warning">
                                        <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="portfolio-item">
                                <img src="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=300&h=400&fit=crop" 
                                     class="img-fluid rounded" alt="Commercial">
                                <div class="mt-2">
                                    <small class="text-muted">Commercial Shoot</small>
                                    <div class="text-warning">
                                        <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    ',
                    '<a href="portfolio/index.php" class="btn btn-outline-primary">View Full Portfolio</a>'
                ); ?>

                <!-- Recent Applications -->
                <div class="mt-4">
                    <?php
                    $headers = ['Casting Call', 'Client', 'Status', 'Applied', 'Response'];
                    $rows = [
                        ['Vogue Summer Campaign', 'Vogue Magazine', '<span class="badge bg-warning">Under Review</span>', '2 days ago', 'Pending'],
                        ['Nike Athletic Wear', 'Nike Inc.', '<span class="badge bg-success">Shortlisted</span>', '1 week ago', 'Interview Scheduled'],
                        ['H&M Fall Collection', 'H&M Fashion', '<span class="badge bg-danger">Not Selected</span>', '2 weeks ago', 'Feedback Available'],
                        ['Zara Commercial Shoot', 'Zara Fashion', '<span class="badge bg-success">Booked</span>', '3 weeks ago', 'Confirmed'],
                        ['Elle Editorial Feature', 'Elle Magazine', '<span class="badge bg-info">Submitted</span>', '1 month ago', 'No Response']
                    ];
                    echo createDataTable('Recent Applications', $headers, $rows, false);
                    ?>
                </div>
            </div>

            <!-- Right Column - Sidebar Info -->
            <div class="col-lg-4">
                <!-- Upcoming Bookings -->
                <?php echo createCard(
                    "Upcoming Bookings",
                    '
                    <div class="booking-card p-3 mb-3">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="fw-bold mb-1">Zara Commercial Shoot</h6>
                                <small class="text-muted">Fashion Photography</small>
                            </div>
                            <span class="badge bg-success">Confirmed</span>
                        </div>
                        <div class="mt-2">
                            <small class="text-muted">
                                <i class="fas fa-calendar me-1"></i> Tomorrow, 9:00 AM<br>
                                <i class="fas fa-map-marker-alt me-1"></i> SoHo Studio, NYC<br>
                                <i class="fas fa-dollar-sign me-1"></i> $2,500
                            </small>
                        </div>
                    </div>
                    <div class="p-3 border rounded">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="fw-bold mb-1">Elle Editorial</h6>
                                <small class="text-muted">Magazine Shoot</small>
                            </div>
                            <span class="badge bg-warning">Pending</span>
                        </div>
                        <div class="mt-2">
                            <small class="text-muted">
                                <i class="fas fa-calendar me-1"></i> Next Week<br>
                                <i class="fas fa-map-marker-alt me-1"></i> TBD<br>
                                <i class="fas fa-dollar-sign me-1"></i> $3,200
                            </small>
                        </div>
                    </div>
                    '
                ); ?>

                <!-- Quick Stats -->
                <div class="mt-3">
                    <?php echo createCard(
                        "Performance Metrics",
                        '
                        <div class="text-center mb-3">
                            <h4 class="text-success">4.9★</h4>
                            <small class="text-muted">Average Rating</small>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <span class="small">Application Success</span>
                                <span class="fw-bold">78%</span>
                            </div>
                            <div class="progress" style="height: 6px;">
                                <div class="progress-bar bg-success" style="width: 78%"></div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <span class="small">Profile Completeness</span>
                                <span class="fw-bold">95%</span>
                            </div>
                            <div class="progress" style="height: 6px;">
                                <div class="progress-bar bg-primary" style="width: 95%"></div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <span class="small">Response Rate</span>
                                <span class="fw-bold">92%</span>
                            </div>
                            <div class="progress" style="height: 6px;">
                                <div class="progress-bar bg-info" style="width: 92%"></div>
                            </div>
                        </div>
                        '
                    ); ?>
                </div>

                <!-- Recent Messages -->
                <div class="mt-3">
                    <?php echo createCard(
                        "Recent Messages",
                        '
                        <div class="mb-3">
                            <div class="d-flex align-items-center">
                                <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face" 
                                     class="rounded-circle me-3" style="width: 40px; height: 40px;" alt="Agent">
                                <div class="flex-grow-1">
                                    <strong class="d-block">Sarah Chen</strong>
                                    <small class="text-muted">Your booking for tomorrow has been confirmed...</small>
                                </div>
                                <small class="text-muted">2h</small>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex align-items-center">
                                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face" 
                                     class="rounded-circle me-3" style="width: 40px; height: 40px;" alt="Client">
                                <div class="flex-grow-1">
                                    <strong class="d-block">Vogue Casting</strong>
                                    <small class="text-muted">Thank you for your application. We are currently...</small>
                                </div>
                                <small class="text-muted">1d</small>
                            </div>
                        </div>
                        <div class="text-center">
                            <a href="messages/index.php" class="btn btn-outline-primary btn-sm">View All Messages</a>
                        </div>
                        '
                    ); ?>
                </div>
            </div>
        </div>
    </div>
</div>

<?php echo renderFooter(); ?>