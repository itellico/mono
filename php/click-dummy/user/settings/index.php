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
.settings-hero { 
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 2rem 0;
    margin: -20px -20px 30px -20px;
}
.settings-nav {
    background: #f8f9fa;
    border-radius: 15px;
    padding: 1.5rem;
    position: sticky;
    top: 20px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}
.settings-nav-item {
    display: block;
    padding: 1rem 1.25rem;
    color: #495057;
    text-decoration: none;
    border-radius: 10px;
    margin-bottom: 0.75rem;
    transition: all 0.3s ease;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
    cursor: pointer;
}
.settings-nav-item:hover {
    background: #e9ecef;
    color: #007bff;
    transform: translateX(5px);
}
.settings-nav-item.active {
    background: #007bff;
    color: white;
    box-shadow: 0 4px 15px rgba(0,123,255,0.3);
}
.settings-nav-item i {
    width: 20px;
    margin-right: 0.75rem;
}
.settings-section {
    display: none;
    background: white;
    border-radius: 15px;
    padding: 2rem;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}
.settings-section.active {
    display: block;
}
.form-group {
    margin-bottom: 1.5rem;
}
.form-label {
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #495057;
}
.form-text {
    font-size: 0.875rem;
    color: #6c757d;
    margin-top: 0.25rem;
}
.toggle-switch {
    position: relative;
    display: inline-block;
    width: 60px;
    height: 34px;
}
.toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
}
.toggle-slider {
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
.toggle-slider:before {
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
input:checked + .toggle-slider {
    background-color: #007bff;
}
input:checked + .toggle-slider:before {
    transform: translateX(26px);
}
.danger-zone {
    border: 2px solid #dc3545;
    border-radius: 15px;
    padding: 1.5rem;
    background: #fff5f5;
    margin-top: 2rem;
}
.privacy-item {
    background: #f8f9fa;
    border-radius: 10px;
    padding: 1.25rem;
    margin-bottom: 1rem;
    border-left: 4px solid #007bff;
}
.billing-card {
    background: linear-gradient(135deg, #28a745, #20c997);
    color: white;
    border-radius: 15px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
}
.usage-bar {
    background: rgba(255,255,255,0.2);
    height: 8px;
    border-radius: 4px;
    overflow: hidden;
}
.usage-progress {
    background: white;
    height: 100%;
    border-radius: 4px;
    transition: width 0.5s ease;
}
.save-indicator {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
}</style>

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
        
        <!-- Save Indicator -->
        <div id="saveIndicator" class="save-indicator" style="display: none;">
            <div class="alert alert-success mb-0">
                <i class="fas fa-check me-2"></i>Settings saved successfully
            </div>
        </div>
        
        <div class="row">
            <!-- Settings Navigation -->
            <div class="col-lg-3">
                <div class="settings-nav">
                    <h5 class="mb-3">Settings</h5>
                    <button class="settings-nav-item active" data-section="account">
                        <i class="fas fa-user"></i>Account Settings
                    </button>
                    <button class="settings-nav-item" data-section="notifications">
                        <i class="fas fa-bell"></i>Notifications
                    </button>
                    <button class="settings-nav-item" data-section="privacy">
                        <i class="fas fa-shield-alt"></i>Privacy & Security
                    </button>
                    <button class="settings-nav-item" data-section="preferences">
                        <i class="fas fa-cog"></i>Preferences
                    </button>
                    <button class="settings-nav-item" data-section="billing">
                        <i class="fas fa-credit-card"></i>Billing & Plan
                    </button>
                    <button class="settings-nav-item" data-section="data">
                        <i class="fas fa-download"></i>Data & Export
                    </button>
                </div>
            </div>

            <!-- Settings Content -->
            <div class="col-lg-9">
                <!-- Account Settings -->
                <div class="settings-section active" id="account">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h4>Account Settings</h4>
                        <button class="btn btn-primary" onclick="saveSettings('account')">
                            <i class="fas fa-save me-2"></i>Save Changes
                        </button>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label class="form-label">Email Address</label>
                                <input type="email" class="form-control" id="email" value="emma.johnson@email.com">
                                <div class="form-text">This is your primary email for notifications and login</div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Phone Number</label>
                                <input type="tel" class="form-control" id="phone" value="+1 (555) 123-4567">
                                <div class="form-text">Used for SMS notifications and account recovery</div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Time Zone</label>
                                <select class="form-select" id="timezone">
                                    <option selected>Eastern Time (ET)</option>
                                    <option>Central Time (CT)</option>
                                    <option>Mountain Time (MT)</option>
                                    <option>Pacific Time (PT)</option>
                                    <option>GMT</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label class="form-label">Language</label>
                                <select class="form-select" id="language">
                                    <option selected>English (US)</option>
                                    <option>English (UK)</option>
                                    <option>Spanish</option>
                                    <option>French</option>
                                    <option>German</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Currency</label>
                                <select class="form-select" id="currency">
                                    <option selected>USD ($)</option>
                                    <option>EUR (€)</option>
                                    <option>GBP (£)</option>
                                    <option>CAD ($)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Date Format</label>
                                <select class="form-select" id="dateFormat">
                                    <option selected>MM/DD/YYYY</option>
                                    <option>DD/MM/YYYY</option>
                                    <option>YYYY-MM-DD</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <hr class="my-4">
                    
                    <h5 class="mb-3">Password & Security</h5>
                    <div class="row">
                        <div class="col-md-6">
                            <button class="btn btn-outline-primary mb-3" onclick="changePassword()">
                                <i class="fas fa-key me-2"></i>Change Password
                            </button>
                            <br>
                            <button class="btn btn-outline-success mb-3" onclick="setup2FA()">
                                <i class="fas fa-mobile-alt me-2"></i>Setup Two-Factor Authentication
                            </button>
                        </div>
                        <div class="col-md-6">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <strong>Two-Factor Authentication</strong>
                                    <div class="form-text">Extra security for your account</div>
                                </div>
                                <div class="toggle-switch">
                                    <input type="checkbox" id="twoFactor">
                                    <span class="toggle-slider"></span>
                                </div>
                            </div>
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>Login Notifications</strong>
                                    <div class="form-text">Get notified of new logins</div>
                                </div>
                                <div class="toggle-switch">
                                    <input type="checkbox" id="loginNotifications" checked>
                                    <span class="toggle-slider"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Notifications Settings -->
                <div class="settings-section" id="notifications">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h4>Notification Settings</h4>
                        <button class="btn btn-primary" onclick="saveSettings('notifications')">
                            <i class="fas fa-save me-2"></i>Save Changes
                        </button>
                    </div>

                    <div class="row">
                        <div class="col-md-6">
                            <h5 class="mb-3">Email Notifications</h5>
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <strong>New Job Opportunities</strong>
                                    <div class="form-text">Get notified of relevant casting calls</div>
                                </div>
                                <div class="toggle-switch">
                                    <input type="checkbox" id="emailJobs" checked>
                                    <span class="toggle-slider"></span>
                                </div>
                            </div>
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <strong>Application Updates</strong>
                                    <div class="form-text">Status changes on your applications</div>
                                </div>
                                <div class="toggle-switch">
                                    <input type="checkbox" id="emailApplications" checked>
                                    <span class="toggle-slider"></span>
                                </div>
                            </div>
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <strong>Messages</strong>
                                    <div class="form-text">New messages from clients</div>
                                </div>
                                <div class="toggle-switch">
                                    <input type="checkbox" id="emailMessages" checked>
                                    <span class="toggle-slider"></span>
                                </div>
                            </div>
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <strong>Calendar Reminders</strong>
                                    <div class="form-text">Upcoming bookings and events</div>
                                </div>
                                <div class="toggle-switch">
                                    <input type="checkbox" id="emailCalendar" checked>
                                    <span class="toggle-slider"></span>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <h5 class="mb-3">Push Notifications</h5>
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <strong>Instant Messages</strong>
                                    <div class="form-text">Real-time message notifications</div>
                                </div>
                                <div class="toggle-switch">
                                    <input type="checkbox" id="pushMessages" checked>
                                    <span class="toggle-slider"></span>
                                </div>
                            </div>
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <strong>Booking Confirmations</strong>
                                    <div class="form-text">Immediate booking updates</div>
                                </div>
                                <div class="toggle-switch">
                                    <input type="checkbox" id="pushBookings" checked>
                                    <span class="toggle-slider"></span>
                                </div>
                            </div>
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <strong>Payment Notifications</strong>
                                    <div class="form-text">Payment confirmations and receipts</div>
                                </div>
                                <div class="toggle-switch">
                                    <input type="checkbox" id="pushPayments" checked>
                                    <span class="toggle-slider"></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr class="my-4">
                    
                    <h5 class="mb-3">Notification Schedule</h5>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label class="form-label">Quiet Hours Start</label>
                                <input type="time" class="form-control" id="quietStart" value="22:00">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label class="form-label">Quiet Hours End</label>
                                <input type="time" class="form-control" id="quietEnd" value="08:00">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Privacy & Security -->
                <div class="settings-section" id="privacy">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h4>Privacy & Security</h4>
                        <button class="btn btn-primary" onclick="saveSettings('privacy')">
                            <i class="fas fa-save me-2"></i>Save Changes
                        </button>
                    </div>

                    <div class="privacy-item">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-1">Profile Visibility</h6>
                                <small class="text-muted">Control who can see your profile</small>
                            </div>
                            <select class="form-select" style="width: auto;" id="profileVisibility">
                                <option selected>Public</option>
                                <option>Verified Clients Only</option>
                                <option>Private</option>
                            </select>
                        </div>
                    </div>

                    <div class="privacy-item">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-1">Contact Information</h6>
                                <small class="text-muted">Show contact details on profile</small>
                            </div>
                            <div class="toggle-switch">
                                <input type="checkbox" id="showContact" checked>
                                <span class="toggle-slider"></span>
                            </div>
                        </div>
                    </div>

                    <div class="privacy-item">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-1">Online Status</h6>
                                <small class="text-muted">Show when you're online</small>
                            </div>
                            <div class="toggle-switch">
                                <input type="checkbox" id="showOnline" checked>
                                <span class="toggle-slider"></span>
                            </div>
                        </div>
                    </div>

                    <div class="privacy-item">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-1">Portfolio Downloads</h6>
                                <small class="text-muted">Allow clients to download portfolio images</small>
                            </div>
                            <div class="toggle-switch">
                                <input type="checkbox" id="allowDownloads">
                                <span class="toggle-slider"></span>
                            </div>
                        </div>
                    </div>

                    <hr class="my-4">
                    
                    <h5 class="mb-3">Data & Cookies</h5>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <strong>Analytics Cookies</strong>
                                    <div class="form-text">Help us improve the platform</div>
                                </div>
                                <div class="toggle-switch">
                                    <input type="checkbox" id="analyticsCookies" checked>
                                    <span class="toggle-slider"></span>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <strong>Marketing Cookies</strong>
                                    <div class="form-text">Personalized recommendations</div>
                                </div>
                                <div class="toggle-switch">
                                    <input type="checkbox" id="marketingCookies">
                                    <span class="toggle-slider"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Preferences -->
                <div class="settings-section" id="preferences">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h4>Preferences</h4>
                        <button class="btn btn-primary" onclick="saveSettings('preferences')">
                            <i class="fas fa-save me-2"></i>Save Changes
                        </button>
                    </div>

                    <div class="row">
                        <div class="col-md-6">
                            <h5 class="mb-3">Display</h5>
                            <div class="form-group">
                                <label class="form-label">Theme</label>
                                <select class="form-select" id="theme">
                                    <option selected>Light</option>
                                    <option>Dark</option>
                                    <option>Auto (System)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Dashboard View</label>
                                <select class="form-select" id="dashboardView">
                                    <option selected>Cards</option>
                                    <option>List</option>
                                    <option>Compact</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Items per Page</label>
                                <select class="form-select" id="itemsPerPage">
                                    <option>10</option>
                                    <option selected>20</option>
                                    <option>50</option>
                                    <option>100</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <h5 class="mb-3">Job Preferences</h5>
                            <div class="form-group">
                                <label class="form-label">Preferred Job Types</label>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="fashionJobs" checked>
                                    <label class="form-check-label" for="fashionJobs">Fashion Modeling</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="commercialJobs" checked>
                                    <label class="form-check-label" for="commercialJobs">Commercial Work</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="editorialJobs" checked>
                                    <label class="form-check-label" for="editorialJobs">Editorial Shoots</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="runwayJobs">
                                    <label class="form-check-label" for="runwayJobs">Runway Shows</label>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Travel Preference</label>
                                <select class="form-select" id="travelPreference">
                                    <option>Local Only</option>
                                    <option selected>Regional (within 100 miles)</option>
                                    <option>National</option>
                                    <option>International</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Billing & Plan -->
                <div class="settings-section" id="billing">
                    <h4 class="mb-4">Billing & Plan</h4>
                    
                    <div class="billing-card">
                        <div class="row align-items-center">
                            <div class="col-md-8">
                                <h5 class="mb-2">Professional Plan</h5>
                                <p class="mb-3">Full access to all platform features</p>
                                <div class="usage-bar mb-2">
                                    <div class="usage-progress" style="width: 65%"></div>
                                </div>
                                <small>65% of monthly application limit used (13/20)</small>
                            </div>
                            <div class="col-md-4 text-end">
                                <h3 class="mb-1">$29/mo</h3>
                                <button class="btn btn-light btn-sm">Manage Plan</button>
                            </div>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-md-6">
                            <h5 class="mb-3">Payment Method</h5>
                            <div class="card">
                                <div class="card-body">
                                    <div class="d-flex align-items-center">
                                        <i class="fab fa-cc-visa fa-2x text-primary me-3"></i>
                                        <div>
                                            <h6 class="mb-0">•••• •••• •••• 4567</h6>
                                            <small class="text-muted">Expires 12/25</small>
                                        </div>
                                        <button class="btn btn-outline-primary btn-sm ms-auto">Edit</button>
                                    </div>
                                </div>
                            </div>
                            <button class="btn btn-outline-success mt-2">
                                <i class="fas fa-plus me-2"></i>Add Payment Method
                            </button>
                        </div>
                        <div class="col-md-6">
                            <h5 class="mb-3">Billing History</h5>
                            <div class="list-group">
                                <div class="list-group-item d-flex justify-content-between">
                                    <div>
                                        <h6 class="mb-0">Professional Plan</h6>
                                        <small class="text-muted">Jan 1, 2024</small>
                                    </div>
                                    <span>$29.00</span>
                                </div>
                                <div class="list-group-item d-flex justify-content-between">
                                    <div>
                                        <h6 class="mb-0">Professional Plan</h6>
                                        <small class="text-muted">Dec 1, 2023</small>
                                    </div>
                                    <span>$29.00</span>
                                </div>
                                <div class="list-group-item d-flex justify-content-between">
                                    <div>
                                        <h6 class="mb-0">Professional Plan</h6>
                                        <small class="text-muted">Nov 1, 2023</small>
                                    </div>
                                    <span>$29.00</span>
                                </div>
                            </div>
                            <button class="btn btn-outline-secondary btn-sm mt-2">View All</button>
                        </div>
                    </div>

                    <hr class="my-4">
                    
                    <h5 class="mb-3">Plan Comparison</h5>
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Feature</th>
                                    <th>Free</th>
                                    <th>Professional</th>
                                    <th>Premium</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Monthly Applications</td>
                                    <td>5</td>
                                    <td><strong>20</strong></td>
                                    <td>Unlimited</td>
                                </tr>
                                <tr>
                                    <td>Portfolio Photos</td>
                                    <td>10</td>
                                    <td><strong>100</strong></td>
                                    <td>Unlimited</td>
                                </tr>
                                <tr>
                                    <td>Priority Support</td>
                                    <td>-</td>
                                    <td><i class="fas fa-check text-success"></i></td>
                                    <td><i class="fas fa-check text-success"></i></td>
                                </tr>
                                <tr>
                                    <td>Advanced Analytics</td>
                                    <td>-</td>
                                    <td>-</td>
                                    <td><i class="fas fa-check text-success"></i></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Data & Export -->
                <div class="settings-section" id="data">
                    <h4 class="mb-4">Data & Export</h4>
                    
                    <div class="row">
                        <div class="col-md-6">
                            <h5 class="mb-3">Data Export</h5>
                            <p class="text-muted">Download your data in various formats</p>
                            <div class="d-grid gap-2">
                                <button class="btn btn-outline-primary" onclick="exportData('profile')">
                                    <i class="fas fa-user me-2"></i>Export Profile Data
                                </button>
                                <button class="btn btn-outline-primary" onclick="exportData('portfolio')">
                                    <i class="fas fa-images me-2"></i>Export Portfolio
                                </button>
                                <button class="btn btn-outline-primary" onclick="exportData('applications')">
                                    <i class="fas fa-file-alt me-2"></i>Export Applications
                                </button>
                                <button class="btn btn-outline-primary" onclick="exportData('all')">
                                    <i class="fas fa-download me-2"></i>Export All Data
                                </button>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <h5 class="mb-3">Data Usage</h5>
                            <div class="mb-3">
                                <div class="d-flex justify-content-between">
                                    <span>Profile Data</span>
                                    <span>2.4 MB</span>
                                </div>
                                <div class="progress">
                                    <div class="progress-bar" style="width: 12%"></div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <div class="d-flex justify-content-between">
                                    <span>Portfolio Images</span>
                                    <span>156.7 MB</span>
                                </div>
                                <div class="progress">
                                    <div class="progress-bar bg-warning" style="width: 78%"></div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <div class="d-flex justify-content-between">
                                    <span>Messages</span>
                                    <span>8.2 MB</span>
                                </div>
                                <div class="progress">
                                    <div class="progress-bar bg-info" style="width: 4%"></div>
                                </div>
                            </div>
                            <div class="d-flex justify-content-between fw-bold">
                                <span>Total Usage</span>
                                <span>167.3 MB / 200 MB</span>
                            </div>
                        </div>
                    </div>

                    <div class="danger-zone">
                        <h5 class="text-danger mb-3">
                            <i class="fas fa-exclamation-triangle me-2"></i>Danger Zone
                        </h5>
                        <p class="mb-3">These actions are permanent and cannot be undone.</p>
                        <div class="row">
                            <div class="col-md-6">
                                <button class="btn btn-outline-danger mb-2" onclick="deactivateAccount()">
                                    <i class="fas fa-pause me-2"></i>Deactivate Account
                                </button>
                                <div class="form-text">Temporarily disable your account</div>
                            </div>
                            <div class="col-md-6">
                                <button class="btn btn-danger mb-2" onclick="deleteAccount()">
                                    <i class="fas fa-trash me-2"></i>Delete Account
                                </button>
                                <div class="form-text">Permanently delete your account and data</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Settings navigation
    const navItems = document.querySelectorAll('.settings-nav-item');
    const sections = document.querySelectorAll('.settings-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetSection = this.dataset.section;
            
            // Update navigation
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Update sections
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(targetSection).classList.add('active');
        });
    });

    // Auto-save on change
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('change', function() {
            autoSave();
        });
    });
});

