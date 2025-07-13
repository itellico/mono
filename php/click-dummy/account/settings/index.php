<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Account Settings - Elite Model Management", "Agency Admin", "Account Manager", "Account");
?>

<div class="d-flex">
    <?php echo renderSidebar('Account', getAccountSidebarItems(), 'settings/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Account', 'href' => '../index.php'],
            ['label' => 'Settings']
        ]);
        
        echo createHeroSection(
            "Account Settings",
            "Manage your agency account settings, preferences, and business configurations",
            "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=1200&h=300&fit=crop",
            [
                ['label' => 'Save Changes', 'icon' => 'fas fa-save', 'style' => 'success'],
                ['label' => 'Reset Settings', 'icon' => 'fas fa-undo', 'style' => 'warning'],
                ['label' => 'Export Data', 'icon' => 'fas fa-download', 'style' => 'info']
            ]
        );
        ?>
        
        <!-- Settings Navigation -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-body">
                        <ul class="nav nav-pills nav-fill" id="settingsTabs" role="tablist">
                            <li class="nav-item" role="presentation">
                                <button class="nav-link active" id="general-tab" data-bs-toggle="pill" data-bs-target="#general" type="button" role="tab">
                                    <i class="fas fa-building me-2"></i> General
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="profile-tab" data-bs-toggle="pill" data-bs-target="#profile" type="button" role="tab">
                                    <i class="fas fa-user me-2"></i> Agency Profile
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="business-tab" data-bs-toggle="pill" data-bs-target="#business" type="button" role="tab">
                                    <i class="fas fa-briefcase me-2"></i> Business
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="notifications-tab" data-bs-toggle="pill" data-bs-target="#notifications" type="button" role="tab">
                                    <i class="fas fa-bell me-2"></i> Notifications
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="billing-tab" data-bs-toggle="pill" data-bs-target="#billing" type="button" role="tab">
                                    <i class="fas fa-credit-card me-2"></i> Billing
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="security-tab" data-bs-toggle="pill" data-bs-target="#security" type="button" role="tab">
                                    <i class="fas fa-shield-alt me-2"></i> Security
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
                                    <form id="generalForm">
                                        <div class="row g-3">
                                            <div class="col-md-6">
                                                <label class="form-label">Agency Name</label>
                                                <input type="text" class="form-control" value="Elite Model Management">
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Legal Entity Name</label>
                                                <input type="text" class="form-control" value="Elite Model Management LLC">
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Primary Contact</label>
                                                <input type="text" class="form-control" value="John Smith">
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Contact Email</label>
                                                <input type="email" class="form-control" value="contact@elitemodelmanagement.com">
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Phone Number</label>
                                                <input type="tel" class="form-control" value="+1 (212) 555-0123">
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Website</label>
                                                <input type="url" class="form-control" value="https://elitemodelmanagement.com">
                                            </div>
                                            <div class="col-12">
                                                <label class="form-label">Business Address</label>
                                                <textarea class="form-control" rows="3">123 Fashion Avenue
