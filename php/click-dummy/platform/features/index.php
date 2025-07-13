<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Feature Sets - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'features/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Feature Sets']
        ]);
        
        echo createHeroSection(
            "Feature Sets & Bundle Management",
            "Create and manage platform features, limits, and bundles for subscription plans and tier-based access control",
            "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=300&fit=crop",
            [
                ['label' => 'Create Feature', 'icon' => 'fas fa-plus', 'style' => 'primary'],
                ['label' => 'Feature Builder', 'icon' => 'fas fa-tools', 'style' => 'info'],
                ['label' => 'Bundle Manager', 'icon' => 'fas fa-layer-group', 'style' => 'success']
            ]
        );
        ?>
        
        <!-- Feature Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Total Features', '150+', 'fas fa-puzzle-piece', 'primary');
            echo createStatCard('Feature Categories', '15', 'fas fa-folder', 'success');
            echo createStatCard('Active Bundles', '5', 'fas fa-layer-group', 'info');
            echo createStatCard('Usage Analytics', '98%', 'fas fa-chart-line', 'warning');
            ?>
        </div>
        
        <div class="row mb-4">
            <!-- Feature Categories -->
            <div class="col-md-12">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Platform Features by Category</h5>
                        <div class="btn-group">
                            <button class="btn btn-primary" onclick="createNewFeature()">
                                <i class="fas fa-plus me-2"></i> Create Feature
                            </button>
                            <button class="btn btn-outline-secondary" onclick="featureBuilder()">
                                <i class="fas fa-tools me-2"></i> Feature Builder
                            </button>
                            <button class="btn btn-outline-info" onclick="bundleManager()">
                                <i class="fas fa-layer-group me-2"></i> Bundle Manager
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <!-- Category Tabs -->
                        <ul class="nav nav-tabs mb-3" id="featureTabs" role="tablist">
                            <li class="nav-item" role="presentation">
                                <button class="nav-link active" id="core-tab" data-bs-toggle="tab" data-bs-target="#core" type="button" role="tab">
                                    <i class="fas fa-cog me-2"></i> Core Platform (12)
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="talent-tab" data-bs-toggle="tab" data-bs-target="#talent" type="button" role="tab">
                                    <i class="fas fa-users me-2"></i> Talent Management (18)
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="casting-tab" data-bs-toggle="tab" data-bs-target="#casting" type="button" role="tab">
                                    <i class="fas fa-bullhorn me-2"></i> Casting & Jobs (15)
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="marketplace-tab" data-bs-toggle="tab" data-bs-target="#marketplace" type="button" role="tab">
                                    <i class="fas fa-shopping-cart me-2"></i> Marketplace (22)
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="analytics-tab" data-bs-toggle="tab" data-bs-target="#analytics" type="button" role="tab">
                                    <i class="fas fa-chart-bar me-2"></i> Analytics (11)
                                </button>
                            </li>
                        </ul>

                        <!-- Tab Content -->
                        <div class="tab-content" id="featureTabsContent">
                            <!-- Core Platform Features -->
                            <div class="tab-pane fade show active" id="core" role="tabpanel">
                                <div class="row g-3">
                                    <div class="col-lg-6">
                                        <div class="card border-start border-primary border-3">
                                            <div class="card-body">
                                                <div class="d-flex justify-content-between align-items-start mb-2">
                                                    <h6 class="card-title mb-0">Multi-Tenant Architecture</h6>
                                                    <div class="dropdown">
                                                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                                            Actions
                                                        </button>
                                                        <ul class="dropdown-menu">
                                                            <li><a class="dropdown-item" href="#" onclick="editFeature(\'multi-tenant\')"><i class="fas fa-edit me-2"></i> Edit</a></li>
                                                            <li><a class="dropdown-item" href="#" onclick="featureLimits(\'multi-tenant\')"><i class="fas fa-sliders-h me-2"></i> Limits</a></li>
                                                            <li><a class="dropdown-item" href="#" onclick="featureAnalytics(\'multi-tenant\')"><i class="fas fa-chart-line me-2"></i> Analytics</a></li>
                                                        </ul>
                                                    </div>
                                                </div>
                                                <p class="text-muted small mb-3">Complete tenant isolation with data separation and custom branding</p>
                                                <div class="mb-3">
                                                    <span class="badge bg-success me-1">Enabled</span>
                                                    <span class="badge bg-primary me-1">Core</span>
                                                    <span class="badge bg-info me-1">All Plans</span>
                                                </div>
                                                <div class="row text-center small">
                                                    <div class="col">
                                                        <div class="fw-bold">Unlimited</div>
                                                        <div class="text-muted">Tenants</div>
                                                    </div>
                                                    <div class="col">
                                                        <div class="fw-bold">100%</div>
                                                        <div class="text-muted">Isolation</div>
                                                    </div>
                                                    <div class="col">
                                                        <div class="fw-bold">Custom</div>
                                                        <div class="text-muted">Branding</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-lg-6">
                                        <div class="card border-start border-success border-3">
                                            <div class="card-body">
                                                <div class="d-flex justify-content-between align-items-start mb-2">
                                                    <h6 class="card-title mb-0">Advanced RBAC System</h6>
                                                    <div class="dropdown">
                                                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                                            Actions
                                                        </button>
                                                        <ul class="dropdown-menu">
                                                            <li><a class="dropdown-item" href="#" onclick="editFeature(\'rbac\')"><i class="fas fa-edit me-2"></i> Edit</a></li>
                                                            <li><a class="dropdown-item" href="#" onclick="featureLimits(\'rbac\')"><i class="fas fa-sliders-h me-2"></i> Limits</a></li>
                                                            <li><a class="dropdown-item" href="#" onclick="featureAnalytics(\'rbac\')"><i class="fas fa-chart-line me-2"></i> Analytics</a></li>
                                                        </ul>
                                                    </div>
                                                </div>
                                                <p class="text-muted small mb-3">Role-based access control with pattern-based permissions and inheritance</p>
                                                <div class="mb-3">
                                                    <span class="badge bg-success me-1">Enabled</span>
                                                    <span class="badge bg-warning me-1">Professional+</span>
                                                    <span class="badge bg-info me-1">Configurable</span>
                                                </div>
                                                <div class="row text-center small">
                                                    <div class="col">
                                                        <div class="fw-bold">Unlimited</div>
                                                        <div class="text-muted">Roles</div>
                                                    </div>
                                                    <div class="col">
                                                        <div class="fw-bold">500+</div>
                                                        <div class="text-muted">Permissions</div>
                                                    </div>
                                                    <div class="col">
                                                        <div class="fw-bold">Hierarchical</div>
                                                        <div class="text-muted">Inheritance</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-lg-6">
                                        <div class="card border-start border-info border-3">
                                            <div class="card-body">
                                                <div class="d-flex justify-content-between align-items-start mb-2">
                                                    <h6 class="card-title mb-0">API Gateway & Rate Limiting</h6>
                                                    <div class="dropdown">
                                                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                                            Actions
                                                        </button>
                                                        <ul class="dropdown-menu">
                                                            <li><a class="dropdown-item" href="#" onclick="editFeature(\'api-gateway\')"><i class="fas fa-edit me-2"></i> Edit</a></li>
                                                            <li><a class="dropdown-item" href="#" onclick="featureLimits(\'api-gateway\')"><i class="fas fa-sliders-h me-2"></i> Limits</a></li>
                                                            <li><a class="dropdown-item" href="#" onclick="featureAnalytics(\'api-gateway\')"><i class="fas fa-chart-line me-2"></i> Analytics</a></li>
                                                        </ul>
                                                    </div>
                                                </div>
                                                <p class="text-muted small mb-3">RESTful API with authentication, rate limiting, and comprehensive documentation</p>
                                                <div class="mb-3">
                                                    <span class="badge bg-success me-1">Enabled</span>
                                                    <span class="badge bg-primary me-1">Core</span>
                                                    <span class="badge bg-warning me-1">Rate Limited</span>
                                                </div>
                                                <div class="row text-center small">
                                                    <div class="col">
                                                        <div class="fw-bold">1,000/hr</div>
                                                        <div class="text-muted">Free Plan</div>
                                                    </div>
                                                    <div class="col">
                                                        <div class="fw-bold">10,000/hr</div>
                                                        <div class="text-muted">Pro Plan</div>
                                                    </div>
                                                    <div class="col">
                                                        <div class="fw-bold">Unlimited</div>
                                                        <div class="text-muted">Enterprise</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-lg-6">
                                        <div class="card border-start border-warning border-3">
                                            <div class="card-body">
                                                <div class="d-flex justify-content-between align-items-start mb-2">
                                                    <h6 class="card-title mb-0">Real-time Notifications</h6>
                                                    <div class="dropdown">
                                                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                                            Actions
                                                        </button>
                                                        <ul class="dropdown-menu">
                                                            <li><a class="dropdown-item" href="#" onclick="editFeature(\'notifications\')"><i class="fas fa-edit me-2"></i> Edit</a></li>
                                                            <li><a class="dropdown-item" href="#" onclick="featureLimits(\'notifications\')"><i class="fas fa-sliders-h me-2"></i> Limits</a></li>
                                                            <li><a class="dropdown-item" href="#" onclick="featureAnalytics(\'notifications\')"><i class="fas fa-chart-line me-2"></i> Analytics</a></li>
                                                        </ul>
                                                    </div>
                                                </div>
                                                <p class="text-muted small mb-3">WebSocket-based real-time notifications with email and SMS integration</p>
                                                <div class="mb-3">
                                                    <span class="badge bg-success me-1">Enabled</span>
                                                    <span class="badge bg-info me-1">Real-time</span>
                                                    <span class="badge bg-secondary me-1">Multi-channel</span>
                                                </div>
                                                <div class="row text-center small">
                                                    <div class="col">
                                                        <div class="fw-bold">100/day</div>
                                                        <div class="text-muted">Free Plan</div>
                                                    </div>
                                                    <div class="col">
                                                        <div class="fw-bold">1,000/day</div>
                                                        <div class="text-muted">Pro Plan</div>
                                                    </div>
                                                    <div class="col">
                                                        <div class="fw-bold">Unlimited</div>
                                                        <div class="text-muted">Enterprise</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Talent Management Features -->
                            <div class="tab-pane fade" id="talent" role="tabpanel">
                                <div class="row g-3">
                                    <div class="col-lg-6">
                                        <div class="card border-start border-primary border-3">
                                            <div class="card-body">
                                                <div class="d-flex justify-content-between align-items-start mb-2">
                                                    <h6 class="card-title mb-0">Portfolio Management</h6>
                                                    <div class="dropdown">
                                                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                                            Actions
                                                        </button>
                                                        <ul class="dropdown-menu">
                                                            <li><a class="dropdown-item" href="#" onclick="editFeature(\'portfolio\')"><i class="fas fa-edit me-2"></i> Edit</a></li>
                                                            <li><a class="dropdown-item" href="#" onclick="featureLimits(\'portfolio\')"><i class="fas fa-sliders-h me-2"></i> Limits</a></li>
                                                            <li><a class="dropdown-item" href="#" onclick="featureAnalytics(\'portfolio\')"><i class="fas fa-chart-line me-2"></i> Analytics</a></li>
                                                        </ul>
                                                    </div>
                                                </div>
                                                <p class="text-muted small mb-3">Comprehensive portfolio creation with image galleries, videos, and performance statistics</p>
                                                <div class="mb-3">
                                                    <span class="badge bg-success me-1">Enabled</span>
                                                    <span class="badge bg-primary me-1">Core</span>
                                                    <span class="badge bg-info me-1">Media Rich</span>
                                                </div>
                                                <div class="row text-center small">
                                                    <div class="col">
                                                        <div class="fw-bold">5</div>
                                                        <div class="text-muted">Images</div>
                                                    </div>
                                                    <div class="col">
                                                        <div class="fw-bold">50</div>
                                                        <div class="text-muted">Pro Plan</div>
                                                    </div>
                                                    <div class="col">
                                                        <div class="fw-bold">Unlimited</div>
                                                        <div class="text-muted">Enterprise</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-lg-6">
                                        <div class="card border-start border-success border-3">
                                            <div class="card-body">
                                                <div class="d-flex justify-content-between align-items-start mb-2">
                                                    <h6 class="card-title mb-0">Advanced Search & Filtering</h6>
                                                    <div class="dropdown">
                                                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                                            Actions
                                                        </button>
                                                        <ul class="dropdown-menu">
                                                            <li><a class="dropdown-item" href="#" onclick="editFeature(\'search\')"><i class="fas fa-edit me-2"></i> Edit</a></li>
                                                            <li><a class="dropdown-item" href="#" onclick="featureLimits(\'search\')"><i class="fas fa-sliders-h me-2"></i> Limits</a></li>
                                                            <li><a class="dropdown-item" href="#" onclick="featureAnalytics(\'search\')"><i class="fas fa-chart-line me-2"></i> Analytics</a></li>
                                                        </ul>
                                                    </div>
                                                </div>
                                                <p class="text-muted small mb-3">Elasticsearch-powered talent search with AI-enhanced matching and recommendation engine</p>
                                                <div class="mb-3">
                                                    <span class="badge bg-success me-1">Enabled</span>
                                                    <span class="badge bg-warning me-1">AI-Powered</span>
                                                    <span class="badge bg-info me-1">Real-time</span>
                                                </div>
                                                <div class="row text-center small">
                                                    <div class="col">
                                                        <div class="fw-bold">Basic</div>
                                                        <div class="text-muted">Free Plan</div>
                                                    </div>
                                                    <div class="col">
                                                        <div class="fw-bold">Advanced</div>
                                                        <div class="text-muted">Pro Plan</div>
                                                    </div>
                                                    <div class="col">
                                                        <div class="fw-bold">AI Match</div>
                                                        <div class="text-muted">Enterprise</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Other tabs continue with similar structure... -->
                            <div class="tab-pane fade" id="casting" role="tabpanel">
                                <div class="alert alert-info">
                                    <i class="fas fa-bullhorn me-2"></i>
                                    <strong>Casting & Jobs Features</strong> - 15 features including casting call management, application tracking, scheduling, and automated matching.
                                </div>
                            </div>
                            
                            <div class="tab-pane fade" id="marketplace" role="tabpanel">
                                <div class="alert alert-success">
                                    <i class="fas fa-shopping-cart me-2"></i>
                                    <strong>Marketplace Features</strong> - 22 features including payment processing, commission management, booking system, and vendor management.
                                </div>
                            </div>
                            
                            <div class="tab-pane fade" id="analytics" role="tabpanel">
                                <div class="alert alert-warning">
                                    <i class="fas fa-chart-bar me-2"></i>
                                    <strong>Analytics Features</strong> - 11 features including real-time dashboards, custom reports, performance metrics, and AI insights.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Feature Bundle Builder -->
        <div class="row mb-4">
            <div class="col-lg-8">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Feature Bundle Builder</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Available Features</h6>
                                <div class="border rounded p-3" style="height: 300px; overflow-y: auto;">
                                    <!-- Feature list with drag/drop -->
                                    <div class="feature-item p-2 mb-2 bg-light rounded" draggable="true">
                                        <i class="fas fa-grip-vertical text-muted me-2"></i>
                                        <span>Multi-Tenant Architecture</span>
                                        <span class="badge bg-primary ms-auto">Core</span>
                                    </div>
                                    <div class="feature-item p-2 mb-2 bg-light rounded" draggable="true">
                                        <i class="fas fa-grip-vertical text-muted me-2"></i>
                                        <span>Advanced RBAC System</span>
                                        <span class="badge bg-warning ms-auto">Professional+</span>
                                    </div>
                                    <div class="feature-item p-2 mb-2 bg-light rounded" draggable="true">
                                        <i class="fas fa-grip-vertical text-muted me-2"></i>
                                        <span>Portfolio Management</span>
                                        <span class="badge bg-success ms-auto">All Plans</span>
                                    </div>
                                    <div class="feature-item p-2 mb-2 bg-light rounded" draggable="true">
                                        <i class="fas fa-grip-vertical text-muted me-2"></i>
                                        <span>Advanced Search</span>
                                        <span class="badge bg-info ms-auto">Pro+</span>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <h6>Bundle Configuration</h6>
                                <div class="border rounded p-3" style="height: 300px; overflow-y: auto;" id="bundle-drop-zone">
                                    <div class="text-center text-muted py-5">
                                        <i class="fas fa-layer-group fa-3x mb-3"></i>
                                        <p>Drag features here to create a bundle</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="row mt-3">
                            <div class="col-12">
                                <div class="btn-group">
                                    <button class="btn btn-primary" onclick="saveBundle()">
                                        <i class="fas fa-save me-2"></i> Save Bundle
                                    </button>
                                    <button class="btn btn-outline-secondary" onclick="previewBundle()">
                                        <i class="fas fa-eye me-2"></i> Preview
                                    </button>
                                    <button class="btn btn-outline-danger" onclick="clearBundle()">
                                        <i class="fas fa-trash me-2"></i> Clear
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Feature Limits Configuration -->
            <div class="col-lg-4">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Feature Limits</h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label class="form-label">Storage Limit</label>
                            <div class="input-group">
                                <input type="number" class="form-control" value="100">
                                <span class="input-group-text">MB</span>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">API Calls/Hour</label>
                            <div class="input-group">
                                <input type="number" class="form-control" value="1000">
                                <span class="input-group-text">/hr</span>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Users per Account</label>
                            <input type="number" class="form-control" value="5">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Portfolio Images</label>
                            <input type="number" class="form-control" value="5">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Monthly Notifications</label>
                            <input type="number" class="form-control" value="100">
                        </div>
                        <button class="btn btn-primary w-100">
                            <i class="fas fa-save me-2"></i> Update Limits
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Feature Creation Modal -->
<div class="modal fade" id="createFeatureModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Create New Feature</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Feature Name</label>
                                <input type="text" class="form-control" placeholder="e.g., Advanced Portfolio">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Category</label>
                                <select class="form-select">
                                    <option>Core Platform</option>
                                    <option>Talent Management</option>
                                    <option>Casting & Jobs</option>
                                    <option>Marketplace</option>
                                    <option>Analytics</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Description</label>
                        <textarea class="form-control" rows="3" placeholder="Detailed description of the feature..."></textarea>
                    </div>
                    <div class="row">
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">Feature Type</label>
                                <select class="form-select">
                                    <option>Core</option>
                                    <option>Premium</option>
                                    <option>Enterprise</option>
                                    <option>Add-on</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">Status</label>
                                <select class="form-select">
                                    <option>Active</option>
                                    <option>Beta</option>
                                    <option>Coming Soon</option>
                                    <option>Deprecated</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">Priority</label>
                                <select class="form-select">
                                    <option>High</option>
                                    <option>Medium</option>
                                    <option>Low</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Available in Plans</label>
                        <div class="row">
                            <div class="col-md-2">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="plan-free">
                                    <label class="form-check-label" for="plan-free">Free</label>
                                </div>
                            </div>
                            <div class="col-md-2">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="plan-pro">
                                    <label class="form-check-label" for="plan-pro">Professional</label>
                                </div>
                            </div>
                            <div class="col-md-2">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="plan-agency">
                                    <label class="form-check-label" for="plan-agency">Agency</label>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="plan-enterprise">
                                    <label class="form-check-label" for="plan-enterprise">Enterprise</label>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="plan-platform">
                                    <label class="form-check-label" for="plan-platform">Platform</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary">Create Feature</button>
            </div>
        </div>
    </div>