function autoSave() {
    // Simulate auto-save
    setTimeout(() => {
        showSaveIndicator();
    }, 500);
}

function showSaveIndicator() {
    const indicator = document.getElementById('saveIndicator');
    indicator.style.display = 'block';
    setTimeout(() => {
        indicator.style.display = 'none';
    }, 3000);
}

function saveSettings(section) {
    // Collect settings data based on section
    const settingsData = {};
    
    if (section === 'account') {
        settingsData.email = document.getElementById('email').value;
        settingsData.phone = document.getElementById('phone').value;
        settingsData.timezone = document.getElementById('timezone').value;
        settingsData.language = document.getElementById('language').value;
        settingsData.currency = document.getElementById('currency').value;
        settingsData.dateFormat = document.getElementById('dateFormat').value;
        settingsData.twoFactor = document.getElementById('twoFactor').checked;
        settingsData.loginNotifications = document.getElementById('loginNotifications').checked;
    }
    
    console.log('Saving settings:', section, settingsData);
    showToast('Settings saved successfully!', 'success');
}

function changePassword() {
    showToast('Password change feature coming soon!', 'info');
}

function setup2FA() {
    showToast('Two-factor authentication setup coming soon!', 'info');
}

function exportData(type) {
    showToast(`Preparing ${type} data export...`, 'info');
    setTimeout(() => {
        showToast(`${type} data export ready for download!`, 'success');
    }, 2000);
}

