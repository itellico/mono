<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Marketplace - Go Models NYC", "Admin User", "Marketplace Admin", "Tenant");
?>

<div class="d-flex">
    <?php echo renderSidebar('Tenant', getTenantSidebarItems(), 'marketplace/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Tenant', 'href' => '../index.php'],
            ['label' => 'Marketplace']
        ]);
        
        echo createHeroSection(
            "Talent Marketplace Hub",
            "Manage gigs, jobs, bookings, and connect talent with opportunities. Create a thriving marketplace ecosystem for your platform.",
            "https://images.unsplash.com/photo-1556745757-8d76bdb6984b?w=1200&h=300&fit=crop",
            [
                ['label' => 'Post Gig', 'icon' => 'fas fa-briefcase', 'style' => 'success'],
                ['label' => 'Create Job', 'icon' => 'fas fa-user-tie', 'style' => 'info'],
                ['label' => 'Manage Bookings', 'icon' => 'fas fa-calendar-check', 'style' => 'warning'],
                ['label' => 'Marketplace Analytics', 'icon' => 'fas fa-chart-pie', 'style' => 'primary']
            ]
        );
        ?>
        
        <!-- Marketplace Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Active Gigs', '47', 'fas fa-briefcase', 'primary');
            echo createStatCard('Job Listings', '23', 'fas fa-user-tie', 'success');
            echo createStatCard('Total Bookings', '189', 'fas fa-calendar-check', 'info');
            echo createStatCard('Revenue (MTD)', '$24,580', 'fas fa-dollar-sign', 'warning');
            ?>
        </div>

        <!-- Quick Actions & Filters -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-md-4">
                                <div class="input-group">
                                    <span class="input-group-text"><i class="fas fa-search"></i></span>
                                    <input type="text" class="form-control" id="searchMarketplace" placeholder="Search gigs, jobs, bookings...">
                                </div>
                            </div>
                            <div class="col-md-2">
                                <select class="form-select" id="filterType">
                                    <option value="">All Types</option>
                                    <option value="gigs">Gigs</option>
                                    <option value="jobs">Jobs</option>
                                    <option value="bookings">Bookings</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <select class="form-select" id="filterStatus">
                                    <option value="">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="pending">Pending</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div class="col-md-4">
                                <div class="btn-group">
                                    <button class="btn btn-success" onclick="createGig()">
                                        <i class="fas fa-briefcase me-2"></i>Post Gig
                                    </button>
                                    <button class="btn btn-info" onclick="createJob()">
                                        <i class="fas fa-user-tie me-2"></i>Create Job
                                    </button>
                                    <button class="btn btn-warning" onclick="manageBookings()">
                                        <i class="fas fa-calendar-check me-2"></i>Bookings
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Marketplace Tabs -->
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <ul class="nav nav-tabs card-header-tabs" role="tablist">
                            <li class="nav-item">
                                <a class="nav-link active" id="gigs-tab" data-bs-toggle="tab" href="#gigs" role="tab">
                                    <i class="fas fa-briefcase me-2"></i>Gigs (47)
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" id="jobs-tab" data-bs-toggle="tab" href="#jobs" role="tab">
                                    <i class="fas fa-user-tie me-2"></i>Jobs (23)
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" id="bookings-tab" data-bs-toggle="tab" href="#bookings" role="tab">
                                    <i class="fas fa-calendar-check me-2"></i>Bookings (189)
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" id="analytics-tab" data-bs-toggle="tab" href="#analytics" role="tab">
                                    <i class="fas fa-chart-bar me-2"></i>Analytics
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div class="card-body">
                        <div class="tab-content">
                            <!-- Gigs Tab -->
                            <div class="tab-pane fade show active" id="gigs" role="tabpanel">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <h5>Active Gigs</h5>
                                    <button class="btn btn-success" onclick="createGig()">
                                        <i class="fas fa-plus me-2"></i>Post New Gig
                                    </button>
                                </div>
                                
                                <div class="row" id="gigsGrid">
                                    <!-- Gig Card 1 -->
                                    <div class="col-lg-6 col-xl-4 mb-4">
                                        <div class="card h-100 gig-card" data-gig-id="fashion-shoot-001">
                                            <div class="position-relative">
                                                <img src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=200&fit=crop" class="card-img-top" alt="Fashion Shoot">
                                                <div class="position-absolute top-0 end-0 p-2">
                                                    <span class="badge bg-success">Active</span>
                                                </div>
                                                <div class="position-absolute bottom-0 start-0 p-2">
                                                    <span class="badge bg-primary">$2,500 - $3,500</span>
                                                </div>
                                            </div>
                                            <div class="card-body">
                                                <h6 class="card-title">High-End Fashion Shoot</h6>
                                                <p class="card-text small text-muted mb-2">
                                                    <i class="fas fa-map-marker-alt me-1"></i>New York, NY
                                                    <span class="ms-3"><i class="fas fa-calendar me-1"></i>Feb 15-16, 2024</span>
                                                </p>
                                                <p class="card-text small mb-3">Looking for experienced fashion models for luxury brand photoshoot. Must have editorial experience...</p>
                                                
                                                <div class="row text-center mb-3">
                                                    <div class="col-4">
                                                        <strong>23</strong><br>
                                                        <small class="text-muted">Applicants</small>
                                                    </div>
                                                    <div class="col-4">
                                                        <strong>5</strong><br>
                                                        <small class="text-muted">Shortlisted</small>
                                                    </div>
                                                    <div class="col-4">
                                                        <strong>2</strong><br>
                                                        <small class="text-muted">Booked</small>
                                                    </div>
                                                </div>
                                                
                                                <div class="d-flex gap-1">
                                                    <button class="btn btn-outline-primary btn-sm flex-fill" onclick="viewGigDetails('fashion-shoot-001')">
                                                        <i class="fas fa-eye"></i> View
                                                    </button>
                                                    <button class="btn btn-outline-warning btn-sm flex-fill" onclick="editGig('fashion-shoot-001')">
                                                        <i class="fas fa-edit"></i> Edit
                                                    </button>
                                                    <button class="btn btn-outline-success btn-sm flex-fill" onclick="manageApplications('fashion-shoot-001')">
                                                        <i class="fas fa-users"></i> Apps
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Gig Card 2 -->
                                    <div class="col-lg-6 col-xl-4 mb-4">
                                        <div class="card h-100 gig-card" data-gig-id="commercial-video-002">
                                            <div class="position-relative">
                                                <img src="https://images.unsplash.com/photo-1492681290082-e932832941e6?w=400&h=200&fit=crop" class="card-img-top" alt="Commercial Video">
                                                <div class="position-absolute top-0 end-0 p-2">
                                                    <span class="badge bg-warning">Urgent</span>
                                                </div>
                                                <div class="position-absolute bottom-0 start-0 p-2">
                                                    <span class="badge bg-success">$1,200/day</span>
                                                </div>
                                            </div>
                                            <div class="card-body">
                                                <h6 class="card-title">Tech Commercial Video</h6>
                                                <p class="card-text small text-muted mb-2">
                                                    <i class="fas fa-map-marker-alt me-1"></i>Los Angeles, CA
                                                    <span class="ms-3"><i class="fas fa-calendar me-1"></i>Feb 20, 2024</span>
                                                </p>
                                                <p class="card-text small mb-3">Need diverse talent for tech startup commercial. Looking for authentic, relatable people...</p>
                                                
                                                <div class="row text-center mb-3">
                                                    <div class="col-4">
                                                        <strong>45</strong><br>
                                                        <small class="text-muted">Applicants</small>
                                                    </div>
                                                    <div class="col-4">
                                                        <strong>12</strong><br>
                                                        <small class="text-muted">Shortlisted</small>
                                                    </div>
                                                    <div class="col-4">
                                                        <strong>0</strong><br>
                                                        <small class="text-muted">Booked</small>
                                                    </div>
                                                </div>
                                                
                                                <div class="d-flex gap-1">
                                                    <button class="btn btn-outline-primary btn-sm flex-fill" onclick="viewGigDetails('commercial-video-002')">
                                                        <i class="fas fa-eye"></i> View
                                                    </button>
                                                    <button class="btn btn-outline-warning btn-sm flex-fill" onclick="editGig('commercial-video-002')">
                                                        <i class="fas fa-edit"></i> Edit
                                                    </button>
                                                    <button class="btn btn-outline-success btn-sm flex-fill" onclick="manageApplications('commercial-video-002')">
                                                        <i class="fas fa-users"></i> Apps
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Gig Card 3 -->
                                    <div class="col-lg-6 col-xl-4 mb-4">
                                        <div class="card h-100 gig-card" data-gig-id="fitness-campaign-003">
                                            <div class="position-relative">
                                                <img src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=200&fit=crop" class="card-img-top" alt="Fitness Campaign">
                                                <div class="position-absolute top-0 end-0 p-2">
                                                    <span class="badge bg-info">Ongoing</span>
                                                </div>
                                                <div class="position-absolute bottom-0 start-0 p-2">
                                                    <span class="badge bg-warning">$800-1,500</span>
                                                </div>
                                            </div>
                                            <div class="card-body">
                                                <h6 class="card-title">Fitness Brand Campaign</h6>
                                                <p class="card-text small text-muted mb-2">
                                                    <i class="fas fa-map-marker-alt me-1"></i>Miami, FL
                                                    <span class="ms-3"><i class="fas fa-calendar me-1"></i>Mar 1-15, 2024</span>
                                                </p>
                                                <p class="card-text small mb-3">Seeking athletic models for fitness apparel campaign. Multiple shoots and events...</p>
                                                
                                                <div class="row text-center mb-3">
                                                    <div class="col-4">
                                                        <strong>67</strong><br>
                                                        <small class="text-muted">Applicants</small>
                                                    </div>
                                                    <div class="col-4">
                                                        <strong>15</strong><br>
                                                        <small class="text-muted">Shortlisted</small>
                                                    </div>
                                                    <div class="col-4">
                                                        <strong>8</strong><br>
                                                        <small class="text-muted">Booked</small>
                                                    </div>
                                                </div>
                                                
                                                <div class="d-flex gap-1">
                                                    <button class="btn btn-outline-primary btn-sm flex-fill" onclick="viewGigDetails('fitness-campaign-003')">
                                                        <i class="fas fa-eye"></i> View
                                                    </button>
                                                    <button class="btn btn-outline-warning btn-sm flex-fill" onclick="editGig('fitness-campaign-003')">
                                                        <i class="fas fa-edit"></i> Edit
                                                    </button>
                                                    <button class="btn btn-outline-success btn-sm flex-fill" onclick="manageApplications('fitness-campaign-003')">
                                                        <i class="fas fa-users"></i> Apps
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Jobs Tab -->
                            <div class="tab-pane fade" id="jobs" role="tabpanel">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <h5>Job Listings</h5>
                                    <button class="btn btn-success" onclick="createJob()">
                                        <i class="fas fa-plus me-2"></i>Create Job Listing
                                    </button>
                                </div>
                                
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Job Title</th>
                                                <th>Company</th>
                                                <th>Location</th>
                                                <th>Type</th>
                                                <th>Salary</th>
                                                <th>Applications</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>
                                                    <strong>Senior Fashion Model</strong><br>
                                                    <small class="text-muted">High-end fashion and runway</small>
                                                </td>
                                                <td>Elite Fashion Agency</td>
                                                <td>New York, NY</td>
                                                <td><span class="badge bg-info">Full-time</span></td>
                                                <td>$85K - $120K</td>
                                                <td>
                                                    <strong>34</strong> applications<br>
                                                    <small class="text-muted">12 qualified</small>
                                                </td>
                                                <td><span class="badge bg-success">Active</span></td>
                                                <td>
                                                    <div class="btn-group btn-group-sm">
                                                        <button class="btn btn-outline-primary" onclick="viewJobDetails('job-001')">
                                                            <i class="fas fa-eye"></i>
                                                        </button>
                                                        <button class="btn btn-outline-warning" onclick="editJob('job-001')">
                                                            <i class="fas fa-edit"></i>
                                                        </button>
                                                        <button class="btn btn-outline-success" onclick="manageJobApplications('job-001')">
                                                            <i class="fas fa-users"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <strong>Commercial Actor</strong><br>
                                                    <small class="text-muted">TV commercials and digital ads</small>
                                                </td>
                                                <td>Prime Talent Group</td>
                                                <td>Los Angeles, CA</td>
                                                <td><span class="badge bg-warning">Contract</span></td>
                                                <td>$2,500/project</td>
                                                <td>
                                                    <strong>67</strong> applications<br>
                                                    <small class="text-muted">23 qualified</small>
                                                </td>
                                                <td><span class="badge bg-success">Active</span></td>
                                                <td>
                                                    <div class="btn-group btn-group-sm">
                                                        <button class="btn btn-outline-primary" onclick="viewJobDetails('job-002')">
                                                            <i class="fas fa-eye"></i>
                                                        </button>
                                                        <button class="btn btn-outline-warning" onclick="editJob('job-002')">
                                                            <i class="fas fa-edit"></i>
                                                        </button>
                                                        <button class="btn btn-outline-success" onclick="manageJobApplications('job-002')">
                                                            <i class="fas fa-users"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <strong>Brand Ambassador</strong><br>
                                                    <small class="text-muted">Event representation and promotion</small>
                                                </td>
                                                <td>Dynamic Events Co.</td>
                                                <td>Chicago, IL</td>
                                                <td><span class="badge bg-success">Part-time</span></td>
                                                <td>$25-35/hour</td>
                                                <td>
                                                    <strong>89</strong> applications<br>
                                                    <small class="text-muted">31 qualified</small>
                                                </td>
                                                <td><span class="badge bg-warning">Closing Soon</span></td>
                                                <td>
                                                    <div class="btn-group btn-group-sm">
                                                        <button class="btn btn-outline-primary" onclick="viewJobDetails('job-003')">
                                                            <i class="fas fa-eye"></i>
                                                        </button>
                                                        <button class="btn btn-outline-warning" onclick="editJob('job-003')">
                                                            <i class="fas fa-edit"></i>
                                                        </button>
                                                        <button class="btn btn-outline-success" onclick="manageJobApplications('job-003')">
                                                            <i class="fas fa-users"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <!-- Bookings Tab -->
                            <div class="tab-pane fade" id="bookings" role="tabpanel">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <h5>Recent Bookings</h5>
                                    <div class="btn-group">
                                        <button class="btn btn-outline-primary" onclick="viewCalendar()">
                                            <i class="fas fa-calendar me-2"></i>Calendar View
                                        </button>
                                        <button class="btn btn-success" onclick="createBooking()">
                                            <i class="fas fa-plus me-2"></i>New Booking
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-6 col-lg-4 mb-3">
                                        <div class="card booking-card border-start border-success border-4">
                                            <div class="card-body">
                                                <div class="d-flex justify-content-between align-items-start mb-2">
                                                    <h6 class="card-title mb-0">Fashion Week Runway</h6>
                                                    <span class="badge bg-success">Confirmed</span>
                                                </div>
                                                <p class="text-muted small mb-2">
                                                    <i class="fas fa-user me-1"></i>Sarah Johnson<br>
                                                    <i class="fas fa-calendar me-1"></i>Feb 15, 2024 - 6:00 PM<br>
                                                    <i class="fas fa-map-marker-alt me-1"></i>Lincoln Center, NYC
                                                </p>
                                                <div class="d-flex justify-content-between align-items-center">
                                                    <strong class="text-success">$3,500</strong>
                                                    <div class="btn-group btn-group-sm">
                                                        <button class="btn btn-outline-info" onclick="viewBookingDetails('booking-001')">
                                                            <i class="fas fa-eye"></i>
                                                        </button>
                                                        <button class="btn btn-outline-warning" onclick="editBooking('booking-001')">
                                                            <i class="fas fa-edit"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="col-md-6 col-lg-4 mb-3">
                                        <div class="card booking-card border-start border-warning border-4">
                                            <div class="card-body">
                                                <div class="d-flex justify-content-between align-items-start mb-2">
                                                    <h6 class="card-title mb-0">Beauty Campaign Shoot</h6>
                                                    <span class="badge bg-warning">Pending</span>
                                                </div>
                                                <p class="text-muted small mb-2">
                                                    <i class="fas fa-user me-1"></i>Michael Chen<br>
                                                    <i class="fas fa-calendar me-1"></i>Feb 18, 2024 - 9:00 AM<br>
                                                    <i class="fas fa-map-marker-alt me-1"></i>Studio Downtown, LA
                                                </p>
                                                <div class="d-flex justify-content-between align-items-center">
                                                    <strong class="text-warning">$2,200</strong>
                                                    <div class="btn-group btn-group-sm">
                                                        <button class="btn btn-outline-info" onclick="viewBookingDetails('booking-002')">
                                                            <i class="fas fa-eye"></i>
                                                        </button>
                                                        <button class="btn btn-outline-warning" onclick="editBooking('booking-002')">
                                                            <i class="fas fa-edit"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="col-md-6 col-lg-4 mb-3">
                                        <div class="card booking-card border-start border-primary border-4">
                                            <div class="card-body">
                                                <div class="d-flex justify-content-between align-items-start mb-2">
                                                    <h6 class="card-title mb-0">Commercial Video</h6>
                                                    <span class="badge bg-primary">In Progress</span>
                                                </div>
                                                <p class="text-muted small mb-2">
                                                    <i class="fas fa-user me-1"></i>Emma Rodriguez<br>
                                                    <i class="fas fa-calendar me-1"></i>Feb 16, 2024 - 2:00 PM<br>
                                                    <i class="fas fa-map-marker-alt me-1"></i>Production Studio, Miami
                                                </p>
                                                <div class="d-flex justify-content-between align-items-center">
                                                    <strong class="text-primary">$1,800</strong>
                                                    <div class="btn-group btn-group-sm">
                                                        <button class="btn btn-outline-info" onclick="viewBookingDetails('booking-003')">
                                                            <i class="fas fa-eye"></i>
                                                        </button>
                                                        <button class="btn btn-outline-warning" onclick="editBooking('booking-003')">
                                                            <i class="fas fa-edit"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="col-md-6 col-lg-4 mb-3">
                                        <div class="card booking-card border-start border-info border-4">
                                            <div class="card-body">
                                                <div class="d-flex justify-content-between align-items-start mb-2">
                                                    <h6 class="card-title mb-0">Editorial Photo Shoot</h6>
                                                    <span class="badge bg-info">Scheduled</span>
                                                </div>
                                                <p class="text-muted small mb-2">
                                                    <i class="fas fa-user me-1"></i>David Kim<br>
                                                    <i class="fas fa-calendar me-1"></i>Feb 25, 2024 - 11:00 AM<br>
                                                    <i class="fas fa-map-marker-alt me-1"></i>Rooftop Studio, Chicago
                                                </p>
                                                <div class="d-flex justify-content-between align-items-center">
                                                    <strong class="text-info">$2,800</strong>
                                                    <div class="btn-group btn-group-sm">
                                                        <button class="btn btn-outline-info" onclick="viewBookingDetails('booking-004')">
                                                            <i class="fas fa-eye"></i>
                                                        </button>
                                                        <button class="btn btn-outline-warning" onclick="editBooking('booking-004')">
                                                            <i class="fas fa-edit"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="col-md-6 col-lg-4 mb-3">
                                        <div class="card booking-card border-start border-secondary border-4">
                                            <div class="card-body">
                                                <div class="d-flex justify-content-between align-items-start mb-2">
                                                    <h6 class="card-title mb-0">Event Hosting</h6>
                                                    <span class="badge bg-secondary">Completed</span>
                                                </div>
                                                <p class="text-muted small mb-2">
                                                    <i class="fas fa-user me-1"></i>Lisa Park<br>
                                                    <i class="fas fa-calendar me-1"></i>Feb 10, 2024 - 7:00 PM<br>
                                                    <i class="fas fa-map-marker-alt me-1"></i>Grand Ballroom, NYC
                                                </p>
                                                <div class="d-flex justify-content-between align-items-center">
                                                    <strong class="text-secondary">$4,200</strong>
                                                    <div class="btn-group btn-group-sm">
                                                        <button class="btn btn-outline-info" onclick="viewBookingDetails('booking-005')">
                                                            <i class="fas fa-eye"></i>
                                                        </button>
                                                        <button class="btn btn-outline-success" onclick="viewInvoice('booking-005')">
                                                            <i class="fas fa-file-invoice"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="col-md-6 col-lg-4 mb-3">
                                        <div class="card booking-card border-start border-danger border-4">
                                            <div class="card-body">
                                                <div class="d-flex justify-content-between align-items-start mb-2">
                                                    <h6 class="card-title mb-0">Fitness Campaign</h6>
                                                    <span class="badge bg-danger">Cancelled</span>
                                                </div>
                                                <p class="text-muted small mb-2">
                                                    <i class="fas fa-user me-1"></i>Alex Thompson<br>
                                                    <i class="fas fa-calendar me-1"></i>Feb 12, 2024 - 3:00 PM<br>
                                                    <i class="fas fa-map-marker-alt me-1"></i>Gym Studio, Denver
                                                </p>
                                                <div class="d-flex justify-content-between align-items-center">
                                                    <strong class="text-danger">$1,500</strong>
                                                    <div class="btn-group btn-group-sm">
                                                        <button class="btn btn-outline-info" onclick="viewBookingDetails('booking-006')">
                                                            <i class="fas fa-eye"></i>
                                                        </button>
                                                        <button class="btn btn-outline-secondary" onclick="viewCancellation('booking-006')">
                                                            <i class="fas fa-ban"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Analytics Tab -->
                            <div class="tab-pane fade" id="analytics" role="tabpanel">
                                <h5 class="mb-4">Marketplace Analytics</h5>
                                
                                <div class="row mb-4">
                                    <div class="col-lg-6">
                                        <div class="card">
                                            <div class="card-header">
                                                <h6 class="mb-0">Revenue Trends</h6>
                                            </div>
                                            <div class="card-body">
                                                <canvas id="revenueChart" height="200"></canvas>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-lg-6">
                                        <div class="card">
                                            <div class="card-header">
                                                <h6 class="mb-0">Booking Status Distribution</h6>
                                            </div>
                                            <div class="card-body">
                                                <canvas id="bookingStatusChart" height="200"></canvas>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="row">
                                    <div class="col-lg-8">
                                        <div class="card">
                                            <div class="card-header">
                                                <h6 class="mb-0">Top Performing Gigs</h6>
                                            </div>
                                            <div class="card-body">
                                                <div class="table-responsive">
                                                    <table class="table table-sm">
                                                        <thead>
                                                            <tr>
                                                                <th>Gig Title</th>
                                                                <th>Applications</th>
                                                                <th>Bookings</th>
                                                                <th>Revenue</th>
                                                                <th>Success Rate</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            <tr>
                                                                <td>High-End Fashion Shoot</td>
                                                                <td>23</td>
                                                                <td>2</td>
                                                                <td>$6,000</td>
                                                                <td><span class="badge bg-success">87%</span></td>
                                                            </tr>
                                                            <tr>
                                                                <td>Fitness Brand Campaign</td>
                                                                <td>67</td>
                                                                <td>8</td>
                                                                <td>$10,400</td>
                                                                <td><span class="badge bg-success">75%</span></td>
                                                            </tr>
                                                            <tr>
                                                                <td>Tech Commercial Video</td>
                                                                <td>45</td>
                                                                <td>0</td>
                                                                <td>$0</td>
                                                                <td><span class="badge bg-warning">Pending</span></td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-lg-4">
                                        <div class="card">
                                            <div class="card-header">
                                                <h6 class="mb-0">Quick Stats</h6>
                                            </div>
                                            <div class="card-body">
                                                <div class="d-flex justify-content-between mb-3">
                                                    <span>Avg. Application Rate:</span>
                                                    <strong>45 per gig</strong>
                                                </div>
                                                <div class="d-flex justify-content-between mb-3">
                                                    <span>Avg. Booking Rate:</span>
                                                    <strong>18%</strong>
                                                </div>
                                                <div class="d-flex justify-content-between mb-3">
                                                    <span>Avg. Gig Value:</span>
                                                    <strong>$2,750</strong>
                                                </div>
                                                <div class="d-flex justify-content-between mb-3">
                                                    <span>Platform Commission:</span>
                                                    <strong>15%</strong>
                                                </div>
                                                <div class="d-flex justify-content-between">
                                                    <span>Monthly Revenue:</span>
                                                    <strong class="text-success">$24,580</strong>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Create Gig Modal -->
