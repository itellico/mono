<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

$titles = [
    'portfolio' => 'Portfolio Management - User Dashboard',
    'applications' => 'My Applications - User Dashboard', 
    'messages' => 'Messages - User Dashboard',
    'calendar' => 'Calendar - User Dashboard',
    'settings' => 'Settings - User Dashboard'
];

$pageNames = [
    'portfolio' => 'Portfolio Management',
    'applications' => 'My Applications',
    'messages' => 'Messages', 
    'calendar' => 'Calendar',
    'settings' => 'Settings'
];

$currentDir = basename(__DIR__);
echo renderHeader($titles[$currentDir], "Emma Johnson", "Fashion Model", "User");
?>

<style>
.application-card {
    border-left: 4px solid;
    transition: all 0.3s ease;
}
.application-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
}
.application-pending {
    border-left-color: #ffc107;
}
.application-approved {
    border-left-color: #28a745;
}
.application-rejected {
    border-left-color: #dc3545;
}
.application-submitted {
    border-left-color: #17a2b8;
}
.filter-badge {
    cursor: pointer;
    transition: all 0.2s ease;
}
.filter-badge:hover {
    transform: scale(1.05);
}
.filter-badge.active {
    background: #007bff !important;
    color: white !important;
}
.timeline-item {
    position: relative;
    padding-left: 2rem;
}
.timeline-item::before {
    content: '';
    position: absolute;
    left: 0.5rem;
    top: 0.5rem;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #dee2e6;
}
.timeline-item.active::before {
    background: #28a745;
}
</style>