function deactivateAccount() {
    if (confirm('Are you sure you want to deactivate your account? You can reactivate it later by logging in.')) {
        showToast('Account deactivation process initiated.', 'warning');
    }
}

function deleteAccount() {
    const confirmation = prompt('This will permanently delete your account and all data. Type "DELETE" to confirm:');
    if (confirmation === 'DELETE') {
        showToast('Account deletion scheduled. You have 30 days to cancel.', 'danger');
    } else if (confirmation !== null) {
        showToast('Account deletion cancelled - confirmation text did not match.', 'info');
    }
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} position-fixed`;
    toast.style.cssText = 'top: 80px; right: 20px; z-index: 9999; min-width: 300px;';
    toast.innerHTML = `
        ${message}
        <button type="button" class="btn-close float-end" onclick="this.parentElement.remove()"></button>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 4000);
}
</script>

<?php echo renderFooter(); ?>
    width: 100%;
    text-align: left;
}
.settings-nav-item:hover {
    background: #e9ecef;
    color: #007bff;
}
.settings-nav-item.active {
    background: #007bff;
    color: white;
}
.settings-section {
    display: none;
}
.settings-section.active {
    display: block;
}
.form-group {
    margin-bottom: 1.5rem;
}
.form-label {
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #495057;
}
.form-text {
    font-size: 0.875rem;
    color: #6c757d;
    margin-top: 0.25rem;
}
.settings-card {
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 15px;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}
.toggle-switch {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 28px;
}
.toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
}
.toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: .4s;
    border-radius: 28px;
}
.toggle-slider:before {
    position: absolute;
    content: "";
    height: 22px;
    width: 22px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
}
input:checked + .toggle-slider {
    background-color: #007bff;
}
input:checked + .toggle-slider:before {
    transform: translateX(22px);
}
.profile-image-upload {
    position: relative;
    display: inline-block;
}
.profile-image-preview {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    object-fit: cover;
    border: 4px solid #dee2e6;
    transition: all 0.3s ease;
}
.profile-image-upload:hover .profile-image-preview {
    border-color: #007bff;
}
.image-upload-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.6);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
    cursor: pointer;
}
.profile-image-upload:hover .image-upload-overlay {
    opacity: 1;
}
.image-upload-overlay i {
    color: white;
    font-size: 1.5rem;
}
.notification-setting {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    margin-bottom: 1rem;
}
.notification-setting:hover {
    background: #f8f9fa;
}
.privacy-option {
    padding: 1rem;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    margin-bottom: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
}
.privacy-option:hover {
    border-color: #007bff;
    background: #f8f9fa;
}
.privacy-option.selected {
    border-color: #007bff;
    background: #e3f2fd;
}
.security-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    margin-bottom: 1rem;
}
.security-status.secure {
    border-color: #28a745;
    background: #f8fff9;
}
.security-status.warning {
    border-color: #ffc107;
    background: #fffbf0;
}
.security-status.danger {
    border-color: #dc3545;
    background: #fff8f8;
}
.billing-card {
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
}
.billing-card.primary {
    border-color: #007bff;
    background: #f8f9ff;
}
.connected-app {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    margin-bottom: 1rem;
}
.connected-app.connected {
    border-color: #28a745;
    background: #f8fff9;
}
</style>

