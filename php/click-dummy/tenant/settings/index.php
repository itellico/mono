<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Tenant Settings - Go Models NYC", "Admin User", "Marketplace Admin", "Tenant");
?>

<div class="d-flex">
    <?php echo renderSidebar('Tenant', getTenantSidebarItems(), 'settings/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Tenant', 'href' => '../index.php'],
            ['label' => 'Settings']
        ]);
        
        echo createHeroSection(
            "Marketplace Settings",
            "Configure and customize your marketplace settings, branding, and operational preferences",
            "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=300&fit=crop",
            [
                ['label' => 'Save Changes', 'icon' => 'fas fa-save', 'style' => 'success'],
                ['label' => 'Reset Defaults', 'icon' => 'fas fa-undo', 'style' => 'warning'],
                ['label' => 'Export Config', 'icon' => 'fas fa-download', 'style' => 'info']
            ]
        );
        ?>
        
        <!-- Settings Navigation Tabs -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-body">
                        <ul class="nav nav-pills nav-fill" id="settingsTabs" role="tablist">
                            <li class="nav-item" role="presentation">
                                <button class="nav-link active" id="general-tab" data-bs-toggle="pill" data-bs-target="#general" type="button" role="tab">
                                    <i class="fas fa-cog me-2"></i> General
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="branding-tab" data-bs-toggle="pill" data-bs-target="#branding" type="button" role="tab">
                                    <i class="fas fa-palette me-2"></i> Branding
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="notifications-tab" data-bs-toggle="pill" data-bs-target="#notifications" type="button" role="tab">
                                    <i class="fas fa-bell me-2"></i> Notifications
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="permissions-tab" data-bs-toggle="pill" data-bs-target="#permissions" type="button" role="tab">
                                    <i class="fas fa-shield-alt me-2"></i> Permissions
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="billing-tab" data-bs-toggle="pill" data-bs-target="#billing" type="button" role="tab">
                                    <i class="fas fa-credit-card me-2"></i> Billing
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="integrations-tab" data-bs-toggle="pill" data-bs-target="#integrations" type="button" role="tab">
                                    <i class="fas fa-plug me-2"></i> Integrations
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Settings Content -->
        <div class="row">
            <div class="col-12">
                <div class="tab-content" id="settingsTabContent">
                    <!-- General Settings -->
                    <div class="tab-pane fade show active" id="general" role="tabpanel">
                        <div class="row">
                            <div class="col-lg-8">
                                <?php echo createCard(
                                    "General Information",
                                    '
                                    <form>
                                        <div class="row g-3">
                                            <div class="col-md-6">
                                                <label class="form-label">Marketplace Name</label>
                                                <input type="text" class="form-control" value="Go Models NYC">
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Domain</label>
                                                <input type="text" class="form-control" value="gomodelsnyc.com">
                                            </div>
                                            <div class="col-12">
                                                <label class="form-label">Description</label>
                                                <textarea class="form-control" rows="3">Premium fashion modeling marketplace serving New York City and the surrounding area. Connecting top-tier models with leading brands and agencies.</textarea>
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Primary Language</label>
                                                <select class="form-select">
                                                    <option selected>English (US)</option>
                                                    <option>Spanish</option>
                                                    <option>French</option>
                                                    <option>Italian</option>
                                                </select>
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Timezone</label>
                                                <select class="form-select">
                                                    <option selected>Eastern Time (ET)</option>
                                                    <option>Central Time (CT)</option>
                                                    <option>Mountain Time (MT)</option>
                                                    <option>Pacific Time (PT)</option>
                                                </select>
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Currency</label>
                                                <select class="form-select">
                                                    <option selected>USD ($)</option>
                                                    <option>EUR (€)</option>
                                                    <option>GBP (£)</option>
                                                    <option>CAD (C$)</option>
                                                </select>
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Date Format</label>
                                                <select class="form-select">
                                                    <option selected>MM/DD/YYYY</option>
                                                    <option>DD/MM/YYYY</option>
                                                    <option>YYYY-MM-DD</option>
                                                </select>
                                            </div>
                                        </div>
                                    </form>
                                    '
                                ); ?>
                            </div>
                            <div class="col-lg-4">
                                <?php echo createCard(
                                    "Marketplace Status",
                                    '
                                    <div class="mb-3">
                                        <label class="form-label">Current Status</label>
                                        <select class="form-select">
                                            <option selected>Active</option>
                                            <option>Maintenance Mode</option>
                                            <option>Private Beta</option>
                                            <option>Coming Soon</option>
                                        </select>
                                    </div>
                                    <div class="mb-3">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" id="publicRegistration" checked>
                                            <label class="form-check-label" for="publicRegistration">
                                                Allow Public Registration
                                            </label>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" id="autoApproval">
                                            <label class="form-check-label" for="autoApproval">
                                                Auto-approve Applications
                                            </label>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" id="analyticsTracking" checked>
                                            <label class="form-check-label" for="analyticsTracking">
                                                Analytics Tracking
                                            </label>
                                        </div>
                                    </div>
                                    <hr>
                                    <div class="text-center">
                                        <span class="badge bg-success">Active</span>
                                        <p class="small text-muted mt-2">Last updated: Dec 10, 2024</p>
                                    </div>
                                    '
                                ); ?>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Branding Settings -->
                    <div class="tab-pane fade" id="branding" role="tabpanel">
                        <div class="row">
                            <div class="col-lg-8">
                                <?php echo createCard(
                                    "Brand Identity",
                                    '
                                    <form>
                                        <div class="row g-3">
                                            <div class="col-12">
                                                <label class="form-label">Logo Upload</label>
                                                <div class="d-flex align-items-center mb-3">
                                                    <img src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=80&h=80&fit=crop" 
                                                         class="rounded me-3" style="width: 80px; height: 80px; object-fit: cover;" alt="Current Logo">
                                                    <div>
                                                        <button type="button" class="btn btn-primary btn-sm">
                                                            <i class="fas fa-upload me-2"></i> Upload New Logo
                                                        </button>
                                                        <p class="small text-muted mb-0 mt-1">Recommended: 200x200px, PNG or SVG</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Primary Color</label>
                                                <div class="input-group">
                                                    <span class="input-group-text" style="background-color: #28a745; border-color: #28a745;"></span>
                                                    <input type="text" class="form-control" value="#28a745">
                                                </div>
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Secondary Color</label>
                                                <div class="input-group">
                                                    <span class="input-group-text" style="background-color: #6c757d; border-color: #6c757d;"></span>
                                                    <input type="text" class="form-control" value="#6c757d">
                                                </div>
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Accent Color</label>
                                                <div class="input-group">
                                                    <span class="input-group-text" style="background-color: #007bff; border-color: #007bff;"></span>
                                                    <input type="text" class="form-control" value="#007bff">
                                                </div>
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Background Color</label>
                                                <div class="input-group">
                                                    <span class="input-group-text" style="background-color: #f8f9fa; border-color: #f8f9fa;"></span>
                                                    <input type="text" class="form-control" value="#f8f9fa">
                                                </div>
                                            </div>
                                            <div class="col-12">
                                                <label class="form-label">Custom CSS</label>
                                                <textarea class="form-control" rows="5" placeholder="/* Add custom CSS styles here */">.marketplace-header { font-family: \'Roboto\', sans-serif; }</textarea>
                                            </div>
                                        </div>
                                    </form>
                                    '
                                ); ?>
                            </div>
                            <div class="col-lg-4">
                                <?php echo createCard(
                                    "Brand Preview",
                                    '
                                    <div class="border rounded p-3 mb-3" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%);">
                                        <div class="d-flex align-items-center text-white">
                                            <img src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=40&h=40&fit=crop" 
                                                 class="rounded me-2" style="width: 40px; height: 40px;" alt="Logo">
                                            <div>
                                                <h6 class="mb-0">Go Models NYC</h6>
                                                <small>Premium Marketplace</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <h6>Color Palette</h6>
                                        <div class="d-flex gap-2">
                                            <div class="rounded" style="width: 40px; height: 40px; background-color: #28a745;" title="Primary"></div>
                                            <div class="rounded" style="width: 40px; height: 40px; background-color: #6c757d;" title="Secondary"></div>
                                            <div class="rounded" style="width: 40px; height: 40px; background-color: #007bff;" title="Accent"></div>
                                            <div class="rounded border" style="width: 40px; height: 40px; background-color: #f8f9fa;" title="Background"></div>
                                        </div>
                                    </div>
                                    <button class="btn btn-outline-primary btn-sm w-100">
                                        <i class="fas fa-eye me-2"></i> Preview Changes
                                    </button>
                                    '
                                ); ?>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Notifications Settings -->
                    <div class="tab-pane fade" id="notifications" role="tabpanel">
                        <?php echo createCard(
                            "Notification Preferences",
                            '
                            <form>
                                <div class="row g-4">
                                    <div class="col-md-6">
                                        <h6>Email Notifications</h6>
                                        <div class="form-check form-switch mb-2">
                                            <input class="form-check-input" type="checkbox" id="emailNewApplications" checked>
                                            <label class="form-check-label" for="emailNewApplications">
                                                New Applications
                                            </label>
                                        </div>
                                        <div class="form-check form-switch mb-2">
                                            <input class="form-check-input" type="checkbox" id="emailNewBookings" checked>
                                            <label class="form-check-label" for="emailNewBookings">
                                                New Bookings
                                            </label>
                                        </div>
                                        <div class="form-check form-switch mb-2">
                                            <input class="form-check-input" type="checkbox" id="emailPayments" checked>
                                            <label class="form-check-label" for="emailPayments">
                                                Payment Updates
                                            </label>
                                        </div>
                                        <div class="form-check form-switch mb-2">
                                            <input class="form-check-input" type="checkbox" id="emailReports">
                                            <label class="form-check-label" for="emailReports">
                                                Weekly Reports
                                            </label>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <h6>SMS Notifications</h6>
                                        <div class="form-check form-switch mb-2">
                                            <input class="form-check-input" type="checkbox" id="smsUrgent" checked>
                                            <label class="form-check-label" for="smsUrgent">
                                                Urgent Alerts
                                            </label>
                                        </div>
                                        <div class="form-check form-switch mb-2">
                                            <input class="form-check-input" type="checkbox" id="smsBookings">
                                            <label class="form-check-label" for="smsBookings">
                                                Booking Confirmations
                                            </label>
                                        </div>
                                        <div class="form-check form-switch mb-2">
                                            <input class="form-check-input" type="checkbox" id="smsPayments">
                                            <label class="form-check-label" for="smsPayments">
                                                Payment Alerts
                                            </label>
                                        </div>
                                    </div>
                                    <div class="col-12">
                                        <h6>Notification Settings</h6>
                                        <div class="row g-3">
                                            <div class="col-md-6">
                                                <label class="form-label">Email From Name</label>
                                                <input type="text" class="form-control" value="Go Models NYC">
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Email From Address</label>
                                                <input type="email" class="form-control" value="noreply@gomodelsnyc.com">
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">SMS Provider</label>
                                                <select class="form-select">
                                                    <option selected>Twilio</option>
                                                    <option>SendGrid</option>
                                                    <option>AWS SNS</option>
                                                </select>
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Notification Frequency</label>
                                                <select class="form-select">
                                                    <option selected>Real-time</option>
                                                    <option>Hourly Digest</option>
                                                    <option>Daily Digest</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                            '
                        ); ?>
                    </div>
                    
                    <!-- Permissions Settings -->
                    <div class="tab-pane fade" id="permissions" role="tabpanel">
                        <?php echo createCard(
                            "User Permissions & Roles",
                            '
                            <div class="row g-4">
                                <div class="col-md-6">
                                    <h6>Model Permissions</h6>
                                    <div class="form-check form-switch mb-2">
                                        <input class="form-check-input" type="checkbox" id="modelCanEditProfile" checked>
                                        <label class="form-check-label" for="modelCanEditProfile">
                                            Edit Profile
                                        </label>
                                    </div>
                                    <div class="form-check form-switch mb-2">
                                        <input class="form-check-input" type="checkbox" id="modelCanUploadPhotos" checked>
                                        <label class="form-check-label" for="modelCanUploadPhotos">
                                            Upload Photos
                                        </label>
                                    </div>
                                    <div class="form-check form-switch mb-2">
                                        <input class="form-check-input" type="checkbox" id="modelCanApplyToCastings" checked>
                                        <label class="form-check-label" for="modelCanApplyToCastings">
                                            Apply to Castings
                                        </label>
                                    </div>
                                    <div class="form-check form-switch mb-2">
                                        <input class="form-check-input" type="checkbox" id="modelCanMessage">
                                        <label class="form-check-label" for="modelCanMessage">
                                            Send Messages
                                        </label>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <h6>Client Permissions</h6>
                                    <div class="form-check form-switch mb-2">
                                        <input class="form-check-input" type="checkbox" id="clientCanCreateCastings" checked>
                                        <label class="form-check-label" for="clientCanCreateCastings">
                                            Create Casting Calls
                                        </label>
                                    </div>
                                    <div class="form-check form-switch mb-2">
                                        <input class="form-check-input" type="checkbox" id="clientCanViewApplications" checked>
                                        <label class="form-check-label" for="clientCanViewApplications">
                                            View Applications
                                        </label>
                                    </div>
                                    <div class="form-check form-switch mb-2">
                                        <input class="form-check-input" type="checkbox" id="clientCanContactModels" checked>
                                        <label class="form-check-label" for="clientCanContactModels">
                                            Contact Models
                                        </label>
                                    </div>
                                    <div class="form-check form-switch mb-2">
                                        <input class="form-check-input" type="checkbox" id="clientCanDownloadPortfolios">
                                        <label class="form-check-label" for="clientCanDownloadPortfolios">
                                            Download Portfolios
                                        </label>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <h6>Content Moderation</h6>
                                    <div class="row g-3">
                                        <div class="col-md-4">
                                            <div class="form-check form-switch">
                                                <input class="form-check-input" type="checkbox" id="autoModeration" checked>
                                                <label class="form-check-label" for="autoModeration">
                                                    Auto-moderation
                                                </label>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="form-check form-switch">
                                                <input class="form-check-input" type="checkbox" id="manualReview" checked>
                                                <label class="form-check-label" for="manualReview">
                                                    Manual Review Required
                                                </label>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="form-check form-switch">
                                                <input class="form-check-input" type="checkbox" id="reportingSystem" checked>
                                                <label class="form-check-label" for="reportingSystem">
                                                    User Reporting
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            '
                        ); ?>
                    </div>
                    
                    <!-- Billing Settings -->
                    <div class="tab-pane fade" id="billing" role="tabpanel">
                        <div class="row">
                            <div class="col-lg-8">
                                <?php echo createCard(
                                    "Subscription & Billing",
                                    '
                                    <div class="row g-3">
                                        <div class="col-12">
                                            <div class="alert alert-success">
                                                <div class="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <h6 class="mb-1">Enterprise Plan</h6>
                                                        <small>Active until Jan 15, 2025</small>
                                                    </div>
                                                    <span class="badge bg-success">Active</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label">Billing Contact</label>
                                            <input type="text" class="form-control" value="John Smith">
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label">Billing Email</label>
                                            <input type="email" class="form-control" value="billing@gomodelsnyc.com">
                                        </div>
                                        <div class="col-12">
                                            <label class="form-label">Billing Address</label>
                                            <textarea class="form-control" rows="3">123 Fashion Avenue
New York, NY 10001
United States</textarea>
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label">Payment Method</label>
                                            <div class="input-group">
                                                <span class="input-group-text">
                                                    <i class="fab fa-cc-visa"></i>
                                                </span>
                                                <input type="text" class="form-control" value="**** **** **** 4242" readonly>
                                                <button class="btn btn-outline-secondary" type="button">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label">Auto-renewal</label>
                                            <div class="form-check form-switch mt-2">
                                                <input class="form-check-input" type="checkbox" id="autoRenewal" checked>
                                                <label class="form-check-label" for="autoRenewal">
                                                    Enable auto-renewal
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    '
                                ); ?>
                            </div>
                            <div class="col-lg-4">
                                <?php echo createCard(
                                    "Usage & Limits",
                                    '
                                    <div class="mb-3">
                                        <div class="d-flex justify-content-between">
                                            <span class="small">Models</span>
                                            <span class="fw-bold">2,450 / Unlimited</span>
                                        </div>
                                        <div class="progress" style="height: 6px;">
                                            <div class="progress-bar bg-success" style="width: 75%"></div>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <div class="d-flex justify-content-between">
                                            <span class="small">Storage</span>
                                            <span class="fw-bold">247 GB / 500 GB</span>
                                        </div>
                                        <div class="progress" style="height: 6px;">
                                            <div class="progress-bar bg-info" style="width: 49%"></div>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <div class="d-flex justify-content-between">
                                            <span class="small">API Calls</span>
                                            <span class="fw-bold">18K / 50K</span>
                                        </div>
                                        <div class="progress" style="height: 6px;">
                                            <div class="progress-bar bg-warning" style="width: 36%"></div>
                                        </div>
                                    </div>
                                    <hr>
                                    <div class="text-center">
                                        <h5 class="text-success">$2,499/month</h5>
                                        <small class="text-muted">Next billing: Jan 15, 2025</small>
                                    </div>
                                    '
                                ); ?>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Integrations Settings -->
                    <div class="tab-pane fade" id="integrations" role="tabpanel">
                        <?php echo createCard(
                            "Third-party Integrations",
                            '
                            <div class="row g-4">
                                <div class="col-md-6 col-lg-4">
                                    <div class="border rounded p-3 text-center">
                                        <i class="fab fa-google fa-2x text-primary mb-2"></i>
                                        <h6>Google Analytics</h6>
                                        <p class="small text-muted">Track website traffic and user behavior</p>
                                        <div class="form-check form-switch justify-content-center">
                                            <input class="form-check-input" type="checkbox" id="googleAnalytics" checked>
                                            <label class="form-check-label" for="googleAnalytics">Enabled</label>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6 col-lg-4">
                                    <div class="border rounded p-3 text-center">
                                        <i class="fab fa-stripe fa-2x text-info mb-2"></i>
                                        <h6>Stripe</h6>
                                        <p class="small text-muted">Payment processing and subscription management</p>
                                        <div class="form-check form-switch justify-content-center">
                                            <input class="form-check-input" type="checkbox" id="stripe" checked>
                                            <label class="form-check-label" for="stripe">Enabled</label>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6 col-lg-4">
                                    <div class="border rounded p-3 text-center">
                                        <i class="fab fa-mailchimp fa-2x text-warning mb-2"></i>
                                        <h6>Mailchimp</h6>
                                        <p class="small text-muted">Email marketing and newsletters</p>
                                        <div class="form-check form-switch justify-content-center">
                                            <input class="form-check-input" type="checkbox" id="mailchimp">
                                            <label class="form-check-label" for="mailchimp">Disabled</label>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6 col-lg-4">
                                    <div class="border rounded p-3 text-center">
                                        <i class="fab fa-slack fa-2x text-success mb-2"></i>
                                        <h6>Slack</h6>
                                        <p class="small text-muted">Team notifications and alerts</p>
                                        <div class="form-check form-switch justify-content-center">
                                            <input class="form-check-input" type="checkbox" id="slack" checked>
                                            <label class="form-check-label" for="slack">Enabled</label>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6 col-lg-4">
                                    <div class="border rounded p-3 text-center">
                                        <i class="fab fa-aws fa-2x text-danger mb-2"></i>
                                        <h6>AWS S3</h6>
                                        <p class="small text-muted">Cloud storage for images and files</p>
                                        <div class="form-check form-switch justify-content-center">
                                            <input class="form-check-input" type="checkbox" id="awsS3" checked>
                                            <label class="form-check-label" for="awsS3">Enabled</label>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6 col-lg-4">
                                    <div class="border rounded p-3 text-center">
                                        <i class="fab fa-facebook fa-2x text-primary mb-2"></i>
                                        <h6>Facebook Pixel</h6>
                                        <p class="small text-muted">Social media advertising tracking</p>
                                        <div class="form-check form-switch justify-content-center">
                                            <input class="form-check-input" type="checkbox" id="facebookPixel">
                                            <label class="form-check-label" for="facebookPixel">Disabled</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <hr>
                            <div class="text-center">
                                <button class="btn btn-primary me-2">
                                    <i class="fas fa-plus me-2"></i> Add Integration
                                </button>
                                <button class="btn btn-outline-info">
                                    <i class="fas fa-cog me-2"></i> Configure APIs
                                </button>
                            </div>
                            '
                        ); ?>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Save Button Footer -->
        <div class="row mt-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <small class="text-muted">Last saved: Dec 10, 2024 at 2:45 PM</small>
                            </div>
                            <div>
                                <button class="btn btn-outline-secondary me-2">
                                    <i class="fas fa-undo me-2"></i> Reset to Defaults
                                </button>
                                <button class="btn btn-success">
                                    <i class="fas fa-save me-2"></i> Save All Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php echo renderFooter(); ?>