<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Documentation - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'docs/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Documentation']
        ]);
        
        echo createHeroSection(
            "Platform Documentation",
            "Comprehensive documentation and guides for the itellico Mono platform",
            "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&h=300&fit=crop",
            [
                ['label' => 'Create Article', 'icon' => 'fas fa-plus', 'style' => 'primary'],
                ['label' => 'Generate Docs', 'icon' => 'fas fa-cog', 'style' => 'light']
            ]
        );
        ?>
        
        <!-- Documentation Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Total Articles', '156', 'fas fa-file-alt', 'primary');
            echo createStatCard('API Endpoints', '147', 'fas fa-code', 'success');
            echo createStatCard('Monthly Views', '12.3K', 'fas fa-eye', 'info');
            echo createStatCard('Contributors', '8', 'fas fa-users', 'warning');
            ?>
        </div>
        
        <!-- Documentation Categories -->
        <div class="row mb-4">
            <div class="col-md-4">
                <div class="card h-100">
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-3">
                            <i class="fas fa-rocket fa-2x text-primary me-3"></i>
                            <div>
                                <h5 class="card-title mb-1">Getting Started</h5>
                                <p class="text-muted small mb-0">Setup guides and quick start tutorials</p>
                            </div>
                        </div>
                        <div class="mb-3">
                            <span class="badge bg-primary me-1">12 Articles</span>
                            <span class="badge bg-success">Complete</span>
                        </div>
                        <ul class="list-unstyled small">
                            <li><i class="fas fa-check text-success me-2"></i> Platform Installation</li>
                            <li><i class="fas fa-check text-success me-2"></i> Initial Configuration</li>
                            <li><i class="fas fa-check text-success me-2"></i> First Tenant Setup</li>
                            <li><i class="fas fa-check text-success me-2"></i> API Quick Start</li>
                        </ul>
                        <button class="btn btn-outline-primary btn-sm w-100">View Section</button>
                    </div>
                </div>
            </div>
            
            <div class="col-md-4">
                <div class="card h-100">
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-3">
                            <i class="fas fa-code fa-2x text-success me-3"></i>
                            <div>
                                <h5 class="card-title mb-1">API Reference</h5>
                                <p class="text-muted small mb-0">Complete API documentation and examples</p>
                            </div>
                        </div>
                        <div class="mb-3">
                            <span class="badge bg-success me-1">87 Endpoints</span>
                            <span class="badge bg-info">Auto-generated</span>
                        </div>
                        <ul class="list-unstyled small">
                            <li><i class="fas fa-check text-success me-2"></i> Authentication APIs</li>
                            <li><i class="fas fa-check text-success me-2"></i> User Management</li>
                            <li><i class="fas fa-check text-success me-2"></i> Project APIs</li>
                            <li><i class="fas fa-check text-success me-2"></i> Analytics APIs</li>
                        </ul>
                        <button class="btn btn-outline-success btn-sm w-100">View API Docs</button>
                    </div>
                </div>
            </div>
            
            <div class="col-md-4">
                <div class="card h-100">
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-3">
                            <i class="fas fa-cogs fa-2x text-info me-3"></i>
                            <div>
                                <h5 class="card-title mb-1">Administration</h5>
                                <p class="text-muted small mb-0">Platform management and configuration guides</p>
                            </div>
                        </div>
                        <div class="mb-3">
                            <span class="badge bg-info me-1">34 Articles</span>
                            <span class="badge bg-warning">In Progress</span>
                        </div>
                        <ul class="list-unstyled small">
                            <li><i class="fas fa-check text-success me-2"></i> Tenant Management</li>
                            <li><i class="fas fa-check text-success me-2"></i> User Permissions</li>
                            <li><i class="fas fa-clock text-warning me-2"></i> Schema Configuration</li>
                            <li><i class="fas fa-clock text-warning me-2"></i> Advanced Monitoring</li>
                        </ul>
                        <button class="btn btn-outline-info btn-sm w-100">View Section</button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Recent Documentation -->
        <?php
        $headers = ['Title', 'Category', 'Author', 'Status', 'Views', 'Last Updated', 'Actions'];
        $rows = [
            ['5-Tier Architecture Guide', 'Getting Started', 'Platform Team', '<span class="badge bg-success">Published</span>', '2,341', '2 days ago'],
            ['API Authentication Methods', 'API Reference', 'Dev Team', '<span class="badge bg-success">Published</span>', '1,876', '1 week ago'],
            ['Tenant Configuration Guide', 'Administration', 'Platform Team', '<span class="badge bg-success">Published</span>', '1,432', '3 days ago'],
            ['Schema Builder Tutorial', 'Administration', 'Dev Team', '<span class="badge bg-warning">Draft</span>', '89', '5 days ago'],
            ['Multi-Tenant Best Practices', 'Getting Started', 'Platform Team', '<span class="badge bg-success">Published</span>', '987', '1 week ago'],
            ['API Rate Limiting Guide', 'API Reference', 'Dev Team', '<span class="badge bg-success">Published</span>', '543', '4 days ago'],
            ['Monitoring Setup Guide', 'Administration', 'Platform Team', '<span class="badge bg-info">Review</span>', '234', '2 weeks ago'],
            ['Security Best Practices', 'Administration', 'Security Team', '<span class="badge bg-warning">Draft</span>', '67', '3 weeks ago']
        ];
        echo createDataTable('Documentation Articles', $headers, $rows);
        ?>
    </div>
</div>

<?php echo renderFooter(); ?>