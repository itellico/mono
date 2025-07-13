<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Projects Management - Elite Model Management", "Agency Admin", "Account Manager", "Account");
?>

<div class="d-flex">
    <?php echo renderSidebar('Account', getAccountSidebarItems(), 'projects/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Account', 'href' => '../index.php'],
            ['label' => 'Projects']
        ]);
        
        echo createHeroSection(
            "Project Management",
            "Manage all your agency projects, campaigns, and client bookings in one place",
            "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=300&fit=crop",
            [
                ['label' => 'New Project', 'icon' => 'fas fa-plus', 'style' => 'primary'],
                ['label' => 'Client Meeting', 'icon' => 'fas fa-calendar', 'style' => 'info'],
                ['label' => 'Generate Report', 'icon' => 'fas fa-file-pdf', 'style' => 'success']
            ]
        );
        ?>
        
        <!-- Project Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Active Projects', '24', 'fas fa-project-diagram', 'primary');
            echo createStatCard('Completed This Month', '18', 'fas fa-check-circle', 'success');
            echo createStatCard('Total Revenue', '$247K', 'fas fa-dollar-sign', 'warning');
            echo createStatCard('Client Satisfaction', '96%', 'fas fa-star', 'info');
            ?>
        </div>
        
        <!-- Project Filter Bar -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-body">
                        <form class="row g-3">
                            <div class="col-md-3">
                                <input type="text" class="form-control" placeholder="Search projects...">
                            </div>
                            <div class="col-md-2">
                                <select class="form-select">
                                    <option>All Status</option>
                                    <option>Planning</option>
                                    <option>In Progress</option>
                                    <option>Completed</option>
                                    <option>On Hold</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <select class="form-select">
                                    <option>All Clients</option>
                                    <option>Vogue Magazine</option>
                                    <option>Nike Inc.</option>
                                    <option>Zara Fashion</option>
                                    <option>Calvin Klein</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <select class="form-select">
                                    <option>All Categories</option>
                                    <option>Fashion Editorial</option>
                                    <option>Commercial Campaign</option>
                                    <option>Runway Show</option>
                                    <option>Brand Partnership</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <input type="date" class="form-control" placeholder="Date Range">
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
        
        <!-- Active Projects Grid -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Active Projects</h5>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary active">
                                <i class="fas fa-th"></i> Grid
                            </button>
                            <button class="btn btn-outline-primary">
                                <i class="fas fa-list"></i> List
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="row g-4">
                            <!-- Project 1: Vogue Paris Editorial -->
                            <div class="col-md-6 col-lg-4">
                                <div class="card border-primary h-100">
                                    <div class="card-header bg-primary text-white">
                                        <div class="d-flex justify-content-between align-items-center">
                                            <h6 class="mb-0">Vogue Paris Editorial</h6>
                                            <span class="badge bg-light text-primary">High Fashion</span>
                                        </div>
                                    </div>
                                    <div class="card-body">
                                        <div class="d-flex align-items-center mb-3">
                                            <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=40&h=40&fit=crop" 
                                                 class="rounded me-2" style="width: 40px; height: 40px;" alt="Vogue">
                                            <div>
                                                <strong>Vogue Magazine</strong><br>
                                                <small class="text-muted">Fashion Editorial</small>
                                            </div>
                                        </div>
                                        <p class="text-muted small mb-3">Exclusive spring collection editorial featuring 5 top models for Vogue Paris magazine.</p>
                                        <div class="mb-3">
                                            <div class="d-flex justify-content-between small">
                                                <span>Progress</span>
                                                <span class="fw-bold">75%</span>
                                            </div>
                                            <div class="progress" style="height: 6px;">
                                                <div class="progress-bar bg-primary" style="width: 75%"></div>
                                            </div>
                                        </div>
                                        <div class="row text-center small">
                                            <div class="col-4">
                                                <strong>5</strong><br>
                                                <span class="text-muted">Models</span>
                                            </div>
                                            <div class="col-4">
                                                <strong>Dec 15</strong><br>
                                                <span class="text-muted">Deadline</span>
                                            </div>
                                            <div class="col-4">
                                                <strong>$45K</strong><br>
                                                <span class="text-muted">Budget</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="card-footer">
                                        <div class="btn-group w-100">
                                            <button class="btn btn-outline-primary btn-sm">
                                                <i class="fas fa-eye"></i> View
                                            </button>
                                            <button class="btn btn-outline-success btn-sm">
                                                <i class="fas fa-edit"></i> Edit
                                            </button>
                                            <button class="btn btn-outline-info btn-sm">
                                                <i class="fas fa-users"></i> Team
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Project 2: Nike Campaign -->
                            <div class="col-md-6 col-lg-4">
                                <div class="card border-warning h-100">
                                    <div class="card-header bg-warning text-dark">
                                        <div class="d-flex justify-content-between align-items-center">
                                            <h6 class="mb-0">Nike Global Campaign</h6>
                                            <span class="badge bg-dark text-warning">Commercial</span>
                                        </div>
                                    </div>
                                    <div class="card-body">
                                        <div class="d-flex align-items-center mb-3">
                                            <img src="https://images.unsplash.com/photo-1556906781-9a412961c28c?w=40&h=40&fit=crop" 
                                                 class="rounded me-2" style="width: 40px; height: 40px;" alt="Nike">
                                            <div>
                                                <strong>Nike Inc.</strong><br>
                                                <small class="text-muted">Athletic Campaign</small>
                                            </div>
                                        </div>
                                        <p class="text-muted small mb-3">Global athletic wear campaign featuring diverse models showcasing Nike's new performance collection.</p>
                                        <div class="mb-3">
                                            <div class="d-flex justify-content-between small">
                                                <span>Progress</span>
                                                <span class="fw-bold">45%</span>
                                            </div>
                                            <div class="progress" style="height: 6px;">
                                                <div class="progress-bar bg-warning" style="width: 45%"></div>
                                            </div>
                                        </div>
                                        <div class="row text-center small">
                                            <div class="col-4">
                                                <strong>8</strong><br>
                                                <span class="text-muted">Models</span>
                                            </div>
                                            <div class="col-4">
                                                <strong>Dec 20</strong><br>
                                                <span class="text-muted">Deadline</span>
                                            </div>
                                            <div class="col-4">
                                                <strong>$125K</strong><br>
                                                <span class="text-muted">Budget</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="card-footer">
                                        <div class="btn-group w-100">
                                            <button class="btn btn-outline-primary btn-sm">
                                                <i class="fas fa-eye"></i> View
                                            </button>
                                            <button class="btn btn-outline-success btn-sm">
                                                <i class="fas fa-edit"></i> Edit
                                            </button>
                                            <button class="btn btn-outline-info btn-sm">
                                                <i class="fas fa-users"></i> Team
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Project 3: Calvin Klein -->
                            <div class="col-md-6 col-lg-4">
                                <div class="card border-success h-100">
                                    <div class="card-header bg-success text-white">
                                        <div class="d-flex justify-content-between align-items-center">
                                            <h6 class="mb-0">Calvin Klein Underwear</h6>
                                            <span class="badge bg-light text-success">Lifestyle</span>
                                        </div>
                                    </div>
                                    <div class="card-body">
                                        <div class="d-flex align-items-center mb-3">
                                            <img src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=40&h=40&fit=crop" 
                                                 class="rounded me-2" style="width: 40px; height: 40px;" alt="Calvin Klein">
                                            <div>
                                                <strong>Calvin Klein</strong><br>
                                                <small class="text-muted">Underwear Campaign</small>
                                            </div>
                                        </div>
                                        <p class="text-muted small mb-3">Intimate apparel campaign featuring models in minimalist studio settings for the new CK collection.</p>
                                        <div class="mb-3">
                                            <div class="d-flex justify-content-between small">
                                                <span>Progress</span>
                                                <span class="fw-bold">90%</span>
                                            </div>
                                            <div class="progress" style="height: 6px;">
                                                <div class="progress-bar bg-success" style="width: 90%"></div>
                                            </div>
                                        </div>
                                        <div class="row text-center small">
                                            <div class="col-4">
                                                <strong>6</strong><br>
                                                <span class="text-muted">Models</span>
                                            </div>
                                            <div class="col-4">
                                                <strong>Dec 12</strong><br>
                                                <span class="text-muted">Deadline</span>
                                            </div>
                                            <div class="col-4">
                                                <strong>$78K</strong><br>
                                                <span class="text-muted">Budget</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="card-footer">
                                        <div class="btn-group w-100">
                                            <button class="btn btn-outline-primary btn-sm">
                                                <i class="fas fa-eye"></i> View
                                            </button>
                                            <button class="btn btn-outline-success btn-sm">
                                                <i class="fas fa-edit"></i> Edit
                                            </button>
                                            <button class="btn btn-outline-info btn-sm">
                                                <i class="fas fa-users"></i> Team
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
        
        <!-- Project Timeline and Quick Actions -->
        <div class="row">
            <div class="col-lg-8">
                <?php
                $timelineHeaders = ['Project', 'Client', 'Status', 'Deadline', 'Budget', 'Team Lead'];
                $timelineRows = [
                    ['Vogue Paris Editorial', 'Vogue Magazine', '<span class="badge bg-primary">Active</span>', 'Dec 15, 2024', '$45,000', 'Sarah Williams'],
                    ['Nike Global Campaign', 'Nike Inc.', '<span class="badge bg-warning text-dark">In Progress</span>', 'Dec 20, 2024', '$125,000', 'Michael Chen'],
                    ['Calvin Klein Underwear', 'Calvin Klein', '<span class="badge bg-success">Completing</span>', 'Dec 12, 2024', '$78,000', 'Emma Rodriguez'],
                    ['Zara Fall Collection', 'Zara Fashion', '<span class="badge bg-info">Planning</span>', 'Jan 10, 2025', '$52,000', 'David Kim'],
                    ['H&M Sustainable Line', 'H&M Fashion', '<span class="badge bg-secondary">On Hold</span>', 'Dec 28, 2024', '$34,000', 'Lisa Thompson']
                ];
                echo createDataTable('All Projects Overview', $timelineHeaders, $timelineRows, true);
                ?>
            </div>
            <div class="col-lg-4">
                <?php echo createCard(
                    "Quick Actions",
                    '
                    <div class="d-grid gap-2">
                        <button class="btn btn-primary">
                            <i class="fas fa-plus me-2"></i> Create New Project
                        </button>
                        <button class="btn btn-success">
                            <i class="fas fa-calendar me-2"></i> Schedule Meeting
                        </button>
                        <button class="btn btn-info">
                            <i class="fas fa-file-invoice me-2"></i> Generate Invoice
                        </button>
                        <button class="btn btn-warning">
                            <i class="fas fa-chart-line me-2"></i> Project Reports
                        </button>
                        <button class="btn btn-secondary">
                            <i class="fas fa-archive me-2"></i> Archive Completed
                        </button>
                    </div>
                    '
                ); ?>
                
                <div class="mt-3">
                    <?php echo createCard(
                        "Project Insights",
                        '
                        <div class="text-center mb-3">
                            <h4 class="text-success">$247K</h4>
                            <small class="text-muted">Total Active Revenue</small>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <span class="small">On-time Delivery</span>
                                <span class="fw-bold">94%</span>
                            </div>
                            <div class="progress mb-2" style="height: 6px;">
                                <div class="progress-bar bg-success" style="width: 94%"></div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <span class="small">Budget Efficiency</span>
                                <span class="fw-bold">87%</span>
                            </div>
                            <div class="progress mb-2" style="height: 6px;">
                                <div class="progress-bar bg-primary" style="width: 87%"></div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <span class="small">Client Satisfaction</span>
                                <span class="fw-bold">96%</span>
                            </div>
                            <div class="progress mb-2" style="height: 6px;">
                                <div class="progress-bar bg-info" style="width: 96%"></div>
                            </div>
                        </div>
                        '
                    ); ?>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Project Modals -->
