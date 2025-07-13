<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Casting Calls - Go Models NYC", "Admin User", "Marketplace Admin", "Tenant");
?>

<div class="d-flex">
    <?php echo renderSidebar('Tenant', getTenantSidebarItems(), 'castings/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Tenant', 'href' => '../index.php'],
            ['label' => 'Casting Calls']
        ]);
        
        echo createHeroSection(
            "Casting Calls Management",
            "Create and manage casting calls for clients and talent opportunities",
            "https://images.unsplash.com/photo-1516975471617-69dfe0e17d5f?w=1200&h=300&fit=crop",
            [
                ['label' => 'Create Casting', 'icon' => 'fas fa-plus', 'style' => 'primary'],
                ['label' => 'View Applications', 'icon' => 'fas fa-file-alt', 'style' => 'info'],
                ['label' => 'Send Invites', 'icon' => 'fas fa-envelope', 'style' => 'success']
            ]
        );
        ?>
        
        <!-- Casting Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Active Castings', '17', 'fas fa-bullhorn', 'primary');
            echo createStatCard('Total Applications', '1,247', 'fas fa-file-alt', 'success');
            echo createStatCard('Closing Soon', '3', 'fas fa-clock', 'warning');
            echo createStatCard('This Month', '24', 'fas fa-calendar', 'info');
            ?>
        </div>
        
        <!-- Filter Bar -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-body">
                        <form class="row g-3">
                            <div class="col-md-3">
                                <input type="text" class="form-control" placeholder="Search castings...">
                            </div>
                            <div class="col-md-2">
                                <select class="form-select">
                                    <option>All Status</option>
                                    <option>Active</option>
                                    <option>Closing Soon</option>
                                    <option>Closed</option>
                                    <option>Draft</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <select class="form-select">
                                    <option>All Categories</option>
                                    <option>Fashion</option>
                                    <option>Commercial</option>
                                    <option>Editorial</option>
                                    <option>Runway</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <select class="form-select">
                                    <option>All Clients</option>
                                    <option>Vogue Magazine</option>
                                    <option>Nike Inc.</option>
                                    <option>H&M Fashion</option>
                                    <option>Zara</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <input type="date" class="form-control">
                            </div>
                            <div class="col-md-1">
                                <button type="submit" class="btn btn-primary w-100">
                                    <i class="fas fa-search"></i>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Active Castings -->
        <div class="row">
            <div class="col-12">
                <?php
                $castingHeaders = ['Casting Call', 'Client', 'Type', 'Deadline', 'Applications', 'Status', 'Fee'];
                $castingRows = [
                    [
                        '<strong>Vogue Summer 2024 Campaign</strong><br><small class="text-muted">High-fashion editorial shoot</small>',
                        '<div class="d-flex align-items-center"><img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=30&h=30&fit=crop" class="rounded me-2" style="width: 30px; height: 30px;"><strong>Vogue Magazine</strong></div>',
                        '<span class="badge bg-info">Editorial</span>',
                        '<strong>Dec 15, 2024</strong><br><small class="text-muted">5 days left</small>',
                        '<strong>247</strong><br><small class="text-success">+12 today</small>',
                        '<span class="badge bg-success">Active</span>',
                        '<strong>$2,500</strong><br><small class="text-muted">per model</small>'
                    ],
                    [
                        '<strong>Nike Athletic Campaign</strong><br><small class="text-muted">Sports and athletic wear commercial</small>',
                        '<div class="d-flex align-items-center"><img src="https://images.unsplash.com/photo-1556906781-9a412961c28c?w=30&h=30&fit=crop" class="rounded me-2" style="width: 30px; height: 30px;"><strong>Nike Inc.</strong></div>',
                        '<span class="badge bg-warning text-dark">Commercial</span>',
                        '<strong>Dec 18, 2024</strong><br><small class="text-muted">8 days left</small>',
                        '<strong>189</strong><br><small class="text-success">+8 today</small>',
                        '<span class="badge bg-success">Active</span>',
                        '<strong>$3,200</strong><br><small class="text-muted">per model</small>'
                    ],
                    [
                        '<strong>H&M Fall Collection</strong><br><small class="text-muted">Casual wear lookbook</small>',
                        '<div class="d-flex align-items-center"><img src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=30&h=30&fit=crop" class="rounded me-2" style="width: 30px; height: 30px;"><strong>H&M Fashion</strong></div>',
                        '<span class="badge bg-primary">Fashion</span>',
                        '<strong>Dec 12, 2024</strong><br><small class="text-warning">2 days left</small>',
                        '<strong>156</strong><br><small class="text-success">+5 today</small>',
                        '<span class="badge bg-warning text-dark">Closing Soon</span>',
                        '<strong>$1,800</strong><br><small class="text-muted">per model</small>'
                    ],
                    [
                        '<strong>Zara Commercial Shoot</strong><br><small class="text-muted">Spring collection commercial</small>',
                        '<div class="d-flex align-items-center"><img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=30&h=30&fit=crop" class="rounded me-2" style="width: 30px; height: 30px;"><strong>Zara Fashion</strong></div>',
                        '<span class="badge bg-warning text-dark">Commercial</span>',
                        '<strong>Dec 20, 2024</strong><br><small class="text-muted">10 days left</small>',
                        '<strong>203</strong><br><small class="text-success">+15 today</small>',
                        '<span class="badge bg-success">Active</span>',
                        '<strong>$2,200</strong><br><small class="text-muted">per model</small>'
                    ],
                    [
                        '<strong>Elle Editorial Feature</strong><br><small class="text-muted">Luxury fashion spread</small>',
                        '<div class="d-flex align-items-center"><img src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=30&h=30&fit=crop" class="rounded me-2" style="width: 30px; height: 30px;"><strong>Elle Magazine</strong></div>',
                        '<span class="badge bg-info">Editorial</span>',
                        '<strong>Dec 10, 2024</strong><br><small class="text-danger">Closed</small>',
                        '<strong>91</strong><br><small class="text-muted">Final count</small>',
                        '<span class="badge bg-danger">Closed</span>',
                        '<strong>$2,800</strong><br><small class="text-muted">per model</small>'
                    ]
                ];
                echo createDataTable('All Casting Calls', $castingHeaders, $castingRows, true);
                ?>
            </div>
        </div>
        
        <!-- Bottom Section -->
        <div class="row mt-4">
            <div class="col-md-4">
                <?php echo createCard(
                    "Quick Actions",
                    '
                    <div class="d-grid gap-2">
                        <button class="btn btn-primary">
                            <i class="fas fa-plus me-2"></i> Create New Casting
                        </button>
                        <button class="btn btn-success">
                            <i class="fas fa-envelope me-2"></i> Send Invitations
                        </button>
                        <button class="btn btn-info">
                            <i class="fas fa-file-alt me-2"></i> Review Applications
                        </button>
                        <button class="btn btn-warning">
                            <i class="fas fa-clock me-2"></i> Extend Deadlines
                        </button>
                    </div>
                    '
                ); ?>
            </div>
            <div class="col-md-8">
                <?php echo createCard(
                    "Casting Performance",
                    '
                    <div class="row text-center">
                        <div class="col-md-3">
                            <h4 class="text-primary">247</h4>
                            <small class="text-muted">Avg Applications</small>
                        </div>
                        <div class="col-md-3">
                            <h4 class="text-success">3.2</h4>
                            <small class="text-muted">Days to Fill</small>
                        </div>
                        <div class="col-md-3">
                            <h4 class="text-info">$2,460</h4>
                            <small class="text-muted">Avg Rate</small>
                        </div>
                        <div class="col-md-3">
                            <h4 class="text-warning">94%</h4>
                            <small class="text-muted">Success Rate</small>
                        </div>
                    </div>
                    <hr>
                    <div class="mb-3">
                        <div class="d-flex justify-content-between">
                            <span class="small">Application Response Rate</span>
                            <span class="fw-bold">89%</span>
                        </div>
                        <div class="progress" style="height: 6px;">
                            <div class="progress-bar bg-success" style="width: 89%"></div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="d-flex justify-content-between">
                            <span class="small">Client Satisfaction</span>
                            <span class="fw-bold">96%</span>
                        </div>
                        <div class="progress" style="height: 6px;">
                            <div class="progress-bar bg-primary" style="width: 96%"></div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="d-flex justify-content-between">
                            <span class="small">On-Time Completion</span>
                            <span class="fw-bold">92%</span>
                        </div>
                        <div class="progress" style="height: 6px;">
                            <div class="progress-bar bg-info" style="width: 92%"></div>
                        </div>
                    </div>
                    '
                ); ?>
            </div>
        </div>
    </div>
</div>

<?php echo renderFooter(); ?>