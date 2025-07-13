<?php
require_once '../includes/header.php';
require_once '../includes/sidebar.php';
require_once '../includes/components.php';
require_once '../includes/footer.php';

echo renderHeader("Photographer Dashboard - Marcus Rodriguez", "Marcus Rodriguez", "Professional Photographer", "User");
?>

<style>
.profile-hero { 
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
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
.service-card {
    border-left: 4px solid #28a745;
    transition: all 0.3s ease;
}
.service-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
}
.equipment-badge {
    background: linear-gradient(45deg, #28a745, #20c997);
    color: white;
    border: none;
}
</style>

<div class="d-flex">
    <?php echo renderSidebar('User', getUserSidebarItems(), 'photographer.php'); ?>
    
    <div class="main-content flex-grow-1">
        <!-- Profile Hero Section -->
        <div class="profile-hero">
            <div class="container-fluid">
                <div class="row align-items-center">
                    <div class="col-md-3 text-center">
                        <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face" 
                             class="rounded-circle profile-image mb-3" alt="Marcus Rodriguez">
                        <div class="text-center">
                            <span class="badge bg-success">Available for Bookings</span>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h1 class="fw-bold mb-2">Marcus Rodriguez</h1>
                        <p class="fs-5 mb-3">Fashion & Portrait Photographer</p>
                        <div class="mb-3">
                            <span class="badge bg-light text-dark me-2">Fashion</span>
                            <span class="badge bg-light text-dark me-2">Portrait</span>
                            <span class="badge bg-light text-dark me-2">Commercial</span>
                            <span class="badge bg-light text-dark me-2">Editorial</span>
                        </div>
                        <div class="row text-center">
                            <div class="col-3">
                                <div class="stat-card p-3 text-center">
                                    <h4 class="fw-bold mb-1">4.9★</h4>
                                    <small>Rating</small>
                                </div>
                            </div>
                            <div class="col-3">
                                <div class="stat-card p-3 text-center">
                                    <h4 class="fw-bold mb-1">234</h4>
                                    <small>Projects</small>
                                </div>
                            </div>
                            <div class="col-3">
                                <div class="stat-card p-3 text-center">
                                    <h4 class="fw-bold mb-1">8</h4>
                                    <small>Years Exp</small>
                                </div>
                            </div>
                            <div class="col-3">
                                <div class="stat-card p-3 text-center">
                                    <h4 class="fw-bold mb-1">LA</h4>
                                    <small>Based</small>
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
                                <i class="fas fa-camera me-2"></i> Upload Work
                            </button>
                            <button class="btn btn-outline-light">
                                <i class="fas fa-calendar me-2"></i> Manage Calendar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <?php 
        echo createBreadcrumb([
            ['label' => 'User', 'href' => 'index.php'],
            ['label' => 'Marcus Rodriguez Profile']
        ]);
        ?>

        <!-- Dashboard Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Active Bookings', '7', 'fas fa-calendar-check', 'success');
            echo createStatCard('Portfolio Views', '3,456', 'fas fa-eye', 'primary');
            echo createStatCard('Monthly Revenue', '$12,340', 'fas fa-dollar-sign', 'warning');
            echo createStatCard('Client Reviews', '4.9★', 'fas fa-star', 'info');
            ?>
        </div>

        <!-- Main Content Row -->
        <div class="row">
            <!-- Left Column - Portfolio & Services -->
            <div class="col-lg-8">
                <!-- Recent Work -->
                <?php echo createCard(
                    "Recent Work",
                    '
                    <div class="row g-3">
                        <div class="col-md-4">
                            <div class="position-relative">
                                <img src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=300&h=400&fit=crop" 
                                     class="img-fluid rounded" alt="Fashion Photography">
                                <div class="position-absolute top-0 end-0 m-2">
                                    <span class="badge bg-success">Fashion</span>
                                </div>
                                <div class="mt-2">
                                    <h6 class="mb-1">Vogue Editorial Shoot</h6>
                                    <small class="text-muted">Fashion Editorial • 3 days ago</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="position-relative">
                                <img src="https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=300&h=400&fit=crop" 
                                     class="img-fluid rounded" alt="Portrait Photography">
                                <div class="position-absolute top-0 end-0 m-2">
                                    <span class="badge bg-info">Portrait</span>
                                </div>
                                <div class="mt-2">
                                    <h6 class="mb-1">Executive Portraits</h6>
                                    <small class="text-muted">Corporate Portrait • 1 week ago</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="position-relative">
                                <img src="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=300&h=400&fit=crop" 
                                     class="img-fluid rounded" alt="Commercial Photography">
                                <div class="position-absolute top-0 end-0 m-2">
                                    <span class="badge bg-warning">Commercial</span>
                                </div>
                                <div class="mt-2">
                                    <h6 class="mb-1">Nike Campaign</h6>
                                    <small class="text-muted">Commercial Shoot • 2 weeks ago</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    ',
                    '<a href="portfolio/index.php" class="btn btn-outline-success">View Full Portfolio</a>'
                ); ?>

                <!-- Service Packages -->
                <div class="mt-4">
                    <?php echo createCard(
                        "Service Packages",
                        '
                        <div class="row g-3">
                            <div class="col-md-6">
                                <div class="card service-card h-100">
                                    <div class="card-body">
                                        <h5 class="text-success">Fashion Editorial</h5>
                                        <p class="text-muted mb-3">Professional fashion photography with creative direction and post-processing.</p>
                                        <ul class="list-unstyled small">
                                            <li><i class="fas fa-check text-success me-2"></i> 4-hour studio session</li>
                                            <li><i class="fas fa-check text-success me-2"></i> Professional lighting setup</li>
                                            <li><i class="fas fa-check text-success me-2"></i> 50+ edited high-res images</li>
                                            <li><i class="fas fa-check text-success me-2"></i> Creative direction included</li>
                                        </ul>
                                        <div class="d-flex justify-content-between align-items-center">
                                            <span class="h4 text-success">$1,200</span>
                                            <button class="btn btn-outline-success btn-sm">Book Now</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card service-card h-100">
                                    <div class="card-body">
                                        <h5 class="text-success">Portrait Session</h5>
                                        <p class="text-muted mb-3">Professional headshots and portrait photography for personal branding.</p>
                                        <ul class="list-unstyled small">
                                            <li><i class="fas fa-check text-success me-2"></i> 2-hour session</li>
                                            <li><i class="fas fa-check text-success me-2"></i> Multiple background options</li>
                                            <li><i class="fas fa-check text-success me-2"></i> 25+ edited images</li>
                                            <li><i class="fas fa-check text-success me-2"></i> Same-day preview</li>
                                        </ul>
                                        <div class="d-flex justify-content-between align-items-center">
                                            <span class="h4 text-success">$650</span>
                                            <button class="btn btn-outline-success btn-sm">Book Now</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        '
                    ); ?>
                </div>

                <!-- Recent Bookings -->
                <div class="mt-4">
                    <?php
                    $headers = ['Client', 'Service', 'Date', 'Status', 'Fee'];
                    $rows = [
                        ['Vogue Magazine', 'Fashion Editorial', 'Tomorrow', '<span class="badge bg-success">Confirmed</span>', '$2,500'],
                        ['Elite Models', 'Portfolio Shoot', 'Dec 15', '<span class="badge bg-warning">Pending</span>', '$1,800'],
                        ['Nike Inc.', 'Commercial Campaign', 'Dec 20', '<span class="badge bg-info">Booked</span>', '$5,000'],
                        ['Independent Model', 'Headshots', 'Dec 22', '<span class="badge bg-success">Confirmed</span>', '$650'],
                        ['H&M Fashion', 'Lookbook Shoot', 'Dec 28', '<span class="badge bg-warning">Quote Sent</span>', '$3,200']
                    ];
                    echo createDataTable('Upcoming Bookings', $headers, $rows, false);
                    ?>
                </div>
            </div>

            <!-- Right Column - Studio Info & Equipment -->
            <div class="col-lg-4">
                <!-- Studio Information -->
                <?php echo createCard(
                    "Studio Information",
                    '
                    <div class="text-center mb-3">
                        <img src="https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=300&h=200&fit=crop" 
                             class="img-fluid rounded" alt="Studio">
                    </div>
                    <h6 class="fw-bold mb-3">Rodriguez Photography Studio</h6>
                    <div class="mb-3">
                        <small class="text-muted d-block">
                            <i class="fas fa-map-marker-alt me-2"></i> 1234 Sunset Blvd, Los Angeles, CA<br>
                            <i class="fas fa-ruler-combined me-2"></i> 2,500 sq ft professional space<br>
                            <i class="fas fa-car me-2"></i> Parking available<br>
                            <i class="fas fa-wifi me-2"></i> High-speed internet<br>
                            <i class="fas fa-coffee me-2"></i> Client lounge & refreshments
                        </small>
                    </div>
                    <hr>
                    <h6 class="fw-bold mb-3">Studio Features</h6>
                    <div class="d-flex flex-wrap gap-2">
                        <span class="badge equipment-badge">Natural Light</span>
                        <span class="badge equipment-badge">Seamless Backdrops</span>
                        <span class="badge equipment-badge">Changing Room</span>
                        <span class="badge equipment-badge">Makeup Station</span>
                        <span class="badge equipment-badge">Props Library</span>
                    </div>
                    '
                ); ?>

                <!-- Equipment -->
                <div class="mt-3">
                    <?php echo createCard(
                        "Professional Equipment",
                        '
                        <h6 class="fw-bold mb-3">Cameras & Lenses</h6>
                        <ul class="list-unstyled small mb-3">
                            <li class="mb-1"><i class="fas fa-camera text-success me-2"></i> Canon EOS R5 (Primary)</li>
                            <li class="mb-1"><i class="fas fa-camera text-success me-2"></i> Canon EOS 5D Mark IV (Backup)</li>
                            <li class="mb-1"><i class="fas fa-search text-info me-2"></i> 24-70mm f/2.8L</li>
                            <li class="mb-1"><i class="fas fa-search text-info me-2"></i> 85mm f/1.2L (Portrait)</li>
                            <li class="mb-1"><i class="fas fa-search text-info me-2"></i> 16-35mm f/2.8L (Wide)</li>
                        </ul>
                        
                        <h6 class="fw-bold mb-3">Lighting Equipment</h6>
                        <ul class="list-unstyled small">
                            <li class="mb-1"><i class="fas fa-lightbulb text-warning me-2"></i> Profoto B1X Flash Kit</li>
                            <li class="mb-1"><i class="fas fa-lightbulb text-warning me-2"></i> Continuous LED Panel Setup</li>
                            <li class="mb-1"><i class="fas fa-lightbulb text-warning me-2"></i> Softboxes & Umbrellas</li>
                            <li class="mb-1"><i class="fas fa-lightbulb text-warning me-2"></i> Beauty Dish & Reflectors</li>
                        </ul>
                        '
                    ); ?>
                </div>

                <!-- Availability Calendar -->
                <div class="mt-3">
                    <?php echo createCard(
                        "This Week's Schedule",
                        '
                        <div class="mb-3">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="small fw-bold">Monday</span>
                                <span class="badge bg-success">Available</span>
                            </div>
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="small fw-bold">Tuesday</span>
                                <span class="badge bg-danger">Vogue Shoot</span>
                            </div>
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="small fw-bold">Wednesday</span>
                                <span class="badge bg-success">Available</span>
                            </div>
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="small fw-bold">Thursday</span>
                                <span class="badge bg-warning">Nike Shoot</span>
                            </div>
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="small fw-bold">Friday</span>
                                <span class="badge bg-success">Available</span>
                            </div>
                        </div>
                        <div class="text-center">
                            <a href="calendar/index.php" class="btn btn-outline-success btn-sm">View Full Calendar</a>
                        </div>
                        '
                    ); ?>
                </div>
            </div>
        </div>
    </div>
</div>

<?php echo renderFooter(); ?>