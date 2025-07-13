<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Industry Templates - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'templates/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Industry Templates']
        ]);
        
        echo createHeroSection(
            "Industry Templates",
            "Pre-configured marketplace templates for different industries and use cases",
            "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=300&fit=crop",
            [
                ['label' => 'Create Template', 'icon' => 'fas fa-plus', 'style' => 'primary'],
                ['label' => 'Import Templates', 'icon' => 'fas fa-upload', 'style' => 'light'],
                ['label' => 'Template Analytics', 'icon' => 'fas fa-chart-bar', 'style' => 'info']
            ]
        );
        ?>
        
        <!-- Template Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Total Templates', '23', 'fas fa-layer-group', 'primary');
            echo createStatCard('Active Templates', '18', 'fas fa-check-circle', 'success');
            echo createStatCard('Most Popular', 'Fashion Modeling', 'fas fa-star', 'warning');
            echo createStatCard('Template Usage', '87%', 'fas fa-chart-line', 'info');
            ?>
        </div>
        
        <div class="row mb-4">
            <!-- Template Categories -->
            <div class="col-md-8">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Industry Template Categories</h5>
                        <div class="btn-group">
                            <button class="btn btn-outline-secondary btn-sm active" onclick="showCategory('all')">
                                All Templates
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" onclick="showCategory('modeling')">
                                Modeling
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" onclick="showCategory('creative')">
                                Creative
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" onclick="showCategory('business')">
                                Business
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <!-- Modeling Templates -->
                        <div class="template-category mb-4" id="modeling-templates">
                            <h6 class="fw-bold mb-3">
                                <i class="fas fa-female text-primary me-2"></i> Modeling & Fashion
                            </h6>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <div class="card template-card h-100" style="cursor: pointer;" onclick="viewTemplate('fashion-modeling')">
                                        <div class="card-body">
                                            <div class="d-flex justify-content-between align-items-start mb-2">
                                                <h6 class="card-title mb-0">Fashion Modeling Agency</h6>
                                                <span class="badge bg-success">Popular</span>
                                            </div>
                                            <p class="text-muted small mb-3">Complete marketplace for fashion models, agencies, and brands. Includes casting calls, portfolio management, and booking system.</p>
                                            <div class="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <small class="text-muted">
                                                        <i class="fas fa-users me-1"></i> 8 tenants using
                                                    </small>
                                                </div>
                                                <div class="btn-group btn-group-sm">
                                                    <button class="btn btn-outline-primary" onclick="event.stopPropagation(); editTemplate('fashion-modeling')">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                    <button class="btn btn-outline-success" onclick="event.stopPropagation(); cloneTemplate('fashion-modeling')">
                                                        <i class="fas fa-copy"></i>
                                                    </button>
                                                    <button class="btn btn-outline-info" onclick="event.stopPropagation(); previewTemplate('fashion-modeling')">
                                                        <i class="fas fa-eye"></i>
                                                    </button>
                                                    <button class="btn btn-outline-secondary" onclick="event.stopPropagation(); editSchema('fashion-modeling')">
                                                        <i class="fas fa-database"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <div class="card template-card h-100" style="cursor: pointer;" onclick="viewTemplate('fitness-modeling')">
                                        <div class="card-body">
                                            <div class="d-flex justify-content-between align-items-start mb-2">
                                                <h6 class="card-title mb-0">Fitness & Athletic Models</h6>
                                                <span class="badge bg-info">Active</span>
                                            </div>
                                            <p class="text-muted small mb-3">Specialized platform for fitness models, athletes, and sports brands. Features body composition tracking and athletic achievements.</p>
                                            <div class="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <small class="text-muted">
                                                        <i class="fas fa-users me-1"></i> 3 tenants using
                                                    </small>
                                                </div>
                                                <div class="btn-group btn-group-sm">
                                                    <button class="btn btn-outline-primary" onclick="event.stopPropagation(); editTemplate('fitness-modeling')">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                    <button class="btn btn-outline-success" onclick="event.stopPropagation(); cloneTemplate('fitness-modeling')">
                                                        <i class="fas fa-copy"></i>
                                                    </button>
                                                    <button class="btn btn-outline-info" onclick="event.stopPropagation(); previewTemplate('fitness-modeling')">
                                                        <i class="fas fa-eye"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <div class="card template-card h-100" style="cursor: pointer;" onclick="viewTemplate('plus-size-modeling')">
                                        <div class="card-body">
                                            <div class="d-flex justify-content-between align-items-start mb-2">
                                                <h6 class="card-title mb-0">Plus Size Modeling</h6>
                                                <span class="badge bg-warning">Growing</span>
                                            </div>
                                            <p class="text-muted small mb-3">Inclusive platform for plus-size models and body-positive brands. Emphasizes diversity and representation.</p>
                                            <div class="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <small class="text-muted">
                                                        <i class="fas fa-users me-1"></i> 2 tenants using
                                                    </small>
                                                </div>
                                                <div class="btn-group btn-group-sm">
                                                    <button class="btn btn-outline-primary" onclick="event.stopPropagation(); editTemplate('plus-size-modeling')">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                    <button class="btn btn-outline-success" onclick="event.stopPropagation(); cloneTemplate('plus-size-modeling')">
                                                        <i class="fas fa-copy"></i>
                                                    </button>
                                                    <button class="btn btn-outline-info" onclick="event.stopPropagation(); previewTemplate('plus-size-modeling')">
                                                        <i class="fas fa-eye"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <div class="card template-card h-100" style="cursor: pointer;" onclick="viewTemplate('kids-modeling')">
                                        <div class="card-body">
                                            <div class="d-flex justify-content-between align-items-start mb-2">
                                                <h6 class="card-title mb-0">Kids & Teen Modeling</h6>
                                                <span class="badge bg-secondary">Specialized</span>
                                            </div>
                                            <p class="text-muted small mb-3">Child-safe platform with enhanced parental controls and specialized workflows for young talent.</p>
                                            <div class="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <small class="text-muted">
                                                        <i class="fas fa-users me-1"></i> 1 tenant using
                                                    </small>
                                                </div>
                                                <div class="btn-group btn-group-sm">
                                                    <button class="btn btn-outline-primary" onclick="event.stopPropagation(); editTemplate('kids-modeling')">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                    <button class="btn btn-outline-success" onclick="event.stopPropagation(); cloneTemplate('kids-modeling')">
                                                        <i class="fas fa-copy"></i>
                                                    </button>
                                                    <button class="btn btn-outline-info" onclick="event.stopPropagation(); previewTemplate('kids-modeling')">
                                                        <i class="fas fa-eye"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Creative Templates -->
                        <div class="template-category mb-4" id="creative-templates">
                            <h6 class="fw-bold mb-3">
                                <i class="fas fa-camera text-success me-2"></i> Creative & Media
                            </h6>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <div class="card template-card h-100" style="cursor: pointer;" onclick="viewTemplate('photography')">
                                        <div class="card-body">
                                            <div class="d-flex justify-content-between align-items-start mb-2">
                                                <h6 class="card-title mb-0">Photography Network</h6>
                                                <span class="badge bg-success">Popular</span>
                                            </div>
                                            <p class="text-muted small mb-3">Professional network for photographers, models, and clients. Portfolio showcase and booking management.</p>
                                            <div class="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <small class="text-muted">
                                                        <i class="fas fa-users me-1"></i> 5 tenants using
                                                    </small>
                                                </div>
                                                <div class="btn-group btn-group-sm">
                                                    <button class="btn btn-outline-primary" onclick="event.stopPropagation(); editTemplate('photography')">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                    <button class="btn btn-outline-success" onclick="event.stopPropagation(); cloneTemplate('photography')">
                                                        <i class="fas fa-copy"></i>
                                                    </button>
                                                    <button class="btn btn-outline-info" onclick="event.stopPropagation(); previewTemplate('photography')">
                                                        <i class="fas fa-eye"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <div class="card template-card h-100" style="cursor: pointer;" onclick="viewTemplate('voice-talent')">
                                        <div class="card-body">
                                            <div class="d-flex justify-content-between align-items-start mb-2">
                                                <h6 class="card-title mb-0">Voice Talent Hub</h6>
                                                <span class="badge bg-info">Growing</span>
                                            </div>
                                            <p class="text-muted small mb-3">Marketplace for voice actors, dubbing artists, and audio professionals. Audio portfolio and demo management.</p>
                                            <div class="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <small class="text-muted">
                                                        <i class="fas fa-users me-1"></i> 2 tenants using
                                                    </small>
                                                </div>
                                                <div class="btn-group btn-group-sm">
                                                    <button class="btn btn-outline-primary" onclick="event.stopPropagation(); editTemplate('voice-talent')">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                    <button class="btn btn-outline-success" onclick="event.stopPropagation(); cloneTemplate('voice-talent')">
                                                        <i class="fas fa-copy"></i>
                                                    </button>
                                                    <button class="btn btn-outline-info" onclick="event.stopPropagation(); previewTemplate('voice-talent')">
                                                        <i class="fas fa-eye"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Business Templates -->
                        <div class="template-category mb-4" id="business-templates">
                            <h6 class="fw-bold mb-3">
                                <i class="fas fa-briefcase text-warning me-2"></i> Business & Services
                            </h6>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <div class="card template-card h-100" style="cursor: pointer;" onclick="viewTemplate('freelance-marketplace')">
                                        <div class="card-body">
                                            <div class="d-flex justify-content-between align-items-start mb-2">
                                                <h6 class="card-title mb-0">Freelance Marketplace</h6>
                                                <span class="badge bg-primary">Versatile</span>
                                            </div>
                                            <p class="text-muted small mb-3">General freelance platform template. Customizable for any service-based marketplace.</p>
                                            <div class="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <small class="text-muted">
                                                        <i class="fas fa-users me-1"></i> 4 tenants using
                                                    </small>
                                                </div>
                                                <div class="btn-group btn-group-sm">
                                                    <button class="btn btn-outline-primary" onclick="event.stopPropagation(); editTemplate('freelance-marketplace')">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                    <button class="btn btn-outline-success" onclick="event.stopPropagation(); cloneTemplate('freelance-marketplace')">
                                                        <i class="fas fa-copy"></i>
                                                    </button>
                                                    <button class="btn btn-outline-info" onclick="event.stopPropagation(); previewTemplate('freelance-marketplace')">
                                                        <i class="fas fa-eye"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <div class="card template-card h-100" style="cursor: pointer;" onclick="viewTemplate('talent-agency')">
                                        <div class="card-body">
                                            <div class="d-flex justify-content-between align-items-start mb-2">
                                                <h6 class="card-title mb-0">Talent Agency</h6>
                                                <span class="badge bg-info">Professional</span>
                                            </div>
                                            <p class="text-muted small mb-3">Full-featured talent management platform for agencies and representation.</p>
                                            <div class="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <small class="text-muted">
                                                        <i class="fas fa-users me-1"></i> 1 tenant using
                                                    </small>
                                                </div>
                                                <div class="btn-group btn-group-sm">
                                                    <button class="btn btn-outline-primary" onclick="event.stopPropagation(); editTemplate('talent-agency')">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                    <button class="btn btn-outline-success" onclick="event.stopPropagation(); cloneTemplate('talent-agency')">
                                                        <i class="fas fa-copy"></i>
                                                    </button>
                                                    <button class="btn btn-outline-info" onclick="event.stopPropagation(); previewTemplate('talent-agency')">
                                                        <i class="fas fa-eye"></i>
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
            </div>
            
            <!-- Template Management -->
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Template Actions</h5>
                    </div>
                    <div class="card-body">
                        <div class="d-grid gap-2 mb-3">
                            <button class="btn btn-primary" onclick="createNewTemplate()">
                                <i class="fas fa-plus me-2"></i> Create New Template
                            </button>
                            <button class="btn btn-outline-secondary" onclick="importTemplate()">
                                <i class="fas fa-upload me-2"></i> Import Template
                            </button>
                            <button class="btn btn-outline-info" onclick="exportTemplates()">
                                <i class="fas fa-download me-2"></i> Export All Templates
                            </button>
                            <a href="template-builder.php" class="btn btn-outline-warning">
                                <i class="fas fa-tools me-2"></i> Template Builder
                            </a>
                        </div>
                        
                        <hr>
                        
                        <h6>Template Analytics</h6>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <small>Most Used Template</small>
                                <small class="fw-bold">Fashion Modeling</small>
                            </div>
                            <div class="progress mb-2" style="height: 4px;">
                                <div class="progress-bar bg-primary" style="width: 85%"></div>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <small>Template Adoption Rate</small>
                                <small class="fw-bold">87%</small>
                            </div>
                            <div class="progress mb-2" style="height: 4px;">
                                <div class="progress-bar bg-success" style="width: 87%"></div>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <small>Customization Rate</small>
                                <small class="fw-bold">73%</small>
                            </div>
                            <div class="progress mb-2" style="height: 4px;">
                                <div class="progress-bar bg-info" style="width: 73%"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card mt-3">
                    <div class="card-header">
                        <h5 class="mb-0">Template Features</h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <strong class="d-block small">Included in Templates</strong>
                            <div class="mt-2">
                                <span class="badge bg-light text-dark me-1 mb-1">User Management</span>
                                <span class="badge bg-light text-dark me-1 mb-1">Portfolio System</span>
                                <span class="badge bg-light text-dark me-1 mb-1">Schema Builder</span>
                                <span class="badge bg-light text-dark me-1 mb-1">Option Sets</span>
                                <span class="badge bg-light text-dark me-1 mb-1">Booking Management</span>
                                <span class="badge bg-light text-dark me-1 mb-1">Payment Processing</span>
                                <span class="badge bg-light text-dark me-1 mb-1">Messaging System</span>
                                <span class="badge bg-light text-dark me-1 mb-1">Search & Filters</span>
                                <span class="badge bg-light text-dark me-1 mb-1">Analytics Dashboard</span>
                                <span class="badge bg-light text-dark me-1 mb-1">Mobile Responsive</span>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <strong class="d-block small">Optional Add-ons</strong>
                            <div class="mt-2">
                                <span class="badge bg-warning me-1 mb-1">AI Matching</span>
                                <span class="badge bg-warning me-1 mb-1">Video Calls</span>
                                <span class="badge bg-warning me-1 mb-1">Advanced Analytics</span>
                                <span class="badge bg-warning me-1 mb-1">Multi-language</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card mt-3">
                    <div class="card-header">
                        <h5 class="mb-0">Recent Activity</h5>
                    </div>
                    <div class="card-body">
                        <div class="timeline">
                            <div class="d-flex mb-3">
                                <div class="bg-success rounded-circle me-3" style="width: 8px; height: 8px; margin-top: 6px;"></div>
                                <div class="flex-grow-1">
                                    <small class="fw-bold">New Template: "Pet Models"</small><br>
                                    <small class="text-muted">Created by Admin User</small><br>
                                    <small class="text-muted">2 hours ago</small>
                                </div>
                            </div>
                            <div class="d-flex mb-3">
                                <div class="bg-info rounded-circle me-3" style="width: 8px; height: 8px; margin-top: 6px;"></div>
                                <div class="flex-grow-1">
                                    <small class="fw-bold">Updated: "Fashion Modeling"</small><br>
                                    <small class="text-muted">Enhanced portfolio features</small><br>
                                    <small class="text-muted">1 day ago</small>
                                </div>
                            </div>
                            <div class="d-flex mb-3">
                                <div class="bg-warning rounded-circle me-3" style="width: 8px; height: 8px; margin-top: 6px;"></div>
                                <div class="flex-grow-1">
                                    <small class="fw-bold">Template Used: "Voice Talent"</small><br>
                                    <small class="text-muted">By Voice Pros Network</small><br>
                                    <small class="text-muted">3 days ago</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Templates Table -->
        <?php
        $headers = ['Template', 'Industry', 'Status', 'Installs', 'Last Updated', 'Actions'];
        $rows = [
            ['Fashion Modeling Pro', 'Fashion', '<span class="badge bg-success">Active</span>', '12', '2 days ago'],
            ['Fitness Hub Template', 'Sports', '<span class="badge bg-success">Active</span>', '8', '1 week ago'],
            ['Voice Talent Network', 'Audio', '<span class="badge bg-success">Active</span>', '6', '3 days ago'],
            ['Photography Marketplace', 'Creative', '<span class="badge bg-success">Active</span>', '9', '5 days ago'],
            ['Pet Modeling Template', 'Animals', '<span class="badge bg-success">Active</span>', '4', '1 week ago'],
            ['Child Talent Template', 'Entertainment', '<span class="badge bg-warning">Beta</span>', '2', '2 weeks ago'],
            ['Dance Academy Pro', 'Entertainment', '<span class="badge bg-success">Active</span>', '3', '1 week ago'],
            ['Creative Directors Hub', 'Creative', '<span class="badge bg-info">Development</span>', '0', '3 weeks ago']
        ];
        echo createDataTable('All Industry Templates', $headers, $rows);
        ?>
    </div>