<div class="d-flex">
    <?php echo renderSidebar('User', getUserSidebarItems(), 'settings/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Dashboard', 'href' => '../index.php'],
            ['label' => 'Settings']
        ]);
        ?>
        
        <!-- Settings Hero Section -->
        <div class="settings-hero">
            <div class="container-fluid">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <h1 class="fw-bold mb-2">Account Settings</h1>
                        <p class="fs-5 mb-3">Manage your profile, preferences, and account security</p>
                    </div>
                    <div class="col-md-4 text-end">
                        <button class="btn btn-light btn-lg me-2" onclick="exportSettings()">
                            <i class="fas fa-download me-2"></i>Export Data
                        </button>
                        <button class="btn btn-outline-light btn-lg" onclick="showSettingsHelp()">
                            <i class="fas fa-question-circle me-2"></i>Help
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Settings Content -->
        <div class="row">
            <!-- Settings Navigation -->
            <div class="col-lg-3">
                <div class="settings-nav">
                    <h6 class="fw-bold mb-3">Settings Categories</h6>
                    <button class="settings-nav-item active" data-section="profile">
                        <i class="fas fa-user me-2"></i>Profile Information
                    </button>
                    <button class="settings-nav-item" data-section="account">
                        <i class="fas fa-cog me-2"></i>Account Preferences
                    </button>
                    <button class="settings-nav-item" data-section="notifications">
                        <i class="fas fa-bell me-2"></i>Notifications
                    </button>
                    <button class="settings-nav-item" data-section="privacy">
                        <i class="fas fa-shield-alt me-2"></i>Privacy & Visibility
                    </button>
                    <button class="settings-nav-item" data-section="security">
                        <i class="fas fa-lock me-2"></i>Security
                    </button>
                    <button class="settings-nav-item" data-section="billing">
                        <i class="fas fa-credit-card me-2"></i>Billing & Payments
                    </button>
                    <button class="settings-nav-item" data-section="integrations">
                        <i class="fas fa-plug me-2"></i>Integrations
                    </button>
                    <button class="settings-nav-item" data-section="danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>Advanced
                    </button>
                </div>
            </div>

            <!-- Settings Content Area -->
            <div class="col-lg-9">
                <!-- Profile Information Section -->
                <div class="settings-section active" id="profile">
                    <div class="settings-card">
                        <h4 class="mb-4">Profile Information</h4>
                        
                        <div class="row">
                            <div class="col-md-4 text-center">
                                <div class="profile-image-upload">
                                    <img src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&h=300&fit=crop&crop=face" 
                                         class="profile-image-preview" alt="Profile Photo">
                                    <div class="image-upload-overlay" onclick="selectProfileImage()">
                                        <i class="fas fa-camera"></i>
                                    </div>
                                    <input type="file" id="profileImageInput" accept="image/*" style="display: none;">
                                </div>
                                <div class="mt-3">
                                    <button class="btn btn-outline-primary btn-sm" onclick="selectProfileImage()">
                                        Change Photo
                                    </button>
                                    <button class="btn btn-outline-danger btn-sm ms-2" onclick="removeProfileImage()">
                                        Remove
                                    </button>
                                </div>
                            </div>
                            
                            <div class="col-md-8">
                                <form id="profileForm">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="form-group">
                                                <label class="form-label">First Name</label>
                                                <input type="text" class="form-control" value="Emma" id="firstName">
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="form-group">
                                                <label class="form-label">Last Name</label>
                                                <input type="text" class="form-control" value="Johnson" id="lastName">
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label class="form-label">Professional Title</label>
                                        <input type="text" class="form-control" value="Professional Fashion Model" id="professionalTitle">
                                        <div class="form-text">This appears on your public profile</div>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label class="form-label">Bio</label>
                                        <textarea class="form-control" rows="4" id="bio">Experienced fashion model with over 5 years in the industry. Specialized in editorial, commercial, and runway work. Available for bookings worldwide.</textarea>
                                        <div class="form-text">Tell potential clients about your experience and specialties</div>
                                    </div>
                                    
                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="form-group">
                                                <label class="form-label">Location</label>
                                                <input type="text" class="form-control" value="New York, NY" id="location">
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="form-group">
                                                <label class="form-label">Website</label>
                                                <input type="url" class="form-control" value="https://emmajohnson.com" id="website">
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label class="form-label">Professional Categories</label>
                                        <div class="d-flex flex-wrap gap-2">
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" checked id="fashionModel">
                                                <label class="form-check-label" for="fashionModel">Fashion Model</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" checked id="editorialModel">
                                                <label class="form-check-label" for="editorialModel">Editorial</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="commercialModel">
                                                <label class="form-check-label" for="commercialModel">Commercial</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" checked id="runwayModel">
                                                <label class="form-check-label" for="runwayModel">Runway</label>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="text-end">
                                        <button type="button" class="btn btn-outline-secondary me-2" onclick="resetProfileForm()">Reset</button>
                                        <button type="submit" class="btn btn-primary">Save Changes</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Account Preferences Section -->
                <div class="settings-section" id="account">
                    <div class="settings-card">
                        <h4 class="mb-4">Account Preferences</h4>
                        
                        <form id="accountForm">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label class="form-label">Email Address</label>
                                        <input type="email" class="form-control" value="emma.johnson@email.com" id="email">
                                        <div class="form-text">We'll send important notifications to this email</div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label class="form-label">Phone Number</label>
                                        <input type="tel" class="form-control" value="+1 (555) 123-4567" id="phone">
                                    </div>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label class="form-label">Timezone</label>
                                        <select class="form-select" id="timezone">
                                            <option value="America/New_York" selected>Eastern Time (EST)</option>
                                            <option value="America/Chicago">Central Time (CST)</option>
                                            <option value="America/Denver">Mountain Time (MST)</option>
                                            <option value="America/Los_Angeles">Pacific Time (PST)</option>
                                            <option value="Europe/London">London (GMT)</option>
                                            <option value="Europe/Paris">Paris (CET)</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label class="form-label">Language</label>
                                        <select class="form-select" id="language">
                                            <option value="en" selected>English</option>
                                            <option value="es">Spanish</option>
                                            <option value="fr">French</option>
                                            <option value="de">German</option>
                                            <option value="it">Italian</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label class="form-label">Currency</label>
                                        <select class="form-select" id="currency">
                                            <option value="USD" selected>US Dollar ($)</option>
                                            <option value="EUR">Euro (€)</option>
                                            <option value="GBP">British Pound (£)</option>
                                            <option value="CAD">Canadian Dollar (C$)</option>
                                            <option value="AUD">Australian Dollar (A$)</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label class="form-label">Date Format</label>
                                        <select class="form-select" id="dateFormat">
                                            <option value="MM/DD/YYYY" selected>MM/DD/YYYY</option>
                                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="text-end">
                                <button type="submit" class="btn btn-primary">Save Preferences</button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Notifications Section -->
                <div class="settings-section" id="notifications">
                    <div class="settings-card">
                        <h4 class="mb-4">Notification Settings</h4>
                        <p class="text-muted mb-4">Choose how you want to be notified about updates and activities.</p>
                        
                        <h6 class="fw-bold mb-3">Email Notifications</h6>
                        <div class="notification-setting">
                            <div>
                                <strong>New Booking Requests</strong>
                                <br><small class="text-muted">When someone requests to book you</small>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" checked>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        
                        <div class="notification-setting">
                            <div>
                                <strong>Booking Confirmations</strong>
                                <br><small class="text-muted">When a booking is confirmed or cancelled</small>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" checked>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        
                        <div class="notification-setting">
                            <div>
                                <strong>New Messages</strong>
                                <br><small class="text-muted">When you receive new messages</small>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" checked>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        
                        <div class="notification-setting">
                            <div>
                                <strong>Portfolio Views</strong>
                                <br><small class="text-muted">Weekly summary of portfolio activity</small>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        
                        <h6 class="fw-bold mb-3 mt-4">Push Notifications</h6>
                        <div class="notification-setting">
                            <div>
                                <strong>Urgent Messages</strong>
                                <br><small class="text-muted">Important messages from clients</small>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" checked>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        
                        <div class="notification-setting">
                            <div>
                                <strong>Booking Reminders</strong>
                                <br><small class="text-muted">24-hour reminder before bookings</small>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" checked>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        
                        <div class="text-end">
                            <button class="btn btn-primary" onclick="saveNotificationSettings()">Save Settings</button>
                        </div>
                    </div>
                </div>

                <!-- Privacy & Visibility Section -->
                <div class="settings-section" id="privacy">
                    <div class="settings-card">
                        <h4 class="mb-4">Privacy & Visibility</h4>
                        
                        <h6 class="fw-bold mb-3">Profile Visibility</h6>
                        <div class="privacy-option selected" data-visibility="public">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-globe text-success me-3"></i>
                                <div>
                                    <strong>Public Profile</strong>
                                    <br><small class="text-muted">Anyone can view your profile and book you</small>
                                </div>
                            </div>
                        </div>
                        
                        <div class="privacy-option" data-visibility="limited">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-users text-warning me-3"></i>
                                <div>
                                    <strong>Limited Visibility</strong>
                                    <br><small class="text-muted">Only verified clients can view your full profile</small>
                                </div>
                            </div>
                        </div>
                        
                        <div class="privacy-option" data-visibility="private">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-lock text-danger me-3"></i>
                                <div>
                                    <strong>Private Profile</strong>
                                    <br><small class="text-muted">Profile not visible in search, invitation only</small>
                                </div>
                            </div>
                        </div>
                        
                        <h6 class="fw-bold mb-3 mt-4">Contact Information</h6>
                        <div class="notification-setting">
                            <div>
                                <strong>Show Contact Details</strong>
                                <br><small class="text-muted">Display email and phone on public profile</small>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        
                        <div class="notification-setting">
                            <div>
                                <strong>Allow Direct Booking</strong>
                                <br><small class="text-muted">Let clients book without prior approval</small>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" checked>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        
                        <div class="text-end">
                            <button class="btn btn-primary" onclick="savePrivacySettings()">Save Privacy Settings</button>
                        </div>
                    </div>
                </div>

                <!-- Security Section -->
                <div class="settings-section" id="security">
                    <div class="settings-card">
                        <h4 class="mb-4">Security Settings</h4>
                        
                        <div class="security-status secure">
                            <i class="fas fa-shield-alt text-success"></i>
                            <div class="ms-3">
                                <strong>Account Security: Good</strong>
                                <br><small>Your account has strong security measures in place</small>
                            </div>
                        </div>
                        
                        <h6 class="fw-bold mb-3">Password & Authentication</h6>
                        <div class="mb-3">
                            <button class="btn btn-outline-primary me-2" onclick="showChangePasswordModal()">
                                <i class="fas fa-key me-2"></i>Change Password
                            </button>
                            <button class="btn btn-outline-success" onclick="setupTwoFactor()">
                                <i class="fas fa-mobile-alt me-2"></i>Enable 2FA
                            </button>
                        </div>
                        
                        <h6 class="fw-bold mb-3">Active Sessions</h6>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between align-items-center p-3 border rounded">
                                <div>
                                    <strong>Current Session</strong>
                                    <br><small class="text-muted">Chrome on MacOS - New York, NY</small>
                                    <br><small class="text-success">Active now</small>
                                </div>
                                <span class="badge bg-success">Current</span>
                            </div>
                            <div class="d-flex justify-content-between align-items-center p-3 border rounded">
                                <div>
                                    <strong>Mobile Session</strong>
                                    <br><small class="text-muted">Safari on iPhone - New York, NY</small>
                                    <br><small class="text-muted">Last active: 2 hours ago</small>
                                </div>
                                <button class="btn btn-outline-danger btn-sm" onclick="revokeSession('mobile')">
                                    Revoke
                                </button>
                            </div>
                        </div>
                        
                        <h6 class="fw-bold mb-3">Login Activity</h6>
                        <div class="mb-3">
                            <small class="text-muted d-block">Recent login attempts</small>
                            <ul class="list-unstyled mt-2">
                                <li class="text-success"><i class="fas fa-check-circle me-2"></i>Today at 2:30 PM - Chrome (New York)</li>
                                <li class="text-success"><i class="fas fa-check-circle me-2"></i>Yesterday at 9:15 AM - Mobile (New York)</li>
                                <li class="text-success"><i class="fas fa-check-circle me-2"></i>Dec 8 at 6:20 PM - Chrome (New York)</li>
                            </ul>
                        </div>
                        
                        <div class="text-end">
                            <button class="btn btn-outline-secondary me-2" onclick="downloadSecurityReport()">
                                Download Security Report
                            </button>
                            <button class="btn btn-primary" onclick="saveSecuritySettings()">
                                Save Settings
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Billing & Payments Section -->
                <div class="settings-section" id="billing">
                    <div class="settings-card">
                        <h4 class="mb-4">Billing & Payments</h4>
                        
                        <h6 class="fw-bold mb-3">Payment Methods</h6>
                        <div class="billing-card primary">
                            <div class="d-flex justify-content-between align-items-center">
                                <div class="d-flex align-items-center">
                                    <i class="fab fa-cc-visa fa-2x text-primary me-3"></i>
                                    <div>
                                        <strong>•••• •••• •••• 4567</strong>
                                        <br><small class="text-muted">Expires 12/26</small>
                                        <span class="badge bg-primary ms-2">Primary</span>
                                    </div>
                                </div>
                                <div>
                                    <button class="btn btn-outline-secondary btn-sm me-2">Edit</button>
                                    <button class="btn btn-outline-danger btn-sm">Remove</button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="billing-card">
                            <div class="d-flex justify-content-between align-items-center">
                                <div class="d-flex align-items-center">
                                    <i class="fab fa-cc-mastercard fa-2x text-warning me-3"></i>
                                    <div>
                                        <strong>•••• •••• •••• 8901</strong>
                                        <br><small class="text-muted">Expires 08/25</small>
                                    </div>
                                </div>
                                <div>
                                    <button class="btn btn-outline-primary btn-sm">Make Primary</button>
                                    <button class="btn btn-outline-danger btn-sm ms-2">Remove</button>
                                </div>
                            </div>
                        </div>
                        
                        <button class="btn btn-outline-primary mb-4" onclick="addPaymentMethod()">
                            <i class="fas fa-plus me-2"></i>Add Payment Method
                        </button>
                        
                        <h6 class="fw-bold mb-3">Payout Settings</h6>
                        <div class="form-group">
                            <label class="form-label">Payout Method</label>
                            <select class="form-select">
                                <option selected>Bank Transfer (ACH)</option>
                                <option>PayPal</option>
                                <option>Wire Transfer</option>
                            </select>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label class="form-label">Bank Account</label>
                                    <input type="text" class="form-control" value="•••• •••• •••• 7890" readonly>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label class="form-label">Payout Schedule</label>
                                    <select class="form-select">
                                        <option selected>Weekly (Fridays)</option>
                                        <option>Bi-weekly</option>
                                        <option>Monthly</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <h6 class="fw-bold mb-3 mt-4">Billing History</h6>
                        <div class="table-responsive">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Description</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Dec 8, 2024</td>
                                        <td>Vogue Editorial Shoot</td>
                                        <td>$2,500.00</td>
                                        <td><span class="badge bg-success">Paid</span></td>
                                        <td><button class="btn btn-outline-secondary btn-sm">Download</button></td>
                                    </tr>
                                    <tr>
                                        <td>Dec 1, 2024</td>
                                        <td>Nike Campaign</td>
                                        <td>$1,800.00</td>
                                        <td><span class="badge bg-success">Paid</span></td>
                                        <td><button class="btn btn-outline-secondary btn-sm">Download</button></td>
                                    </tr>
                                    <tr>
                                        <td>Nov 25, 2024</td>
                                        <td>Fashion Week Runway</td>
                                        <td>$3,200.00</td>
                                        <td><span class="badge bg-warning">Pending</span></td>
                                        <td><button class="btn btn-outline-secondary btn-sm">View</button></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                        <div class="text-end">
                            <button class="btn btn-primary" onclick="savePaymentSettings()">Save Payment Settings</button>
                        </div>
                    </div>
                </div>

                <!-- Integrations Section -->
                <div class="settings-section" id="integrations">
                    <div class="settings-card">
                        <h4 class="mb-4">Integrations & Connected Apps</h4>
                        
                        <h6 class="fw-bold mb-3">Social Media</h6>
                        <div class="connected-app connected">
                            <div class="d-flex align-items-center">
                                <i class="fab fa-instagram fa-2x text-primary me-3"></i>
                                <div>
                                    <strong>Instagram</strong>
                                    <br><small class="text-muted">@emmajohnsonmodel - Connected</small>
                                </div>
                            </div>
                            <button class="btn btn-outline-danger btn-sm" onclick="disconnectApp('instagram')">
                                Disconnect
                            </button>
                        </div>
                        
                        <div class="connected-app">
                            <div class="d-flex align-items-center">
                                <i class="fab fa-linkedin fa-2x text-primary me-3"></i>
                                <div>
                                    <strong>LinkedIn</strong>
                                    <br><small class="text-muted">Not connected</small>
                                </div>
                            </div>
                            <button class="btn btn-primary btn-sm" onclick="connectApp('linkedin')">
                                Connect
                            </button>
                        </div>
                        
                        <div class="connected-app">
                            <div class="d-flex align-items-center">
                                <i class="fab fa-twitter fa-2x text-primary me-3"></i>
                                <div>
                                    <strong>Twitter</strong>
                                    <br><small class="text-muted">Not connected</small>
                                </div>
                            </div>
                            <button class="btn btn-primary btn-sm" onclick="connectApp('twitter')">
                                Connect
                            </button>
                        </div>
                        
                        <h6 class="fw-bold mb-3 mt-4">Professional Tools</h6>
                        <div class="connected-app">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-calendar fa-2x text-success me-3"></i>
                                <div>
                                    <strong>Google Calendar</strong>
                                    <br><small class="text-muted">Sync bookings with your calendar</small>
                                </div>
                            </div>
                            <button class="btn btn-primary btn-sm" onclick="connectApp('google-calendar')">
                                Connect
                            </button>
                        </div>
                        
                        <div class="connected-app">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-cloud fa-2x text-info me-3"></i>
                                <div>
                                    <strong>Dropbox</strong>
                                    <br><small class="text-muted">Sync portfolio photos automatically</small>
                                </div>
                            </div>
                            <button class="btn btn-primary btn-sm" onclick="connectApp('dropbox')">
                                Connect
                            </button>
                        </div>
                        
                        <div class="text-end">
                            <button class="btn btn-primary" onclick="saveIntegrationSettings()">Save Integration Settings</button>
                        </div>
                    </div>
                </div>

                <!-- Advanced/Danger Section -->
                <div class="settings-section" id="danger">
                    <div class="settings-card">
                        <h4 class="mb-4 text-danger">Advanced Settings</h4>
                        <p class="text-muted mb-4">These actions are permanent and cannot be undone.</p>
                        
                        <h6 class="fw-bold mb-3">Data Export</h6>
                        <p class="text-muted">Download a copy of all your data including profile, portfolio, messages, and booking history.</p>
                        <button class="btn btn-outline-primary mb-4" onclick="requestDataExport()">
                            <i class="fas fa-download me-2"></i>Request Data Export
                        </button>
                        
                        <h6 class="fw-bold mb-3 text-warning">Account Deactivation</h6>
                        <p class="text-muted">Temporarily deactivate your account. You can reactivate it anytime by logging in.</p>
                        <button class="btn btn-outline-warning mb-4" onclick="deactivateAccount()">
                            <i class="fas fa-pause me-2"></i>Deactivate Account
                        </button>
                        
                        <h6 class="fw-bold mb-3 text-danger">Delete Account</h6>
                        <p class="text-muted">Permanently delete your account and all associated data. This action cannot be undone.</p>
                        <button class="btn btn-danger" onclick="showDeleteAccountModal()">
                            <i class="fas fa-trash me-2"></i>Delete Account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Change Password Modal -->