<!-- New Project Modal -->
<div class="modal fade" id="newProjectModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Create New Project</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form id="newProjectForm">
                <div class="modal-body">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label">Project Name *</label>
                            <input type="text" class="form-control" name="project_name" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Client *</label>
                            <select class="form-select" name="client" required>
                                <option value="">Select Client</option>
                                <option value="vogue">Vogue Magazine</option>
                                <option value="nike">Nike Inc.</option>
                                <option value="zara">Zara Fashion</option>
                                <option value="calvin-klein">Calvin Klein</option>
                                <option value="hm">H&M Fashion</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Category *</label>
                            <select class="form-select" name="category" required>
                                <option value="">Select Category</option>
                                <option value="fashion-editorial">Fashion Editorial</option>
                                <option value="commercial-campaign">Commercial Campaign</option>
                                <option value="runway-show">Runway Show</option>
                                <option value="brand-partnership">Brand Partnership</option>
                                <option value="lifestyle-shoot">Lifestyle Shoot</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Budget *</label>
                            <div class="input-group">
                                <span class="input-group-text">$</span>
                                <input type="number" class="form-control" name="budget" required>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Start Date *</label>
                            <input type="date" class="form-control" name="start_date" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Deadline *</label>
                            <input type="date" class="form-control" name="deadline" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Team Lead *</label>
                            <select class="form-select" name="team_lead" required>
                                <option value="">Select Team Lead</option>
                                <option value="sarah">Sarah Williams</option>
                                <option value="michael">Michael Chen</option>
                                <option value="emma">Emma Rodriguez</option>
                                <option value="david">David Kim</option>
                                <option value="lisa">Lisa Thompson</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Priority</label>
                            <select class="form-select" name="priority">
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                        <div class="col-12">
                            <label class="form-label">Description</label>
                            <textarea class="form-control" name="description" rows="4" placeholder="Project description and details..."></textarea>
                        </div>
                        <div class="col-12">
                            <label class="form-label">Required Models</label>
                            <input type="number" class="form-control" name="models_count" min="1" value="1">
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">Create Project</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Edit Project Modal -->
<div class="modal fade" id="editProjectModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Edit Project</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form id="editProjectForm">
                <div class="modal-body">
                    <input type="hidden" name="project_id" id="edit_project_id">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label">Project Name *</label>
                            <input type="text" class="form-control" name="project_name" id="edit_project_name" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Status *</label>
                            <select class="form-select" name="status" id="edit_status" required>
                                <option value="planning">Planning</option>
                                <option value="in-progress">In Progress</option>
                                <option value="completing">Completing</option>
                                <option value="completed">Completed</option>
                                <option value="on-hold">On Hold</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Progress %</label>
                            <input type="range" class="form-range" name="progress" id="edit_progress" min="0" max="100" value="0">
                            <div class="d-flex justify-content-between">
                                <small>0%</small>
                                <small id="progressValue">0%</small>
                                <small>100%</small>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Budget</label>
                            <div class="input-group">
                                <span class="input-group-text">$</span>
                                <input type="number" class="form-control" name="budget" id="edit_budget">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Deadline</label>
                            <input type="date" class="form-control" name="deadline" id="edit_deadline">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Team Lead</label>
                            <select class="form-select" name="team_lead" id="edit_team_lead">
                                <option value="sarah">Sarah Williams</option>
                                <option value="michael">Michael Chen</option>
                                <option value="emma">Emma Rodriguez</option>
                                <option value="david">David Kim</option>
                                <option value="lisa">Lisa Thompson</option>
                            </select>
                        </div>
                        <div class="col-12">
                            <label class="form-label">Notes</label>
                            <textarea class="form-control" name="notes" id="edit_notes" rows="3"></textarea>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-success">Save Changes</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Project Team Modal -->