</div>

<script>
// Feature management functions
function createNewFeature() {
    const modal = new bootstrap.Modal(document.getElementById('createFeatureModal'));
    modal.show();
}

function featureBuilder() {
    alert('Feature Builder: Advanced feature creation wizard with dependencies, conflicts, and integration settings.');
}

function bundleManager() {
    alert('Bundle Manager: Create and manage feature bundles for different subscription tiers.');
}

function editFeature(featureId) {
    alert(`Edit Feature: ${featureId} - Open feature editor with full configuration options.`);
}

function featureLimits(featureId) {
    alert(`Feature Limits: ${featureId} - Configure usage limits, quotas, and restrictions.`);
}

function featureAnalytics(featureId) {
    alert(`Feature Analytics: ${featureId} - View usage statistics, adoption rates, and performance metrics.`);
}

function saveBundle() {
    alert('Save Bundle: Bundle configuration saved successfully.');
}

function previewBundle() {
    alert('Preview Bundle: Show bundle preview with pricing and feature comparison.');
}

function clearBundle() {
    document.getElementById('bundle-drop-zone').innerHTML = `
        <div class="text-center text-muted py-5">
            <i class="fas fa-layer-group fa-3x mb-3"></i>
            <p>Drag features here to create a bundle</p>
        </div>
    `;
}

// Drag and drop functionality
document.addEventListener('DOMContentLoaded', function() {
    const features = document.querySelectorAll('.feature-item');
    const dropZone = document.getElementById('bundle-drop-zone');
    
    features.forEach(feature => {
        feature.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', this.outerHTML);
        });
    });
    
    dropZone.addEventListener('dragover', function(e) {
        e.preventDefault();
    });
    
    dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        const featureHTML = e.dataTransfer.getData('text/plain');
        
        if (this.children.length === 1 && this.children[0].querySelector('.text-muted')) {
            this.innerHTML = '';
        }
        
        const newFeature = document.createElement('div');
        newFeature.innerHTML = featureHTML;
        newFeature.firstChild.classList.add('mb-2');
        this.appendChild(newFeature.firstChild);
    });
});
</script>

<?php echo renderFooter(); ?>