<div class="modal fade" id="createGigModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Post New Gig</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form id="createGigForm">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Gig Title *</label>
                                <input type="text" class="form-control" id="gigTitle" placeholder="e.g., Fashion Photo Shoot">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Category *</label>
                                <select class="form-select" id="gigCategory">
                                    <option value="fashion">Fashion</option>
                                    <option value="commercial">Commercial</option>
                                    <option value="editorial">Editorial</option>
                                    <option value="fitness">Fitness</option>
                                    <option value="beauty">Beauty</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Description *</label>
                        <textarea class="form-control" id="gigDescription" rows="4" placeholder="Describe the gig, requirements, and expectations..."></textarea>
                    </div>
                    <div class="row">
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">Budget Range *</label>
                                <input type="text" class="form-control" id="gigBudget" placeholder="e.g., $2,500 - $3,500">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">Location *</label>
                                <input type="text" class="form-control" id="gigLocation" placeholder="e.g., New York, NY">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">Date *</label>
                                <input type="date" class="form-control" id="gigDate">
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-success" onclick="submitGig()">Post Gig</button>
            </div>
        </div>
    </div>
</div>

<script>
// Marketplace Management JavaScript
let currentMarketplaceTab = 'gigs';

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    console.log('ClickDami Marketplace - Fully Interactive Version Loaded');
});

