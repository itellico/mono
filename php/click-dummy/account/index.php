<?php
require_once '../includes/header.php';
require_once '../includes/sidebar.php';
require_once '../includes/components.php';
require_once '../includes/footer.php';

echo renderHeader("Account Types - Marketplace Platform", "Demo", "Account Explorer", "Account");
?>

<div class="d-flex">
    <?php echo renderSidebar('Account', getAccountSidebarItems(), 'index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Account', 'href' => 'index.php'],
            ['label' => 'Account Types Demo']
        ]);
        
        echo createHeroSection(
            "Account Features System",
            "All accounts use the same base system with features enabled based on your needs. No more rigid account types!",
            "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=1200&h=300&fit=crop",
            [
                ['label' => 'One Account Type', 'icon' => 'fas fa-check-circle', 'style' => 'success'],
                ['label' => 'Flexible Features', 'icon' => 'fas fa-puzzle-piece', 'style' => 'primary'],
                ['label' => 'Pay for What You Use', 'icon' => 'fas fa-credit-card', 'style' => 'info'],
                ['label' => 'Grow as You Need', 'icon' => 'fas fa-chart-line', 'style' => 'warning']
            ]
        );
        ?>
        
        <!-- New Feature-Based System Alert -->
        <div class="alert alert-info mb-4">
            <div class="d-flex align-items-center">
                <i class="fas fa-info-circle fa-2x me-3"></i>
                <div>
                    <h5 class="alert-heading mb-1">Unified Account System</h5>
                    <p class="mb-0">We've eliminated rigid account types. Now all accounts start the same and you enable only the features you need. Mix and match capabilities based on your business model!</p>
                </div>
            </div>
        </div>
        
        <!-- Platform Overview Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Total Accounts', '1,247', 'fas fa-users', 'primary');
            echo createStatCard('Active Features', '2,341', 'fas fa-puzzle-piece', 'success');
            echo createStatCard('Feature Combinations', '47', 'fas fa-layer-group', 'info');
            echo createStatCard('Avg Features/Account', '3.2', 'fas fa-chart-bar', 'warning');
            ?>
        </div>
        
        <!-- Feature Templates -->
        <h3 class="mb-3">Popular Feature Templates</h3>
        <p class="text-muted mb-4">These are common feature combinations, but you can customize your own!</p>
        
        <div class="row">
            <!-- Agency Template Example -->
            <div class="col-lg-6 mb-4">
                <?php echo createCard(
                    'Agency Template',
                    '
                    <div class="alert alert-primary mb-3">
                        <strong>Enabled Features:</strong> Manage Others • Team Collaboration • Invoicing • Commissions • Multiple Profiles
                    </div>
                    <div class="card bg-light border-primary mb-3">
                        <div class="card-body">
                            <h6 class="fw-bold text-primary"><i class="fas fa-building me-2"></i>Elite Model Management</h6>
                            <p class="small text-muted mb-3">International modeling agency managing 156 exclusive models</p>
                            <div class="row g-2 mb-3">
                                <div class="col-6">
                                    <div class="text-center">
                                        <h6 class="text-primary mb-1">156</h6>
                                        <small class="text-muted">Talent Roster</small>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="text-center">
                                        <h6 class="text-success mb-1">24</h6>
                                        <small class="text-muted">Active Projects</small>
                                    </div>
                                </div>
                            </div>
                            <div class="d-flex justify-content-between align-items-center">
                                <small class="text-muted">15 Team Members</small>
                                <span class="badge bg-primary">Premium</span>
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <strong class="d-block mb-2">Key Features:</strong>
                        <ul class="small text-muted ps-3">
                            <li>Talent roster management</li>
                            <li>Team collaboration tools</li>
                            <li>Project & booking management</li>
                            <li>Financial reporting & analytics</li>
                            <li>Client relationship management</li>
                        </ul>
                    </div>
                    ',
                    '<a href="agency/index.php" class="btn btn-primary btn-sm me-2">View Agency Dashboard</a><a href="index-original.php" class="btn btn-outline-primary btn-sm">Current Demo</a>'
                ); ?>
            </div>

            <!-- Solo Professional Template Example -->
            <div class="col-lg-6 mb-4">
                <?php echo createCard(
                    'Solo Professional Template',
                    '
                    <div class="alert alert-info mb-3">
                        <strong>Enabled Features:</strong> Single Profile • Portfolio • Direct Bookings • Basic Invoicing
                    </div>
                    <div class="card bg-light border-info mb-3">
                        <div class="card-body">
                            <h6 class="fw-bold text-info"><i class="fas fa-camera me-2"></i>Marcus Photography Studio</h6>
                            <p class="small text-muted mb-3">Fashion & commercial photographer specializing in high-end campaigns</p>
                            <div class="row g-2 mb-3">
                                <div class="col-6">
                                    <div class="text-center">
                                        <h6 class="text-info mb-1">127</h6>
                                        <small class="text-muted">Portfolio Items</small>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="text-center">
                                        <h6 class="text-success mb-1">18</h6>
                                        <small class="text-muted">Active Bookings</small>
                                    </div>
                                </div>
                            </div>
                            <div class="d-flex justify-content-between align-items-center">
                                <small class="text-muted">$2,500/day rate</small>
                                <span class="badge bg-info">Professional</span>
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <strong class="d-block mb-2">Key Features:</strong>
                        <ul class="small text-muted ps-3">
                            <li>Professional portfolio showcase</li>
                            <li>Service packages & pricing</li>
                            <li>Booking calendar management</li>
                            <li>Client communication tools</li>
                            <li>Equipment & location listings</li>
                        </ul>
                    </div>
                    ',
                    '<a href="professional/index.php" class="btn btn-info btn-sm">View Professional Dashboard</a>'
                ); ?>
            </div>

            <!-- Individual Talent Template Example -->
            <div class="col-lg-6 mb-4">
                <?php echo createCard(
                    'Individual Talent Template',
                    '
                    <div class="alert alert-success mb-3">
                        <strong>Enabled Features:</strong> Single Profile • Comp Card • Availability Calendar • Direct Applications
                    </div>
                    <div class="card bg-light border-success mb-3">
                        <div class="card-body">
                            <h6 class="fw-bold text-success"><i class="fas fa-user me-2"></i>Emma Johnson</h6>
                            <p class="small text-muted mb-3">Professional fashion model with international experience</p>
                            <div class="row g-2 mb-3">
                                <div class="col-6">
                                    <div class="text-center">
                                        <h6 class="text-success mb-1">89</h6>
                                        <small class="text-muted">Portfolio Images</small>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="text-center">
                                        <h6 class="text-warning mb-1">12</h6>
                                        <small class="text-muted">This Month</small>
                                    </div>
                                </div>
                            </div>
                            <div class="d-flex justify-content-between align-items-center">
                                <small class="text-muted">Height: 5\'10" | Size: 2</small>
                                <span class="badge bg-success">Available</span>
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <strong class="d-block mb-2">Key Features:</strong>
                        <ul class="small text-muted ps-3">
                            <li>Digital comp card & measurements</li>
                            <li>Portfolio & photo management</li>
                            <li>Availability calendar</li>
                            <li>Booking request handling</li>
                            <li>Earnings & payment tracking</li>
                        </ul>
                    </div>
                    ',
                    '<a href="talent/index.php" class="btn btn-success btn-sm">View Talent Dashboard</a>'
                ); ?>
            </div>

            <!-- Family Business Template Example -->
            <div class="col-lg-6 mb-4">
                <?php echo createCard(
                    'Family Business Template',
                    '
                    <div class="alert alert-warning mb-3">
                        <strong>Enabled Features:</strong> Multiple Profiles • Minor Management • Trust Fund • Consolidated Calendar
                    </div>
                    <div class="card bg-light border-warning mb-3">
                        <div class="card-body">
                            <h6 class="fw-bold text-warning"><i class="fas fa-users me-2"></i>Maria Rodriguez</h6>
                            <p class="small text-muted mb-3">Managing mother & hand model + 2 children (ages 8 & 12)</p>
                            <div class="row g-2 mb-3">
                                <div class="col-6">
                                    <div class="text-center">
                                        <h6 class="text-warning mb-1">3</h6>
                                        <small class="text-muted">Managed Profiles</small>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="text-center">
                                        <h6 class="text-success mb-1">7</h6>
                                        <small class="text-muted">Active Bookings</small>
                                    </div>
                                </div>
                            </div>
                            <div class="d-flex justify-content-between align-items-center">
                                <small class="text-muted">Currently: Sofia Rodriguez</small>
                                <span class="badge bg-warning">Guardian</span>
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <strong class="d-block mb-2">Key Features:</strong>
                        <ul class="small text-muted ps-3">
                            <li>Profile switching & management</li>
                            <li>Parental controls for minors</li>
                            <li>Consolidated earnings view</li>
                            <li>Educational content restrictions</li>
                            <li>Guardian approval workflows</li>
                        </ul>
                    </div>
                    ',
                    '<a href="guardian/index.php" class="btn btn-warning btn-sm">View Guardian Dashboard</a>'
                ); ?>
            </div>
        </div>
        
        <!-- All Available Features -->
        <div class="row mt-5">
            <div class="col-12">
                <h3 class="mb-3">All Available Features</h3>
                <p class="text-muted mb-4">Mix and match any features to create your perfect account configuration</p>
            </div>
            <div class="col-md-6 col-lg-3 mb-4">
                <div class="card h-100">
                    <div class="card-header bg-primary text-white">
                        <h5 class="mb-0"><i class="fas fa-user-circle me-2"></i>Profile Management</h5>
                    </div>
                    <div class="card-body">
                        <ul class="list-unstyled">
                            <li class="mb-2"><i class="fas fa-check text-success me-2"></i>Multiple Profiles</li>
                            <li class="mb-2"><i class="fas fa-check text-success me-2"></i>Profile Types (Model, Photo, etc)</li>
                            <li class="mb-2"><i class="fas fa-check text-success me-2"></i>Manage Others</li>
                            <li class="mb-2"><i class="fas fa-check text-success me-2"></i>Minor Management</li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="col-md-6 col-lg-3 mb-4">
                <div class="card h-100">
                    <div class="card-header bg-success text-white">
                        <h5 class="mb-0"><i class="fas fa-users me-2"></i>Team & Collaboration</h5>
                    </div>
                    <div class="card-body">
                        <ul class="list-unstyled">
                            <li class="mb-2"><i class="fas fa-check text-success me-2"></i>Team Members</li>
                            <li class="mb-2"><i class="fas fa-check text-success me-2"></i>Role Assignment</li>
                            <li class="mb-2"><i class="fas fa-check text-success me-2"></i>Approval Workflows</li>
                            <li class="mb-2"><i class="fas fa-check text-success me-2"></i>Shared Calendar</li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="col-md-6 col-lg-3 mb-4">
                <div class="card h-100">
                    <div class="card-header bg-warning text-white">
                        <h5 class="mb-0"><i class="fas fa-briefcase me-2"></i>Business Features</h5>
                    </div>
                    <div class="card-body">
                        <ul class="list-unstyled">
                            <li class="mb-2"><i class="fas fa-check text-success me-2"></i>Invoicing System</li>
                            <li class="mb-2"><i class="fas fa-check text-success me-2"></i>Commission Tracking</li>
                            <li class="mb-2"><i class="fas fa-check text-success me-2"></i>Custom Branding</li>
                            <li class="mb-2"><i class="fas fa-check text-success me-2"></i>API Access</li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="col-md-6 col-lg-3 mb-4">
                <div class="card h-100">
                    <div class="card-header bg-info text-white">
                        <h5 class="mb-0"><i class="fas fa-star me-2"></i>Special Features</h5>
                    </div>
                    <div class="card-body">
                        <ul class="list-unstyled">
                            <li class="mb-2"><i class="fas fa-check text-success me-2"></i>Trust Fund Management</li>
                            <li class="mb-2"><i class="fas fa-check text-success me-2"></i>Advanced Analytics</li>
                            <li class="mb-2"><i class="fas fa-check text-success me-2"></i>Priority Support</li>
                            <li class="mb-2"><i class="fas fa-check text-success me-2"></i>White Label Options</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <!-- New Architecture Notes -->
        <div class="row mt-4">
            <div class="col-12">
                <?php echo createCard(
                    "Feature-Based Architecture Benefits",
                    '
                    <div class="row g-3">
                        <div class="col-md-6">
                            <h6 class="text-primary">Why Feature-Based?</h6>
                            <ul class="small text-muted">
                                <li><strong>No Artificial Limits:</strong> Why can\'t a photographer also manage models?</li>
                                <li><strong>Natural Growth:</strong> Start solo, add team features when ready</li>
                                <li><strong>One Account:</strong> Single login for all your professional needs</li>
                                <li><strong>Pay As You Grow:</strong> Only pay for features you actually use</li>
                            </ul>
                        </div>
                        <div class="col-md-6">
                            <h6 class="text-info">Real-World Examples</h6>
                            <ul class="small text-muted">
                                <li><strong>Mother Scenario:</strong> 50+ Model + Photographer + 2 Kids</li>
                                <li><strong>Growing Agency:</strong> Start solo, add staff as you grow</li>
                                <li><strong>Multi-Professional:</strong> Model who also does makeup</li>
                                <li><strong>Flexible Business:</strong> Agency that also offers photography</li>
                            </ul>
                        </div>
                    </div>
                    '
                ); ?>
            </div>
        </div>
    </div>
</div>
    </div>
</div>

<?php echo renderFooter(); ?>