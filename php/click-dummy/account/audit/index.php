<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Activity Logs - Elite Fashion Agency", "John Doe", "Agency Admin", "Account");
?>

<div class="d-flex">
    <?php echo renderSidebar('Account', getAgencySidebarItems(), 'audit/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Agency', 'href' => '../agency/index.php'],
            ['label' => 'Activity Logs']
        ]);
        ?>
        
        <!-- Activity Header -->
        <div class="bg-info text-white p-4 rounded mb-4">
            <div class="row align-items-center">
                <div class="col-md-8">
                    <h2 class="mb-2">Activity Logs</h2>
                    <p class="mb-0 opacity-75">Track all activities and changes within your agency account</p>
                </div>
                <div class="col-md-4 text-end">
                    <button class="btn btn-light" onclick="exportActivityLogs()">
                        <i class="fas fa-download me-2"></i> Export Activity
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Quick Summary -->
        <div class="row g-3 mb-4">
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body text-center">
                        <h4 class="mb-1">847</h4>
                        <p class="mb-0 text-muted">Total Activities</p>
                        <small class="text-success">This month</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body text-center">
                        <h4 class="mb-1">12</h4>
                        <p class="mb-0 text-muted">Team Members</p>
                        <small class="text-info">Active today</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body text-center">
                        <h4 class="mb-1">234</h4>
                        <p class="mb-0 text-muted">Talent Updates</p>
                        <small class="text-primary">Last 7 days</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body text-center">
                        <h4 class="mb-1">56</h4>
                        <p class="mb-0 text-muted">Client Actions</p>
                        <small class="text-warning">This week</small>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Activity Filter -->
        <div class="card mb-4">
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-md-3">
                        <select class="form-select" id="filterPeriod">
                            <option value="today">Today</option>
                            <option value="week" selected>Last 7 Days</option>
                            <option value="month">Last 30 Days</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <select class="form-select" id="filterUser">
                            <option value="">All Team Members</option>
                            <option value="john">John Doe (You)</option>
                            <option value="sarah">Sarah Smith</option>
                            <option value="mike">Mike Johnson</option>
                            <option value="emma">Emma Wilson</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <select class="form-select" id="filterType">
                            <option value="">All Activities</option>
                            <option value="talent">Talent Management</option>
                            <option value="project">Project Updates</option>
                            <option value="client">Client Interactions</option>
                            <option value="team">Team Actions</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <button class="btn btn-primary w-100" onclick="applyActivityFilters()">
                            <i class="fas fa-filter me-2"></i>Apply Filters
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Activity Timeline -->
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">
                    <i class="fas fa-history me-2"></i>
                    Recent Activities
                </h5>
            </div>
            <div class="card-body">
                <!-- Today -->
                <div class="activity-day mb-4">
                    <h6 class="text-muted mb-3">Today - January 20, 2024</h6>
                    
                    <div class="activity-entry mb-3">
                        <div class="d-flex">
                            <div class="activity-time text-muted me-3" style="min-width: 80px;">
                                <small>15:45</small>
                            </div>
                            <div class="activity-icon me-3">
                                <div class="rounded-circle bg-success text-white p-2">
                                    <i class="fas fa-user-plus"></i>
                                </div>
                            </div>
                            <div class="flex-grow-1">
                                <div class="d-flex justify-content-between">
                                    <div>
                                        <strong>New Talent Added</strong>
                                        <p class="mb-0">Jessica Williams added to agency roster</p>
                                        <small class="text-muted">by Sarah Smith</small>
                                    </div>
                                    <button class="btn btn-sm btn-outline-info" onclick="viewDetails('act-001')">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="activity-entry mb-3">
                        <div class="d-flex">
                            <div class="activity-time text-muted me-3" style="min-width: 80px;">
                                <small>14:20</small>
                            </div>
                            <div class="activity-icon me-3">
                                <div class="rounded-circle bg-info text-white p-2">
                                    <i class="fas fa-project-diagram"></i>
                                </div>
                            </div>
                            <div class="flex-grow-1">
                                <div class="d-flex justify-content-between">
                                    <div>
                                        <strong>Project Updated</strong>
                                        <p class="mb-0">Fashion Week 2024 - Added 5 new talent selections</p>
                                        <small class="text-muted">by You</small>
                                    </div>
                                    <button class="btn btn-sm btn-outline-info" onclick="viewDetails('act-002')">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="activity-entry mb-3">
                        <div class="d-flex">
                            <div class="activity-time text-muted me-3" style="min-width: 80px;">
                                <small>11:15</small>
                            </div>
                            <div class="activity-icon me-3">
                                <div class="rounded-circle bg-warning text-white p-2">
                                    <i class="fas fa-envelope"></i>
                                </div>
                            </div>
                            <div class="flex-grow-1">
                                <div class="d-flex justify-content-between">
                                    <div>
                                        <strong>Client Communication</strong>
                                        <p class="mb-0">Sent proposal to Vogue Magazine for Spring Campaign</p>
                                        <small class="text-muted">by Mike Johnson</small>
                                    </div>
                                    <button class="btn btn-sm btn-outline-info" onclick="viewDetails('act-003')">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Yesterday -->
                <div class="activity-day mb-4">
                    <h6 class="text-muted mb-3">Yesterday - January 19, 2024</h6>
                    
                    <div class="activity-entry mb-3">
                        <div class="d-flex">
                            <div class="activity-time text-muted me-3" style="min-width: 80px;">
                                <small>17:30</small>
                            </div>
                            <div class="activity-icon me-3">
                                <div class="rounded-circle bg-primary text-white p-2">
                                    <i class="fas fa-calendar-check"></i>
                                </div>
                            </div>
                            <div class="flex-grow-1">
                                <div class="d-flex justify-content-between">
                                    <div>
                                        <strong>Booking Confirmed</strong>
                                        <p class="mb-0">Sarah Johnson booked for Nike Commercial - $15,000</p>
                                        <small class="text-muted">by Emma Wilson</small>
                                    </div>
                                    <button class="btn btn-sm btn-outline-info" onclick="viewDetails('act-004')">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="activity-entry mb-3">
                        <div class="d-flex">
                            <div class="activity-time text-muted me-3" style="min-width: 80px;">
                                <small>15:45</small>
                            </div>
                            <div class="activity-icon me-3">
                                <div class="rounded-circle bg-danger text-white p-2">
                                    <i class="fas fa-user-times"></i>
                                </div>
                            </div>
                            <div class="flex-grow-1">
                                <div class="d-flex justify-content-between">
                                    <div>
                                        <strong>Talent Removed</strong>
                                        <p class="mb-0">Alex Thompson removed from roster (contract ended)</p>
                                        <small class="text-muted">by You</small>
                                    </div>
                                    <button class="btn btn-sm btn-outline-info" onclick="viewDetails('act-005')">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="activity-entry mb-3">
                        <div class="d-flex">
                            <div class="activity-time text-muted me-3" style="min-width: 80px;">
                                <small>10:00</small>
                            </div>
                            <div class="activity-icon me-3">
                                <div class="rounded-circle bg-secondary text-white p-2">
                                    <i class="fas fa-cog"></i>
                                </div>
                            </div>
                            <div class="flex-grow-1">
                                <div class="d-flex justify-content-between">
                                    <div>
                                        <strong>Settings Updated</strong>
                                        <p class="mb-0">Commission structure updated for new talent</p>
                                        <small class="text-muted">by You</small>
                                    </div>
                                    <button class="btn btn-sm btn-outline-info" onclick="viewDetails('act-006')">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Load More -->
                <div class="text-center">
                    <button class="btn btn-outline-primary" onclick="loadMoreActivities()">
                        <i class="fas fa-plus me-2"></i>Load More Activities
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Activity Summary -->
        <div class="row mt-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">Activity by Type</h6>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <div class="d-flex justify-content-between mb-1">
                                <span>Talent Management</span>
                                <strong>45%</strong>
                            </div>
                            <div class="progress" style="height: 8px;">
                                <div class="progress-bar bg-success" style="width: 45%"></div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between mb-1">
                                <span>Client Communications</span>
                                <strong>28%</strong>
                            </div>
                            <div class="progress" style="height: 8px;">
                                <div class="progress-bar bg-info" style="width: 28%"></div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between mb-1">
                                <span>Project Updates</span>
                                <strong>20%</strong>
                            </div>
                            <div class="progress" style="height: 8px;">
                                <div class="progress-bar bg-warning" style="width: 20%"></div>
                            </div>
                        </div>
                        <div>
                            <div class="d-flex justify-content-between mb-1">
                                <span>Settings & Admin</span>
                                <strong>7%</strong>
                            </div>
                            <div class="progress" style="height: 8px;">
                                <div class="progress-bar bg-secondary" style="width: 7%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">Most Active Team Members</h6>
                    </div>
                    <div class="card-body">
                        <div class="list-group list-group-flush">
                            <div class="list-group-item d-flex justify-content-between align-items-center">
                                <div class="d-flex align-items-center">
                                    <img src="https://randomuser.me/api/portraits/women/1.jpg" class="rounded-circle me-2" width="32" height="32">
                                    <div>
                                        <strong>Sarah Smith</strong><br>
                                        <small class="text-muted">Talent Manager</small>
                                    </div>
                                </div>
                                <span class="badge bg-primary">234 actions</span>
                            </div>
                            <div class="list-group-item d-flex justify-content-between align-items-center">
                                <div class="d-flex align-items-center">
                                    <img src="https://randomuser.me/api/portraits/men/2.jpg" class="rounded-circle me-2" width="32" height="32">
                                    <div>
                                        <strong>Mike Johnson</strong><br>
                                        <small class="text-muted">Client Relations</small>
                                    </div>
                                </div>
                                <span class="badge bg-primary">189 actions</span>
                            </div>
                            <div class="list-group-item d-flex justify-content-between align-items-center">
                                <div class="d-flex align-items-center">
                                    <img src="https://randomuser.me/api/portraits/women/3.jpg" class="rounded-circle me-2" width="32" height="32">
                                    <div>
                                        <strong>Emma Wilson</strong><br>
                                        <small class="text-muted">Booking Coordinator</small>
                                    </div>
                                </div>
                                <span class="badge bg-primary">156 actions</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
.activity-icon .rounded-circle {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.activity-entry {
    position: relative;
    padding-bottom: 20px;
}

.activity-entry:not(:last-child)::after {
    content: '';
    position: absolute;
    left: 128px;
    top: 40px;
    bottom: 0;
    width: 2px;
    background-color: #dee2e6;
}

.activity-day:not(:last-child) {
    border-bottom: 1px solid #dee2e6;
    padding-bottom: 20px;
}
</style>

<script>
// Mock functions for demo
function exportActivityLogs() {
    showToast('info', 'Preparing activity export...');
    setTimeout(() => {
        showToast('success', 'Activity logs exported successfully!');
    }, 2000);
}

function applyActivityFilters() {
    showToast('success', 'Filters applied');
}

function viewDetails(activityId) {
    showToast('info', `Loading details for activity ${activityId}...`);
}

function loadMoreActivities() {
    showToast('info', 'Loading more activities...');
    setTimeout(() => {
        showToast('success', 'Loaded 10 more activities');
    }, 1000);
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
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    const toastElement = toastContainer.lastElementChild;
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Agency Activity Logs page initialized');
});
</script>

<?php echo renderFooter(); ?>