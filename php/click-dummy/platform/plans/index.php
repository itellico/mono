<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Subscription Plans - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'plans/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Subscription Plans']
        ]);
        
        echo createHeroSection(
            "Subscription Plans Management",
            "Create and manage 5-tier subscription system with features, limits, and pricing for marketplace platforms",
            "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=300&fit=crop",
            [
                ['label' => 'Create Plan', 'icon' => 'fas fa-plus', 'style' => 'primary'],
                ['label' => 'Feature Builder', 'icon' => 'fas fa-puzzle-piece', 'style' => 'info'],
                ['label' => 'Plan Analytics', 'icon' => 'fas fa-chart-bar', 'style' => 'success']
            ]
        );
        ?>
        
        <!-- Subscription Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Active Plans', '5', 'fas fa-tags', 'primary');
            echo createStatCard('Total Subscribers', '2,847', 'fas fa-users', 'success');
            echo createStatCard('Monthly Revenue', '€387K', 'fas fa-euro-sign', 'warning');
            echo createStatCard('Feature Bundle', '150+', 'fas fa-puzzle-piece', 'info');
            ?>
        </div>
        
        <div class="row mb-4">
            <!-- 5-Tier Subscription Plans -->
            <div class="col-12">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">5-Tier Subscription System</h5>
                        <div class="btn-group">
                            <a href="plan-builder.php" class="btn btn-primary">
                                <i class="fas fa-plus me-2"></i> Create Plan
                            </a>
                            <a href="plan-builder.php" class="btn btn-outline-secondary">
                                <i class="fas fa-tools me-2"></i> Plan Builder
                            </a>
                            <a href="feature-sets.php" class="btn btn-outline-success">
                                <i class="fas fa-layer-group me-2"></i> Feature Sets
                            </a>
                            <button class="btn btn-outline-info" onclick="planAnalytics()">
                                <i class="fas fa-chart-bar me-2"></i> Analytics
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            <!-- Free Starter Plan -->
                            <div class="col-lg">
                                <div class="card border-secondary h-100">
                                    <div class="card-header bg-secondary text-white text-center">
                                        <h6 class="mb-0">Free Starter</h6>
                                        <div class="h2 mt-2 mb-0">€0</div>
                                        <small>/month</small>
                                    </div>
                                    <div class="card-body">
                                        <div class="mb-3">
                                            <span class="badge bg-success">847 subscribers</span>
                                            <span class="badge bg-info">Most Popular</span>
                                        </div>
                                        <ul class="list-unstyled small">
                                            <li class="mb-1"><i class="fas fa-check text-success me-2"></i> Basic portfolio (5 images)</li>
                                            <li class="mb-1"><i class="fas fa-check text-success me-2"></i> 100MB storage</li>
                                            <li class="mb-1"><i class="fas fa-check text-success me-2"></i> Basic search visibility</li>
                                            <li class="mb-1"><i class="fas fa-check text-success me-2"></i> Standard categories</li>
                                            <li class="mb-1"><i class="fas fa-times text-danger me-2"></i> Advanced analytics</li>
                                            <li class="mb-1"><i class="fas fa-times text-danger me-2"></i> Priority support</li>
                                        </ul>
                                        <div class="mt-auto">
                                            <button class="btn btn-outline-primary btn-sm w-100" onclick="editPlan('free-starter')">
                                                Manage Plan
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Professional Model Plan -->
                            <div class="col-lg">
                                <div class="card border-primary h-100">
                                    <div class="card-header bg-primary text-white text-center">
                                        <h6 class="mb-0">Professional Model</h6>
                                        <div class="h2 mt-2 mb-0">€29</div>
                                        <small>/month</small>
                                    </div>
                                    <div class="card-body">
                                        <div class="mb-3">
                                            <span class="badge bg-success">634 subscribers</span>
                                            <span class="badge bg-warning">Growing</span>
                                        </div>
                                        <ul class="list-unstyled small">
                                            <li class="mb-1"><i class="fas fa-check text-success me-2"></i> Enhanced portfolio (50 images)</li>
                                            <li class="mb-1"><i class="fas fa-check text-success me-2"></i> 5GB storage</li>
                                            <li class="mb-1"><i class="fas fa-check text-success me-2"></i> Priority search ranking</li>
                                            <li class="mb-1"><i class="fas fa-check text-success me-2"></i> Advanced categories & tags</li>
                                            <li class="mb-1"><i class="fas fa-check text-success me-2"></i> Basic analytics</li>
                                            <li class="mb-1"><i class="fas fa-check text-success me-2"></i> Email support</li>
                                        </ul>
                                        <div class="mt-auto">
                                            <button class="btn btn-outline-primary btn-sm w-100" onclick="editPlan('professional-model')">
                                                Manage Plan
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Agency Pro Plan -->
                            <div class="col-lg">
                                <div class="card border-success h-100">
                                    <div class="card-header bg-success text-white text-center position-relative">
                                        <span class="badge bg-warning text-dark position-absolute top-0 start-50 translate-middle" style="z-index: 10;">Recommended</span>
                                        <h6 class="mb-0 mt-2">Agency Pro</h6>
                                        <div class="h2 mt-2 mb-0">€99</div>
                                        <small>/month</small>
                                    </div>
                                    <div class="card-body">
                                        <div class="mb-3">
                                            <span class="badge bg-success">287 subscribers</span>
                                            <span class="badge bg-primary">High Value</span>
                                        </div>
                                        <ul class="list-unstyled small">
                                            <li class="mb-1"><i class="fas fa-check text-success me-2"></i> Team management (25 users)</li>
                                            <li class="mb-1"><i class="fas fa-check text-success me-2"></i> 50GB storage</li>
                                            <li class="mb-1"><i class="fas fa-check text-success me-2"></i> Advanced talent discovery</li>
                                            <li class="mb-1"><i class="fas fa-check text-success me-2"></i> Custom branding</li>
                                            <li class="mb-1"><i class="fas fa-check text-success me-2"></i> Advanced analytics</li>
                                            <li class="mb-1"><i class="fas fa-check text-success me-2"></i> Priority support</li>
                                        </ul>
                                        <div class="mt-auto">
                                            <button class="btn btn-outline-success btn-sm w-100" onclick="editPlan('agency-pro')">
                                                Manage Plan
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Enterprise Studio Plan -->
                            <div class="col-lg">
                                <div class="card border-warning h-100">
                                    <div class="card-header bg-warning text-dark text-center">
                                        <h6 class="mb-0">Enterprise Studio</h6>
                                        <div class="h2 mt-2 mb-0">€299</div>
                                        <small>/month</small>
                                    </div>
                                    <div class="card-body">
                                        <div class="mb-3">
                                            <span class="badge bg-success">156 subscribers</span>
                                            <span class="badge bg-secondary">Enterprise</span>
                                        </div>
                                        <ul class="list-unstyled small">
                                            <li class="mb-1"><i class="fas fa-check text-success me-2"></i> Unlimited team members</li>
                                            <li class="mb-1"><i class="fas fa-check text-success me-2"></i> 500GB storage</li>
                                            <li class="mb-1"><i class="fas fa-check text-success me-2"></i> White-label platform</li>
                                            <li class="mb-1"><i class="fas fa-check text-success me-2"></i> API access & integrations</li>
                                            <li class="mb-1"><i class="fas fa-check text-success me-2"></i> Custom workflows</li>
                                            <li class="mb-1"><i class="fas fa-check text-success me-2"></i> Dedicated support</li>
                                        </ul>
                                        <div class="mt-auto">
                                            <button class="btn btn-outline-warning btn-sm w-100" onclick="editPlan('enterprise-studio')">
                                                Manage Plan
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Platform Operator Plan -->
                            <div class="col-lg">
                                <div class="card border-danger h-100">
                                    <div class="card-header bg-danger text-white text-center">
                                        <h6 class="mb-0">Platform Operator</h6>
                                        <div class="h2 mt-2 mb-0">€999</div>
                                        <small>/month</small>
                                    </div>
                                    <div class="card-body">
                                        <div class="mb-3">
                                            <span class="badge bg-success">23 subscribers</span>
                                            <span class="badge bg-danger">Premium</span>
                                        </div>
                                        <ul class="list-unstyled small">
                                            <li class="mb-1"><i class="fas fa-check text-success me-2"></i> Complete platform licensing</li>
                                            <li class="mb-1"><i class="fas fa-check text-success me-2"></i> Unlimited everything</li>
                                            <li class="mb-1"><i class="fas fa-check text-success me-2"></i> Multi-tenant capabilities</li>
                                            <li class="mb-1"><i class="fas fa-check text-success me-2"></i> Custom development</li>
                                            <li class="mb-1"><i class="fas fa-check text-success me-2"></i> On-premise deployment</li>
                                            <li class="mb-1"><i class="fas fa-check text-success me-2"></i> 24/7 dedicated team</li>
                                        </ul>
                                        <div class="mt-auto">
                                            <button class="btn btn-outline-danger btn-sm w-100" onclick="editPlan('platform-operator')">
                                                Manage Plan
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mb-4">
            <!-- Feature Bundle Management -->
            <div class="col-md-8">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Feature Bundle Management</h5>
                        <button class="btn btn-outline-primary btn-sm" onclick="featureBuilder()">
                            <i class="fas fa-cogs me-2"></i> Feature Builder
                        </button>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6 class="fw-bold mb-3">
                                    <i class="fas fa-user text-primary me-2"></i> Profile & Portfolio Features
                                </h6>
                                <div class="feature-category mb-3">
                                    <div class="form-check mb-2">
                                        <input class="form-check-input" type="checkbox" id="basic-portfolio" checked disabled>
                                        <label class="form-check-label small" for="basic-portfolio">
                                            Basic Portfolio Management
                                            <span class="badge bg-light text-dark ms-2">All Plans</span>
                                        </label>
                                    </div>
                                    <div class="form-check mb-2">
                                        <input class="form-check-input" type="checkbox" id="enhanced-portfolio" checked>
                                        <label class="form-check-label small" for="enhanced-portfolio">
                                            Enhanced Portfolio (50+ images)
                                            <span class="badge bg-primary ms-2">Pro+</span>
                                        </label>
                                    </div>
                                    <div class="form-check mb-2">
                                        <input class="form-check-input" type="checkbox" id="video-portfolio" checked>
                                        <label class="form-check-label small" for="video-portfolio">
                                            Video Portfolio & Reels
                                            <span class="badge bg-success ms-2">Agency+</span>
                                        </label>
                                    </div>
                                    <div class="form-check mb-2">
                                        <input class="form-check-input" type="checkbox" id="measurements-tracking">
                                        <label class="form-check-label small" for="measurements-tracking">
                                            Measurements & Body Tracking
                                            <span class="badge bg-warning ms-2">Enterprise+</span>
                                        </label>
                                    </div>
                                </div>
                                
                                <h6 class="fw-bold mb-3">
                                    <i class="fas fa-chart-bar text-success me-2"></i> Analytics & Reporting
                                </h6>
                                <div class="feature-category mb-3">
                                    <div class="form-check mb-2">
                                        <input class="form-check-input" type="checkbox" id="basic-analytics" checked>
                                        <label class="form-check-label small" for="basic-analytics">
                                            Basic View Analytics
                                            <span class="badge bg-primary ms-2">Pro+</span>
                                        </label>
                                    </div>
                                    <div class="form-check mb-2">
                                        <input class="form-check-input" type="checkbox" id="advanced-analytics" checked>
                                        <label class="form-check-label small" for="advanced-analytics">
                                            Advanced Performance Analytics
                                            <span class="badge bg-success ms-2">Agency+</span>
                                        </label>
                                    </div>
                                    <div class="form-check mb-2">
                                        <input class="form-check-input" type="checkbox" id="custom-reports">
                                        <label class="form-check-label small" for="custom-reports">
                                            Custom Reports & Dashboards
                                            <span class="badge bg-warning ms-2">Enterprise+</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <h6 class="fw-bold mb-3">
                                    <i class="fas fa-users text-info me-2"></i> Team & Collaboration
                                </h6>
                                <div class="feature-category mb-3">
                                    <div class="form-check mb-2">
                                        <input class="form-check-input" type="checkbox" id="single-user" checked disabled>
                                        <label class="form-check-label small" for="single-user">
                                            Single User Account
                                            <span class="badge bg-light text-dark ms-2">Free+</span>
                                        </label>
                                    </div>
                                    <div class="form-check mb-2">
                                        <input class="form-check-input" type="checkbox" id="team-management" checked>
                                        <label class="form-check-label small" for="team-management">
                                            Team Management (25 users)
                                            <span class="badge bg-success ms-2">Agency+</span>
                                        </label>
                                    </div>
                                    <div class="form-check mb-2">
                                        <input class="form-check-input" type="checkbox" id="unlimited-team" checked>
                                        <label class="form-check-label small" for="unlimited-team">
                                            Unlimited Team Members
                                            <span class="badge bg-warning ms-2">Enterprise+</span>
                                        </label>
                                    </div>
                                    <div class="form-check mb-2">
                                        <input class="form-check-input" type="checkbox" id="role-permissions">
                                        <label class="form-check-label small" for="role-permissions">
                                            Advanced Role & Permissions
                                            <span class="badge bg-danger ms-2">Platform</span>
                                        </label>
                                    </div>
                                </div>
                                
                                <h6 class="fw-bold mb-3">
                                    <i class="fas fa-cogs text-warning me-2"></i> Platform & API
                                </h6>
                                <div class="feature-category mb-3">
                                    <div class="form-check mb-2">
                                        <input class="form-check-input" type="checkbox" id="basic-api">
                                        <label class="form-check-label small" for="basic-api">
                                            Basic API Access
                                            <span class="badge bg-success ms-2">Agency+</span>
                                        </label>
                                    </div>
                                    <div class="form-check mb-2">
                                        <input class="form-check-input" type="checkbox" id="full-api" checked>
                                        <label class="form-check-label small" for="full-api">
                                            Full API & Webhooks
                                            <span class="badge bg-warning ms-2">Enterprise+</span>
                                        </label>
                                    </div>
                                    <div class="form-check mb-2">
                                        <input class="form-check-input" type="checkbox" id="white-label" checked>
                                        <label class="form-check-label small" for="white-label">
                                            White-label Platform
                                            <span class="badge bg-warning ms-2">Enterprise+</span>
                                        </label>
                                    </div>
                                    <div class="form-check mb-2">
                                        <input class="form-check-input" type="checkbox" id="multi-tenant">
                                        <label class="form-check-label small" for="multi-tenant">
                                            Multi-tenant Capabilities
                                            <span class="badge bg-danger ms-2">Platform</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <hr>
                        
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <strong>Total Features Available: 150+</strong>
                                <br><small class="text-muted">Across 15 feature categories</small>
                            </div>
                            <div class="btn-group">
                                <button class="btn btn-outline-secondary btn-sm" onclick="exportFeatures()">
                                    <i class="fas fa-download me-1"></i> Export
                                </button>
                                <button class="btn btn-outline-primary btn-sm" onclick="importFeatures()">
                                    <i class="fas fa-upload me-1"></i> Import
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Plan Analytics & Actions -->
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Plan Performance</h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <small>Free Starter</small>
                                <small class="fw-bold">€0 (847 users)</small>
                            </div>
                            <div class="progress mb-2" style="height: 4px;">
                                <div class="progress-bar bg-secondary" style="width: 43%"></div>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <small>Professional Model</small>
                                <small class="fw-bold">€18.3K (634 users)</small>
                            </div>
                            <div class="progress mb-2" style="height: 4px;">
                                <div class="progress-bar bg-primary" style="width: 32%"></div>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <small>Agency Pro</small>
                                <small class="fw-bold">€28.4K (287 users)</small>
                            </div>
                            <div class="progress mb-2" style="height: 4px;">
                                <div class="progress-bar bg-success" style="width: 15%"></div>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <small>Enterprise Studio</small>
                                <small class="fw-bold">€46.6K (156 users)</small>
                            </div>
                            <div class="progress mb-2" style="height: 4px;">
                                <div class="progress-bar bg-warning" style="width: 8%"></div>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <small>Platform Operator</small>
                                <small class="fw-bold">€23.0K (23 users)</small>
                            </div>
                            <div class="progress mb-2" style="height: 4px;">
                                <div class="progress-bar bg-danger" style="width: 1%"></div>
                            </div>
                        </div>
                        
                        <hr>
                        
                        <div class="text-center">
                            <h4 class="text-success">€387K</h4>
                            <small class="text-muted">Total Monthly Revenue</small>
                        </div>
                    </div>
                </div>
                
                <div class="card mt-3">
                    <div class="card-header">
                        <h5 class="mb-0">Quick Actions</h5>
                    </div>
                    <div class="card-body">
                        <div class="d-grid gap-2">
                            <button class="btn btn-primary btn-sm" onclick="createNewPlan()">
                                <i class="fas fa-plus me-2"></i> Create New Plan
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" onclick="manageFeatures()">
                                <i class="fas fa-puzzle-piece me-2"></i> Manage Features
                            </button>
                            <button class="btn btn-outline-info btn-sm" onclick="pricingStrategy()">
                                <i class="fas fa-calculator me-2"></i> Pricing Strategy
                            </button>
                            <button class="btn btn-outline-success btn-sm" onclick="migrationTools()">
                                <i class="fas fa-exchange-alt me-2"></i> Migration Tools
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="card mt-3">
                    <div class="card-header">
                        <h5 class="mb-0">Recent Changes</h5>
                    </div>
                    <div class="card-body">
                        <div class="timeline">
                            <div class="d-flex mb-3">
                                <div class="bg-success rounded-circle me-3" style="width: 8px; height: 8px; margin-top: 6px;"></div>
                                <div class="flex-grow-1">
                                    <small class="fw-bold">Feature Update: Video Portfolio</small><br>
                                    <small class="text-muted">Added to Agency Pro plan</small><br>
                                    <small class="text-muted">2 hours ago</small>
                                </div>
                            </div>
                            <div class="d-flex mb-3">
                                <div class="bg-info rounded-circle me-3" style="width: 8px; height: 8px; margin-top: 6px;"></div>
                                <div class="flex-grow-1">
                                    <small class="fw-bold">Price Adjustment: Professional</small><br>
                                    <small class="text-muted">€29/month (from €25)</small><br>
                                    <small class="text-muted">1 day ago</small>
                                </div>
                            </div>
                            <div class="d-flex mb-3">
                                <div class="bg-warning rounded-circle me-3" style="width: 8px; height: 8px; margin-top: 6px;"></div>
                                <div class="flex-grow-1">
                                    <small class="fw-bold">New Plan: Platform Operator</small><br>
                                    <small class="text-muted">Enterprise tier launched</small><br>
                                    <small class="text-muted">1 week ago</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Plan Management Table -->
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Detailed Plan Management</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Plan Name</th>
                                <th>Price</th>
                                <th>Features</th>
                                <th>Subscribers</th>
                                <th>Revenue</th>
                                <th>Conversion</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <span class="badge bg-secondary me-2">Free</span>
                                        <strong>Free Starter</strong>
                                    </div>
                                </td>
                                <td><strong>€0</strong>/month</td>
                                <td><span class="badge bg-light text-dark">12 features</span></td>
                                <td><strong>847</strong> users</td>
                                <td>€0</td>
                                <td><span class="text-success">45%</span></td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editPlan('free-starter')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-info" onclick="viewAnalytics('free-starter')">
                                            <i class="fas fa-chart-bar"></i>
                                        </button>
                                        <button class="btn btn-outline-secondary" onclick="clonePlan('free-starter')">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <span class="badge bg-primary me-2">Pro</span>
                                        <strong>Professional Model</strong>
                                    </div>
                                </td>
                                <td><strong>€29</strong>/month</td>
                                <td><span class="badge bg-light text-dark">35 features</span></td>
                                <td><strong>634</strong> users</td>
                                <td>€18,386</td>
                                <td><span class="text-success">28%</span></td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editPlan('professional-model')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-info" onclick="viewAnalytics('professional-model')">
                                            <i class="fas fa-chart-bar"></i>
                                        </button>
                                        <button class="btn btn-outline-secondary" onclick="clonePlan('professional-model')">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr class="table-success">
                                <td>
                                    <div class="d-flex align-items-center">
                                        <span class="badge bg-success me-2">Agency</span>
                                        <strong>Agency Pro</strong>
                                        <span class="badge bg-warning text-dark ms-2">Recommended</span>
                                    </div>
                                </td>
                                <td><strong>€99</strong>/month</td>
                                <td><span class="badge bg-light text-dark">75 features</span></td>
                                <td><strong>287</strong> users</td>
                                <td>€28,413</td>
                                <td><span class="text-success">18%</span></td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editPlan('agency-pro')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-info" onclick="viewAnalytics('agency-pro')">
                                            <i class="fas fa-chart-bar"></i>
                                        </button>
                                        <button class="btn btn-outline-secondary" onclick="clonePlan('agency-pro')">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <span class="badge bg-warning me-2">Enterprise</span>
                                        <strong>Enterprise Studio</strong>
                                    </div>
                                </td>
                                <td><strong>€299</strong>/month</td>
                                <td><span class="badge bg-light text-dark">120 features</span></td>
                                <td><strong>156</strong> users</td>
                                <td>€46,644</td>
                                <td><span class="text-warning">12%</span></td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editPlan('enterprise-studio')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-info" onclick="viewAnalytics('enterprise-studio')">
                                            <i class="fas fa-chart-bar"></i>
                                        </button>
                                        <button class="btn btn-outline-secondary" onclick="clonePlan('enterprise-studio')">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <span class="badge bg-danger me-2">Platform</span>
                                        <strong>Platform Operator</strong>
                                    </div>
                                </td>
                                <td><strong>€999</strong>/month</td>
                                <td><span class="badge bg-light text-dark">150+ features</span></td>
                                <td><strong>23</strong> users</td>
                                <td>€22,977</td>
                                <td><span class="text-info">8%</span></td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editPlan('platform-operator')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-info" onclick="viewAnalytics('platform-operator')">
                                            <i class="fas fa-chart-bar"></i>
                                        </button>
                                        <button class="btn btn-outline-secondary" onclick="clonePlan('platform-operator')">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Plan Management Modals -->
