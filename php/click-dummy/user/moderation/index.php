<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

$titles = [
    'moderation' => 'Content Flagging & Reports - User Dashboard'
];

$pageNames = [
    'moderation' => 'Content Flagging & Reports'
];

$currentDir = basename(__DIR__);
echo renderHeader($titles[$currentDir], "Emma Johnson", "Fashion Model", "User");
?>

<style>
.moderation-hero { 
    background: linear-gradient(135deg, #fd79a8 0%, #e84393 100%);
    color: white;
    padding: 2rem 0;
    margin: -20px -20px 30px -20px;
}
.flag-card {
    background: white;
    border-radius: 15px;
    padding: 1.5rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    margin-bottom: 1.5rem;
    border-left: 4px solid #fd79a8;
}
.flag-item {
    border: 1px solid #dee2e6;
    border-radius: 10px;
    padding: 1rem;
    margin-bottom: 1rem;
    transition: all 0.3s ease;
}
.flag-item:hover {
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}
.flag-item.pending {
    border-left: 4px solid #ffc107;
    background: #fffcf0;
}
.flag-item.resolved {
    border-left: 4px solid #28a745;
    background: #f8fff8;
}
.flag-item.rejected {
    border-left: 4px solid #dc3545;
    background: #fff5f5;
}
.quick-flag {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 10px;
    padding: 1rem;
    margin-bottom: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
}
.quick-flag:hover {
    background: #e9ecef;
    border-color: #fd79a8;
}
.quick-flag.selected {
    background: #fd79a8;
    color: white;
    border-color: #fd79a8;
}
.flag-form {
    background: white;
    border-radius: 15px;
    padding: 2rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}
.gocare-info {
    background: linear-gradient(135deg, #00b894, #00a085);
    color: white;
    border-radius: 15px;
    padding: 1.5rem;
    margin-bottom: 2rem;
}
.content-preview {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 1rem;
    margin: 1rem 0;
}
.content-preview img {
    max-width: 150px;
    max-height: 100px;
    border-radius: 8px;
    margin-right: 1rem;
}
.flag-status {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 500;
}
.flag-status.pending { background: #ffc107; color: #212529; }
.flag-status.resolved { background: #28a745; color: white; }
.flag-status.rejected { background: #dc3545; color: white; }
.flag-status.reviewing { background: #17a2b8; color: white; }
</style>

<div class="d-flex">
    <?php echo renderSidebar('User', getUserSidebarItems(), 'moderation/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Dashboard', 'href' => '../index.php'],
            ['label' => 'Content Flagging & Reports']
        ]);
        ?>
        
        <!-- Moderation Hero Section -->
        <div class="moderation-hero">
            <div class="container-fluid">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <h1 class="fw-bold mb-2">
                            <i class="fas fa-flag me-3"></i>Content Flagging & Reports
                        </h1>
                        <p class="fs-5 mb-3">Flag inappropriate content and track your reports</p>
                    </div>
                    <div class="col-md-4 text-end">
                        <button class="btn btn-light btn-lg" onclick="showFlagForm()">
                            <i class="fas fa-plus me-2"></i>Flag Content
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- GoCare Information -->
        <div class="gocare-info">
            <div class="row align-items-center">
                <div class="col-md-8">
                    <h3 class="mb-2">
                        <i class="fas fa-heart me-2"></i>GoCare Community Review
                    </h3>
                    <p class="mb-0">Your flags are reviewed by our community moderators and AI systems to ensure fair and accurate content moderation.</p>
                </div>
                <div class="col-md-4 text-end">
                    <button class="btn btn-outline-light" onclick="learnMoreGoCare()">
                        <i class="fas fa-info-circle me-2"></i>Learn More
                    </button>
                </div>
            </div>
        </div>

        <div class="row">
            <!-- Flag Content Form -->
            <div class="col-md-8">
                <div class="flag-form" id="flagForm" style="display: none;">
                    <h3><i class="fas fa-flag me-2"></i>Flag Content</h3>
                    <p class="text-muted mb-4">Report inappropriate content for community review</p>
                    
                    <form id="contentFlagForm">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label class="form-label">Content Type</label>
                                <select class="form-select" id="contentType" required>
                                    <option value="">Select content type</option>
                                    <option value="message">Message</option>
                                    <option value="image">Image</option>
                                    <option value="profile">Profile</option>
                                    <option value="gig">Gig Posting</option>
                                    <option value="comment">Comment</option>
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Content URL or ID</label>
                                <input type="text" class="form-control" id="contentUrl" placeholder="Paste content URL or ID" required>
                            </div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Flag Type</label>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="quick-flag" onclick="selectFlagType('inappropriate')">
                                        <div class="d-flex align-items-center">
                                            <i class="fas fa-exclamation-triangle text-danger me-2"></i>
                                            <div>
                                                <strong>Inappropriate Content</strong>
                                                <small class="d-block text-muted">Sexually explicit or inappropriate material</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="quick-flag" onclick="selectFlagType('spam')">
                                        <div class="d-flex align-items-center">
                                            <i class="fas fa-ban text-warning me-2"></i>
                                            <div>
                                                <strong>Spam</strong>
                                                <small class="d-block text-muted">Unwanted promotional or repetitive content</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="quick-flag" onclick="selectFlagType('harassment')">
                                        <div class="d-flex align-items-center">
                                            <i class="fas fa-user-slash text-danger me-2"></i>
                                            <div>
                                                <strong>Harassment</strong>
                                                <small class="d-block text-muted">Bullying, threats, or abusive behavior</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="quick-flag" onclick="selectFlagType('copyright')">
                                        <div class="d-flex align-items-center">
                                            <i class="fas fa-copyright text-info me-2"></i>
                                            <div>
                                                <strong>Copyright Violation</strong>
                                                <small class="d-block text-muted">Unauthorized use of copyrighted material</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <input type="hidden" id="selectedFlagType" required>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Additional Details</label>
                            <textarea class="form-control" id="flagReason" rows="4" placeholder="Please provide specific details about why you're flagging this content..." required></textarea>
                        </div>

                        <div class="d-flex justify-content-between">
                            <button type="button" class="btn btn-secondary" onclick="hideFlagForm()">Cancel</button>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-flag me-2"></i>Submit Flag
                            </button>
                        </div>
                    </form>
                </div>

                <!-- My Flags -->
                <div class="flag-card">
                    <h3><i class="fas fa-list me-2"></i>My Flags</h3>
                    <p class="text-muted mb-4">Track the status of your content flags</p>
                    
                    <!-- Flag Item 1 -->
                    <div class="flag-item pending">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <h5 class="mb-1">Inappropriate Profile Image</h5>
                                <small class="text-muted">Flagged 2 hours ago</small>
                            </div>
                            <span class="flag-status pending">Pending Review</span>
                        </div>
                        <div class="content-preview">
                            <div class="d-flex">
                                <img src="https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=150&h=100&fit=crop" 
                                     alt="Flagged content" class="img-fluid">
                                <div>
                                    <strong>Content Type:</strong> Profile Image<br>
                                    <strong>User:</strong> @suspicious_user<br>
                                    <strong>Flag Type:</strong> Inappropriate Content<br>
                                    <strong>Reason:</strong> Image contains inappropriate content for a professional platform
                                </div>
                            </div>
                        </div>
                        <div class="mt-2">
                            <small class="text-muted">
                                <i class="fas fa-clock me-1"></i>Under community review • 3 reviewers assigned
                            </small>
                        </div>
                    </div>

                    <!-- Flag Item 2 -->
                    <div class="flag-item resolved">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <h5 class="mb-1">Spam Message</h5>
                                <small class="text-muted">Flagged yesterday</small>
                            </div>
                            <span class="flag-status resolved">Resolved - Approved</span>
                        </div>
                        <div class="content-preview">
                            <div>
                                <strong>Content Type:</strong> Message<br>
                                <strong>User:</strong> @spam_account<br>
                                <strong>Flag Type:</strong> Spam<br>
                                <strong>Reason:</strong> Repetitive promotional messages in multiple conversations
                            </div>
                        </div>
                        <div class="mt-2">
                            <small class="text-success">
                                <i class="fas fa-check-circle me-1"></i>Flag approved • Content removed • User warned
                            </small>
                        </div>
                    </div>

                    <!-- Flag Item 3 -->
                    <div class="flag-item rejected">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <h5 class="mb-1">Harassment Report</h5>
                                <small class="text-muted">Flagged 3 days ago</small>
                            </div>
                            <span class="flag-status rejected">Resolved - Rejected</span>
                        </div>
                        <div class="content-preview">
                            <div>
                                <strong>Content Type:</strong> Message<br>
                                <strong>User:</strong> @other_user<br>
                                <strong>Flag Type:</strong> Harassment<br>
                                <strong>Reason:</strong> User was being rude and unprofessional
                            </div>
                        </div>
                        <div class="mt-2">
                            <small class="text-danger">
                                <i class="fas fa-times-circle me-1"></i>Flag rejected • Content within community guidelines
                            </small>
                        </div>
                    </div>

                    <!-- Flag Item 4 -->
                    <div class="flag-item resolved">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <h5 class="mb-1">Copyright Violation</h5>
                                <small class="text-muted">Flagged 1 week ago</small>
                            </div>
                            <span class="flag-status resolved">Resolved - Approved</span>
                        </div>
                        <div class="content-preview">
                            <div class="d-flex">
                                <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=150&h=100&fit=crop" 
                                     alt="Flagged content" class="img-fluid">
                                <div>
                                    <strong>Content Type:</strong> Portfolio Image<br>
                                    <strong>User:</strong> @photographer123<br>
                                    <strong>Flag Type:</strong> Copyright Violation<br>
                                    <strong>Reason:</strong> This image is from a copyrighted fashion campaign
                                </div>
                            </div>
                        </div>
                        <div class="mt-2">
                            <small class="text-success">
                                <i class="fas fa-check-circle me-1"></i>Flag approved • Content removed • User contacted
                            </small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Sidebar Information -->
            <div class="col-md-4">
                <div class="flag-card">
                    <h4><i class="fas fa-info-circle me-2"></i>Flagging Guidelines</h4>
                    <ul class="list-unstyled">
                        <li class="mb-2">
                            <i class="fas fa-check-circle text-success me-2"></i>
                            Only flag content that violates community guidelines
                        </li>
                        <li class="mb-2">
                            <i class="fas fa-check-circle text-success me-2"></i>
                            Provide specific details about the violation
                        </li>
                        <li class="mb-2">
                            <i class="fas fa-check-circle text-success me-2"></i>
                            Be respectful and professional
                        </li>
                        <li class="mb-2">
                            <i class="fas fa-check-circle text-success me-2"></i>
                            Allow time for community review
                        </li>
                    </ul>
                </div>

                <div class="flag-card">
                    <h4><i class="fas fa-shield-alt me-2"></i>How GoCare Works</h4>
                    <div class="mb-3">
                        <h6>1. Flag Submission</h6>
                        <p class="text-muted small">You flag content that violates guidelines</p>
                    </div>
                    <div class="mb-3">
                        <h6>2. AI Analysis</h6>
                        <p class="text-muted small">AI systems perform initial content analysis</p>
                    </div>
                    <div class="mb-3">
                        <h6>3. Community Review</h6>
                        <p class="text-muted small">Trusted community members review the flag</p>
                    </div>
                    <div class="mb-3">
                        <h6>4. Decision</h6>
                        <p class="text-muted small">Content is approved, hidden, or removed</p>
                    </div>
                </div>

                <div class="flag-card">
                    <h4><i class="fas fa-chart-bar me-2"></i>Your Statistics</h4>
                    <div class="row text-center">
                        <div class="col-6">
                            <h5 class="text-primary">8</h5>
                            <small class="text-muted">Total Flags</small>
                        </div>
                        <div class="col-6">
                            <h5 class="text-success">75%</h5>
                            <small class="text-muted">Approved Rate</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    initializeUserModeration();
});

function initializeUserModeration() {
    // Initialize flag form
    const flagForm = document.getElementById('contentFlagForm');
    if (flagForm) {
        flagForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitFlag();
        });
    }
}

