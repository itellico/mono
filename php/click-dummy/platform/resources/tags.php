<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Base Tags & Labels Management - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'resources/tags.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Global Resources', 'href' => 'index.php'],
            ['label' => 'Base Tags & Labels']
        ]);
        ?>
        
        <!-- Tags Header -->
        <div class="bg-warning text-dark p-4 rounded mb-4">
            <div class="row align-items-center">
                <div class="col-md-8">
                    <h2 class="mb-2">Base Tags & Labels Management</h2>
                    <p class="mb-0 opacity-75">Manage flexible tagging system for content discovery across all industry templates</p>
                </div>
                <div class="col-md-4 text-end">
                    <div class="btn-group">
                        <button class="btn btn-dark" onclick="createTag()">
                            <i class="fas fa-plus me-2"></i> New Tag
                        </button>
                        <button class="btn btn-secondary" onclick="importTags()">
                            <i class="fas fa-upload me-2"></i> Import
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Statistics Cards -->
        <div class="row g-3 mb-4">
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h3 class="text-warning">2,341</h3>
                        <p class="mb-0">Total Tags</p>
                        <small class="text-muted">All tag instances</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h3 class="text-info">67</h3>
                        <p class="mb-0">Tag Groups</p>
                        <small class="text-muted">Organized collections</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h3 class="text-success">89%</h3>
                        <p class="mb-0">Usage Rate</p>
                        <small class="text-muted">Tags actively used</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h3 class="text-purple" style="color: #6f42c1;">23</h3>
                        <p class="mb-0">Templates Using</p>
                        <small class="text-muted">Active assignments</small>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Filter and Search -->
        <div class="card mb-4">
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-md-4">
                        <input type="text" class="form-control" placeholder="Search tags..." id="searchInput">
                    </div>
                    <div class="col-md-2">
                        <select class="form-select" id="groupFilter">
                            <option value="">All Groups</option>
                            <option value="skills">Skills</option>
                            <option value="physical">Physical</option>
                            <option value="industry">Industry</option>
                            <option value="location">Location</option>
                            <option value="experience">Experience</option>
                            <option value="equipment">Equipment</option>
                            <option value="specialty">Specialty</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <select class="form-select" id="colorFilter">
                            <option value="">All Colors</option>
                            <option value="blue">Blue</option>
                            <option value="green">Green</option>
                            <option value="red">Red</option>
                            <option value="purple">Purple</option>
                            <option value="orange">Orange</option>
                            <option value="teal">Teal</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <select class="form-select" id="statusFilter">
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <button class="btn btn-outline-secondary w-100" onclick="resetFilters()">
                            <i class="fas fa-undo me-2"></i> Reset
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Tag Groups View -->
        <div class="row">
            <div class="col-lg-8">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">
                            <i class="fas fa-tags me-2"></i>
                            Tags by Group
                        </h5>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="switchView('groups')">
                                <i class="fas fa-layer-group me-1"></i> Groups
                            </button>
                            <button class="btn btn-outline-secondary" onclick="switchView('list')">
                                <i class="fas fa-list me-1"></i> List
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <!-- Skills Group -->
                        <div class="tag-group mb-4">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h6 class="text-primary mb-0">
                                    <i class="fas fa-cogs me-2"></i>
                                    Skills & Abilities
                                </h6>
                                <div>
                                    <span class="badge bg-primary">143 tags</span>
                                    <button class="btn btn-outline-primary btn-sm ms-2" onclick="manageGroup('skills')">
                                        <i class="fas fa-cog"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="tags-container">
                                <span class="badge bg-primary me-2 mb-2 tag-item" data-usage="234">
                                    Acting
                                    <span class="badge bg-light text-dark ms-1">234</span>
                                    <button class="btn btn-sm ms-1" onclick="editTag('acting')" style="background: none; border: none; color: white;">
                                        <i class="fas fa-edit" style="font-size: 10px;"></i>
                                    </button>
                                </span>
                                <span class="badge bg-primary me-2 mb-2 tag-item" data-usage="189">
                                    Voice Acting
                                    <span class="badge bg-light text-dark ms-1">189</span>
                                    <button class="btn btn-sm ms-1" onclick="editTag('voice-acting')" style="background: none; border: none; color: white;">
                                        <i class="fas fa-edit" style="font-size: 10px;"></i>
                                    </button>
                                </span>
                                <span class="badge bg-primary me-2 mb-2 tag-item" data-usage="156">
                                    Dancing
                                    <span class="badge bg-light text-dark ms-1">156</span>
                                    <button class="btn btn-sm ms-1" onclick="editTag('dancing')" style="background: none; border: none; color: white;">
                                        <i class="fas fa-edit" style="font-size: 10px;"></i>
                                    </button>
                                </span>
                                <span class="badge bg-primary me-2 mb-2 tag-item" data-usage="134">
                                    Singing
                                    <span class="badge bg-light text-dark ms-1">134</span>
                                    <button class="btn btn-sm ms-1" onclick="editTag('singing')" style="background: none; border: none; color: white;">
                                        <i class="fas fa-edit" style="font-size: 10px;"></i>
                                    </button>
                                </span>
                                <span class="badge bg-primary me-2 mb-2 tag-item" data-usage="98">
                                    Comedy
                                    <span class="badge bg-light text-dark ms-1">98</span>
                                    <button class="btn btn-sm ms-1" onclick="editTag('comedy')" style="background: none; border: none; color: white;">
                                        <i class="fas fa-edit" style="font-size: 10px;"></i>
                                    </button>
                                </span>
                                <span class="badge bg-primary me-2 mb-2 tag-item" data-usage="87">
                                    Drama
                                    <span class="badge bg-light text-dark ms-1">87</span>
                                    <button class="btn btn-sm ms-1" onclick="editTag('drama')" style="background: none; border: none; color: white;">
                                        <i class="fas fa-edit" style="font-size: 10px;"></i>
                                    </button>
                                </span>
                                <button class="btn btn-outline-primary btn-sm" onclick="showMoreTags('skills')">
                                    +137 more tags
                                </button>
                            </div>
                        </div>
                        
                        <!-- Physical Attributes Group -->
                        <div class="tag-group mb-4">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h6 class="text-success mb-0">
                                    <i class="fas fa-user me-2"></i>
                                    Physical Attributes
                                </h6>
                                <div>
                                    <span class="badge bg-success">89 tags</span>
                                    <button class="btn btn-outline-success btn-sm ms-2" onclick="manageGroup('physical')">
                                        <i class="fas fa-cog"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="tags-container">
                                <span class="badge bg-success me-2 mb-2 tag-item" data-usage="312">
                                    Tall
                                    <span class="badge bg-light text-dark ms-1">312</span>
                                    <button class="btn btn-sm ms-1" onclick="editTag('tall')" style="background: none; border: none; color: white;">
                                        <i class="fas fa-edit" style="font-size: 10px;"></i>
                                    </button>
                                </span>
                                <span class="badge bg-success me-2 mb-2 tag-item" data-usage="289">
                                    Athletic
                                    <span class="badge bg-light text-dark ms-1">289</span>
                                    <button class="btn btn-sm ms-1" onclick="editTag('athletic')" style="background: none; border: none; color: white;">
                                        <i class="fas fa-edit" style="font-size: 10px;"></i>
                                    </button>
                                </span>
                                <span class="badge bg-success me-2 mb-2 tag-item" data-usage="234">
                                    Petite
                                    <span class="badge bg-light text-dark ms-1">234</span>
                                    <button class="btn btn-sm ms-1" onclick="editTag('petite')" style="background: none; border: none; color: white;">
                                        <i class="fas fa-edit" style="font-size: 10px;"></i>
                                    </button>
                                </span>
                                <span class="badge bg-success me-2 mb-2 tag-item" data-usage="187">
                                    Plus Size
                                    <span class="badge bg-light text-dark ms-1">187</span>
                                    <button class="btn btn-sm ms-1" onclick="editTag('plus-size')" style="background: none; border: none; color: white;">
                                        <i class="fas fa-edit" style="font-size: 10px;"></i>
                                    </button>
                                </span>
                                <button class="btn btn-outline-success btn-sm" onclick="showMoreTags('physical')">
                                    +85 more tags
                                </button>
                            </div>
                        </div>
                        
                        <!-- Industry Specific Group -->
                        <div class="tag-group mb-4">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h6 class="text-info mb-0">
                                    <i class="fas fa-industry me-2"></i>
                                    Industry Specific
                                </h6>
                                <div>
                                    <span class="badge bg-info">76 tags</span>
                                    <button class="btn btn-outline-info btn-sm ms-2" onclick="manageGroup('industry')">
                                        <i class="fas fa-cog"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="tags-container">
                                <span class="badge bg-info me-2 mb-2 tag-item" data-usage="456">
                                    Fashion
                                    <span class="badge bg-light text-dark ms-1">456</span>
                                    <button class="btn btn-sm ms-1" onclick="editTag('fashion')" style="background: none; border: none; color: white;">
                                        <i class="fas fa-edit" style="font-size: 10px;"></i>
                                    </button>
                                </span>
                                <span class="badge bg-info me-2 mb-2 tag-item" data-usage="389">
                                    Commercial
                                    <span class="badge bg-light text-dark ms-1">389</span>
                                    <button class="btn btn-sm ms-1" onclick="editTag('commercial')" style="background: none; border: none; color: white;">
                                        <i class="fas fa-edit" style="font-size: 10px;"></i>
                                    </button>
                                </span>
                                <span class="badge bg-info me-2 mb-2 tag-item" data-usage="234">
                                    Editorial
                                    <span class="badge bg-light text-dark ms-1">234</span>
                                    <button class="btn btn-sm ms-1" onclick="editTag('editorial')" style="background: none; border: none; color: white;">
                                        <i class="fas fa-edit" style="font-size: 10px;"></i>
                                    </button>
                                </span>
                                <span class="badge bg-info me-2 mb-2 tag-item" data-usage="198">
                                    Runway
                                    <span class="badge bg-light text-dark ms-1">198</span>
                                    <button class="btn btn-sm ms-1" onclick="editTag('runway')" style="background: none; border: none; color: white;">
                                        <i class="fas fa-edit" style="font-size: 10px;"></i>
                                    </button>
                                </span>
                                <button class="btn btn-outline-info btn-sm" onclick="showMoreTags('industry')">
                                    +72 more tags
                                </button>
                            </div>
                        </div>
                        
                        <!-- Experience Level Group -->
                        <div class="tag-group mb-4">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h6 class="text-warning mb-0">
                                    <i class="fas fa-star me-2"></i>
                                    Experience Level
                                </h6>
                                <div>
                                    <span class="badge bg-warning text-dark">12 tags</span>
                                    <button class="btn btn-outline-warning btn-sm ms-2" onclick="manageGroup('experience')">
                                        <i class="fas fa-cog"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="tags-container">
                                <span class="badge bg-warning text-dark me-2 mb-2 tag-item" data-usage="567">
                                    Beginner
                                    <span class="badge bg-dark text-white ms-1">567</span>
                                    <button class="btn btn-sm ms-1" onclick="editTag('beginner')" style="background: none; border: none; color: black;">
                                        <i class="fas fa-edit" style="font-size: 10px;"></i>
                                    </button>
                                </span>
                                <span class="badge bg-warning text-dark me-2 mb-2 tag-item" data-usage="434">
                                    Intermediate
                                    <span class="badge bg-dark text-white ms-1">434</span>
                                    <button class="btn btn-sm ms-1" onclick="editTag('intermediate')" style="background: none; border: none; color: black;">
                                        <i class="fas fa-edit" style="font-size: 10px;"></i>
                                    </button>
                                </span>
                                <span class="badge bg-warning text-dark me-2 mb-2 tag-item" data-usage="298">
                                    Professional
                                    <span class="badge bg-dark text-white ms-1">298</span>
                                    <button class="btn btn-sm ms-1" onclick="editTag('professional')" style="background: none; border: none; color: black;">
                                        <i class="fas fa-edit" style="font-size: 10px;"></i>
                                    </button>
                                </span>
                                <span class="badge bg-warning text-dark me-2 mb-2 tag-item" data-usage="156">
                                    Expert
                                    <span class="badge bg-dark text-white ms-1">156</span>
                                    <button class="btn btn-sm ms-1" onclick="editTag('expert')" style="background: none; border: none; color: black;">
                                        <i class="fas fa-edit" style="font-size: 10px;"></i>
                                    </button>
                                </span>
                                <button class="btn btn-outline-warning btn-sm" onclick="showMoreTags('experience')">
                                    +8 more tags
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Tag Management Panel -->
            <div class="col-lg-4">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">
                            <i class="fas fa-tools me-2"></i>
                            Tag Management
                        </h6>
                    </div>
                    <div class="card-body">
                        <h6>Quick Actions</h6>
                        <div class="d-grid gap-2 mb-3">
                            <button class="btn btn-primary" onclick="createTag()">
                                <i class="fas fa-plus me-2"></i> Create New Tag
                            </button>
                            <button class="btn btn-outline-info" onclick="createGroup()">
                                <i class="fas fa-layer-group me-2"></i> Create Group
                            </button>
                            <button class="btn btn-outline-warning" onclick="mergeTags()">
                                <i class="fas fa-compress-alt me-2"></i> Merge Tags
                            </button>
                        </div>
                        
                        <h6>Tag Statistics</h6>
                        <div class="row g-2 mb-3">
                            <div class="col-6">
                                <div class="text-center p-2 border rounded">
                                    <div class="h6 text-success">89%</div>
                                    <small>Active Tags</small>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="text-center p-2 border rounded">
                                    <div class="h6 text-info">156</div>
                                    <small>Avg. Usage</small>
                                </div>
                            </div>
                        </div>
                        
                        <h6>Popular Tags</h6>
                        <div class="list-group list-group-flush">
                            <div class="list-group-item d-flex justify-content-between align-items-center">
                                <span>Fashion</span>
                                <span class="badge bg-primary rounded-pill">456</span>
                            </div>
                            <div class="list-group-item d-flex justify-content-between align-items-center">
                                <span>Beginner</span>
                                <span class="badge bg-primary rounded-pill">567</span>
                            </div>
                            <div class="list-group-item d-flex justify-content-between align-items-center">
                                <span>Commercial</span>
                                <span class="badge bg-primary rounded-pill">389</span>
                            </div>
                            <div class="list-group-item d-flex justify-content-between align-items-center">
                                <span>Tall</span>
                                <span class="badge bg-primary rounded-pill">312</span>
                            </div>
                        </div>
                        
                        <div class="mt-3">
                            <button class="btn btn-outline-secondary btn-sm w-100" onclick="viewAllStats()">
                                <i class="fas fa-chart-bar me-2"></i> View Detailed Statistics
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Cleanup Tools -->
                <div class="card mt-3">
                    <div class="card-header">
                        <h6 class="mb-0">
                            <i class="fas fa-broom me-2"></i>
                            Cleanup Tools
                        </h6>
                    </div>
                    <div class="card-body">
                        <div class="d-grid gap-2">
                            <button class="btn btn-outline-danger btn-sm" onclick="findUnusedTags()">
                                <i class="fas fa-trash me-2"></i> Find Unused Tags
                            </button>
                            <button class="btn btn-outline-warning btn-sm" onclick="findDuplicates()">
                                <i class="fas fa-copy me-2"></i> Find Duplicates
                            </button>
                            <button class="btn btn-outline-info btn-sm" onclick="suggestTags()">
                                <i class="fas fa-lightbulb me-2"></i> Suggest New Tags
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Bulk Actions -->
        <div class="card mt-4">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <h6>Bulk Actions</h6>
                        <div class="btn-group">
                            <button class="btn btn-outline-primary" onclick="bulkExport()">
                                <i class="fas fa-download me-2"></i> Export Selected
                            </button>
                            <button class="btn btn-outline-warning" onclick="bulkEdit()">
                                <i class="fas fa-edit me-2"></i> Edit Selected
                            </button>
                            <button class="btn btn-outline-danger" onclick="bulkDelete()">
                                <i class="fas fa-trash me-2"></i> Delete Selected
                            </button>
                        </div>
                    </div>
                    <div class="col-md-6 text-end">
                        <h6>System Actions</h6>
                        <div class="btn-group">
                            <button class="btn btn-outline-info" onclick="syncWithTemplates()">
                                <i class="fas fa-sync me-2"></i> Sync with Templates
                            </button>
                            <button class="btn btn-outline-success" onclick="optimizeTags()">
                                <i class="fas fa-tools me-2"></i> Optimize Tags
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
function createTag() {
    alert('Create New Tag functionality - would open tag creation wizard');
}

