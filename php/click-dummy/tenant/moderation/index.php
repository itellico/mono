<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

$titles = [
    'moderation' => 'Content Moderation - Tenant Dashboard'
];

$pageNames = [
    'moderation' => 'Content Moderation'
];

$currentDir = basename(__DIR__);
echo renderHeader($titles[$currentDir], "Fashion Hub NYC Admin", "Tenant Administrator", "Tenant");
?>

<style>
.moderation-hero { 
    background: linear-gradient(135deg, #6c5ce7 0%, #5a4fcf 100%);
    color: white;
    padding: 2rem 0;
    margin: -20px -20px 30px -20px;
}
.gocare-card {
    background: white;
    border-radius: 15px;
    padding: 2rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    margin-bottom: 2rem;
    border-left: 4px solid #6c5ce7;
}
.gocare-toggle {
    background: linear-gradient(135deg, #00b894, #00a085);
    color: white;
    border-radius: 15px;
    padding: 1.5rem;
    margin-bottom: 2rem;
}
.moderation-settings {
    background: white;
    border-radius: 15px;
    padding: 1.5rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    margin-bottom: 2rem;
}
.setting-item {
    border-bottom: 1px solid #dee2e6;
    padding: 1rem 0;
}
.setting-item:last-child {
    border-bottom: none;
}
.community-stats {
    background: white;
    border-radius: 15px;
    padding: 1.5rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
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
.flag-type-config {
    background: #f8f9fa;
    border-radius: 10px;
    padding: 1rem;
    margin-bottom: 1rem;
}
.reviewers-section {
    background: white;
    border-radius: 15px;
    padding: 1.5rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}
.reviewer-card {
    border: 1px solid #dee2e6;
    border-radius: 10px;
    padding: 1rem;
    margin-bottom: 1rem;
    transition: all 0.3s ease;
}
.reviewer-card:hover {
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}
.reviewer-stats {
    display: flex;
    gap: 1rem;
    margin-top: 0.5rem;
}
.reviewer-stat {
    text-align: center;
    font-size: 0.8rem;
}
.reviewer-stat .number {
    font-weight: bold;
    color: #6c5ce7;
}
</style>

<div class="d-flex">
    <?php echo renderSidebar('Tenant', getTenantSidebarItems(), 'moderation/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Tenant Dashboard', 'href' => '../index.php'],
            ['label' => 'Content Moderation']
        ]);
        ?>
        
        <!-- Moderation Hero Section -->
        <div class="moderation-hero">
            <div class="container-fluid">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <h1 class="fw-bold mb-2">
                            <i class="fas fa-shield-alt me-3"></i>Content Moderation
                        </h1>
                        <p class="fs-5 mb-3">Manage content moderation and GoCare community reviews for your tenant</p>
                    </div>
                    <div class="col-md-4 text-end">
                        <button class="btn btn-light btn-lg me-2" onclick="showModerationAnalytics()">
                            <i class="fas fa-chart-bar me-2"></i>Analytics
                        </button>
                        <button class="btn btn-outline-light btn-lg" onclick="manageReviewers()">
                            <i class="fas fa-users me-2"></i>Reviewers
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- GoCare System Status -->
        <div class="gocare-toggle">
            <div class="row align-items-center">
                <div class="col-md-8">
                    <h3 class="mb-2">
                        <i class="fas fa-heart me-2"></i>GoCare Community Moderation
                    </h3>
                    <p class="mb-0">Enable community-driven content moderation with AI assistance</p>
                </div>
                <div class="col-md-4 text-end">
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="gocareToggle" checked style="transform: scale(1.5);">
                        <label class="form-check-label text-white ms-2" for="gocareToggle">
                            <strong>ENABLED</strong>
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <div class="row">
            <!-- Moderation Settings -->
            <div class="col-md-8">
                <div class="moderation-settings">
                    <h3><i class="fas fa-cogs me-2"></i>Moderation Settings</h3>
                    <p class="text-muted mb-4">Configure how content moderation works for your tenant</p>
                    
                    <div class="setting-item">
                        <div class="row align-items-center">
                            <div class="col-md-8">
                                <h5>Auto-Approval Threshold</h5>
                                <p class="text-muted mb-0">Number of community approvals needed for automatic content approval</p>
                            </div>
                            <div class="col-md-4">
                                <div class="input-group">
                                    <input type="number" class="form-control" value="3" min="1" max="10">
                                    <span class="input-group-text">reviews</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="setting-item">
                        <div class="row align-items-center">
                            <div class="col-md-8">
                                <h5>Auto-Hide Threshold</h5>
                                <p class="text-muted mb-0">Number of flags needed to automatically hide content</p>
                            </div>
                            <div class="col-md-4">
                                <div class="input-group">
                                    <input type="number" class="form-control" value="5" min="1" max="20">
                                    <span class="input-group-text">flags</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="setting-item">
                        <div class="row align-items-center">
                            <div class="col-md-8">
                                <h5>Manual Review Required</h5>
                                <p class="text-muted mb-0">Require manual review for all flagged content</p>
                            </div>
                            <div class="col-md-4">
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" id="manualReview">
                                    <label class="form-check-label" for="manualReview">Enabled</label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="setting-item">
                        <div class="row align-items-center">
                            <div class="col-md-8">
                                <h5>Multiple Reviewers Required</h5>
                                <p class="text-muted mb-0">Require multiple reviewers for moderation decisions</p>
                            </div>
                            <div class="col-md-4">
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" id="multipleReviewers" checked>
                                    <label class="form-check-label" for="multipleReviewers">Enabled</label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="setting-item">
                        <div class="col-12">
                            <h5 class="mb-3">Enabled Flag Types</h5>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="flag-type-config">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="inappropriate" checked>
                                            <label class="form-check-label" for="inappropriate">
                                                <i class="fas fa-exclamation-triangle text-danger me-2"></i>Inappropriate Content
                                            </label>
                                        </div>
                                        <small class="text-muted">Sexually explicit or inappropriate content</small>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="flag-type-config">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="spam" checked>
                                            <label class="form-check-label" for="spam">
                                                <i class="fas fa-ban text-warning me-2"></i>Spam
                                            </label>
                                        </div>
                                        <small class="text-muted">Unwanted promotional or repetitive content</small>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="flag-type-config">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="harassment" checked>
                                            <label class="form-check-label" for="harassment">
                                                <i class="fas fa-user-slash text-danger me-2"></i>Harassment
                                            </label>
                                        </div>
                                        <small class="text-muted">Bullying, threats, or abusive behavior</small>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="flag-type-config">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="copyright">
                                            <label class="form-check-label" for="copyright">
                                                <i class="fas fa-copyright text-info me-2"></i>Copyright Violation
                                            </label>
                                        </div>
                                        <small class="text-muted">Unauthorized use of copyrighted material</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Community Reviewers -->
                <div class="reviewers-section">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h3><i class="fas fa-users me-2"></i>Community Reviewers</h3>
                        <button class="btn btn-primary" onclick="inviteReviewer()">
                            <i class="fas fa-plus me-2"></i>Invite Reviewer
                        </button>
                    </div>

                    <div class="reviewer-card">
                        <div class="row align-items-center">
                            <div class="col-md-2">
                                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face" 
                                     class="rounded-circle" width="50" height="50" alt="Marcus Rodriguez">
                            </div>
                            <div class="col-md-4">
                                <h5 class="mb-0">Marcus Rodriguez</h5>
                                <small class="text-muted">Senior Community Reviewer</small>
                                <div class="reviewer-stats">
                                    <div class="reviewer-stat">
                                        <div class="number">1,247</div>
                                        <div>Reviews</div>
                                    </div>
                                    <div class="reviewer-stat">
                                        <div class="number">94%</div>
                                        <div>Accuracy</div>
                                    </div>
                                    <div class="reviewer-stat">
                                        <div class="number">2.3hrs</div>
                                        <div>Avg Time</div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <span class="badge bg-success">Active</span>
                                <span class="badge bg-primary">Trusted</span>
                            </div>
                            <div class="col-md-3 text-end">
                                <button class="btn btn-outline-primary btn-sm" onclick="reviewerDetails(1)">
                                    <i class="fas fa-eye"></i> View
                                </button>
                                <button class="btn btn-outline-secondary btn-sm" onclick="reviewerSettings(1)">
                                    <i class="fas fa-cog"></i> Settings
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="reviewer-card">
                        <div class="row align-items-center">
                            <div class="col-md-2">
                                <img src="https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=60&h=60&fit=crop&crop=face" 
                                     class="rounded-circle" width="50" height="50" alt="Sarah Mitchell">
                            </div>
                            <div class="col-md-4">
                                <h5 class="mb-0">Sarah Mitchell</h5>
                                <small class="text-muted">Community Reviewer</small>
                                <div class="reviewer-stats">
                                    <div class="reviewer-stat">
                                        <div class="number">832</div>
                                        <div>Reviews</div>
                                    </div>
                                    <div class="reviewer-stat">
                                        <div class="number">89%</div>
                                        <div>Accuracy</div>
                                    </div>
                                    <div class="reviewer-stat">
                                        <div class="number">3.1hrs</div>
                                        <div>Avg Time</div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <span class="badge bg-success">Active</span>
                            </div>
                            <div class="col-md-3 text-end">
                                <button class="btn btn-outline-primary btn-sm" onclick="reviewerDetails(2)">
                                    <i class="fas fa-eye"></i> View
                                </button>
                                <button class="btn btn-outline-secondary btn-sm" onclick="reviewerSettings(2)">
                                    <i class="fas fa-cog"></i> Settings
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="reviewer-card">
                        <div class="row align-items-center">
                            <div class="col-md-2">
                                <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face" 
                                     class="rounded-circle" width="50" height="50" alt="David Thompson">
                            </div>
                            <div class="col-md-4">
                                <h5 class="mb-0">David Thompson</h5>
                                <small class="text-muted">New Reviewer</small>
                                <div class="reviewer-stats">
                                    <div class="reviewer-stat">
                                        <div class="number">156</div>
                                        <div>Reviews</div>
                                    </div>
                                    <div class="reviewer-stat">
                                        <div class="number">78%</div>
                                        <div>Accuracy</div>
                                    </div>
                                    <div class="reviewer-stat">
                                        <div class="number">4.2hrs</div>
                                        <div>Avg Time</div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <span class="badge bg-warning">Training</span>
                            </div>
                            <div class="col-md-3 text-end">
                                <button class="btn btn-outline-primary btn-sm" onclick="reviewerDetails(3)">
                                    <i class="fas fa-eye"></i> View
                                </button>
                                <button class="btn btn-outline-secondary btn-sm" onclick="reviewerSettings(3)">
                                    <i class="fas fa-cog"></i> Settings
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Community Statistics -->
            <div class="col-md-4">
                <div class="community-stats">
                    <h4><i class="fas fa-chart-pie me-2"></i>Community Statistics</h4>
                    
                    <div class="stat-item">
                        <h4>1,247</h4>
                        <p class="text-muted mb-0">Total Reviews This Month</p>
                    </div>
                    
                    <div class="stat-item">
                        <h4>92%</h4>
                        <p class="text-muted mb-0">Community Accuracy Rate</p>
                    </div>
                    
                    <div class="stat-item">
                        <h4>2.8hrs</h4>
                        <p class="text-muted mb-0">Average Review Time</p>
                    </div>
                    
                    <div class="stat-item">
                        <h4>87%</h4>
                        <p class="text-muted mb-0">Auto-Resolved Rate</p>
                    </div>
                    
                    <div class="stat-item">
                        <h4>23</h4>
                        <p class="text-muted mb-0">Pending Reviews</p>
                    </div>
                </div>

                <div class="gocare-card">
                    <h4><i class="fas fa-heart me-2"></i>GoCare Benefits</h4>
                    <ul class="list-unstyled">
                        <li class="mb-2">
                            <i class="fas fa-check-circle text-success me-2"></i>
                            Community-driven moderation
                        </li>
                        <li class="mb-2">
                            <i class="fas fa-check-circle text-success me-2"></i>
                            AI-assisted decision making
                        </li>
                        <li class="mb-2">
                            <i class="fas fa-check-circle text-success me-2"></i>
                            Reduced false positives
                        </li>
                        <li class="mb-2">
                            <i class="fas fa-check-circle text-success me-2"></i>
                            Faster content review
                        </li>
                        <li class="mb-2">
                            <i class="fas fa-check-circle text-success me-2"></i>
                            Transparent process
                        </li>
                    </ul>
                    <button class="btn btn-primary btn-sm" onclick="learnMoreGoCare()">
                        <i class="fas fa-info-circle me-2"></i>Learn More
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    initializeTenantModeration();
});