<div class="modal fade" id="projectTeamModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Project Team</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="row mb-3">
                    <div class="col-md-8">
                        <select class="form-select" id="teamMemberSelect">
                            <option value="">Add team member...</option>
                            <option value="sarah">Sarah Williams - Senior Agent</option>
                            <option value="michael">Michael Chen - Talent Scout</option>
                            <option value="emma">Emma Rodriguez - Project Manager</option>
                            <option value="david">David Kim - Account Executive</option>
                            <option value="lisa">Lisa Thompson - Creative Director</option>
                        </select>
                    </div>
                    <div class="col-md-4">
                        <button class="btn btn-primary w-100" onclick="addTeamMember()">
                            <i class="fas fa-plus"></i> Add Member
                        </button>
                    </div>
                </div>
                <div id="teamMembersList">
                    <!-- Team members will be populated here -->
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary">Save Team</button>
            </div>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Initialize project management functionality
    initializeProjectManagement();
});

function initializeProjectManagement() {
    // Search functionality
    const searchInput = document.querySelector('input[placeholder="Search projects..."]');
    if (searchInput) {
        searchInput.addEventListener('input', filterProjects);
    }

    // Filter dropdowns
    const filterSelects = document.querySelectorAll('.row.g-3 select');
    filterSelects.forEach(select => {
        select.addEventListener('change', filterProjects);
    });

    // View toggle buttons (Grid/List)
    const viewButtons = document.querySelectorAll('.btn-group .btn');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            viewButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            toggleProjectView(this.innerHTML.includes('Grid') ? 'grid' : 'list');
        });
    });

    // Project action buttons
    setupProjectActionButtons();

    // Quick action buttons
    setupQuickActionButtons();

    // Form handlers
    setupFormHandlers();
}