// Gig Management Functions
function createGig() {
    const modal = new bootstrap.Modal(document.getElementById('createGigModal'));
    modal.show();
}

function submitGig() {
    const title = document.getElementById('gigTitle').value;
    const category = document.getElementById('gigCategory').value;
    const description = document.getElementById('gigDescription').value;
    const budget = document.getElementById('gigBudget').value;
    const location = document.getElementById('gigLocation').value;
    const date = document.getElementById('gigDate').value;
    
    if (!title || !description || !budget || !location || !date) {
        showToast('error', 'Please fill in all required fields');
        return;
    }
    
    // Close modal and reset form
    bootstrap.Modal.getInstance(document.getElementById('createGigModal')).hide();
    document.getElementById('createGigForm').reset();
    
    showToast('success', `Gig "${title}" posted successfully!`);
}

function viewGigDetails(gigId) {
    showToast('info', `Loading gig details for: ${gigId}`);
    // In real implementation, this would open a detailed modal
}

function editGig(gigId) {
    showToast('info', `Edit mode for gig: ${gigId}`);
    // In real implementation, this would open an edit modal
}

function manageApplications(gigId) {
    showToast('info', `Managing applications for gig: ${gigId}`);
    // In real implementation, this would open applications management
}

// Job Management Functions
function createJob() {
    showToast('info', 'Opening job creation form...');
    // In real implementation, this would open a job creation modal
}