function showFlagForm() {
    const flagForm = document.getElementById('flagForm');
    flagForm.style.display = 'block';
    flagForm.scrollIntoView({ behavior: 'smooth' });
}

function hideFlagForm() {
    const flagForm = document.getElementById('flagForm');
    flagForm.style.display = 'none';
    
    // Reset form
    document.getElementById('contentFlagForm').reset();
    document.getElementById('selectedFlagType').value = '';
    
    // Reset flag type selection
    document.querySelectorAll('.quick-flag').forEach(flag => {
        flag.classList.remove('selected');
    });
}

function selectFlagType(type) {
    // Remove previous selection
    document.querySelectorAll('.quick-flag').forEach(flag => {
        flag.classList.remove('selected');
    });
    
    // Add selection to clicked flag
    event.currentTarget.classList.add('selected');
    
    // Update hidden input
    document.getElementById('selectedFlagType').value = type;
}

function submitFlag() {
    const contentType = document.getElementById('contentType').value;
    const contentUrl = document.getElementById('contentUrl').value;
    const flagType = document.getElementById('selectedFlagType').value;
    const reason = document.getElementById('flagReason').value;
    
    if (!flagType) {
        showToast('Please select a flag type', 'warning');
        return;
    }
    
    // Simulate API call
    showToast('Flag submitted successfully', 'success');
    
    // Hide form and reset
    hideFlagForm();
    
    // In real implementation, would add new flag to the list
    setTimeout(() => {
        showToast('Your flag is now under community review', 'info');
    }, 2000);
}

function learnMoreGoCare() {
    showToast('Opening GoCare documentation', 'info');
    // In real implementation, would open documentation modal or page
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