<div class="modal fade" id="createPlanModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Create New Subscription Plan</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form id="createPlanForm">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Plan Name</label>
                                <input type="text" class="form-control" placeholder="e.g., Professional Model">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Plan Tier</label>
                                <select class="form-select">
                                    <option value="free">Free Tier</option>
                                    <option value="professional">Professional Tier</option>
                                    <option value="agency">Agency Tier</option>
                                    <option value="enterprise">Enterprise Tier</option>
                                    <option value="platform">Platform Tier</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Monthly Price (€)</label>
                                <input type="number" class="form-control" placeholder="29.00">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Annual Discount (%)</label>
                                <input type="number" class="form-control" placeholder="20">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Description</label>
                                <textarea class="form-control" rows="3" placeholder="Plan description and target audience..."></textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Target Market</label>
                                <select class="form-select">
                                    <option value="individual">Individual Models</option>
                                    <option value="small-agency">Small Agencies</option>
                                    <option value="medium-agency">Medium Agencies</option>
                                    <option value="enterprise">Large Enterprises</option>
                                    <option value="platform">Platform Operators</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Trial Period (days)</label>
                                <input type="number" class="form-control" placeholder="14">
                            </div>
                        </div>
                    </div>
                    
                    <hr>
                    
                    <h6 class="mb-3">Resource Limits</h6>
                    <div class="row">
                        <div class="col-md-3">
                            <div class="mb-3">
                                <label class="form-label">Storage (GB)</label>
                                <input type="number" class="form-control" placeholder="5">
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="mb-3">
                                <label class="form-label">Team Members</label>
                                <input type="number" class="form-control" placeholder="25">
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="mb-3">
                                <label class="form-label">API Calls/month</label>
                                <input type="number" class="form-control" placeholder="10000">
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="mb-3">
                                <label class="form-label">Projects</label>
                                <input type="number" class="form-control" placeholder="50">
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary">Create Plan</button>
            </div>
        </div>
    </div>
