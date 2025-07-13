<?php
require_once '../includes/header.php';
require_once '../includes/sidebar.php';
require_once '../includes/components.php';
require_once '../includes/footer.php';

echo renderHeader("User Dashboard - itellico Mono", "Demo User", "Individual User", "User");
?>

<div class="d-flex">
    <?php echo renderSidebar('User', getUserSidebarItems(), 'index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'User', 'href' => 'index.php'],
            ['label' => 'Dashboard']
        ]);
        
        echo createHeroSection(
            "Choose Your Profile Type",
            "Select the type of user profile you'd like to explore",
            "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=300&fit=crop",
            []
        );
        ?>
        
        <!-- Profile Type Selection -->
        <div class="row g-4 mb-5">
            <!-- Model Profile -->
            <div class="col-md-6 col-lg-4">
                <div class="card h-100 profile-card" onclick="window.location.href='model.php'">
                    <div class="card-body text-center p-4">
                        <img src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=120&h=120&fit=crop&crop=face" 
                             class="rounded-circle mb-3" style="width: 100px; height: 100px; object-fit: cover;" alt="Model">
                        <h4 class="card-title text-primary">Fashion Model</h4>
                        <p class="text-muted mb-3">Professional modeling dashboard with portfolio management, casting applications, and booking calendar.</p>
                        <div class="mb-3">
                            <span class="badge bg-primary me-1">Portfolio</span>
                            <span class="badge bg-primary me-1">Castings</span>
                            <span class="badge bg-primary me-1">Bookings</span>
                            <span class="badge bg-primary">Comp Cards</span>
                        </div>
                        <button class="btn btn-primary w-100">View Emma's Dashboard →</button>
                    </div>
                </div>
            </div>

            <!-- Photographer Profile -->
            <div class="col-md-6 col-lg-4">
                <div class="card h-100 profile-card" onclick="window.location.href='photographer.php'">
                    <div class="card-body text-center p-4">
                        <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face" 
                             class="rounded-circle mb-3" style="width: 100px; height: 100px; object-fit: cover;" alt="Photographer">
                        <h4 class="card-title text-success">Photographer</h4>
                        <p class="text-muted mb-3">Creative professional workspace with service packages, booking management, and portfolio galleries.</p>
                        <div class="mb-3">
                            <span class="badge bg-success me-1">Services</span>
                            <span class="badge bg-success me-1">Portfolio</span>
                            <span class="badge bg-success me-1">Bookings</span>
                            <span class="badge bg-success">Studio Info</span>
                        </div>
                        <button class="btn btn-success w-100">View Marcus's Dashboard →</button>
                    </div>
                </div>
            </div>

            <!-- Coming Soon - Other User Types -->
            <div class="col-md-6 col-lg-4">
                <div class="card h-100 text-center" style="opacity: 0.7;">
                    <div class="card-body p-4">
                        <i class="fas fa-plus-circle fa-4x text-muted mb-3"></i>
                        <h4 class="card-title text-muted">More User Types</h4>
                        <p class="text-muted mb-3">Additional user profiles will be available soon including voice talent, dancers, and fitness models.</p>
                        <div class="mb-3">
                            <span class="badge bg-light text-dark me-1">Voice Talent</span>
                            <span class="badge bg-light text-dark me-1">Dancer</span>
                            <span class="badge bg-light text-dark">Fitness Model</span>
                        </div>
                        <button class="btn btn-outline-secondary w-100" disabled>Coming Soon</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- User Features Overview -->
        <div class="row mb-4">
            <div class="col-md-8">
                <?php echo createCard(
                    "User Tier Features",
                    '
                    <div class="row">
                        <div class="col-md-6">
                            <h6 class="fw-bold text-primary mb-3">Portfolio Management</h6>
                            <ul class="list-unstyled">
                                <li class="mb-2"><i class="fas fa-check text-success me-2"></i> Photo galleries with categories</li>
                                <li class="mb-2"><i class="fas fa-check text-success me-2"></i> Video portfolio uploads</li>
                                <li class="mb-2"><i class="fas fa-check text-success me-2"></i> Comp card generator</li>
                                <li class="mb-2"><i class="fas fa-check text-success me-2"></i> Portfolio analytics</li>
                            </ul>
                            
                            <h6 class="fw-bold text-primary mb-3 mt-4">Application Management</h6>
                            <ul class="list-unstyled">
                                <li class="mb-2"><i class="fas fa-check text-success me-2"></i> Casting call applications</li>
                                <li class="mb-2"><i class="fas fa-check text-success me-2"></i> Application status tracking</li>
                                <li class="mb-2"><i class="fas fa-check text-success me-2"></i> Job history</li>
                            </ul>
                        </div>
                        <div class="col-md-6">
                            <h6 class="fw-bold text-primary mb-3">Communication</h6>
                            <ul class="list-unstyled">
                                <li class="mb-2"><i class="fas fa-check text-success me-2"></i> Direct messaging system</li>
                                <li class="mb-2"><i class="fas fa-check text-success me-2"></i> Notification center</li>
                                <li class="mb-2"><i class="fas fa-check text-success me-2"></i> Email preferences</li>
                                <li class="mb-2"><i class="fas fa-check text-success me-2"></i> Contact management</li>
                            </ul>
                            
                            <h6 class="fw-bold text-primary mb-3 mt-4">Calendar & Bookings</h6>
                            <ul class="list-unstyled">
                                <li class="mb-2"><i class="fas fa-check text-success me-2"></i> Availability calendar</li>
                                <li class="mb-2"><i class="fas fa-check text-success me-2"></i> Booking confirmations</li>
                                <li class="mb-2"><i class="fas fa-check text-success me-2"></i> Schedule management</li>
                            </ul>
                        </div>
                    </div>
                    '
                ); ?>
            </div>
            <div class="col-md-4">
                <?php echo createCard(
                    "Quick Stats",
                    '
                    <div class="text-center mb-4">
                        <h3 class="text-primary">Demo Users</h3>
                        <p class="text-muted">Interactive user profiles available</p>
                    </div>
                    <div class="row text-center">
                        <div class="col-6 mb-3">
                            <h4 class="text-success">2</h4>
                            <small class="text-muted">Active Profiles</small>
                        </div>
                        <div class="col-6 mb-3">
                            <h4 class="text-info">7</h4>
                            <small class="text-muted">Feature Areas</small>
                        </div>
                        <div class="col-6">
                            <h4 class="text-warning">50+</h4>
                            <small class="text-muted">UI Components</small>
                        </div>
                        <div class="col-6">
                            <h4 class="text-danger">100%</h4>
                            <small class="text-muted">Responsive</small>
                        </div>
                    </div>
                    '
                ); ?>
            </div>
        </div>

        <!-- Navigation Help -->
        <div class="row">
            <div class="col-12">
                <?php echo createAlert(
                    'Tip: Click on any profile card above to explore that user type\'s dashboard. Each profile showcases different features and workflows within the itellico Mono platform.',
                    'info'
                ); ?>
            </div>
        </div>
    </div>
</div>

<style>
.profile-card {
    transition: all 0.3s ease;
    cursor: pointer;
}

.profile-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
}
</style>

<?php echo renderFooter(); ?>