function initializeTenantModeration() {
    // Initialize GoCare toggle
    const gocareToggle = document.getElementById('gocareToggle');
    gocareToggle.addEventListener('change', function() {
        if (this.checked) {
            showToast('GoCare system enabled', 'success');
        } else {
            showToast('GoCare system disabled', 'warning');
        }
    });
    
    // Initialize other toggles
    const toggles = document.querySelectorAll('.form-check-input');
    toggles.forEach(toggle => {
        toggle.addEventListener('change', function() {
            const label = this.parentElement.querySelector('label').textContent;
            const status = this.checked ? 'enabled' : 'disabled';
            showToast(`${label} ${status}`, 'info');
        });
    });
}

function showModerationAnalytics() {
    showToast('Opening moderation analytics dashboard', 'info');
    // In real implementation, would open analytics modal or navigate to analytics page
}

function manageReviewers() {
    showToast('Opening reviewer management interface', 'info');
    // In real implementation, would open reviewer management modal
}

function inviteReviewer() {
    showToast('Opening reviewer invitation form', 'info');
    // In real implementation, would open invitation modal
}

function reviewerDetails(reviewerId) {
    showToast(`Opening details for reviewer #${reviewerId}`, 'info');
    // In real implementation, would open reviewer details modal
}

function reviewerSettings(reviewerId) {
    showToast(`Opening settings for reviewer #${reviewerId}`, 'info');
    // In real implementation, would open reviewer settings modal
}

function learnMoreGoCare() {
    showToast('Opening GoCare documentation', 'info');
    // In real implementation, would open documentation or help modal
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