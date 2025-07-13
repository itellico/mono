<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Multi-Brand Platform Manager", "Platform Admin", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'brands/brand-manager.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Multi-Brand Platform Manager']
        ]);
        ?>
        
        <!-- Header Section -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h2 class="mb-1">Multi-Brand Platform Manager</h2>
                <p class="text-muted mb-0">Manage all brands across the platform</p>
            </div>
            <button class="btn btn-primary">
                <i class="fas fa-plus me-2"></i> Create New Brand
            </button>
        </div>

        <!-- Platform Overview -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Active Brands', '3', 'fas fa-building', 'primary');
            echo createStatCard('Total Users', '1,247', 'fas fa-users', 'success');
            echo createStatCard('Active Gigs', '89', 'fas fa-briefcase', 'info');
            echo createStatCard('Monthly Revenue', '€12,450', 'fas fa-euro-sign', 'warning');
            ?>
        </div>

        <!-- Active Brands -->
        <div class="mb-4">
            <h3 class="mb-3">Active Brands</h3>
            <div class="row g-4">
                <!-- Go Models Brand -->
                <div class="col-lg-4">
                    <div class="card h-100">
                        <div class="card-body">
                            <div class="d-flex align-items-center mb-3">
                                <div class="bg-primary rounded-circle d-flex align-items-center justify-center me-3" style="width: 48px; height: 48px;">
                                    <span class="text-white fw-bold">GM</span>
                                </div>
                                <div class="flex-grow-1">
                                    <h5 class="card-title mb-0">go-models.com</h5>
                                    <small class="text-muted">Modeling Industry</small>
                                </div>
                                <span class="badge bg-success">Active</span>
                            </div>
                            <div class="mb-3">
                                <div class="d-flex justify-content-between small mb-1">
                                    <span class="text-muted">Total Users:</span>
                                    <span class="fw-bold">847</span>
                                </div>
                                <div class="d-flex justify-content-between small mb-1">
                                    <span class="text-muted">Active Gigs:</span>
                                    <span class="fw-bold">34</span>
                                </div>
                                <div class="d-flex justify-content-between small">
                                    <span class="text-muted">Monthly Revenue:</span>
                                    <span class="fw-bold">€8,200</span>
                                </div>
                            </div>
                            <div class="d-grid gap-2 d-md-flex">
                                <button class="btn btn-primary btn-sm flex-fill">Manage</button>
                                <button class="btn btn-outline-secondary btn-sm flex-fill">Analytics</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Go Pets Brand -->
                <div class="col-lg-4">
                    <div class="card h-100">
                        <div class="card-body">
                            <div class="d-flex align-items-center mb-3">
                                <div class="bg-success rounded-circle d-flex align-items-center justify-center me-3" style="width: 48px; height: 48px;">
                                    <span class="text-white fw-bold">GP</span>
                                </div>
                                <div class="flex-grow-1">
                                    <h5 class="card-title mb-0">go-pets.com</h5>
                                    <small class="text-muted">Pet Industry</small>
                                </div>
                                <span class="badge bg-success">Active</span>
                            </div>
                            <div class="mb-3">
                                <div class="d-flex justify-content-between small mb-1">
                                    <span class="text-muted">Total Users:</span>
                                    <span class="fw-bold">312</span>
                                </div>
                                <div class="d-flex justify-content-between small mb-1">
                                    <span class="text-muted">Active Gigs:</span>
                                    <span class="fw-bold">18</span>
                                </div>
                                <div class="d-flex justify-content-between small">
                                    <span class="text-muted">Monthly Revenue:</span>
                                    <span class="fw-bold">€2,800</span>
                                </div>
                            </div>
                            <div class="d-grid gap-2 d-md-flex">
                                <button class="btn btn-primary btn-sm flex-fill">Manage</button>
                                <button class="btn btn-outline-secondary btn-sm flex-fill">Analytics</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Voice Agents Brand -->
                <div class="col-lg-4">
                    <div class="card h-100">
                        <div class="card-body">
                            <div class="d-flex align-items-center mb-3">
                                <div class="bg-primary rounded-circle d-flex align-items-center justify-center me-3" style="width: 48px; height: 48px;">
                                    <span class="text-white fw-bold">VA</span>
                                </div>
                                <div class="flex-grow-1">
                                    <h5 class="card-title mb-0">voice-agents.com</h5>
                                    <small class="text-muted">AI Voice Industry</small>
                                </div>
                                <span class="badge bg-warning">Beta</span>
                            </div>
                            <div class="mb-3">
                                <div class="d-flex justify-content-between small mb-1">
                                    <span class="text-muted">Total Users:</span>
                                    <span class="fw-bold">88</span>
                                </div>
                                <div class="d-flex justify-content-between small mb-1">
                                    <span class="text-muted">Active Gigs:</span>
                                    <span class="fw-bold">37</span>
                                </div>
                                <div class="d-flex justify-content-between small">
                                    <span class="text-muted">Monthly Revenue:</span>
                                    <span class="fw-bold">€1,450</span>
                                </div>
                            </div>
                            <div class="d-grid gap-2 d-md-flex">
                                <button class="btn btn-primary btn-sm flex-fill">Manage</button>
                                <button class="btn btn-outline-secondary btn-sm flex-fill">Analytics</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        <!-- Cross-Brand Features -->
        <div class="mb-4">
            <h3 class="mb-3">Cross-Brand Management</h3>
            <div class="row g-4">
                <div class="col-md-6">
                    <div class="card h-100">
                        <div class="card-body">
                            <h5 class="card-title">Data Sharing</h5>
                            <p class="text-muted mb-3">Configure cross-brand data sharing and API integration</p>
                            <div class="mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="small">go-models ↔ voice-agents</span>
                                    <span class="badge bg-success">Enabled</span>
                                </div>
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="small">go-pets ↔ go-models</span>
                                    <span class="badge bg-secondary">Disabled</span>
                                </div>
                            </div>
                            <button class="btn btn-primary w-100">
                                Configure Integrations
                            </button>
                        </div>
                    </div>
                </div>

                <div class="col-md-6">
                    <div class="card h-100">
                        <div class="card-body">
                            <h5 class="card-title">Global Analytics</h5>
                            <p class="text-muted mb-3">Cross-brand performance and user insights</p>
                            <div class="mb-3">
                                <div class="d-flex justify-content-between small mb-1">
                                    <span class="text-muted">Cross-brand users:</span>
                                    <span class="fw-bold">23</span>
                                </div>
                                <div class="d-flex justify-content-between small mb-1">
                                    <span class="text-muted">Multi-industry gigs:</span>
                                    <span class="fw-bold">7</span>
                                </div>
                                <div class="d-flex justify-content-between small">
                                    <span class="text-muted">Platform growth:</span>
                                    <span class="fw-bold text-success">+18%</span>
                                </div>
                            </div>
                            <button class="btn btn-primary w-100">
                                View Full Analytics
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Industry Templates -->
        <div class="mb-4">
            <h3 class="mb-3">Industry Templates</h3>
            <div class="card">
                <div class="card-body">
                    <div class="row g-4">
                        <div class="col-md-4">
                            <div class="border rounded p-3">
                                <h6 class="fw-bold mb-2">Modeling Industry</h6>
                                <p class="small text-muted mb-3">Portfolio, castings, comp cards, guardian management</p>
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="badge bg-success text-white">go-models.com</span>
                                    <button class="btn btn-link btn-sm p-0">Configure</button>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="border rounded p-3">
                                <h6 class="fw-bold mb-2">Pet Industry</h6>
                                <p class="small text-muted mb-3">Pet profiles, shows, training, breeding services</p>
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="badge bg-success text-white">go-pets.com</span>
                                    <button class="btn btn-link btn-sm p-0">Configure</button>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="border rounded p-3">
                                <h6 class="fw-bold mb-2">Voice & AI</h6>
                                <p class="small text-muted mb-3">Voice profiles, demos, AI agents, projects</p>
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="badge bg-warning text-dark">voice-agents.com</span>
                                    <button class="btn btn-link btn-sm p-0">Configure</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <hr class="my-4">
                    <button class="btn btn-success">
                        <i class="fas fa-plus me-2"></i>Create New Industry Template
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include '../../includes/footer.php'; ?>