function setupProjectActionButtons() {
    // View project buttons
    document.querySelectorAll('.btn-outline-primary').forEach(btn => {
        if (btn.innerHTML.includes('View')) {
            btn.addEventListener('click', function() {
                const projectCard = this.closest('.card');
                const projectName = projectCard.querySelector('h6').textContent;
                viewProjectDetails(projectName);
            });
        }
    });

    // Edit project buttons
    document.querySelectorAll('.btn-outline-success').forEach(btn => {
        if (btn.innerHTML.includes('Edit')) {
            btn.addEventListener('click', function() {
                const projectCard = this.closest('.card');
                editProject(projectCard);
            });
        }
    });

    // Team management buttons
    document.querySelectorAll('.btn-outline-info').forEach(btn => {
        if (btn.innerHTML.includes('Team')) {
            btn.addEventListener('click', function() {
                const projectCard = this.closest('.card');
                const projectName = projectCard.querySelector('h6').textContent;
                manageProjectTeam(projectName);
            });
        }
    });
}

function setupQuickActionButtons() {
    // Create New Project
    document.querySelectorAll('button').forEach(btn => {
        if (btn.innerHTML.includes('Create New Project') || btn.innerHTML.includes('New Project')) {
            btn.addEventListener('click', () => {
                const modal = new bootstrap.Modal(document.getElementById('newProjectModal'));
                modal.show();
            });
        }
    });

    // Other quick actions
    const quickActions = {
        'Schedule Meeting': showCalendarModal,
        'Generate Invoice': generateInvoice,
        'Project Reports': generateReports,
        'Archive Completed': archiveCompleted
    };

    Object.entries(quickActions).forEach(([text, handler]) => {
        document.querySelectorAll('button').forEach(btn => {
            if (btn.innerHTML.includes(text)) {
                btn.addEventListener('click', handler);
            }
        });
    });
}