<div class="modal fade" id="changePasswordModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Change Password</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form id="changePasswordForm">
                    <div class="form-group">
                        <label class="form-label">Current Password</label>
                        <input type="password" class="form-control" id="currentPassword" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">New Password</label>
                        <input type="password" class="form-control" id="newPassword" required>
                        <div class="form-text">Must be at least 8 characters with uppercase, lowercase, and numbers</div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Confirm New Password</label>
                        <input type="password" class="form-control" id="confirmPassword" required>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="changePassword()">Change Password</button>
            </div>
        </div>
    </div>
</div>

<!-- Delete Account Modal -->
<div class="modal fade" id="deleteAccountModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title text-danger">Delete Account</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Warning:</strong> This action cannot be undone. All your data will be permanently deleted.
                </div>
                <p>Please type <strong>DELETE</strong> to confirm account deletion:</p>
                <input type="text" class="form-control" id="deleteConfirmation" placeholder="Type DELETE here">
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-danger" onclick="deleteAccount()" id="deleteAccountBtn" disabled>
                    Delete Account
                </button>
            </div>
        </div>
    </div>
</div>

<script>
// Settings functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeSettings();
});

function initializeSettings() {
    // Settings navigation
    document.querySelectorAll('.settings-nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const section = this.dataset.section;
            showSettingsSection(section);
            
            // Update active nav item
            document.querySelectorAll('.settings-nav-item').forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Privacy options
    document.querySelectorAll('.privacy-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.privacy-option').forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
        });
    });

    // Profile form submission
    document.getElementById('profileForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveProfileSettings();
    });

    // Account form submission
    document.getElementById('accountForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveAccountSettings();
    });

    // Profile image input
    document.getElementById('profileImageInput').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.querySelector('.profile-image-preview').src = e.target.result;
                showToast('Profile image updated. Remember to save changes.', 'success');
            };
            reader.readAsDataURL(file);
        }
    });

    // Delete confirmation input
    document.getElementById('deleteConfirmation').addEventListener('input', function() {
        const btn = document.getElementById('deleteAccountBtn');
        btn.disabled = this.value !== 'DELETE';
    });
}

function showSettingsSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.settings-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
}

function selectProfileImage() {
    document.getElementById('profileImageInput').click();
}

function removeProfileImage() {
    if (confirm('Are you sure you want to remove your profile image?')) {
        document.querySelector('.profile-image-preview').src = 'https://via.placeholder.com/300x300/e9ecef/6c757d?text=No+Image';
        showToast('Profile image removed. Remember to save changes.', 'success');
    }
}

function resetProfileForm() {
    if (confirm('Reset all profile changes to original values?')) {
        document.getElementById('profileForm').reset();
        showToast('Profile form reset', 'info');
    }
}

function saveProfileSettings() {
    // Simulate saving profile
    showToast('Profile settings saved successfully!', 'success');
}

function saveAccountSettings() {
    // Simulate saving account preferences
    showToast('Account preferences saved successfully!', 'success');
}

function saveNotificationSettings() {
    // Simulate saving notification settings
    showToast('Notification settings saved successfully!', 'success');
}

function savePrivacySettings() {
    // Simulate saving privacy settings
    showToast('Privacy settings saved successfully!', 'success');
}

function saveSecuritySettings() {
    // Simulate saving security settings
    showToast('Security settings saved successfully!', 'success');
}

function savePaymentSettings() {
    // Simulate saving payment settings
    showToast('Payment settings saved successfully!', 'success');
}