</div>

<!-- Template Management Modals -->
<div class="modal fade" id="createTemplateModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Create New Industry Template</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form id="createTemplateForm">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Template Name</label>
                                <input type="text" class="form-control" placeholder="e.g., Fashion Modeling Agency">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Category</label>
                                <select class="form-select">
                                    <option value="modeling">Modeling & Fashion</option>
                                    <option value="creative">Creative & Media</option>
                                    <option value="business">Business & Services</option>
                                    <option value="entertainment">Entertainment</option>
                                    <option value="custom">Custom Category</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Industry</label>
                                <input type="text" class="form-control" placeholder="e.g., Fashion, Photography, Voice Acting">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Template Description</label>
                                <textarea class="form-control" rows="4" placeholder="Describe the template's purpose and ideal use cases..."></textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Target Audience</label>
                                <input type="text" class="form-control" placeholder="e.g., Fashion agencies, Independent models">
                            </div>
                        </div>
                    </div>
                    
                    <hr>
                    
                    <h6 class="mb-3">Template Features</h6>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-2">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="feature-portfolio" checked>
                                    <label class="form-check-label" for="feature-portfolio">Portfolio Management</label>
                                </div>
                            </div>
                            <div class="mb-2">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="feature-booking" checked>
                                    <label class="form-check-label" for="feature-booking">Booking System</label>
                                </div>
                            </div>
                            <div class="mb-2">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="feature-payments" checked>
                                    <label class="form-check-label" for="feature-payments">Payment Processing</label>
                                </div>
                            </div>
                            <div class="mb-2">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="feature-messaging">
                                    <label class="form-check-label" for="feature-messaging">Messaging System</label>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-2">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="feature-analytics">
                                    <label class="form-check-label" for="feature-analytics">Analytics Dashboard</label>
                                </div>
                            </div>
                            <div class="mb-2">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="feature-mobile" checked>
                                    <label class="form-check-label" for="feature-mobile">Mobile Responsive</label>
                                </div>
                            </div>
                            <div class="mb-2">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="feature-search" checked>
                                    <label class="form-check-label" for="feature-search">Advanced Search</label>
                                </div>
                            </div>
                            <div class="mb-2">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="feature-ai">
                                    <label class="form-check-label" for="feature-ai">AI-Powered Matching</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary">Create Template</button>
            </div>
        </div>
    </div>