<div class="d-flex">
    <?php echo renderSidebar('User', getUserSidebarItems(), $currentDir . '/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Dashboard', 'href' => '../index.php'],
            ['label' => $pageNames[$currentDir]]
        ]);
        
        echo createHeroSection(
            $pageNames[$currentDir],
            "Manage your " . strtolower($pageNames[$currentDir]),
            "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=1200&h=300&fit=crop"
        );
        ?>
        
        <!-- Dashboard Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Total Applications', '24', 'fas fa-file-alt', 'primary');
            echo createStatCard('Pending Review', '5', 'fas fa-clock', 'warning');
            echo createStatCard('Accepted', '15', 'fas fa-check-circle', 'success');
            echo createStatCard('Success Rate', '78%', 'fas fa-chart-line', 'info');
            ?>
        </div>

        <!-- Filters & Actions -->
        <div class="row mb-4">
            <div class="col-md-8">
                <div class="d-flex flex-wrap gap-2 mb-3">
                    <span class="badge bg-primary filter-badge active" data-filter="all">All Applications</span>
                    <span class="badge bg-outline-warning filter-badge" data-filter="pending">Pending (5)</span>
                    <span class="badge bg-outline-success filter-badge" data-filter="approved">Approved (15)</span>
                    <span class="badge bg-outline-danger filter-badge" data-filter="rejected">Rejected (4)</span>
                    <span class="badge bg-outline-info filter-badge" data-filter="submitted">Just Submitted (3)</span>
                </div>
                <div class="input-group">
                    <input type="text" class="form-control" placeholder="Search applications by client, type, or description..." id="applicationSearch">
                    <button class="btn btn-outline-secondary" type="button">
                        <i class="fas fa-search"></i>
                    </button>
                </div>
            </div>
            <div class="col-md-4 text-end">
                <div class="btn-group" role="group">
                    <button class="btn btn-primary">
                        <i class="fas fa-plus me-2"></i>New Application
                    </button>
                    <button class="btn btn-outline-primary dropdown-toggle" data-bs-toggle="dropdown">
                        <i class="fas fa-cog"></i>
                    </button>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" href="#"><i class="fas fa-download me-2"></i>Export Applications</a></li>
                        <li><a class="dropdown-item" href="#"><i class="fas fa-chart-bar me-2"></i>Analytics Report</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="#"><i class="fas fa-bell me-2"></i>Notification Settings</a></li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- Applications List -->
        <div class="row">
            <div class="col-lg-8">
                <!-- Recent Applications -->
                <div class="mb-4">
                    <!-- Vogue Campaign -->
                    <div class="card application-card application-pending mb-3">
                        <div class="card-body">
                            <div class="row align-items-center">
                                <div class="col-md-2 text-center">
                                    <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=80&h=80&fit=crop" 
                                         class="rounded" style="width: 60px; height: 60px; object-fit: cover;" alt="Vogue">
                                </div>
                                <div class="col-md-6">
                                    <h5 class="card-title mb-1">Vogue Summer Campaign 2024</h5>
                                    <p class="text-muted mb-2">High-fashion editorial shoot for summer collection</p>
                                    <div class="d-flex flex-wrap gap-1">
                                        <span class="badge bg-light text-dark">Fashion</span>
                                        <span class="badge bg-light text-dark">Editorial</span>
                                        <span class="badge bg-light text-dark">Summer</span>
                                        <span class="badge bg-light text-dark">High-Fashion</span>
                                    </div>
                                </div>
                                <div class="col-md-2 text-center">
                                    <span class="badge bg-warning fs-6">Under Review</span>
                                    <small class="d-block text-muted mt-1">Applied 2 days ago</small>
                                </div>
                                <div class="col-md-2 text-center">
                                    <div class="fw-bold text-success">$3,500</div>
                                    <small class="text-muted">Day Rate</small>
                                    <div class="mt-2">
                                        <button class="btn btn-outline-primary btn-sm">View Details</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Nike Campaign -->
                    <div class="card application-card application-approved mb-3">
                        <div class="card-body">
                            <div class="row align-items-center">
                                <div class="col-md-2 text-center">
                                    <img src="https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=80&h=80&fit=crop" 
                                         class="rounded" style="width: 60px; height: 60px; object-fit: cover;" alt="Nike">
                                </div>
                                <div class="col-md-6">
                                    <h5 class="card-title mb-1">Nike Athletic Wear Campaign</h5>
                                    <p class="text-muted mb-2">Commercial photography for new athletic line</p>
                                    <div class="d-flex flex-wrap gap-1">
                                        <span class="badge bg-light text-dark">Commercial</span>
                                        <span class="badge bg-light text-dark">Athletic</span>
                                        <span class="badge bg-light text-dark">Fitness</span>
                                    </div>
                                </div>
                                <div class="col-md-2 text-center">
                                    <span class="badge bg-success fs-6">Booked!</span>
                                    <small class="d-block text-muted mt-1">Confirmed yesterday</small>
                                </div>
                                <div class="col-md-2 text-center">
                                    <div class="fw-bold text-success">$2,800</div>
                                    <small class="text-muted">Day Rate</small>
                                    <div class="mt-2">
                                        <button class="btn btn-success btn-sm">Contract Details</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- H&M Campaign -->
                    <div class="card application-card application-rejected mb-3">
                        <div class="card-body">
                            <div class="row align-items-center">
                                <div class="col-md-2 text-center">
                                    <img src="https://images.unsplash.com/photo-1445205170230-053b83016050?w=80&h=80&fit=crop" 
                                         class="rounded" style="width: 60px; height: 60px; object-fit: cover;" alt="H&M">
                                </div>
                                <div class="col-md-6">
                                    <h5 class="card-title mb-1">H&M Fall Collection 2024</h5>
                                    <p class="text-muted mb-2">Lookbook photography for autumn fashion line</p>
                                    <div class="d-flex flex-wrap gap-1">
                                        <span class="badge bg-light text-dark">Fashion</span>
                                        <span class="badge bg-light text-dark">Lookbook</span>
                                        <span class="badge bg-light text-dark">Fall</span>
                                    </div>
                                </div>
                                <div class="col-md-2 text-center">
                                    <span class="badge bg-danger fs-6">Not Selected</span>
                                    <small class="d-block text-muted mt-1">2 weeks ago</small>
                                </div>
                                <div class="col-md-2 text-center">
                                    <div class="fw-bold text-muted">$2,200</div>
                                    <small class="text-muted">Day Rate</small>
                                    <div class="mt-2">
                                        <button class="btn btn-outline-info btn-sm">View Feedback</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Zara Campaign -->
                    <div class="card application-card application-submitted mb-3">
                        <div class="card-body">
                            <div class="row align-items-center">
                                <div class="col-md-2 text-center">
                                    <img src="https://images.unsplash.com/photo-1560743173-567a3b5658b1?w=80&h=80&fit=crop" 
                                         class="rounded" style="width: 60px; height: 60px; object-fit: cover;" alt="Zara">
                                </div>
                                <div class="col-md-6">
                                    <h5 class="card-title mb-1">Zara Commercial Shoot</h5>
                                    <p class="text-muted mb-2">Studio photography for new campaign</p>
                                    <div class="d-flex flex-wrap gap-1">
                                        <span class="badge bg-light text-dark">Commercial</span>
                                        <span class="badge bg-light text-dark">Studio</span>
                                        <span class="badge bg-light text-dark">Fashion</span>
                                    </div>
                                </div>
                                <div class="col-md-2 text-center">
                                    <span class="badge bg-info fs-6">Just Submitted</span>
                                    <small class="d-block text-muted mt-1">Today</small>
                                </div>
                                <div class="col-md-2 text-center">
                                    <div class="fw-bold text-success">$3,000</div>
                                    <small class="text-muted">Day Rate</small>
                                    <div class="mt-2">
                                        <button class="btn btn-outline-secondary btn-sm">Edit Application</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Load More -->
                <div class="text-center">
                    <button class="btn btn-outline-primary">Load More Applications</button>
                </div>
            </div>

            <!-- Sidebar Info -->
            <div class="col-lg-4">
                <!-- Application Analytics -->
                <?php echo createCard(
                    "Application Analytics",
                    '
                    <div class="mb-4">
                        <h6 class="fw-bold mb-3">Success Metrics</h6>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <span class="small">Response Rate</span>
                                <span class="fw-bold">85%</span>
                            </div>
                            <div class="progress" style="height: 6px;">
                                <div class="progress-bar bg-info" style="width: 85%"></div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <span class="small">Booking Rate</span>
                                <span class="fw-bold">78%</span>
                            </div>
                            <div class="progress" style="height: 6px;">
                                <div class="progress-bar bg-success" style="width: 78%"></div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <span class="small">Profile Views</span>
                                <span class="fw-bold">92%</span>
                            </div>
                            <div class="progress" style="height: 6px;">
                                <div class="progress-bar bg-primary" style="width: 92%"></div>
                            </div>
                        </div>
                    </div>
                    <hr>
                    <div class="text-center">
                        <h4 class="text-primary mb-1">$47,800</h4>
                        <small class="text-muted">Total Earnings (YTD)</small>
                    </div>
                    '
                ); ?>

                <!-- Recent Activity -->
                <div class="mt-3">
                    <?php echo createCard(
                        "Recent Activity",
                        '
                        <div class="timeline">
                            <div class="timeline-item active mb-3">
                                <strong class="d-block">Application Submitted</strong>
                                <small class="text-muted">Zara Commercial Shoot</small>
                                <small class="text-muted d-block">Today, 2:30 PM</small>
                            </div>
                            <div class="timeline-item active mb-3">
                                <strong class="d-block">Booking Confirmed</strong>
                                <small class="text-muted">Nike Athletic Campaign</small>
                                <small class="text-muted d-block">Yesterday, 4:15 PM</small>
                            </div>
                            <div class="timeline-item mb-3">
                                <strong class="d-block">Application Reviewed</strong>
                                <small class="text-muted">Vogue Summer Campaign</small>
                                <small class="text-muted d-block">2 days ago</small>
                            </div>
                            <div class="timeline-item mb-3">
                                <strong class="d-block">Feedback Received</strong>
                                <small class="text-muted">H&M Fall Collection</small>
                                <small class="text-muted d-block">2 weeks ago</small>
                            </div>
                        </div>
                        '
                    ); ?>
                </div>

                <!-- Quick Actions -->
                <div class="mt-3">
                    <?php echo createCard(
                        "Quick Actions",
                        '
                        <div class="d-grid gap-2">
                            <button class="btn btn-primary">
                                <i class="fas fa-plus me-2"></i>Apply to New Casting
                            </button>
                            <button class="btn btn-outline-primary">
                                <i class="fas fa-search me-2"></i>Browse Open Calls
                            </button>
                            <button class="btn btn-outline-secondary">
                                <i class="fas fa-file-export me-2"></i>Export Application Data
                            </button>
                            <button class="btn btn-outline-info">
                                <i class="fas fa-chart-line me-2"></i>View Detailed Analytics
                            </button>
                        </div>
                        '
                    ); ?>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Filter functionality
    const filterBadges = document.querySelectorAll('.filter-badge');
    const applicationCards = document.querySelectorAll('.application-card');
    
    filterBadges.forEach(badge => {
        badge.addEventListener('click', function() {
            // Remove active class from all badges
            filterBadges.forEach(b => b.classList.remove('active'));
            // Add active class to clicked badge
            this.classList.add('active');
            
            const filter = this.dataset.filter;
            
            applicationCards.forEach(card => {
                if (filter === 'all') {
                    card.style.display = 'block';
                } else {
                    const hasFilterClass = card.classList.contains(`application-${filter}`);
                    card.style.display = hasFilterClass ? 'block' : 'none';
                }
            });
        });
    });
    
    // Search functionality
    const searchInput = document.getElementById('applicationSearch');
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        
        applicationCards.forEach(card => {
            const cardText = card.textContent.toLowerCase();
            const isVisible = cardText.includes(searchTerm);
            card.style.display = isVisible ? 'block' : 'none';
        });
    });
});
</script>

<?php echo renderFooter(); ?>
