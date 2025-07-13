<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

$titles = [
    'activity' => 'My Activity - User Dashboard'
];

$pageNames = [
    'activity' => 'My Activity'
];

$currentDir = basename(__DIR__);
echo renderHeader($titles[$currentDir], "Emma Johnson", "Fashion Model", "User");
?>

<style>
.activity-hero { 
    background: linear-gradient(135deg, #6c5ce7 0%, #5a4fcf 100%);
    color: white;
    padding: 2rem 0;
    margin: -20px -20px 30px -20px;
}
.activity-timeline {
    background: white;
    border-radius: 15px;
    padding: 1.5rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}
.timeline-item {
    border-left: 3px solid #dee2e6;
    padding-left: 1.5rem;
    margin-bottom: 2rem;
    position: relative;
}
.timeline-item::before {
    content: '';
    position: absolute;
    left: -6px;
    top: 0;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #6c5ce7;
}
.timeline-item.login::before { background: #28a745; }
.timeline-item.profile::before { background: #17a2b8; }
.timeline-item.message::before { background: #fd7e14; }
.timeline-item.application::before { background: #e83e8c; }
.timeline-item.portfolio::before { background: #6610f2; }
.timeline-date {
    font-size: 0.8rem;
    color: #6c757d;
    font-weight: 500;
}
.timeline-content {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 1rem;
    margin-top: 0.5rem;
}
.activity-stats {
    background: white;
    border-radius: 15px;
    padding: 1.5rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    margin-bottom: 2rem;
}
.stat-item {
    text-align: center;
    padding: 1rem;
    border-radius: 10px;
    background: #f8f9fa;
    margin-bottom: 1rem;
}
.stat-item h4 {
    color: #6c5ce7;
    margin-bottom: 0.5rem;
}
.filter-tabs {
    background: white;
    border-radius: 15px;
    padding: 1rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    margin-bottom: 2rem;
}
.activity-item {
    border: 1px solid #dee2e6;
    border-radius: 10px;
    padding: 1rem;
    margin-bottom: 1rem;
    transition: all 0.3s ease;
}
.activity-item:hover {
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}
.activity-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 1rem;
    color: white;
}
.icon-login { background: #28a745; }
.icon-profile { background: #17a2b8; }
.icon-message { background: #fd7e14; }
.icon-application { background: #e83e8c; }
.icon-portfolio { background: #6610f2; }
.icon-moderation { background: #dc3545; }
.icon-default { background: #6c757d; }
</style>

<div class="d-flex">
    <?php echo renderSidebar('User', getUserSidebarItems(), 'activity/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Dashboard', 'href' => '../index.php'],
            ['label' => 'My Activity']
        ]);
        ?>
        
        <!-- Activity Hero Section -->
        <div class="activity-hero">
            <div class="container-fluid">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <h1 class="fw-bold mb-2">
                            <i class="fas fa-history me-3"></i>My Activity
                        </h1>
                        <p class="fs-5 mb-3">Track your platform activity and engagement history</p>
                    </div>
                    <div class="col-md-4 text-end">
                        <button class="btn btn-light btn-lg me-2" onclick="exportActivity()">
                            <i class="fas fa-download me-2"></i>Export
                        </button>
                        <button class="btn btn-outline-light btn-lg" onclick="clearActivity()">
                            <i class="fas fa-trash me-2"></i>Clear History
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="row">
            <!-- Activity Statistics -->
            <div class="col-md-4">
                <div class="activity-stats">
                    <h4><i class="fas fa-chart-bar me-2"></i>Activity Summary</h4>
                    
                    <div class="stat-item">
                        <h4>147</h4>
                        <p class="text-muted mb-0">Total Actions This Month</p>
                    </div>
                    
                    <div class="stat-item">
                        <h4>23</h4>
                        <p class="text-muted mb-0">Messages Sent</p>
                    </div>
                    
                    <div class="stat-item">
                        <h4>8</h4>
                        <p class="text-muted mb-0">Profile Updates</p>
                    </div>
                    
                    <div class="stat-item">
                        <h4>12</h4>
                        <p class="text-muted mb-0">Applications Submitted</p>
                    </div>
                    
                    <div class="stat-item">
                        <h4>5</h4>
                        <p class="text-muted mb-0">Portfolio Updates</p>
                    </div>
                </div>
            </div>

            <!-- Activity Timeline -->
            <div class="col-md-8">
                <!-- Filter Tabs -->
                <div class="filter-tabs">
                    <div class="btn-group w-100" role="group">
                        <button class="btn btn-outline-primary active" onclick="filterActivity('all')">All Activity</button>
                        <button class="btn btn-outline-primary" onclick="filterActivity('today')">Today</button>
                        <button class="btn btn-outline-primary" onclick="filterActivity('week')">This Week</button>
                        <button class="btn btn-outline-primary" onclick="filterActivity('month')">This Month</button>
                    </div>
                </div>

                <div class="activity-timeline">
                    <h3><i class="fas fa-clock me-2"></i>Recent Activity</h3>
                    <p class="text-muted mb-4">Your recent actions and engagement on the platform</p>
                    
                    <!-- Activity Item 1 -->
                    <div class="activity-item">
                        <div class="d-flex align-items-center">
                            <div class="activity-icon icon-message">
                                <i class="fas fa-envelope"></i>
                            </div>
                            <div class="flex-grow-1">
                                <h5 class="mb-1">Sent message to Marcus Rodriguez</h5>
                                <p class="text-muted mb-1">Replied to collaboration opportunity discussion</p>
                                <small class="text-muted">2 hours ago</small>
                            </div>
                            <div>
                                <button class="btn btn-outline-primary btn-sm" onclick="viewDetails('message', 1)">
                                    <i class="fas fa-eye"></i> View
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Activity Item 2 -->
                    <div class="activity-item">
                        <div class="d-flex align-items-center">
                            <div class="activity-icon icon-portfolio">
                                <i class="fas fa-images"></i>
                            </div>
                            <div class="flex-grow-1">
                                <h5 class="mb-1">Updated portfolio</h5>
                                <p class="text-muted mb-1">Added 6 new fashion photography images</p>
                                <small class="text-muted">5 hours ago</small>
                            </div>
                            <div>
                                <button class="btn btn-outline-primary btn-sm" onclick="viewDetails('portfolio', 2)">
                                    <i class="fas fa-eye"></i> View
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Activity Item 3 -->
                    <div class="activity-item">
                        <div class="d-flex align-items-center">
                            <div class="activity-icon icon-moderation">
                                <i class="fas fa-flag"></i>
                            </div>
                            <div class="flex-grow-1">
                                <h5 class="mb-1">Flagged inappropriate content</h5>
                                <p class="text-muted mb-1">Reported spam message for community review</p>
                                <small class="text-muted">Yesterday, 3:45 PM</small>
                            </div>
                            <div>
                                <button class="btn btn-outline-primary btn-sm" onclick="viewDetails('moderation', 3)">
                                    <i class="fas fa-eye"></i> View
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Activity Item 4 -->
                    <div class="activity-item">
                        <div class="d-flex align-items-center">
                            <div class="activity-icon icon-application">
                                <i class="fas fa-file-alt"></i>
                            </div>
                            <div class="flex-grow-1">
                                <h5 class="mb-1">Applied to Fashion Week Casting</h5>
                                <p class="text-muted mb-1">Submitted application for New York Fashion Week</p>
                                <small class="text-muted">Yesterday, 11:30 AM</small>
                            </div>
                            <div>
                                <button class="btn btn-outline-primary btn-sm" onclick="viewDetails('application', 4)">
                                    <i class="fas fa-eye"></i> View
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Activity Item 5 -->
                    <div class="activity-item">
                        <div class="d-flex align-items-center">
                            <div class="activity-icon icon-profile">
                                <i class="fas fa-user"></i>
                            </div>
                            <div class="flex-grow-1">
                                <h5 class="mb-1">Updated profile information</h5>
                                <p class="text-muted mb-1">Changed bio, contact information, and availability</p>
                                <small class="text-muted">2 days ago</small>
                            </div>
                            <div>
                                <button class="btn btn-outline-primary btn-sm" onclick="viewDetails('profile', 5)">
                                    <i class="fas fa-eye"></i> View
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Activity Item 6 -->
                    <div class="activity-item">
                        <div class="d-flex align-items-center">
                            <div class="activity-icon icon-message">
                                <i class="fas fa-envelope"></i>
                            </div>
                            <div class="flex-grow-1">
                                <h5 class="mb-1">Received message from Sarah Mitchell</h5>
                                <p class="text-muted mb-1">New collaboration opportunity message</p>
                                <small class="text-muted">3 days ago</small>
                            </div>
                            <div>
                                <button class="btn btn-outline-primary btn-sm" onclick="viewDetails('message', 6)">
                                    <i class="fas fa-eye"></i> View
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Activity Item 7 -->
                    <div class="activity-item">
                        <div class="d-flex align-items-center">
                            <div class="activity-icon icon-login">
                                <i class="fas fa-sign-in-alt"></i>
                            </div>
                            <div class="flex-grow-1">
                                <h5 class="mb-1">Logged in to platform</h5>
                                <p class="text-muted mb-1">Successful login from Chrome on MacOS</p>
                                <small class="text-muted">3 days ago</small>
                            </div>
                            <div>
                                <span class="badge bg-success">Secure</span>
                            </div>
                        </div>
                    </div>

                    <!-- Activity Item 8 -->
                    <div class="activity-item">
                        <div class="d-flex align-items-center">
                            <div class="activity-icon icon-application">
                                <i class="fas fa-file-alt"></i>
                            </div>
                            <div class="flex-grow-1">
                                <h5 class="mb-1">Application status updated</h5>
                                <p class="text-muted mb-1">Commercial shoot application moved to "Under Review"</p>
                                <small class="text-muted">4 days ago</small>
                            </div>
                            <div>
                                <button class="btn btn-outline-primary btn-sm" onclick="viewDetails('application', 8)">
                                    <i class="fas fa-eye"></i> View
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Activity Item 9 -->
                    <div class="activity-item">
                        <div class="d-flex align-items-center">
                            <div class="activity-icon icon-portfolio">
                                <i class="fas fa-images"></i>
                            </div>
                            <div class="flex-grow-1">
                                <h5 class="mb-1">Portfolio viewed by Elite Models NYC</h5>
                                <p class="text-muted mb-1">Your portfolio was viewed by potential client</p>
                                <small class="text-muted">1 week ago</small>
                            </div>
                            <div>
                                <button class="btn btn-outline-primary btn-sm" onclick="viewDetails('portfolio', 9)">
                                    <i class="fas fa-eye"></i> View
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Activity Item 10 -->
                    <div class="activity-item">
                        <div class="d-flex align-items-center">
                            <div class="activity-icon icon-profile">
                                <i class="fas fa-camera"></i>
                            </div>
                            <div class="flex-grow-1">
                                <h5 class="mb-1">Updated profile photo</h5>
                                <p class="text-muted mb-1">Changed main profile picture</p>
                                <small class="text-muted">1 week ago</small>
                            </div>
                            <div>
                                <button class="btn btn-outline-primary btn-sm" onclick="viewDetails('profile', 10)">
                                    <i class="fas fa-eye"></i> View
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Load More Button -->
                    <div class="text-center mt-4">
                        <button class="btn btn-outline-primary" onclick="loadMoreActivity()">
                            <i class="fas fa-plus me-2"></i>Load More Activity
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    initializeActivityDashboard();
});

function initializeActivityDashboard() {
    // Initialize activity filters
    const filterButtons = document.querySelectorAll('.btn-group button');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function filterActivity(period) {
    const activities = document.querySelectorAll('.activity-item');
    
    // In a real implementation, this would filter based on actual dates
    switch(period) {
        case 'today':
            showToast('Showing today\'s activity', 'info');
            // Hide activities older than today
            activities.forEach((activity, index) => {
                activity.style.display = index < 2 ? 'block' : 'none';
            });
            break;
        case 'week':
            showToast('Showing this week\'s activity', 'info');
            // Hide activities older than a week
            activities.forEach((activity, index) => {
                activity.style.display = index < 7 ? 'block' : 'none';
            });
            break;
        case 'month':
            showToast('Showing this month\'s activity', 'info');
            // Show all activities
            activities.forEach(activity => {
                activity.style.display = 'block';
            });
            break;
        default:
            showToast('Showing all activity', 'info');
            // Show all activities
            activities.forEach(activity => {
                activity.style.display = 'block';
            });
    }
}

function viewDetails(type, id) {
    showToast(`Opening ${type} details for item #${id}`, 'info');
    // In real implementation, would open relevant page or modal
}

function exportActivity() {
    showToast('Exporting activity data...', 'info');
    // In real implementation, would generate and download activity report
}

function clearActivity() {
    if (confirm('Are you sure you want to clear your activity history? This action cannot be undone.')) {
        showToast('Activity history cleared', 'warning');
        // In real implementation, would clear activity data
    }
}

function loadMoreActivity() {
    showToast('Loading more activity...', 'info');
    // In real implementation, would load additional activity items
    
    // Simulate loading delay
    setTimeout(() => {
        showToast('No more activity to load', 'info');
    }, 1500);
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} position-fixed`;
    toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    toast.innerHTML = `
        ${message}
        <button type="button" class="btn-close float-end" onclick="this.parentElement.remove()"></button>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 3000);
}
</script>

<?php echo renderFooter(); ?>