</div>

<script>
function createNewTemplate() {
    new bootstrap.Modal(document.getElementById('createTemplateModal')).show();
}

function viewTemplate(templateId) {
    window.location.href = 'template-view.php?id=' + templateId;
}

function editTemplate(templateId) {
    window.location.href = 'template-builder.php?id=' + templateId;
}

function cloneTemplate(templateId) {
    alert('Clone Template: ' + templateId + '\n\nThis would create a copy of the template for customization:\n- Duplicate all configurations\n- Reset usage statistics\n- Allow renaming\n- Maintain feature compatibility');
}

function previewTemplate(templateId) {
    alert('Preview Template: ' + templateId + '\n\nThis would open a live preview showing:\n- User interface design\n- Navigation flow\n- Feature demonstrations\n- Mobile responsiveness\n- Sample data');
}

function importTemplate() {
    alert('Import Template\n\nThis would allow importing templates from:\n- JSON configuration files\n- Other itellico instances\n- Third-party templates\n- Template marketplace');
}

function exportTemplates() {
    alert('Export Templates\n\nThis would generate:\n- Complete template configurations\n- Feature mappings\n- Usage analytics\n- Implementation guides\n- JSON/ZIP format');
}

function templateBuilder() {
    window.location.href = 'template-builder.php';
}

function editSchema(templateId) {
    // Redirect to schema builder with template context
    window.location.href = '../schemas/schema-builder.php?template=' + templateId;
}

function showCategory(category) {
    // Update active button
    document.querySelectorAll('.btn-group .btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Show/hide template categories
    const categories = document.querySelectorAll('.template-category');
    if (category === 'all') {
        categories.forEach(cat => cat.style.display = 'block');
    } else {
        categories.forEach(cat => {
            cat.style.display = cat.id.includes(category) ? 'block' : 'none';
        });
    }
}

// Add hover effects to template cards
document.addEventListener('DOMContentLoaded', function() {
    const templateCards = document.querySelectorAll('.template-card');
    templateCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px)';
            this.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
            this.style.transition = 'all 0.3s ease';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '';
        });
    });
});
</script>

<?php echo renderFooter(); ?>