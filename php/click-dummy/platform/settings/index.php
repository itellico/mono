<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Platform Settings - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'settings/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Platform Settings']
        ]);
        
        echo createHeroSection(
            "Platform Settings",
            "Configure global platform settings and system preferences",
            "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&h=300&fit=crop",
            [
                ['label' => 'Save Changes', 'icon' => 'fas fa-save', 'style' => 'primary'],
                ['label' => 'Export Config', 'icon' => 'fas fa-download', 'style' => 'light']
            ]
        );
        ?>
        
        <!-- Settings Categories -->
        <div class="row mb-4">
            <div class="col-md-4">
                <div class="card h-100">
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-3">
                            <i class="fas fa-shield-alt fa-2x text-primary me-3"></i>
                            <div>
                                <h5 class="card-title mb-1">Security</h5>
                                <p class="text-muted small mb-0">Authentication, encryption, and security policies</p>
                            </div>
                        </div>
                        <ul class="list-unstyled small">
                            <li><i class="fas fa-check text-success me-2"></i> Two-Factor Authentication</li>
                            <li><i class="fas fa-check text-success me-2"></i> Password Policies</li>
                            <li><i class="fas fa-check text-success me-2"></i> API Security</li>
                            <li><i class="fas fa-check text-success me-2"></i> SSL/TLS Configuration</li>
                        </ul>
                        <button class="btn btn-outline-primary btn-sm w-100">Configure Security</button>
                    </div>
                </div>
            </div>
            
            <div class="col-md-4">
                <div class="card h-100">
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-3">
                            <i class="fas fa-envelope fa-2x text-success me-3"></i>
                            <div>
                                <h5 class="card-title mb-1">Email & Notifications</h5>
                                <p class="text-muted small mb-0">SMTP settings and notification preferences</p>
                            </div>
                        </div>
                        <ul class="list-unstyled small">
                            <li><i class="fas fa-check text-success me-2"></i> SMTP Configuration</li>
                            <li><i class="fas fa-check text-success me-2"></i> Email Templates</li>
                            <li><i class="fas fa-check text-success me-2"></i> Notification Rules</li>
                            <li><i class="fas fa-check text-success me-2"></i> Delivery Tracking</li>
                        </ul>
                        <button class="btn btn-outline-success btn-sm w-100">Configure Email</button>
                    </div>
                </div>
            </div>
            
            <div class="col-md-4">
                <div class="card h-100">
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-3">
                            <i class="fas fa-credit-card fa-2x text-info me-3"></i>
                            <div>
                                <h5 class="card-title mb-1">Payment Processing</h5>
                                <p class="text-muted small mb-0">Payment gateways and billing configuration</p>
                            </div>
                        </div>
                        <ul class="list-unstyled small">
                            <li><i class="fas fa-check text-success me-2"></i> Stripe Integration</li>
                            <li><i class="fas fa-check text-success me-2"></i> PayPal Configuration</li>
                            <li><i class="fas fa-check text-success me-2"></i> Subscription Billing</li>
                            <li><i class="fas fa-check text-success me-2"></i> Tax Settings</li>
                        </ul>
                        <button class="btn btn-outline-info btn-sm w-100">Configure Payments</button>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mb-4">
            <div class="col-md-4">
                <div class="card h-100">
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-3">
                            <i class="fas fa-cloud fa-2x text-warning me-3"></i>
                            <div>
                                <h5 class="card-title mb-1">File Storage</h5>
                                <p class="text-muted small mb-0">Cloud storage and CDN configuration</p>
                            </div>
                        </div>
                        <ul class="list-unstyled small">
                            <li><i class="fas fa-check text-success me-2"></i> AWS S3 Integration</li>
                            <li><i class="fas fa-check text-success me-2"></i> CloudFront CDN</li>
                            <li><i class="fas fa-check text-success me-2"></i> Upload Limits</li>
                            <li><i class="fas fa-check text-success me-2"></i> File Optimization</li>
                        </ul>
                        <button class="btn btn-outline-warning btn-sm w-100">Configure Storage</button>
                    </div>
                </div>
            </div>
            
            <div class="col-md-4">
                <div class="card h-100">
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-3">
                            <i class="fas fa-chart-bar fa-2x text-danger me-3"></i>
                            <div>
                                <h5 class="card-title mb-1">Analytics & Tracking</h5>
                                <p class="text-muted small mb-0">Google Analytics and tracking configuration</p>
                            </div>
                        </div>
                        <ul class="list-unstyled small">
                            <li><i class="fas fa-check text-success me-2"></i> Google Analytics</li>
                            <li><i class="fas fa-check text-success me-2"></i> Custom Events</li>
                            <li><i class="fas fa-check text-success me-2"></i> Conversion Tracking</li>
                            <li><i class="fas fa-check text-success me-2"></i> Privacy Compliance</li>
                        </ul>
                        <button class="btn btn-outline-danger btn-sm w-100">Configure Analytics</button>
                    </div>
                </div>
            </div>
            
            <div class="col-md-4">
                <div class="card h-100">
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-3">
                            <i class="fas fa-cogs fa-2x text-secondary me-3"></i>
                            <div>
                                <h5 class="card-title mb-1">System Configuration</h5>
                                <p class="text-muted small mb-0">Database, caching, and performance settings</p>
                            </div>
                        </div>
                        <ul class="list-unstyled small">
                            <li><i class="fas fa-check text-success me-2"></i> Database Settings</li>
                            <li><i class="fas fa-check text-success me-2"></i> Redis Configuration</li>
                            <li><i class="fas fa-check text-success me-2"></i> Performance Tuning</li>
                            <li><i class="fas fa-check text-success me-2"></i> Backup Settings</li>
                        </ul>
                        <button class="btn btn-outline-secondary btn-sm w-100">Configure System</button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Platform Configuration -->
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Global Platform Configuration</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label class="form-label">Platform Name</label>
                            <input type="text" class="form-control" value="itellico Mono Platform" readonly>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Default Language</label>
                            <select class="form-select">
                                <option selected>English (US)</option>
                                <option>Spanish</option>
                                <option>French</option>
                                <option>German</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Default Timezone</label>
                            <select class="form-select">
                                <option selected>UTC</option>
                                <option>America/New_York</option>
                                <option>America/Los_Angeles</option>
                                <option>Europe/London</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label class="form-label">Max Tenants per Instance</label>
                            <input type="number" class="form-control" value="1000">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Default Storage Limit (GB)</label>
                            <input type="number" class="form-control" value="100">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">API Rate Limit (requests/minute)</label>
                            <input type="number" class="form-control" value="1000">
                        </div>
                    </div>
                </div>
                <hr>
                <div class="d-flex justify-content-between">
                    <div>
                        <span class="text-muted small">Last updated: 3 days ago by Admin User</span>
                    </div>
                    <div>
                        <button class="btn btn-outline-secondary me-2">Reset to Defaults</button>
                        <button class="btn btn-primary">Save Changes</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php echo renderFooter(); ?>