New York, NY 10001
United States</textarea>
                                            </div>
                                            <div class="col-md-4">
                                                <label class="form-label">Industry Focus</label>
                                                <select class="form-select">
                                                    <option selected>Fashion Modeling</option>
                                                    <option>Commercial Modeling</option>
                                                    <option>Entertainment</option>
                                                    <option>Mixed Portfolio</option>
                                                </select>
                                            </div>
                                            <div class="col-md-4">
                                                <label class="form-label">Market Reach</label>
                                                <select class="form-select">
                                                    <option>Local</option>
                                                    <option>Regional</option>
                                                    <option>National</option>
                                                    <option selected>International</option>
                                                </select>
                                            </div>
                                            <div class="col-md-4">
                                                <label class="form-label">Established Year</label>
                                                <input type="number" class="form-control" value="2008">
                                            </div>
                                        </div>
                                    </form>
                                    '
                                ); ?>
                            </div>
                            <div class="col-lg-4">
                                <?php echo createCard(
                                    "Account Status",
                                    '
                                    <div class="text-center mb-3">
                                        <div class="position-relative d-inline-block">
                                            <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=80&h=80&fit=crop" 
                                                 class="rounded" style="width: 80px; height: 80px;" alt="Agency Logo">
                                        </div>
                                        <h6 class="mt-2">Elite Model Management</h6>
                                        <span class="badge bg-success">Premium Account</span>
                                    </div>
                                    <div class="mb-3">
                                        <div class="d-flex justify-content-between">
                                            <span class="small">Account Type</span>
                                            <strong>Premium Agency</strong>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <div class="d-flex justify-content-between">
                                            <span class="small">Member Since</span>
                                            <strong>Jan 2020</strong>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <div class="d-flex justify-content-between">
                                            <span class="small">Models Represented</span>
                                            <strong>156</strong>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <div class="d-flex justify-content-between">
                                            <span class="small">Active Projects</span>
                                            <strong>24</strong>
                                        </div>
                                    </div>
                                    <hr>
                                    <button class="btn btn-outline-primary btn-sm w-100">
                                        <i class="fas fa-upload me-2"></i> Update Logo
                                    </button>
                                    '
                                ); ?>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Agency Profile -->
                    <div class="tab-pane fade" id="profile" role="tabpanel">
                        <?php echo createCard(
                            "Agency Profile & Brand",
                            '
                            <form id="profileForm">
                                <div class="row g-3">
                                    <div class="col-12">
                                        <label class="form-label">Agency Description</label>
                                        <textarea class="form-control" rows="4">Elite Model Management is a premier international modeling agency representing top-tier talent across fashion, commercial, and editorial markets. Founded in 2008, we have established ourselves as industry leaders with offices in New York, Los Angeles, and Miami.</textarea>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Specializations</label>
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="fashionModeling" checked>
                                            <label class="form-check-label" for="fashionModeling">Fashion Modeling</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="commercialModeling" checked>
                                            <label class="form-check-label" for="commercialModeling">Commercial Modeling</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="editorialWork" checked>
                                            <label class="form-check-label" for="editorialWork">Editorial Work</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="runwayShows">
                                            <label class="form-check-label" for="runwayShows">Runway Shows</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="brandPartnerships" checked>
                                            <label class="form-check-label" for="brandPartnerships">Brand Partnerships</label>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Notable Clients</label>
                                        <textarea class="form-control" rows="6" placeholder="List your notable clients...">Vogue Magazine
Nike Inc.
Calvin Klein
Zara Fashion
H&M
Ralph Lauren
Tommy Hilfiger</textarea>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Awards & Recognition</label>
                                        <textarea class="form-control" rows="4" placeholder="Agency awards and recognition...">2023 - Best International Agency (Fashion Week Awards)
2022 - Excellence in Talent Representation
2021 - Top 10 Modeling Agencies (Industry Weekly)</textarea>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Social Media</label>
                                        <div class="mb-2">
                                            <label class="form-label small">Instagram</label>
                                            <input type="text" class="form-control" value="@elitemodelmanagement">
                                        </div>
                                        <div class="mb-2">
                                            <label class="form-label small">Twitter</label>
                                            <input type="text" class="form-control" value="@EliteModels">
                                        </div>
                                        <div class="mb-2">
                                            <label class="form-label small">LinkedIn</label>
                                            <input type="text" class="form-control" value="Elite Model Management">
                                        </div>
                                    </div>
                                </div>
                            </form>
                            '
                        ); ?>
                    </div>
                    
                    <!-- Business Settings -->
                    <div class="tab-pane fade" id="business" role="tabpanel">
                        <div class="row">
                            <div class="col-lg-6">
                                <?php echo createCard(
                                    "Business Configuration",
                                    '
                                    <form id="businessForm">
                                        <div class="row g-3">
                                            <div class="col-12">
                                                <label class="form-label">Commission Structure</label>
                                                <div class="input-group">
                                                    <input type="number" class="form-control" value="15" min="0" max="50">
                                                    <span class="input-group-text">%</span>
                                                </div>
                                                <small class="text-muted">Standard agency commission rate</small>
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Payment Terms</label>
                                                <select class="form-select">
                                                    <option>Net 15</option>
                                                    <option selected>Net 30</option>
                                                    <option>Net 45</option>
                                                    <option>Net 60</option>
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
                                            <div class="col-12">
                                                <label class="form-label">Tax ID / EIN</label>
                                                <input type="text" class="form-control" value="12-3456789">
                                            </div>
                                            <div class="col-12">
                                                <div class="form-check form-switch">
                                                    <input class="form-check-input" type="checkbox" id="autoInvoicing" checked>
                                                    <label class="form-check-label" for="autoInvoicing">
                                                        Enable automatic invoicing
                                                    </label>
                                                </div>
                                            </div>
                                            <div class="col-12">
                                                <div class="form-check form-switch">
                                                    <input class="form-check-input" type="checkbox" id="contractReminders" checked>
                                                    <label class="form-check-label" for="contractReminders">
                                                        Send contract renewal reminders
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                    '
                                ); ?>
                            </div>
                            <div class="col-lg-6">
                                <?php echo createCard(
                                    "Working Hours & Availability",
                                    '
                                    <form id="scheduleForm">
                                        <div class="row g-3">
                                            <div class="col-md-6">
                                                <label class="form-label">Time Zone</label>
                                                <select class="form-select">
                                                    <option selected>Eastern Time (ET)</option>
                                                    <option>Central Time (CT)</option>
                                                    <option>Mountain Time (MT)</option>
                                                    <option>Pacific Time (PT)</option>
                                                </select>
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Business Hours</label>
                                                <select class="form-select">
                                                    <option selected>9 AM - 6 PM</option>
                                                    <option>8 AM - 5 PM</option>
                                                    <option>10 AM - 7 PM</option>
                                                    <option>24/7 Support</option>
                                                </select>
                                            </div>
                                            <div class="col-12">
                                                <label class="form-label">Working Days</label>
                                                <div class="row">
                                                    <div class="col-6">
                                                        <div class="form-check">
                                                            <input class="form-check-input" type="checkbox" id="monday" checked>
                                                            <label class="form-check-label" for="monday">Monday</label>
                                                        </div>
                                                        <div class="form-check">
                                                            <input class="form-check-input" type="checkbox" id="tuesday" checked>
                                                            <label class="form-check-label" for="tuesday">Tuesday</label>
                                                        </div>
                                                        <div class="form-check">
                                                            <input class="form-check-input" type="checkbox" id="wednesday" checked>
                                                            <label class="form-check-label" for="wednesday">Wednesday</label>
                                                        </div>
                                                        <div class="form-check">
                                                            <input class="form-check-input" type="checkbox" id="thursday" checked>
                                                            <label class="form-check-label" for="thursday">Thursday</label>
                                                        </div>
                                                    </div>
                                                    <div class="col-6">
                                                        <div class="form-check">
                                                            <input class="form-check-input" type="checkbox" id="friday" checked>
                                                            <label class="form-check-label" for="friday">Friday</label>
                                                        </div>
                                                        <div class="form-check">
                                                            <input class="form-check-input" type="checkbox" id="saturday">
                                                            <label class="form-check-label" for="saturday">Saturday</label>
                                                        </div>
                                                        <div class="form-check">
                                                            <input class="form-check-input" type="checkbox" id="sunday">
                                                            <label class="form-check-label" for="sunday">Sunday</label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-12">
                                                <label class="form-label">Emergency Contact</label>
                                                <input type="tel" class="form-control" value="+1 (212) 555-0199" placeholder="24/7 emergency contact number">
                                            </div>
                                        </div>
                                    </form>
                                    '
                                ); ?>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Notifications -->
                    <div class="tab-pane fade" id="notifications" role="tabpanel">
                        <?php echo createCard(
                            "Notification Preferences",
                            '
                            <form id="notificationsForm">
                                <div class="row g-4">
                                    <div class="col-md-6">
                                        <h6>Email Notifications</h6>
                                        <div class="form-check form-switch mb-2">
                                            <input class="form-check-input" type="checkbox" id="emailNewBookings" checked>
                                            <label class="form-check-label" for="emailNewBookings">New Booking Requests</label>
                                        </div>
                                        <div class="form-check form-switch mb-2">
                                            <input class="form-check-input" type="checkbox" id="emailModelApplications" checked>
                                            <label class="form-check-label" for="emailModelApplications">Model Applications</label>
                                        </div>
                                        <div class="form-check form-switch mb-2">
                                            <input class="form-check-input" type="checkbox" id="emailPayments" checked>
                                            <label class="form-check-label" for="emailPayments">Payment Notifications</label>
                                        </div>
                                        <div class="form-check form-switch mb-2">
                                            <input class="form-check-input" type="checkbox" id="emailContracts">
                                            <label class="form-check-label" for="emailContracts">Contract Updates</label>
                                        </div>
                                        <div class="form-check form-switch mb-2">
                                            <input class="form-check-input" type="checkbox" id="emailReports" checked>
                                            <label class="form-check-label" for="emailReports">Weekly Reports</label>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <h6>SMS Notifications</h6>
                                        <div class="form-check form-switch mb-2">
                                            <input class="form-check-input" type="checkbox" id="smsUrgent" checked>
                                            <label class="form-check-label" for="smsUrgent">Urgent Alerts</label>
                                        </div>
                                        <div class="form-check form-switch mb-2">
                                            <input class="form-check-input" type="checkbox" id="smsBookings">
                                            <label class="form-check-label" for="smsBookings">Booking Confirmations</label>
                                        </div>
                                        <div class="form-check form-switch mb-2">
                                            <input class="form-check-input" type="checkbox" id="smsPayments">
                                            <label class="form-check-label" for="smsPayments">Payment Alerts</label>
                                        </div>
                                        <div class="form-check form-switch mb-2">
                                            <input class="form-check-input" type="checkbox" id="smsReminders" checked>
                                            <label class="form-check-label" for="smsReminders">Appointment Reminders</label>
                                        </div>
                                    </div>
                                    <div class="col-12">
                                        <h6>Notification Schedule</h6>
                                        <div class="row g-3">
                                            <div class="col-md-4">
                                                <label class="form-label">Email Frequency</label>
                                                <select class="form-select">
                                                    <option selected>Real-time</option>
                                                    <option>Hourly Summary</option>
                                                    <option>Daily Summary</option>
                                                    <option>Weekly Summary</option>
                                                </select>
                                            </div>
                                            <div class="col-md-4">
                                                <label class="form-label">Quiet Hours Start</label>
                                                <input type="time" class="form-control" value="22:00">
                                            </div>
                                            <div class="col-md-4">
                                                <label class="form-label">Quiet Hours End</label>
                                                <input type="time" class="form-control" value="08:00">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                            '
                        ); ?>
                    </div>
                    
                    <!-- Billing -->
                    <div class="tab-pane fade" id="billing" role="tabpanel">
                        <div class="row">
                            <div class="col-lg-8">
                                <?php echo createCard(
                                    "Billing Information",
                                    '
                                    <div class="alert alert-info">
                                        <div class="d-flex justify-content-between align-items-center">
                                            <div>
                                                <h6 class="mb-1">Premium Agency Plan</h6>
                                                <small>$299/month • Next billing: Jan 15, 2025</small>
                                            </div>
                                            <span class="badge bg-info">Active</span>
                                        </div>
                                    </div>
                                    <form id="billingForm">
                                        <div class="row g-3">
                                            <div class="col-md-6">
                                                <label class="form-label">Billing Contact</label>
                                                <input type="text" class="form-control" value="John Smith">
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Billing Email</label>
                                                <input type="email" class="form-control" value="billing@elitemodelmanagement.com">
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
                                                        <i class="fas fa-edit"></i> Change
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
                                    </form>
                                    '
                                ); ?>
                            </div>
                            <div class="col-lg-4">
                                <?php echo createCard(
                                    "Plan Usage",
                                    '
                                    <div class="mb-3">
                                        <div class="d-flex justify-content-between">
                                            <span class="small">Models</span>
                                            <span class="fw-bold">156 / 200</span>
                                        </div>
                                        <div class="progress" style="height: 6px;">
                                            <div class="progress-bar bg-primary" style="width: 78%"></div>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <div class="d-flex justify-content-between">
                                            <span class="small">Storage</span>
                                            <span class="fw-bold">89 GB / 500 GB</span>
                                        </div>
                                        <div class="progress" style="height: 6px;">
                                            <div class="progress-bar bg-success" style="width: 18%"></div>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <div class="d-flex justify-content-between">
                                            <span class="small">API Calls</span>
                                            <span class="fw-bold">7.2K / 25K</span>
                                        </div>
                                        <div class="progress" style="height: 6px;">
                                            <div class="progress-bar bg-info" style="width: 29%"></div>
                                        </div>
                                    </div>
                                    <hr>
                                    <div class="text-center">
                                        <h5 class="text-primary">$299/month</h5>
                                        <small class="text-muted">Premium Agency Plan</small>
                                        <br>
                                        <button class="btn btn-outline-primary btn-sm mt-2">
                                            <i class="fas fa-arrow-up me-1"></i> Upgrade Plan
                                        </button>
                                    </div>
                                    '
                                ); ?>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Security -->
                    <div class="tab-pane fade" id="security" role="tabpanel">
                        <?php echo createCard(
                            "Security Settings",
                            '
                            <form id="securityForm">
                                <div class="row g-4">
                                    <div class="col-md-6">
                                        <h6>Account Security</h6>
                                        <div class="mb-3">
                                            <label class="form-label">Current Password</label>
                                            <input type="password" class="form-control" placeholder="Enter current password">
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">New Password</label>
                                            <input type="password" class="form-control" placeholder="Enter new password">
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">Confirm New Password</label>
                                            <input type="password" class="form-control" placeholder="Confirm new password">
                                        </div>
                                        <button type="button" class="btn btn-primary" data-action="update-password">
                                            <i class="fas fa-key me-2"></i> Update Password
                                        </button>
                                    </div>
                                    <div class="col-md-6">
                                        <h6>Two-Factor Authentication</h6>
                                        <div class="d-flex align-items-center justify-content-between mb-3">
                                            <div>
                                                <strong>SMS Authentication</strong><br>
                                                <small class="text-muted">Receive codes via SMS</small>
                                            </div>
                                            <div class="form-check form-switch">
                                                <input class="form-check-input" type="checkbox" id="sms2fa" checked>
                                            </div>
                                        </div>
                                        <div class="d-flex align-items-center justify-content-between mb-3">
                                            <div>
                                                <strong>App Authentication</strong><br>
                                                <small class="text-muted">Use authenticator app</small>
                                            </div>
                                            <div class="form-check form-switch">
                                                <input class="form-check-input" type="checkbox" id="app2fa">
                                            </div>
                                        </div>
                                        <div class="d-flex align-items-center justify-content-between mb-3">
                                            <div>
                                                <strong>Login Alerts</strong><br>
                                                <small class="text-muted">Email on new device login</small>
                                            </div>
                                            <div class="form-check form-switch">
                                                <input class="form-check-input" type="checkbox" id="loginAlerts" checked>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-12">
                                        <h6>Session Management</h6>
                                        <div class="table-responsive">
                                            <table class="table table-sm">
                                                <thead>
                                                    <tr>
                                                        <th>Device</th>
                                                        <th>Location</th>
                                                        <th>Last Active</th>
                                                        <th>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td>
                                                            <i class="fas fa-desktop me-2"></i> Desktop - Chrome
                                                            <span class="badge bg-success ms-2">Current</span>
                                                        </td>
                                                        <td>New York, NY</td>
                                                        <td>Active now</td>
                                                        <td>-</td>
                                                    </tr>
                                                    <tr>
                                                        <td><i class="fas fa-mobile-alt me-2"></i> iPhone - Safari</td>
                                                        <td>New York, NY</td>
                                                        <td>2 hours ago</td>
                                                        <td>
                                                            <button class="btn btn-outline-danger btn-sm">
                                                                <i class="fas fa-sign-out-alt"></i> Logout
                                                            </button>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td><i class="fas fa-tablet-alt me-2"></i> iPad - Safari</td>
                                                        <td>Los Angeles, CA</td>
                                                        <td>1 day ago</td>
                                                        <td>
                                                            <button class="btn btn-outline-danger btn-sm">
                                                                <i class="fas fa-sign-out-alt"></i> Logout
                                                            </button>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </form>
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
                                <small class="text-muted">Last saved: Dec 10, 2024 at 3:15 PM</small>
                            </div>
                            <div>
                                <button class="btn btn-outline-secondary me-2">
                                    <i class="fas fa-undo me-2"></i> Reset Changes
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

<script>
// Settings Management JavaScript
class SettingsManager {
    constructor() {
        this.activeTab = 'general';
        this.unsavedChanges = false;
        this.setupEventListeners();
        this.setupFormHandlers();
        this.setupTabHandlers();
        this.setupPasswordToggle();
        this.trackChanges();
    }

    setupEventListeners() {
        // Save all changes button
        document.querySelector('.btn-success').addEventListener('click', () => {
            this.saveAllSettings();
        });

        // Reset changes button
        document.querySelector('.btn-outline-secondary').addEventListener('click', () => {
            this.resetAllSettings();
        });

        // Update logo button
        document.querySelector('.btn-outline-primary.btn-sm').addEventListener('click', () => {
            this.handleLogoUpload();
        });

        // Update password button
        document.querySelector('[data-action="update-password"]')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.updatePassword();
        });

        // Session logout buttons
        document.querySelectorAll('.btn-outline-danger').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logoutSession(btn);
            });
        });
    }

    setupFormHandlers() {
        const forms = ['generalForm', 'profileForm', 'businessForm', 'scheduleForm', 'notificationsForm', 'billingForm', 'securityForm'];
        
        forms.forEach(formId => {
            const form = document.getElementById(formId);
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.saveFormSettings(formId);
                });
            }
        });
    }

    setupTabHandlers() {
        document.querySelectorAll('[data-bs-toggle="pill"]').forEach(tab => {
            tab.addEventListener('shown.bs.tab', (e) => {
                this.activeTab = e.target.getAttribute('data-bs-target').replace('#', '');
                this.updateLastActiveTab();
            });
        });
    }

    setupPasswordToggle() {
        // Add password visibility toggle (if needed)
        const passwordFields = document.querySelectorAll('input[type="password"]');
        passwordFields.forEach(field => {
            const toggleBtn = document.createElement('button');
            toggleBtn.type = 'button';
            toggleBtn.className = 'btn btn-outline-secondary position-absolute end-0 top-50 translate-middle-y me-2';
            toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
            toggleBtn.style.zIndex = '10';
            
            if (field.parentElement.classList.contains('input-group')) return;
            
            field.parentElement.style.position = 'relative';
            field.style.paddingRight = '45px';
            field.parentElement.appendChild(toggleBtn);
            
            toggleBtn.addEventListener('click', () => {
                const isPassword = field.type === 'password';
                field.type = isPassword ? 'text' : 'password';
                toggleBtn.innerHTML = isPassword ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
            });
        });
    }

    trackChanges() {
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                this.unsavedChanges = true;
                this.updateSaveButton();
            });
        });

        // Track checkbox changes
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.unsavedChanges = true;
                this.updateSaveButton();
            });
        });
    }

    updateSaveButton() {
        const saveBtn = document.querySelector('.btn-success');
        if (this.unsavedChanges) {
            saveBtn.innerHTML = '<i class="fas fa-save me-2"></i> Save Changes *';
            saveBtn.classList.add('pulse');
        } else {
            saveBtn.innerHTML = '<i class="fas fa-save me-2"></i> Save All Changes';
            saveBtn.classList.remove('pulse');
        }
    }

    async saveFormSettings(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        const formData = new FormData(form);
        const settings = {};
        
        // Convert FormData to object
        for (let [key, value] of formData.entries()) {
            settings[key] = value;
        }

        try {
            // Simulate API call
            await this.simulateAPICall();
            
            this.showToast(`${this.getTabName(formId)} settings saved successfully!`, 'success');
            this.unsavedChanges = false;
            this.updateSaveButton();
            this.updateLastSaved();
        } catch (error) {
            this.showToast(`Failed to save ${this.getTabName(formId)} settings. Please try again.`, 'danger');
        }
    }

    async saveAllSettings() {
        try {
            // Show loading state
            const saveBtn = document.querySelector('.btn-success');
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Saving...';
            saveBtn.disabled = true;

            // Simulate saving all forms
            await this.simulateAPICall(2000);
            
            this.showToast('All settings saved successfully!', 'success');
            this.unsavedChanges = false;
            this.updateSaveButton();
            this.updateLastSaved();

            // Reset button state
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        } catch (error) {
            this.showToast('Failed to save settings. Please try again.', 'danger');
            
            // Reset button state
            const saveBtn = document.querySelector('.btn-success');
            saveBtn.innerHTML = '<i class="fas fa-save me-2"></i> Save All Changes';
            saveBtn.disabled = false;
        }
    }

    resetAllSettings() {
        if (this.unsavedChanges) {
            if (!confirm('Are you sure you want to reset all changes? Any unsaved changes will be lost.')) {
                return;
            }
        }

        // Reset all forms to original values
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.reset();
        });

        this.unsavedChanges = false;
        this.updateSaveButton();
        this.showToast('All changes have been reset.', 'info');
    }

    async handleLogoUpload() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';
        
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    // Simulate upload
                    await this.simulateAPICall(1500);
                    
                    // Update logo preview
                    const logoImg = document.querySelector('.rounded[alt="Agency Logo"]');
                    if (logoImg) {
                        logoImg.src = URL.createObjectURL(file);
                    }
                    
                    this.showToast('Logo uploaded successfully!', 'success');
                } catch (error) {
                    this.showToast('Failed to upload logo. Please try again.', 'danger');
                }
            }
        });
        
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    }

    async updatePassword() {
        const currentPassword = document.querySelector('input[placeholder="Enter current password"]').value;
        const newPassword = document.querySelector('input[placeholder="Enter new password"]').value;
        const confirmPassword = document.querySelector('input[placeholder="Confirm new password"]').value;

        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showToast('Please fill in all password fields.', 'warning');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showToast('New passwords do not match.', 'danger');
            return;
        }

        if (newPassword.length < 8) {
            this.showToast('Password must be at least 8 characters long.', 'warning');
            return;
        }

        try {
            await this.simulateAPICall(1000);
            
            // Clear password fields
            document.querySelectorAll('input[type="password"]').forEach(field => {
                field.value = '';
            });
            
            this.showToast('Password updated successfully!', 'success');
        } catch (error) {
            this.showToast('Failed to update password. Please try again.', 'danger');
        }
    }

    async logoutSession(button) {
        const row = button.closest('tr');
        const device = row.querySelector('td:first-child').textContent.trim();
        
        if (confirm(`Are you sure you want to logout from ${device}?`)) {
            try {
                await this.simulateAPICall(500);
                row.remove();
                this.showToast(`Successfully logged out from ${device}`, 'success');
            } catch (error) {
                this.showToast('Failed to logout session. Please try again.', 'danger');
            }
        }
    }

    getTabName(formId) {
        const tabNames = {
            'generalForm': 'General',
            'profileForm': 'Agency Profile',
            'businessForm': 'Business',
            'scheduleForm': 'Schedule',
            'notificationsForm': 'Notifications',
            'billingForm': 'Billing',
            'securityForm': 'Security'
        };
        return tabNames[formId] || 'Settings';
    }

    updateLastActiveTab() {
        localStorage.setItem('settingsLastTab', this.activeTab);
    }

    updateLastSaved() {
        const now = new Date();
        const timeString = now.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        
        const lastSavedElement = document.querySelector('.text-muted');
        if (lastSavedElement) {
            lastSavedElement.textContent = `Last saved: ${timeString}`;
        }
    }

    async simulateAPICall(delay = 1000) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate occasional failures
                if (Math.random() < 0.05) {
                    reject(new Error('API Error'));
                } else {
                    resolve();
                }
            }, delay);
        });
    }

    showToast(message, type = 'info') {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => toast.remove());

        const toastContainer = document.createElement('div');
        toastContainer.className = 'position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';

        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-${this.getToastIcon(type)} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        toastContainer.appendChild(toast);
        document.body.appendChild(toastContainer);

        const bsToast = new bootstrap.Toast(toast, { delay: 4000 });
        bsToast.show();

        // Auto remove after hiding
        toast.addEventListener('hidden.bs.toast', () => {
            toastContainer.remove();
        });
    }

    getToastIcon(type) {
        const icons = {
            'success': 'check-circle',
            'danger': 'exclamation-triangle',
            'warning': 'exclamation-circle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
}

// Initialize Settings Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SettingsManager();
    
    // Restore last active tab
    const lastTab = localStorage.getItem('settingsLastTab');
    if (lastTab) {
        const tabButton = document.querySelector(`[data-bs-target="#${lastTab}"]`);
        if (tabButton) {
            const tab = new bootstrap.Tab(tabButton);
            tab.show();
        }
    }
});

// Add pulse animation CSS
const style = document.createElement('style');
style.textContent = `
    .pulse {
        animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
        0% {
            box-shadow: 0 0 0 0 rgba(13, 202, 240, 0.7);
        }
        70% {
            box-shadow: 0 0 0 10px rgba(13, 202, 240, 0);
        }
        100% {
            box-shadow: 0 0 0 0 rgba(13, 202, 240, 0);
        }
    }
`;
document.head.appendChild(style);
</script>

<?php echo renderFooter(); ?>