</div>

<script>
function createNewPlan() {
    new bootstrap.Modal(document.getElementById('createPlanModal')).show();
}

function editPlan(planId) {
    alert('Edit Plan: ' + planId + '\n\nThis would open a comprehensive plan editor with:\n- Feature selection and configuration\n- Pricing and billing settings\n- Resource limits and quotas\n- Target audience settings\n- Analytics and performance data');
}

function viewAnalytics(planId) {
    alert('Plan Analytics: ' + planId + '\n\nDetailed analytics would show:\n- Subscriber growth trends\n- Conversion rates and funnel analysis\n- Revenue attribution\n- Feature usage statistics\n- Churn analysis and retention metrics');
}

function clonePlan(planId) {
    alert('Clone Plan: ' + planId + '\n\nThis would create a copy of the plan for customization:\n- Duplicate all features and settings\n- Allow modification of pricing and limits\n- Reset analytics and subscriber counts\n- Maintain feature compatibility');
}

function planBuilder() {
    alert('Plan Builder\n\nVisual plan builder would include:\n- Drag & drop feature selection\n- Pricing strategy recommendations\n- Competitive analysis\n- Resource limit calculators\n- A/B testing capabilities');
}

function featureBuilder() {
    alert('Feature Builder\n\nComprehensive feature management:\n- 150+ available features across 15 categories\n- Feature dependencies and conflicts\n- Pricing impact analysis\n- Usage analytics per feature\n- Custom feature creation');
}

