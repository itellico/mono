<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

$titles = [
    'moderation' => 'Content Moderation & GoCare System - Platform Dashboard'
];

$pageNames = [
    'moderation' => 'Content Moderation & GoCare'
];

$currentDir = basename(__DIR__);
echo renderHeader($titles[$currentDir], "Platform Admin", "System Administrator", "Platform");
?>

<style>
.moderation-hero { 
    background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
    color: white;
    padding: 2rem 0;
    margin: -20px -20px 30px -20px;
}
.stat-card {
    background: white;
    border-radius: 15px;
    padding: 1.5rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    transition: all 0.3s ease;
    border-left: 4px solid #007bff;
}
.stat-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 30px rgba(0,0,0,0.15);
}
.stat-card.danger { border-left-color: #dc3545; }
.stat-card.warning { border-left-color: #ffc107; }
.stat-card.success { border-left-color: #28a745; }
.stat-card.info { border-left-color: #17a2b8; }
.stat-number {
    font-size: 2.5rem;
    font-weight: bold;
    color: #2c3e50;
    margin-bottom: 0.5rem;
}
.stat-label {
    color: #6c757d;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
}
.stat-change {
    font-size: 0.8rem;
    font-weight: 500;
}
.stat-change.positive { color: #28a745; }
.stat-change.negative { color: #dc3545; }
.moderation-queue {
    background: white;
    border-radius: 15px;
    padding: 1.5rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    margin-bottom: 2rem;
}
.queue-item {
    border: 1px solid #dee2e6;
    border-radius: 10px;
    padding: 1rem;
    margin-bottom: 1rem;
    transition: all 0.3s ease;
}
.queue-item:hover {
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}
.queue-item.high-priority {
    border-left: 4px solid #dc3545;
    background: #fff5f5;
}
.queue-item.medium-priority {
    border-left: 4px solid #ffc107;
    background: #fffcf0;
}
.queue-item.low-priority {
    border-left: 4px solid #28a745;
    background: #f8fff8;
}
.content-preview {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 1rem;
    margin: 1rem 0;
}
.content-preview img {
    max-width: 200px;
    max-height: 150px;
    border-radius: 8px;
    margin-right: 1rem;
}
.flag-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 500;
    margin-right: 0.5rem;
    margin-bottom: 0.5rem;
}
.flag-inappropriate { background: #dc3545; color: white; }
.flag-spam { background: #ffc107; color: #212529; }
.flag-harassment { background: #6f42c1; color: white; }
.flag-copyright { background: #fd7e14; color: white; }
.gocare-settings {
    background: white;
    border-radius: 15px;
    padding: 1.5rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}
.tenant-row {
    border-bottom: 1px solid #dee2e6;
    padding: 1rem 0;
}
.tenant-row:last-child {
    border-bottom: none;
}
.switch {
    position: relative;
    display: inline-block;
    width: 60px;
    height: 34px;
}
.switch input {
    opacity: 0;
    width: 0;
    height: 0;
}
.slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: .4s;
    border-radius: 34px;
}
.slider:before {
    position: absolute;
    content: "";
    height: 26px;
    width: 26px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
}
input:checked + .slider {
    background-color: #007bff;
}
input:checked + .slider:before {
    transform: translateX(26px);
}
.analytics-chart {
    background: white;
    border-radius: 15px;
    padding: 1.5rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    margin-bottom: 2rem;
}
.action-buttons {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
}
.btn-approve { background: #28a745; color: white; }
.btn-reject { background: #dc3545; color: white; }
.btn-escalate { background: #ffc107; color: #212529; }
.btn-review { background: #17a2b8; color: white; }
</style>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'moderation/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Content Moderation & GoCare']
        ]);
        ?>
        
        <!-- Moderation Hero Section -->
        <div class="moderation-hero">
            <div class="container-fluid">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <h1 class="fw-bold mb-2">
                            <i class="fas fa-shield-alt me-3"></i>Content Moderation & GoCare System
                        </h1>
                        <p class="fs-5 mb-3">Platform-wide content moderation, flagging system, and GoCare community review</p>
                    </div>
                    <div class="col-md-4 text-end">
                        <button class="btn btn-light btn-lg me-2" onclick="showModerationSettings()">
                            <i class="fas fa-cogs me-2"></i>Settings
                        </button>
                        <button class="btn btn-outline-light btn-lg" onclick="exportModerationReport()">
                            <i class="fas fa-download me-2"></i>Export Report
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Moderation Statistics -->
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="stat-card danger">
                    <div class="stat-number">247</div>
                    <div class="stat-label">Pending Flags</div>
                    <div class="stat-change negative">
                        <i class="fas fa-arrow-up"></i> +15% from last week
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card warning">
                    <div class="stat-number">89</div>
                    <div class="stat-label">Under Review</div>
                    <div class="stat-change positive">
                        <i class="fas fa-arrow-down"></i> -8% from last week
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card success">
                    <div class="stat-number">1,432</div>
                    <div class="stat-label">Resolved This Month</div>
                    <div class="stat-change positive">
                        <i class="fas fa-arrow-up"></i> +23% from last month
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card info">
                    <div class="stat-number">2.3hrs</div>
                    <div class="stat-label">Avg Response Time</div>
                    <div class="stat-change positive">
                        <i class="fas fa-arrow-down"></i> -15% from last week
                    </div>
                </div>
            </div>
        </div>

        <!-- Content Moderation Queue -->
        <div class="moderation-queue">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h3><i class="fas fa-list me-2"></i>High Priority Moderation Queue</h3>
                <div class="btn-group" role="group">
                    <button class="btn btn-outline-primary active" onclick="filterQueue('all')">All</button>
                    <button class="btn btn-outline-primary" onclick="filterQueue('high')">High</button>
                    <button class="btn btn-outline-primary" onclick="filterQueue('medium')">Medium</button>
                    <button class="btn btn-outline-primary" onclick="filterQueue('low')">Low</button>
                </div>
            </div>

            <!-- Queue Item 1 -->
            <div class="queue-item high-priority">
                <div class="row">
                    <div class="col-md-8">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <h5 class="mb-1">Inappropriate Image Content</h5>
                                <small class="text-muted">Flagged 15 minutes ago • Tenant: Fashion Hub NYC</small>
                            </div>
                            <div>
                                <span class="flag-badge flag-inappropriate">Inappropriate</span>
                                <span class="flag-badge flag-harassment">Harassment</span>
                            </div>
                        </div>
                        <div class="content-preview">
                            <div class="d-flex">
                                <img src="https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=200&h=150&fit=crop" 
                                     alt="Flagged content" class="img-fluid">
                                <div>
                                    <strong>Content Type:</strong> Profile Image<br>
                                    <strong>User:</strong> @emma_fashion_model<br>
                                    <strong>Flags:</strong> 5 users reported this content<br>
                                    <strong>Reason:</strong> "Inappropriate clothing for platform standards"
                                </div>
                            </div>
                        </div>
                        <div class="action-buttons">
                            <button class="btn btn-approve btn-sm" onclick="approveContent(1)">
                                <i class="fas fa-check"></i> Approve
                            </button>
                            <button class="btn btn-reject btn-sm" onclick="rejectContent(1)">
                                <i class="fas fa-times"></i> Reject
                            </button>
                            <button class="btn btn-escalate btn-sm" onclick="escalateContent(1)">
                                <i class="fas fa-arrow-up"></i> Escalate
                            </button>
                            <button class="btn btn-review btn-sm" onclick="reviewDetails(1)">
                                <i class="fas fa-eye"></i> Review Details
                            </button>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">GoCare Community Review</h6>
                            </div>
                            <div class="card-body">
                                <div class="d-flex justify-content-between mb-2">
                                    <span>Community Score:</span>
                                    <span class="badge bg-danger">2.3/5</span>
                                </div>
                                <div class="d-flex justify-content-between mb-2">
                                    <span>Total Reviews:</span>
                                    <span>12</span>
                                </div>
                                <div class="d-flex justify-content-between mb-2">
                                    <span>Flag Rate:</span>
                                    <span class="text-danger">67%</span>
                                </div>
                                <small class="text-muted">AI Confidence: 85% inappropriate</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Queue Item 2 -->
            <div class="queue-item medium-priority">
                <div class="row">
                    <div class="col-md-8">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <h5 class="mb-1">Spam Message Content</h5>
                                <small class="text-muted">Flagged 1 hour ago • Tenant: GoModels.com</small>
                            </div>
                            <div>
                                <span class="flag-badge flag-spam">Spam</span>
                            </div>
                        </div>
                        <div class="content-preview">
                            <div>
                                <strong>Content Type:</strong> Message<br>
                                <strong>User:</strong> @model_recruiter_pro<br>
                                <strong>Message:</strong> "🔥 URGENT! Make $5000/week modeling! Click here now! Limited time offer! 💰"<br>
                                <strong>Flags:</strong> 8 users reported this message
                            </div>
                        </div>
                        <div class="action-buttons">
                            <button class="btn btn-approve btn-sm" onclick="approveContent(2)">
                                <i class="fas fa-check"></i> Approve
                            </button>
                            <button class="btn btn-reject btn-sm" onclick="rejectContent(2)">
                                <i class="fas fa-times"></i> Reject
                            </button>
                            <button class="btn btn-escalate btn-sm" onclick="escalateContent(2)">
                                <i class="fas fa-arrow-up"></i> Escalate
                            </button>
                            <button class="btn btn-review btn-sm" onclick="reviewDetails(2)">
                                <i class="fas fa-eye"></i> Review Details
                            </button>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">GoCare Community Review</h6>
                            </div>
                            <div class="card-body">
                                <div class="d-flex justify-content-between mb-2">
                                    <span>Community Score:</span>
                                    <span class="badge bg-warning">1.8/5</span>
                                </div>
                                <div class="d-flex justify-content-between mb-2">
                                    <span>Total Reviews:</span>
                                    <span>8</span>
                                </div>
                                <div class="d-flex justify-content-between mb-2">
                                    <span>Flag Rate:</span>
                                    <span class="text-danger">88%</span>
                                </div>
                                <small class="text-muted">AI Confidence: 95% spam</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Queue Item 3 -->
            <div class="queue-item low-priority">
                <div class="row">
                    <div class="col-md-8">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <h5 class="mb-1">Copyright Concern</h5>
                                <small class="text-muted">Flagged 3 hours ago • Tenant: Creative Studios</small>
                            </div>
                            <div>
                                <span class="flag-badge flag-copyright">Copyright</span>
                            </div>
                        </div>
                        <div class="content-preview">
                            <div class="d-flex">
                                <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&h=150&fit=crop" 
                                     alt="Flagged content" class="img-fluid">
                                <div>
                                    <strong>Content Type:</strong> Portfolio Image<br>
                                    <strong>User:</strong> @photographer_mike<br>
                                    <strong>Flags:</strong> 1 user reported copyright violation<br>
                                    <strong>Reason:</strong> "This image appears to be from a copyrighted fashion shoot"
                                </div>
                            </div>
                        </div>
                        <div class="action-buttons">
                            <button class="btn btn-approve btn-sm" onclick="approveContent(3)">
                                <i class="fas fa-check"></i> Approve
                            </button>
                            <button class="btn btn-reject btn-sm" onclick="rejectContent(3)">
                                <i class="fas fa-times"></i> Reject
                            </button>
                            <button class="btn btn-escalate btn-sm" onclick="escalateContent(3)">
                                <i class="fas fa-arrow-up"></i> Escalate
                            </button>
                            <button class="btn btn-review btn-sm" onclick="reviewDetails(3)">
                                <i class="fas fa-eye"></i> Review Details
                            </button>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">GoCare Community Review</h6>
                            </div>
                            <div class="card-body">
                                <div class="d-flex justify-content-between mb-2">
                                    <span>Community Score:</span>
                                    <span class="badge bg-success">4.2/5</span>
                                </div>
                                <div class="d-flex justify-content-between mb-2">
                                    <span>Total Reviews:</span>
                                    <span>3</span>
                                </div>
                                <div class="d-flex justify-content-between mb-2">
                                    <span>Flag Rate:</span>
                                    <span class="text-success">22%</span>
                                </div>
                                <small class="text-muted">AI Confidence: 45% copyright issue</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- GoCare System Settings -->
        <div class="row">
            <div class="col-md-8">
                <div class="gocare-settings">
                    <h3><i class="fas fa-users me-2"></i>GoCare System - Tenant Configuration</h3>
                    <p class="text-muted mb-4">Configure GoCare community moderation settings for each tenant</p>
                    
                    <div class="tenant-row">
                        <div class="row align-items-center">
                            <div class="col-md-3">
                                <strong>Fashion Hub NYC</strong><br>
                                <small class="text-muted">Premium Plan</small>
                            </div>
                            <div class="col-md-2">
                                <label class="switch">
                                    <input type="checkbox" checked>
                                    <span class="slider"></span>
                                </label>
                                <small class="d-block text-muted">GoCare Enabled</small>
                            </div>
                            <div class="col-md-2">
                                <label class="switch">
                                    <input type="checkbox" checked>
                                    <span class="slider"></span>
                                </label>
                                <small class="d-block text-muted">Auto-Approve</small>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <label class="form-label">Threshold</label>
                                    <input type="number" class="form-control form-control-sm" value="3" min="1" max="10">
                                </div>
                            </div>
                            <div class="col-md-2">
                                <button class="btn btn-outline-primary btn-sm" onclick="configureTenant('fashion-hub')">
                                    <i class="fas fa-cog"></i> Configure
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="tenant-row">
                        <div class="row align-items-center">
                            <div class="col-md-3">
                                <strong>GoModels.com</strong><br>
                                <small class="text-muted">Enterprise Plan</small>
                            </div>
                            <div class="col-md-2">
                                <label class="switch">
                                    <input type="checkbox" checked>
                                    <span class="slider"></span>
                                </label>
                                <small class="d-block text-muted">GoCare Enabled</small>
                            </div>
                            <div class="col-md-2">
                                <label class="switch">
                                    <input type="checkbox">
                                    <span class="slider"></span>
                                </label>
                                <small class="d-block text-muted">Auto-Approve</small>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <label class="form-label">Threshold</label>
                                    <input type="number" class="form-control form-control-sm" value="5" min="1" max="10">
                                </div>
                            </div>
                            <div class="col-md-2">
                                <button class="btn btn-outline-primary btn-sm" onclick="configureTenant('gomodels')">
                                    <i class="fas fa-cog"></i> Configure
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="tenant-row">
                        <div class="row align-items-center">
                            <div class="col-md-3">
                                <strong>Creative Studios</strong><br>
                                <small class="text-muted">Professional Plan</small>
                            </div>
                            <div class="col-md-2">
                                <label class="switch">
                                    <input type="checkbox">
                                    <span class="slider"></span>
                                </label>
                                <small class="d-block text-muted">GoCare Enabled</small>
                            </div>
                            <div class="col-md-2">
                                <label class="switch">
                                    <input type="checkbox">
                                    <span class="slider"></span>
                                </label>
                                <small class="d-block text-muted">Auto-Approve</small>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <label class="form-label">Threshold</label>
                                    <input type="number" class="form-control form-control-sm" value="2" min="1" max="10">
                                </div>
                            </div>
                            <div class="col-md-2">
                                <button class="btn btn-outline-primary btn-sm" onclick="configureTenant('creative-studios')">
                                    <i class="fas fa-cog"></i> Configure
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-4">
                <div class="analytics-chart">
                    <h4><i class="fas fa-chart-line me-2"></i>Moderation Analytics</h4>
                    <div class="mb-3">
                        <canvas id="moderationChart" width="400" height="200"></canvas>
                    </div>
                    <div class="row text-center">
                        <div class="col-6">
                            <h5 class="text-primary">78%</h5>
                            <small class="text-muted">Auto-Resolved</small>
                        </div>
                        <div class="col-6">
                            <h5 class="text-warning">22%</h5>
                            <small class="text-muted">Manual Review</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
// Moderation queue functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeModerationDashboard();
});

function initializeModerationDashboard() {
    // Initialize moderation chart
    const ctx = document.getElementById('moderationChart').getContext('2d');
    // Note: In a real implementation, you'd use Chart.js here
    
    // Simulate real-time updates
    setInterval(updateModerationStats, 30000); // Update every 30 seconds
}

function filterQueue(type) {
    const buttons = document.querySelectorAll('.btn-group button');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    const items = document.querySelectorAll('.queue-item');
    items.forEach(item => {
        if (type === 'all') {
            item.style.display = 'block';
        } else {
            const priority = item.classList.contains(`${type}-priority`);
            item.style.display = priority ? 'block' : 'none';
        }
    });
    
    showToast(`Filtered to ${type} priority items`, 'info');
}

function approveContent(id) {
    showToast(`Content #${id} approved`, 'success');
    // In real implementation, would make API call
    removeQueueItem(id);
}

function rejectContent(id) {
    showToast(`Content #${id} rejected and removed`, 'warning');
    // In real implementation, would make API call
    removeQueueItem(id);
}

function escalateContent(id) {
    showToast(`Content #${id} escalated to senior moderator`, 'info');
    // In real implementation, would make API call
}

function reviewDetails(id) {
    showToast(`Opening detailed review for content #${id}`, 'info');
    // In real implementation, would open modal with detailed review
}

function removeQueueItem(id) {
    // Simulate removing item from queue
    setTimeout(() => {
        const items = document.querySelectorAll('.queue-item');
        if (items[id - 1]) {
            items[id - 1].style.opacity = '0';
            setTimeout(() => {
                items[id - 1].remove();
            }, 300);
        }
    }, 1000);
}

function configureTenant(tenantId) {
    showToast(`Opening configuration for ${tenantId}`, 'info');
    // In real implementation, would open tenant configuration modal
}

function showModerationSettings() {
    showToast('Opening platform moderation settings', 'info');
    // In real implementation, would open settings modal
}

function exportModerationReport() {
    showToast('Generating moderation report...', 'info');
    // In real implementation, would generate and download report
}

function updateModerationStats() {
    // Simulate real-time stat updates
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(stat => {
        const currentValue = parseInt(stat.textContent.replace(/[^0-9]/g, ''));
        const change = Math.floor(Math.random() * 10) - 5; // Random change -5 to +5
        const newValue = Math.max(0, currentValue + change);
        stat.textContent = newValue.toLocaleString();
    });
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