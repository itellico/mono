<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Global Resources - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'resources/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Global Resources']
        ]);
        ?>
        
        <!-- Global Resources Header -->
        <div class="bg-primary text-white p-4 rounded mb-4">
            <div class="row align-items-center">
                <div class="col-md-8">
                    <h2 class="mb-2">Global Resources Management</h2>
                    <p class="mb-0 opacity-75">Manage platform-wide resources that can be assigned to industry templates</p>
                </div>
                <div class="col-md-4 text-end">
                    <div class="btn-group">
                        <button class="btn btn-light" onclick="importResources()">
                            <i class="fas fa-upload me-2"></i> Import Resources
                        </button>
                        <button class="btn btn-warning" onclick="exportResources()">
                            <i class="fas fa-download me-2"></i> Export All
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Resource Categories Grid -->
        <div class="row g-4">
            <!-- Option Sets -->
            <div class="col-lg-6">
                <div class="card h-100">
                    <div class="card-header bg-success text-white">
                        <h5 class="mb-0">
                            <i class="fas fa-list-ul me-2"></i>
                            Option Sets
                        </h5>
                    </div>
                    <div class="card-body">
                        <p class="text-muted">Dropdown values for form fields with regional conversion support</p>
                        
                        <div class="row text-center mb-3">
                            <div class="col-4">
                                <div class="h4 text-success" id="optionSetsCount">847</div>
                                <small class="text-muted">Total Options</small>
                            </div>
                            <div class="col-4">
                                <div class="h4 text-info">24</div>
                                <small class="text-muted">Option Sets</small>
                            </div>
                            <div class="col-4">
                                <div class="h4 text-warning">8</div>
                                <small class="text-muted">Languages</small>
                            </div>
                        </div>
                        
                        <ul class="list-unstyled mb-3">
                            <li><i class="fas fa-check text-success me-2"></i> Height/Weight conversions</li>
                            <li><i class="fas fa-check text-success me-2"></i> Clothing sizes (US/UK/EU)</li>
                            <li><i class="fas fa-check text-success me-2"></i> Language translations</li>
                            <li><i class="fas fa-check text-success me-2"></i> Industry-specific values</li>
                        </ul>
                        
                        <div class="d-grid gap-2">
                            <a href="option-sets.php" class="btn btn-success">
                                <i class="fas fa-cog me-2"></i> Manage Option Sets
                            </a>
                            <a href="../options/index.php" class="btn btn-outline-success btn-sm">
                                <i class="fas fa-external-link-alt me-2"></i> Legacy Option Manager
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Categories -->
            <div class="col-lg-6">
                <div class="card h-100">
                    <div class="card-header bg-info text-white">
                        <h5 class="mb-0">
                            <i class="fas fa-folder me-2"></i>
                            Base Categories
                        </h5>
                    </div>
                    <div class="card-body">
                        <p class="text-muted">Hierarchical content organization structure</p>
                        
                        <div class="row text-center mb-3">
                            <div class="col-4">
                                <div class="h4 text-info">156</div>
                                <small class="text-muted">Categories</small>
                            </div>
                            <div class="col-4">
                                <div class="h4 text-success">23</div>
                                <small class="text-muted">Root Categories</small>
                            </div>
                            <div class="col-4">
                                <div class="h4 text-warning">5</div>
                                <small class="text-muted">Max Depth</small>
                            </div>
                        </div>
                        
                        <ul class="list-unstyled mb-3">
                            <li><i class="fas fa-check text-success me-2"></i> Hierarchical structure</li>
                            <li><i class="fas fa-check text-success me-2"></i> Multi-language labels</li>
                            <li><i class="fas fa-check text-success me-2"></i> SEO-friendly slugs</li>
                            <li><i class="fas fa-check text-success me-2"></i> Icon & color coding</li>
                        </ul>
                        
                        <div class="d-grid gap-2">
                            <a href="categories.php" class="btn btn-info">
                                <i class="fas fa-folder-open me-2"></i> Manage Categories
                            </a>
                            <a href="../categories/index.php" class="btn btn-outline-info btn-sm">
                                <i class="fas fa-external-link-alt me-2"></i> Legacy Category Manager
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Tags & Labels -->
            <div class="col-lg-6">
                <div class="card h-100">
                    <div class="card-header bg-warning text-dark">
                        <h5 class="mb-0">
                            <i class="fas fa-tags me-2"></i>
                            Base Tags & Labels
                        </h5>
                    </div>
                    <div class="card-body">
                        <p class="text-muted">Flexible tagging system for content discovery</p>
                        
                        <div class="row text-center mb-3">
                            <div class="col-4">
                                <div class="h4 text-warning">2,341</div>
                                <small class="text-muted">Total Tags</small>
                            </div>
                            <div class="col-4">
                                <div class="h4 text-info">67</div>
                                <small class="text-muted">Tag Groups</small>
                            </div>
                            <div class="col-4">
                                <div class="h4 text-success">89%</div>
                                <small class="text-muted">Usage Rate</small>
                            </div>
                        </div>
                        
                        <ul class="list-unstyled mb-3">
                            <li><i class="fas fa-check text-success me-2"></i> Auto-suggestions</li>
                            <li><i class="fas fa-check text-success me-2"></i> Usage analytics</li>
                            <li><i class="fas fa-check text-success me-2"></i> Color coding</li>
                            <li><i class="fas fa-check text-success me-2"></i> Bulk operations</li>
                        </ul>
                        
                        <div class="d-grid gap-2">
                            <a href="tags.php" class="btn btn-warning">
                                <i class="fas fa-tag me-2"></i> Manage Tags
                            </a>
                            <a href="../tags/index.php" class="btn btn-outline-warning btn-sm">
                                <i class="fas fa-external-link-alt me-2"></i> Legacy Tag Manager
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Feature Library -->
            <div class="col-lg-6">
                <div class="card h-100">
                    <div class="card-header bg-purple text-white" style="background-color: #6f42c1 !important;">
                        <h5 class="mb-0">
                            <i class="fas fa-puzzle-piece me-2"></i>
                            Feature Library
                        </h5>
                    </div>
                    <div class="card-body">
                        <p class="text-muted">Reusable platform features and functionality modules</p>
                        
                        <div class="row text-center mb-3">
                            <div class="col-4">
                                <div class="h4 text-purple" style="color: #6f42c1;">127</div>
                                <small class="text-muted">Features</small>
                            </div>
                            <div class="col-4">
                                <div class="h4 text-info">18</div>
                                <small class="text-muted">Categories</small>
                            </div>
                            <div class="col-4">
                                <div class="h4 text-success">94%</div>
                                <small class="text-muted">Compatibility</small>
                            </div>
                        </div>
                        
                        <ul class="list-unstyled mb-3">
                            <li><i class="fas fa-check text-success me-2"></i> API endpoints</li>
                            <li><i class="fas fa-check text-success me-2"></i> UI components</li>
                            <li><i class="fas fa-check text-success me-2"></i> Database schemas</li>
                            <li><i class="fas fa-check text-success me-2"></i> Feature bundling</li>
                        </ul>
                        
                        <div class="d-grid gap-2">
                            <a href="features.php" class="btn text-white" style="background-color: #6f42c1;">
                                <i class="fas fa-cogs me-2"></i> Manage Features
                            </a>
                            <a href="../features/index.php" class="btn btn-outline-secondary btn-sm">
                                <i class="fas fa-external-link-alt me-2"></i> Legacy Feature Manager
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Resource Usage Statistics -->
        <div class="card mt-4">
            <div class="card-header">
                <h5 class="mb-0">
                    <i class="fas fa-chart-bar me-2"></i>
                    Resource Usage Statistics
                </h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-3">
                        <div class="text-center p-3 border rounded">
                            <h3 class="text-primary">23</h3>
                            <p class="mb-0">Active Templates</p>
                            <small class="text-muted">Using global resources</small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="text-center p-3 border rounded">
                            <h3 class="text-success">3,471</h3>
                            <p class="mb-0">Total Resources</p>
                            <small class="text-muted">Across all types</small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="text-center p-3 border rounded">
                            <h3 class="text-info">89%</h3>
                            <p class="mb-0">Utilization Rate</p>
                            <small class="text-muted">Resources in active use</small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="text-center p-3 border rounded">
                            <h3 class="text-warning">12</h3>
                            <p class="mb-0">Pending Updates</p>
                            <small class="text-muted">Resources awaiting sync</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Quick Actions -->
        <div class="card mt-4">
            <div class="card-header">
                <h5 class="mb-0">
                    <i class="fas fa-bolt me-2"></i>
                    Quick Actions
                </h5>
            </div>
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-md-3">
                        <button class="btn btn-outline-primary w-100" onclick="syncAllResources()">
                            <i class="fas fa-sync me-2"></i>
                            Sync All Resources
                        </button>
                    </div>
                    <div class="col-md-3">
                        <button class="btn btn-outline-success w-100" onclick="validateResources()">
                            <i class="fas fa-check-circle me-2"></i>
                            Validate Resources
                        </button>
                    </div>
                    <div class="col-md-3">
                        <button class="btn btn-outline-warning w-100" onclick="generateReport()">
                            <i class="fas fa-file-alt me-2"></i>
                            Usage Report
                        </button>
                    </div>
                    <div class="col-md-3">
                        <button class="btn btn-outline-info w-100" onclick="optimizeResources()">
                            <i class="fas fa-tools me-2"></i>
                            Optimize Resources
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
function importResources() {
    alert('Import Resources functionality - would open file upload dialog');
}

function exportResources() {
    alert('Export All Resources functionality - would download JSON/ZIP file');
}

function syncAllResources() {
    alert('Sync All Resources functionality - would synchronize with templates');
}

function validateResources() {
    alert('Validate Resources functionality - would check for integrity and dependencies');
}

function generateReport() {
    alert('Generate Usage Report functionality - would create comprehensive usage analysis');
}

function optimizeResources() {
    alert('Optimize Resources functionality - would clean up unused resources and consolidate duplicates');
}

// Update statistics periodically
function updateStatistics() {
    // This would fetch real data from the API
    console.log('Updating resource statistics...');
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    updateStatistics();
    
    // Set up periodic updates
    setInterval(updateStatistics, 30000); // Update every 30 seconds
});
</script>

<?php echo renderFooter(); ?>