function importTags() {
    alert('Import Tags functionality - would open file upload dialog');
}

function editTag(slug) {
    alert(`Edit Tag: ${slug} - would open detailed editor`);
}

function createGroup() {
    alert('Create New Group functionality - would open group creation form');
}

function manageGroup(groupSlug) {
    alert(`Manage Group: ${groupSlug} - would open group management interface`);
}

function showMoreTags(groupSlug) {
    alert(`Show More Tags for: ${groupSlug} - would expand to show all tags in group`);
}

function mergeTags() {
    alert('Merge Tags functionality - would open tag merging interface');
}

function switchView(viewType) {
    alert(`Switch to ${viewType} view - would change the display format`);
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('groupFilter').value = '';
    document.getElementById('colorFilter').value = '';
    document.getElementById('statusFilter').value = '';
    alert('Filters would be reset and tags would refresh');
}

function viewAllStats() {
    alert('View All Statistics functionality - would show comprehensive tag analytics');
}

function findUnusedTags() {
    alert('Find Unused Tags functionality - would identify tags not in use');
}

function findDuplicates() {
    alert('Find Duplicates functionality - would identify similar/duplicate tags');
}

function suggestTags() {
    alert('Suggest New Tags functionality - would AI-suggest relevant tags based on content');
}

function bulkExport() {
    alert('Bulk Export functionality - would export selected tags');
}

function bulkEdit() {
    alert('Bulk Edit functionality - would open multi-tag editor');
}

function bulkDelete() {
    if (confirm('Delete selected tags? This action cannot be undone.')) {
        alert('Selected tags would be deleted');
    }
}

function syncWithTemplates() {
    alert('Sync with Templates functionality - would update all template assignments');
}

function optimizeTags() {
    alert('Optimize Tags functionality - would clean up and consolidate tags');
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Tags Management page initialized');
});
</script>

<style>
.tag-item {
    cursor: pointer;
    transition: all 0.2s;
}

.tag-item:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.tags-container {
    line-height: 2.5;
}

.tag-group {
    padding: 15px;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    background-color: #f8f9fa;
}
</style>

<?php echo renderFooter(); ?>