function manageFeatures() {
    alert('Feature Management\n\nManage the 150+ platform features:\n- Profile & Portfolio (20 features)\n- Team & Collaboration (15 features)\n- Analytics & Reporting (18 features)\n- API & Integrations (12 features)\n- And 11 more categories...');
}

function pricingStrategy() {
    alert('Pricing Strategy Tools\n\nAdvanced pricing optimization:\n- Market analysis and competitor pricing\n- Value-based pricing recommendations\n- A/B testing for price points\n- Regional pricing strategies\n- Revenue optimization modeling');
}

function migrationTools() {
    alert('Migration Tools\n\nTools for plan transitions:\n- Automated plan upgrades/downgrades\n- Feature migration mapping\n- Prorated billing calculations\n- Grandfather clause management\n- Bulk subscriber migrations');
}

function exportFeatures() {
    alert('Export Features\n\nGenerate comprehensive feature export:\n- Feature matrix across all plans\n- Pricing and limit configurations\n- Usage statistics and analytics\n- Excel/CSV format for analysis');
}

function importFeatures() {
    alert('Import Features\n\nBulk import feature configurations:\n- CSV/Excel template import\n- Feature validation and conflict detection\n- Batch feature updates\n- Rollback capabilities');
}
</script>

<?php echo renderFooter(); ?>