function saveIntegrationSettings() {
    // Simulate saving integration settings
    showToast('Integration settings saved successfully!', 'success');
}

function showChangePasswordModal() {
    const modal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
    modal.show();
}

function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        showToast('Please fill in all password fields', 'warning');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showToast('New passwords do not match', 'danger');
        return;
    }
    
    if (newPassword.length < 8) {
        showToast('Password must be at least 8 characters long', 'warning');
        return;
    }
    
    // Simulate password change
    const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
    modal.hide();
    
    showToast('Password changed successfully!', 'success');
    
    // Reset form
    document.getElementById('changePasswordForm').reset();
}

function setupTwoFactor() {
    showToast('Two-factor authentication setup would begin', 'info');
}

function revokeSession(sessionId) {
    if (confirm('Are you sure you want to revoke this session?')) {
        showToast(`Session ${sessionId} revoked successfully`, 'success');
    }
}

function downloadSecurityReport() {
    showToast('Security report download started', 'info');
}

function addPaymentMethod() {
    showToast('Payment method addition interface would open', 'info');
}

function connectApp(appName) {
    showToast(`Connecting to ${appName}...`, 'info');
    setTimeout(() => {
        showToast(`Successfully connected to ${appName}!`, 'success');
    }, 2000);
}

function disconnectApp(appName) {
    if (confirm(`Are you sure you want to disconnect ${appName}?`)) {
        showToast(`Disconnected from ${appName}`, 'success');
    }
}