function setupFormHandlers() {
    // New Project Form
    document.getElementById('newProjectForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        createNewProject(formData);
    });

    // Edit Project Form
    document.getElementById('editProjectForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        updateProject(formData);
    });

    // Progress slider update
    const progressSlider = document.getElementById('edit_progress');
    if (progressSlider) {
        progressSlider.addEventListener('input', function() {
            document.getElementById('progressValue').textContent = this.value + '%';
        });
    }
}

function filterProjects() {
    const searchTerm = document.querySelector('input[placeholder="Search projects..."]').value.toLowerCase();
    const statusFilter = document.querySelector('select[option="All Status"]')?.parentElement.querySelector('select').value;
    const clientFilter = document.querySelector('select[option="All Clients"]')?.parentElement.querySelector('select').value;
    
    const projectCards = document.querySelectorAll('.row.g-4 .col-md-6, .row.g-4 .col-lg-4');
    
    projectCards.forEach(card => {
        const projectName = card.querySelector('h6').textContent.toLowerCase();
        const client = card.querySelector('strong').textContent.toLowerCase();
        
        const matchesSearch = projectName.includes(searchTerm) || client.includes(searchTerm);
        const matchesStatus = !statusFilter || statusFilter === 'All Status';
        const matchesClient = !clientFilter || clientFilter === 'All Clients' || client.includes(clientFilter.toLowerCase());
        
        if (matchesSearch && matchesStatus && matchesClient) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function toggleProjectView(view) {
    const projectContainer = document.querySelector('.row.g-4');
    
    if (view === 'list') {
        projectContainer.classList.add('list-view');
        projectContainer.querySelectorAll('.col-md-6, .col-lg-4').forEach(col => {
            col.className = 'col-12 mb-3';
        });
    } else {
        projectContainer.classList.remove('list-view');
        projectContainer.querySelectorAll('.col-12').forEach(col => {
            col.className = 'col-md-6 col-lg-4';
        });
    }
}

function viewProjectDetails(projectName) {
    // Simulate project details view
    alert(`Viewing details for: ${projectName}\n\nThis would show:\n• Project timeline\n• Assigned models\n• Budget breakdown\n• Client communications\n• Deliverables\n• File uploads`);
}

function editProject(projectCard) {
    const projectName = projectCard.querySelector('h6').textContent;
    const progress = projectCard.querySelector('.progress-bar').style.width;
    const budget = projectCard.querySelector('strong').nextElementSibling?.textContent;
    
    // Populate edit form
    document.getElementById('edit_project_name').value = projectName;
    document.getElementById('edit_progress').value = parseInt(progress);
    document.getElementById('progressValue').textContent = progress;
    
    const modal = new bootstrap.Modal(document.getElementById('editProjectModal'));
    modal.show();
}

function manageProjectTeam(projectName) {
    document.querySelector('#projectTeamModal .modal-title').textContent = `Team for ${projectName}`;
    
    // Sample team members
    const teamMembers = [
        { name: 'Sarah Williams', role: 'Senior Agent', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b286?w=40&h=40&fit=crop&crop=face' },
        { name: 'Michael Chen', role: 'Talent Scout', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face' },
        { name: 'Emma Rodriguez', role: 'Project Manager', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face' }
    ];
    
    const teamList = document.getElementById('teamMembersList');
    teamList.innerHTML = teamMembers.map(member => `
        <div class="d-flex align-items-center justify-content-between p-3 border rounded mb-2">
            <div class="d-flex align-items-center">
                <img src="${member.avatar}" class="rounded-circle me-3" style="width: 40px; height: 40px;" alt="${member.name}">
                <div>
                    <strong>${member.name}</strong><br>
                    <small class="text-muted">${member.role}</small>
                </div>
            </div>
            <button class="btn btn-outline-danger btn-sm" onclick="removeTeamMember(this)">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
    
    const modal = new bootstrap.Modal(document.getElementById('projectTeamModal'));
    modal.show();
}

function createNewProject(formData) {
    // Simulate project creation
    const projectData = Object.fromEntries(formData);
    
    console.log('Creating new project:', projectData);
    
    // Show success message
    showToast('Project created successfully!', 'success');
    
    // Close modal and refresh (in real app, would add to list)
    bootstrap.Modal.getInstance(document.getElementById('newProjectModal')).hide();
    
    // Reset form
    document.getElementById('newProjectForm').reset();
}

function updateProject(formData) {
    const projectData = Object.fromEntries(formData);
    
    console.log('Updating project:', projectData);
    
    showToast('Project updated successfully!', 'success');
    bootstrap.Modal.getInstance(document.getElementById('editProjectModal')).hide();
}

function addTeamMember() {
    const select = document.getElementById('teamMemberSelect');
    const selectedValue = select.value;
    const selectedText = select.options[select.selectedIndex].text;
    
    if (!selectedValue) return;
    
    const [name, role] = selectedText.split(' - ');
    const teamList = document.getElementById('teamMembersList');
    
    const memberHtml = `
        <div class="d-flex align-items-center justify-content-between p-3 border rounded mb-2">
            <div class="d-flex align-items-center">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face" 
                     class="rounded-circle me-3" style="width: 40px; height: 40px;" alt="${name}">
                <div>
                    <strong>${name}</strong><br>
                    <small class="text-muted">${role}</small>
                </div>
            </div>
            <button class="btn btn-outline-danger btn-sm" onclick="removeTeamMember(this)">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    teamList.insertAdjacentHTML('beforeend', memberHtml);
    select.value = '';
}

function removeTeamMember(button) {
    button.closest('.d-flex').remove();
}

function showCalendarModal() {
    alert('Calendar integration would open here\n\nFeatures:\n• Schedule client meetings\n• Book photo shoots\n• Coordinate model availability\n• Team scheduling');
}

function generateInvoice() {
    alert('Invoice generation would start here\n\nFeatures:\n• Select project and time period\n• Automatic calculation\n• PDF generation\n• Email to client');
}

function generateReports() {
    alert('Report generation would start here\n\nReports available:\n• Project performance\n• Revenue analysis\n• Team productivity\n• Client satisfaction');
}

function archiveCompleted() {
    const completedCount = document.querySelectorAll('.badge.bg-success').length;
    if (confirm(`Archive ${completedCount} completed projects?`)) {
        showToast(`${completedCount} projects archived successfully!`, 'info');
    }
}

function showToast(message, type = 'info') {
    // Create toast notification
    const toastHtml = `
        <div class="toast align-items-center text-white bg-${type} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    // Add to page and show
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    const toastElement = toastContainer.lastElementChild;
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    // Remove after hiding
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}
</script>

<style>
.stat-card:hover {
    transform: translateY(-5px);
    transition: transform 0.3s ease;
}

.card.border-primary:hover,
.card.border-warning:hover,
.card.border-success:hover {
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    transform: translateY(-2px);
    transition: all 0.3s ease;
}

.list-view .card {
    margin-bottom: 15px;
}

.list-view .card-body {
    display: flex;
    align-items: center;
    gap: 20px;
}

.toast-container {
    z-index: 1055;
}

.progress {
    cursor: pointer;
}

.btn-group .btn-sm {
    padding: 0.25rem 0.5rem;
}
</style>

<?php echo renderFooter(); ?>