function viewJobDetails(jobId) {
    showToast('info', `Loading job details for: ${jobId}`);
    // In real implementation, this would open a detailed modal
}

function editJob(jobId) {
    showToast('info', `Edit mode for job: ${jobId}`);
    // In real implementation, this would open an edit modal
}

function manageJobApplications(jobId) {
    showToast('info', `Managing applications for job: ${jobId}`);
    // In real implementation, this would open applications management
}

// Booking Management Functions
function manageBookings() {
    // Switch to bookings tab
    const bookingsTab = document.getElementById('bookings-tab');
    const tabInstance = new bootstrap.Tab(bookingsTab);
    tabInstance.show();
    
    showToast('info', 'Loading bookings management...');
}

function createBooking() {
    showToast('info', 'Opening booking creation form...');
    // In real implementation, this would open a booking creation modal
}

function viewBookingDetails(bookingId) {
    showToast('info', `Loading booking details for: ${bookingId}`);
    // In real implementation, this would open a detailed modal
}

function editBooking(bookingId) {
    showToast('info', `Edit mode for booking: ${bookingId}`);
    // In real implementation, this would open an edit modal
}

function viewInvoice(bookingId) {
    showToast('success', `Generating invoice for booking: ${bookingId}`);
    // In real implementation, this would generate and display invoice
}

function viewCancellation(bookingId) {
    showToast('info', `Loading cancellation details for: ${bookingId}`);
    // In real implementation, this would show cancellation information
}

function viewCalendar() {
    showToast('info', 'Opening calendar view...');
    // In real implementation, this would open a calendar interface
}

// Toast notification function
function showToast(type, message) {
    const toastHtml = `
        <div class="toast align-items-center text-bg-${type === 'error' ? 'danger' : type === 'info' ? 'info' : 'success'} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'info' ? 'info-circle' : 'check-circle'} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '1090';
        document.body.appendChild(toastContainer);
    }
    
    toastContainer.innerHTML = toastHtml;
    const toastElement = toastContainer.querySelector('.toast');
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}
</script>

<style>
.gig-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    cursor: pointer;
}

.gig-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.booking-card {
    transition: transform 0.2s ease;
}

.booking-card:hover {
    transform: translateY(-1px);
}

.nav-tabs .nav-link {
    color: #495057;
}

.nav-tabs .nav-link.active {
    color: #495057;
    font-weight: 500;
}

.badge {
    font-size: 0.75rem;
}

.btn-group-sm .btn {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
}

.border-4 {
    border-width: 4px !important;
}
</style>

<?php echo renderFooter(); ?>