function exportSettings() {
    showToast('Settings export started', 'info');
}

function showSettingsHelp() {
    showToast('Settings help would open', 'info');
}

function requestDataExport() {
    if (confirm('Request a complete export of your account data? You will receive an email when ready.')) {
        showToast('Data export requested. You will receive an email when ready.', 'success');
    }
}

function deactivateAccount() {
    if (confirm('Are you sure you want to deactivate your account? You can reactivate it anytime by logging in.')) {
        showToast('Account deactivation process would begin', 'warning');
    }
}

function showDeleteAccountModal() {
    const modal = new bootstrap.Modal(document.getElementById('deleteAccountModal'));
    modal.show();
}

function deleteAccount() {
    const confirmation = document.getElementById('deleteConfirmation').value;
    
    if (confirmation !== 'DELETE') {
        showToast('Please type DELETE to confirm', 'warning');
        return;
    }
    
    // Simulate account deletion
    showToast('Account deletion process would begin', 'danger');
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('deleteAccountModal'));
    modal.hide();
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
    }, 4000);
}

// Auto-save functionality for forms
let autoSaveTimeout;
function autoSave(formId) {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
        showToast('Auto-saved draft', 'info');
    }, 2000);
}

// Add auto-save listeners to form inputs
document.querySelectorAll('input, textarea, select').forEach(input => {
    input.addEventListener('input', () => autoSave(input.closest('form')?.id));
});
</script>

<?php echo renderFooter(); ?>