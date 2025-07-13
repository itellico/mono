<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Schema Builder - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'schemas/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Schema Builder']
        ]);
        
        echo createHeroSection(
            "Schema Builder",
            "Design and manage database schemas for marketplace customization",
            "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=300&fit=crop",
            [
                ['label' => 'Create Schema', 'icon' => 'fas fa-plus', 'style' => 'primary'],
                ['label' => 'Import Schema', 'icon' => 'fas fa-upload', 'style' => 'light']
            ]
        );
        ?>
        
        <!-- Schema Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Active Schemas', '15', 'fas fa-database', 'primary');
            echo createStatCard('Custom Fields', '89', 'fas fa-columns', 'success');
            echo createStatCard('Schema Versions', '23', 'fas fa-code-branch', 'info');
            echo createStatCard('Deployments', '156', 'fas fa-rocket', 'warning');
            ?>
        </div>
        
        <!-- Schema Categories -->
        <div class="row mb-4">
            <div class="col-md-4">
                <div class="card h-100">
                    <div class="card-body text-center">
                        <i class="fas fa-user-tag fa-3x text-primary mb-3"></i>
                        <h5 class="card-title">User Profiles</h5>
                        <p class="text-muted small">Custom fields for different user types and profiles</p>
                        <div class="mb-3">
                            <span class="badge bg-primary me-1">8 Schemas</span>
                            <span class="badge bg-success">34 Fields</span>
                        </div>
                        <a href="schema-builder.php" class="btn btn-outline-info btn-sm w-100">Visual Builder</a>
                    </div>
                </div>
            </div>
            
            <div class="col-md-4">
                <div class="card h-100">
                    <div class="card-body text-center">
                        <i class="fas fa-project-diagram fa-3x text-success mb-3"></i>
                        <h5 class="card-title">Projects & Jobs</h5>
                        <p class="text-muted small">Schema definitions for projects, castings, and job postings</p>
                        <div class="mb-3">
                            <span class="badge bg-primary me-1">4 Schemas</span>
                            <span class="badge bg-success">28 Fields</span>
                        </div>
                        <a href="schema-builder.php" class="btn btn-outline-success btn-sm w-100">Visual Builder</a>
                    </div>
                </div>
            </div>
            
            <div class="col-md-4">
                <div class="card h-100">
                    <div class="card-body text-center">
                        <i class="fas fa-cogs fa-3x text-info mb-3"></i>
                        <h5 class="card-title">System Settings</h5>
                        <p class="text-muted small">Configuration schemas for tenant and platform settings</p>
                        <div class="mb-3">
                            <span class="badge bg-primary me-1">3 Schemas</span>
                            <span class="badge bg-success">27 Fields</span>
                        </div>
                        <a href="schema-builder.php" class="btn btn-outline-primary btn-sm w-100">Visual Builder</a>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Schemas Table -->
        <?php
        $headers = ['Schema Name', 'Category', 'Fields', 'Version', 'Status', 'Last Modified', 'Actions'];
        $rows = [
            ['Model Profile Extended', 'User Profiles', '12', 'v2.1', '<span class="badge bg-success">Active</span>', '2 days ago'],
            ['Photographer Portfolio', 'User Profiles', '8', 'v1.4', '<span class="badge bg-success">Active</span>', '1 week ago'],
            ['Casting Call Schema', 'Projects & Jobs', '15', 'v3.0', '<span class="badge bg-success">Active</span>', '3 days ago'],
            ['Agency Profile', 'User Profiles', '10', 'v1.2', '<span class="badge bg-success">Active</span>', '5 days ago'],
            ['Project Requirements', 'Projects & Jobs', '7', 'v2.0', '<span class="badge bg-success">Active</span>', '1 week ago'],
            ['Tenant Configuration', 'System Settings', '18', 'v1.8', '<span class="badge bg-success">Active</span>', '4 days ago'],
            ['Voice Talent Profile', 'User Profiles', '9', 'v1.0', '<span class="badge bg-warning">Beta</span>', '2 weeks ago'],
            ['Payment Settings', 'System Settings', '6', 'v1.1', '<span class="badge bg-info">Development</span>', '3 weeks ago']
        ];
        echo createDataTable('Database Schemas', $headers, $rows);
        ?>
    </div>
</div>

<?php echo renderFooter(); ?>