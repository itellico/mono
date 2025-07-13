<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Team Management - Elite Model Management", "Agency Admin", "Account Manager", "Account");
?>

<div class="d-flex">
    <?php echo renderSidebar('Account', getAccountSidebarItems(), 'team/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Account', 'href' => '../index.php'],
            ['label' => 'Team Management']
        ]);
        
        echo createHeroSection(
            "Team Management",
            "Manage your agency team members, roles, permissions, and collaborative workflows",
            "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=300&fit=crop",
            [
                ['label' => 'Add Team Member', 'icon' => 'fas fa-user-plus', 'style' => 'success'],
                ['label' => 'Manage Roles', 'icon' => 'fas fa-users-cog', 'style' => 'primary'],
                ['label' => 'Team Settings', 'icon' => 'fas fa-cog', 'style' => 'info']
            ]
        );
        ?>
        
        <!-- Team Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Team Members', '15', 'fas fa-users', 'primary');
            echo createStatCard('Active Projects', '24', 'fas fa-project-diagram', 'success');
            echo createStatCard('Departments', '5', 'fas fa-sitemap', 'info');
            echo createStatCard('Performance Score', '94%', 'fas fa-chart-line', 'warning');
            ?>
        </div>
        
        <!-- Team Filters -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-body">
                        <form class="row g-3" id="teamFilterForm">
                            <div class="col-md-3">
                                <input type="text" class="form-control" id="searchTeam" placeholder="Search team members...">
                            </div>
                            <div class="col-md-2">
                                <select class="form-select" id="filterDepartment">
                                    <option>All Departments</option>
                                    <option>Talent Management</option>
                                    <option>Business Development</option>
                                    <option>Creative Services</option>
                                    <option>Operations</option>
                                    <option>Administration</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <select class="form-select" id="filterRole">
                                    <option>All Roles</option>
                                    <option>Senior Agent</option>
                                    <option>Talent Scout</option>
                                    <option>Project Manager</option>
                                    <option>Creative Director</option>
                                    <option>Account Executive</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <select class="form-select" id="filterStatus">
                                    <option>All Status</option>
                                    <option>Active</option>
                                    <option>On Leave</option>
                                    <option>Remote</option>
                                    <option>Part-time</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <select class="form-select" id="sortTeam">
                                    <option>Sort by Name</option>
                                    <option>Sort by Role</option>
                                    <option>Sort by Performance</option>
                                    <option>Sort by Join Date</option>
                                </select>
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
        
        <!-- Team Grid -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Team Members</h5>
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
                        <div class="row g-4" id="teamGrid">
                            <!-- Team Member 1: Sarah Williams -->
                            <div class="col-md-6 col-lg-4">
                                <div class="card h-100">
                                    <div class="card-body text-center">
                                        <div class="position-relative d-inline-block mb-3">
                                            <img src="https://images.unsplash.com/photo-1494790108755-2616b612b5c5?w=80&h=80&fit=crop&crop=face" 
                                                 class="rounded-circle" style="width: 80px; height: 80px; object-fit: cover;" alt="Sarah Williams">
                                            <span class="position-absolute bottom-0 end-0 bg-success rounded-circle border border-white" 
                                                  style="width: 20px; height: 20px;"></span>
                                        </div>
                                        <h6 class="card-title">Sarah Williams</h6>
                                        <p class="text-primary small mb-2">Senior Agent</p>
                                        <p class="text-muted small mb-3">Talent Management</p>
                                        <div class="row text-center small mb-3">
                                            <div class="col-4">
                                                <strong>12</strong><br>
                                                <span class="text-muted">Projects</span>
                                            </div>
                                            <div class="col-4">
                                                <strong>8</strong><br>
                                                <span class="text-muted">Clients</span>
                                            </div>
                                            <div class="col-4">
                                                <strong>97%</strong><br>
                                                <span class="text-muted">Performance</span>
                                            </div>
                                        </div>
                                        <div class="mb-3">
                                            <span class="badge bg-success me-1">Team Lead</span>
                                            <span class="badge bg-info">Remote</span>
                                        </div>
                                        <div class="btn-group w-100">
                                            <button class="btn btn-outline-primary btn-sm">
                                                <i class="fas fa-eye"></i> Profile
                                            </button>
                                            <button class="btn btn-outline-info btn-sm">
                                                <i class="fas fa-envelope"></i> Message
                                            </button>
                                            <button class="btn btn-outline-success btn-sm">
                                                <i class="fas fa-edit"></i> Edit
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Team Member 2: Michael Chen -->
                            <div class="col-md-6 col-lg-4">
                                <div class="card h-100">
                                    <div class="card-body text-center">
                                        <div class="position-relative d-inline-block mb-3">
                                            <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face" 
                                                 class="rounded-circle" style="width: 80px; height: 80px; object-fit: cover;" alt="Michael Chen">
                                            <span class="position-absolute bottom-0 end-0 bg-success rounded-circle border border-white" 
                                                  style="width: 20px; height: 20px;"></span>
                                        </div>
                                        <h6 class="card-title">Michael Chen</h6>
                                        <p class="text-success small mb-2">Talent Scout</p>
                                        <p class="text-muted small mb-3">Talent Management</p>
                                        <div class="row text-center small mb-3">
                                            <div class="col-4">
                                                <strong>8</strong><br>
                                                <span class="text-muted">Projects</span>
                                            </div>
                                            <div class="col-4">
                                                <strong>5</strong><br>
                                                <span class="text-muted">Clients</span>
                                            </div>
                                            <div class="col-4">
                                                <strong>95%</strong><br>
                                                <span class="text-muted">Performance</span>
                                            </div>
                                        </div>
                                        <div class="mb-3">
                                            <span class="badge bg-warning text-dark me-1">Scout</span>
                                            <span class="badge bg-secondary">On-site</span>
                                        </div>
                                        <div class="btn-group w-100">
                                            <button class="btn btn-outline-primary btn-sm">
                                                <i class="fas fa-eye"></i> Profile
                                            </button>
                                            <button class="btn btn-outline-info btn-sm">
                                                <i class="fas fa-envelope"></i> Message
                                            </button>
                                            <button class="btn btn-outline-success btn-sm">
                                                <i class="fas fa-edit"></i> Edit
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Team Member 3: Emma Rodriguez -->
                            <div class="col-md-6 col-lg-4">
                                <div class="card h-100">
                                    <div class="card-body text-center">
                                        <div class="position-relative d-inline-block mb-3">
                                            <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face" 
                                                 class="rounded-circle" style="width: 80px; height: 80px; object-fit: cover;" alt="Emma Rodriguez">
                                            <span class="position-absolute bottom-0 end-0 bg-warning rounded-circle border border-white" 
                                                  style="width: 20px; height: 20px;"></span>
                                        </div>
                                        <h6 class="card-title">Emma Rodriguez</h6>
                                        <p class="text-info small mb-2">Project Manager</p>
                                        <p class="text-muted small mb-3">Operations</p>
                                        <div class="row text-center small mb-3">
                                            <div class="col-4">
                                                <strong>15</strong><br>
                                                <span class="text-muted">Projects</span>
                                            </div>
                                            <div class="col-4">
                                                <strong>12</strong><br>
                                                <span class="text-muted">Clients</span>
                                            </div>
                                            <div class="col-4">
                                                <strong>92%</strong><br>
                                                <span class="text-muted">Performance</span>
                                            </div>
                                        </div>
                                        <div class="mb-3">
                                            <span class="badge bg-primary me-1">Manager</span>
                                            <span class="badge bg-warning text-dark">Away</span>
                                        </div>
                                        <div class="btn-group w-100">
                                            <button class="btn btn-outline-primary btn-sm">
                                                <i class="fas fa-eye"></i> Profile
                                            </button>
                                            <button class="btn btn-outline-info btn-sm">
                                                <i class="fas fa-envelope"></i> Message
                                            </button>
                                            <button class="btn btn-outline-success btn-sm">
                                                <i class="fas fa-edit"></i> Edit
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Team Member 4: David Kim -->
                            <div class="col-md-6 col-lg-4">
                                <div class="card h-100">
                                    <div class="card-body text-center">
                                        <div class="position-relative d-inline-block mb-3">
                                            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face" 
                                                 class="rounded-circle" style="width: 80px; height: 80px; object-fit: cover;" alt="David Kim">
                                            <span class="position-absolute bottom-0 end-0 bg-success rounded-circle border border-white" 
                                                  style="width: 20px; height: 20px;"></span>
                                        </div>
                                        <h6 class="card-title">David Kim</h6>
                                        <p class="text-warning small mb-2">Account Executive</p>
                                        <p class="text-muted small mb-3">Business Development</p>
                                        <div class="row text-center small mb-3">
                                            <div class="col-4">
                                                <strong>6</strong><br>
                                                <span class="text-muted">Projects</span>
                                            </div>
                                            <div class="col-4">
                                                <strong>4</strong><br>
                                                <span class="text-muted">Clients</span>
                                            </div>
                                            <div class="col-4">
                                                <strong>89%</strong><br>
                                                <span class="text-muted">Performance</span>
                                            </div>
                                        </div>
                                        <div class="mb-3">
                                            <span class="badge bg-danger me-1">Executive</span>
                                            <span class="badge bg-secondary">On-site</span>
                                        </div>
                                        <div class="btn-group w-100">
                                            <button class="btn btn-outline-primary btn-sm">
                                                <i class="fas fa-eye"></i> Profile
                                            </button>
                                            <button class="btn btn-outline-info btn-sm">
                                                <i class="fas fa-envelope"></i> Message
                                            </button>
                                            <button class="btn btn-outline-success btn-sm">
                                                <i class="fas fa-edit"></i> Edit
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Team Member 5: Lisa Thompson -->
                            <div class="col-md-6 col-lg-4">
                                <div class="card h-100">
                                    <div class="card-body text-center">
                                        <div class="position-relative d-inline-block mb-3">
                                            <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face" 
                                                 class="rounded-circle" style="width: 80px; height: 80px; object-fit: cover;" alt="Lisa Thompson">
                                            <span class="position-absolute bottom-0 end-0 bg-success rounded-circle border border-white" 
                                                  style="width: 20px; height: 20px;"></span>
                                        </div>
                                        <h6 class="card-title">Lisa Thompson</h6>
                                        <p class="text-danger small mb-2">Creative Director</p>
                                        <p class="text-muted small mb-3">Creative Services</p>
                                        <div class="row text-center small mb-3">
                                            <div class="col-4">
                                                <strong>9</strong><br>
                                                <span class="text-muted">Projects</span>
                                            </div>
                                            <div class="col-4">
                                                <strong>7</strong><br>
                                                <span class="text-muted">Clients</span>
                                            </div>
                                            <div class="col-4">
                                                <strong>96%</strong><br>
                                                <span class="text-muted">Performance</span>
                                            </div>
                                        </div>
                                        <div class="mb-3">
                                            <span class="badge bg-info me-1">Director</span>
                                            <span class="badge bg-success">Remote</span>
                                        </div>
                                        <div class="btn-group w-100">
                                            <button class="btn btn-outline-primary btn-sm">
                                                <i class="fas fa-eye"></i> Profile
                                            </button>
                                            <button class="btn btn-outline-info btn-sm">
                                                <i class="fas fa-envelope"></i> Message
                                            </button>
                                            <button class="btn btn-outline-success btn-sm">
                                                <i class="fas fa-edit"></i> Edit
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Add Team Member Card -->
                            <div class="col-md-6 col-lg-4">
                                <div class="card h-100 border-dashed border-2">
                                    <div class="card-body text-center d-flex flex-column justify-content-center">
                                        <i class="fas fa-plus-circle fa-3x text-muted mb-3"></i>
                                        <h6 class="card-title text-muted">Add Team Member</h6>
                                        <p class="text-muted small mb-3">Invite a new team member to join your agency</p>
                                        <button class="btn btn-success">
                                            <i class="fas fa-user-plus me-2"></i> Add Member
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Bottom Section -->
        <div class="row">
            <div class="col-lg-8">
                <?php
                $teamTableHeaders = ['Member', 'Role', 'Department', 'Projects', 'Performance', 'Status'];
                $teamTableRows = [
                    [
                        '<div class="d-flex align-items-center"><img src="https://images.unsplash.com/photo-1494790108755-2616b612b5c5?w=30&h=30&fit=crop&crop=face" class="rounded-circle me-2" style="width: 30px; height: 30px;"><strong>Sarah Williams</strong></div>',
                        'Senior Agent',
                        'Talent Management',
                        '12',
                        '<span class="text-success">97%</span>',
                        '<span class="badge bg-success">Active</span>'
                    ],
                    [
                        '<div class="d-flex align-items-center"><img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=30&h=30&fit=crop&crop=face" class="rounded-circle me-2" style="width: 30px; height: 30px;"><strong>Michael Chen</strong></div>',
                        'Talent Scout',
                        'Talent Management',
                        '8',
                        '<span class="text-success">95%</span>',
                        '<span class="badge bg-success">Active</span>'
                    ],
                    [
                        '<div class="d-flex align-items-center"><img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=30&h=30&fit=crop&crop=face" class="rounded-circle me-2" style="width: 30px; height: 30px;"><strong>Emma Rodriguez</strong></div>',
                        'Project Manager',
                        'Operations',
                        '15',
                        '<span class="text-warning">92%</span>',
                        '<span class="badge bg-warning text-dark">Away</span>'
                    ],
                    [
                        '<div class="d-flex align-items-center"><img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=30&h=30&fit=crop&crop=face" class="rounded-circle me-2" style="width: 30px; height: 30px;"><strong>David Kim</strong></div>',
                        'Account Executive',
                        'Business Development',
                        '6',
                        '<span class="text-warning">89%</span>',
                        '<span class="badge bg-success">Active</span>'
                    ],
                    [
                        '<div class="d-flex align-items-center"><img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=30&h=30&fit=crop&crop=face" class="rounded-circle me-2" style="width: 30px; height: 30px;"><strong>Lisa Thompson</strong></div>',
                        'Creative Director',
                        'Creative Services',
                        '9',
                        '<span class="text-success">96%</span>',
                        '<span class="badge bg-success">Active</span>'
                    ]
                ];
                echo createDataTable('Team Overview', $teamTableHeaders, $teamTableRows, true);
                ?>
            </div>
            <div class="col-lg-4">
                <?php echo createCard(
                    "Team Management",
                    '
                    <div class="d-grid gap-2">
                        <button class="btn btn-success">
                            <i class="fas fa-user-plus me-2"></i> Add Team Member
                        </button>
                        <button class="btn btn-primary">
                            <i class="fas fa-users-cog me-2"></i> Manage Roles
                        </button>
                        <button class="btn btn-info">
                            <i class="fas fa-calendar me-2"></i> Schedule Meeting
                        </button>
                        <button class="btn btn-warning">
                            <i class="fas fa-chart-bar me-2"></i> Performance Review
                        </button>
                        <button class="btn btn-secondary">
                            <i class="fas fa-cog me-2"></i> Team Settings
                        </button>
                    </div>
                    '
                ); ?>
                
                <div class="mt-3">
                    <?php echo createCard(
                        "Team Performance",
                        '
                        <div class="text-center mb-3">
                            <h4 class="text-success">94%</h4>
                            <small class="text-muted">Overall Team Performance</small>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <span class="small">Project Completion</span>
                                <span class="fw-bold">96%</span>
                            </div>
                            <div class="progress mb-2" style="height: 6px;">
                                <div class="progress-bar bg-success" style="width: 96%"></div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <span class="small">Client Satisfaction</span>
                                <span class="fw-bold">93%</span>
                            </div>
                            <div class="progress mb-2" style="height: 6px;">
                                <div class="progress-bar bg-primary" style="width: 93%"></div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <span class="small">Team Collaboration</span>
                                <span class="fw-bold">89%</span>
                            </div>
                            <div class="progress mb-2" style="height: 6px;">
                                <div class="progress-bar bg-info" style="width: 89%"></div>
                            </div>
                        </div>
                        <hr>
                        <div class="text-center">
                            <small class="text-muted">Last updated: Dec 10, 2024</small>
                        </div>
                        '
                    ); ?>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Add Team Member Modal -->
<div class="modal fade" id="addTeamMemberModal" tabindex="-1">
    <div class="modal-dialog modal-xl">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Add Team Member</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form id="addTeamMemberForm">
                <div class="modal-body">
                    <div class="row g-3">
                        <!-- Personal Information -->
                        <div class="col-12"><h6 class="border-bottom pb-2 mb-3">Personal Information</h6></div>
                        <div class="col-md-4">
                            <label class="form-label">First Name *</label>
                            <input type="text" class="form-control" name="first_name" required>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Last Name *</label>
                            <input type="text" class="form-control" name="last_name" required>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Email *</label>
                            <input type="email" class="form-control" name="email" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Phone</label>
                            <input type="tel" class="form-control" name="phone">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Date of Birth</label>
                            <input type="date" class="form-control" name="dob">
                        </div>
                        
                        <!-- Role & Department -->
                        <div class="col-12"><h6 class="border-bottom pb-2 mb-3 mt-4">Role & Department</h6></div>
                        <div class="col-md-4">
                            <label class="form-label">Department *</label>
                            <select class="form-select" name="department" required>
                                <option value="">Select Department</option>
                                <option value="Talent Management">Talent Management</option>
                                <option value="Business Development">Business Development</option>
                                <option value="Creative Services">Creative Services</option>
                                <option value="Operations">Operations</option>
                                <option value="Administration">Administration</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Role *</label>
                            <select class="form-select" name="role" required>
                                <option value="">Select Role</option>
                                <option value="Senior Agent">Senior Agent</option>
                                <option value="Talent Scout">Talent Scout</option>
                                <option value="Project Manager">Project Manager</option>
                                <option value="Creative Director">Creative Director</option>
                                <option value="Account Executive">Account Executive</option>
                                <option value="Coordinator">Coordinator</option>
                                <option value="Assistant">Assistant</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Employment Type *</label>
                            <select class="form-select" name="employment_type" required>
                                <option value="">Select Type</option>
                                <option value="Full-time">Full-time</option>
                                <option value="Part-time">Part-time</option>
                                <option value="Contract">Contract</option>
                                <option value="Intern">Intern</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Start Date *</label>
                            <input type="date" class="form-control" name="start_date" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Salary/Rate</label>
                            <input type="number" class="form-control" name="salary" placeholder="Annual salary or hourly rate">
                        </div>
                        
                        <!-- Work Preferences -->
                        <div class="col-12"><h6 class="border-bottom pb-2 mb-3 mt-4">Work Preferences</h6></div>
                        <div class="col-md-6">
                            <label class="form-label">Work Location *</label>
                            <select class="form-select" name="work_location" required>
                                <option value="">Select Location</option>
                                <option value="On-site">On-site</option>
                                <option value="Remote">Remote</option>
                                <option value="Hybrid">Hybrid</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Reports To</label>
                            <select class="form-select" name="reports_to">
                                <option value="">Select Manager</option>
                                <option value="Sarah Williams">Sarah Williams (Senior Agent)</option>
                                <option value="Emma Rodriguez">Emma Rodriguez (Project Manager)</option>
                                <option value="Lisa Thompson">Lisa Thompson (Creative Director)</option>
                            </select>
                        </div>
                        
                        <!-- Access & Permissions -->
                        <div class="col-12"><h6 class="border-bottom pb-2 mb-3 mt-4">Access & Permissions</h6></div>
                        <div class="col-12">
                            <label class="form-label">System Access Level</label>
                            <div class="row">
                                <div class="col-md-3">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" name="permissions[]" value="talent_management" id="permTalent">
                                        <label class="form-check-label" for="permTalent">
                                            Talent Management
                                        </label>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" name="permissions[]" value="project_management" id="permProject">
                                        <label class="form-check-label" for="permProject">
                                            Project Management
                                        </label>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" name="permissions[]" value="client_management" id="permClient">
                                        <label class="form-check-label" for="permClient">
                                            Client Management
                                        </label>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" name="permissions[]" value="financial_access" id="permFinance">
                                        <label class="form-check-label" for="permFinance">
                                            Financial Access
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-success">Add Team Member</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Edit Team Member Modal -->
<div class="modal fade" id="editTeamMemberModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Edit Team Member</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form id="editTeamMemberForm">
                <div class="modal-body">
                    <input type="hidden" name="member_id" id="edit_member_id">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label">Full Name</label>
                            <input type="text" class="form-control" name="full_name" id="edit_full_name" readonly>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Email</label>
                            <input type="email" class="form-control" name="email" id="edit_email">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Role</label>
                            <select class="form-select" name="role" id="edit_role">
                                <option value="Senior Agent">Senior Agent</option>
                                <option value="Talent Scout">Talent Scout</option>
                                <option value="Project Manager">Project Manager</option>
                                <option value="Creative Director">Creative Director</option>
                                <option value="Account Executive">Account Executive</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Department</label>
                            <select class="form-select" name="department" id="edit_department">
                                <option value="Talent Management">Talent Management</option>
                                <option value="Business Development">Business Development</option>
                                <option value="Creative Services">Creative Services</option>
                                <option value="Operations">Operations</option>
                                <option value="Administration">Administration</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Status</label>
                            <select class="form-select" name="status" id="edit_status">
                                <option value="Active">Active</option>
                                <option value="On Leave">On Leave</option>
                                <option value="Remote">Remote</option>
                                <option value="Part-time">Part-time</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Work Location</label>
                            <select class="form-select" name="work_location" id="edit_work_location">
                                <option value="On-site">On-site</option>
                                <option value="Remote">Remote</option>
                                <option value="Hybrid">Hybrid</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">Update Member</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Team Member Profile Modal -->
<div class="modal fade" id="teamMemberProfileModal" tabindex="-1">
    <div class="modal-dialog modal-xl">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="profileModalTitle">Team Member Profile</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-md-4">
                        <div class="text-center">
                            <img id="profileImage" src="" class="rounded-circle mb-3" style="width: 120px; height: 120px; object-fit: cover;" alt="Profile">
                            <h5 id="profileName"></h5>
                            <p class="text-muted" id="profileRole"></p>
                            <p class="text-muted small" id="profileDepartment"></p>
                            <div class="d-flex justify-content-center gap-2 mb-3">
                                <button class="btn btn-primary btn-sm">
                                    <i class="fas fa-envelope"></i> Message
                                </button>
                                <button class="btn btn-success btn-sm">
                                    <i class="fas fa-calendar"></i> Schedule
                                </button>
                            </div>
                        </div>
                        
                        <!-- Performance Stats -->
                        <div class="card">
                            <div class="card-body">
                                <h6>Performance Overview</h6>
                                <div class="row text-center">
                                    <div class="col-6">
                                        <strong id="profileProjects"></strong><br>
                                        <span class="text-muted small">Projects</span>
                                    </div>
                                    <div class="col-6">
                                        <strong id="profilePerformance"></strong><br>
                                        <span class="text-muted small">Rating</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-8">
                        <ul class="nav nav-tabs mb-3">
                            <li class="nav-item">
                                <a class="nav-link active" data-bs-toggle="tab" href="#profileDetails">Details</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" data-bs-toggle="tab" href="#profileProjects">Projects</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" data-bs-toggle="tab" href="#profileActivity">Activity</a>
                            </li>
                        </ul>
                        
                        <div class="tab-content">
                            <div class="tab-pane fade show active" id="profileDetails">
                                <div id="profileDetailsContent">
                                    <!-- Details will be loaded here -->
                                </div>
                            </div>
                            <div class="tab-pane fade" id="profileProjects">
                                <div id="profileProjectsContent">
                                    <!-- Projects will be loaded here -->
                                </div>
                            </div>
                            <div class="tab-pane fade" id="profileActivity">
                                <div id="profileActivityContent">
                                    <!-- Activity will be loaded here -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Message Team Member Modal -->
<div class="modal fade" id="messageTeamMemberModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Send Message</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form id="messageTeamMemberForm">
                <div class="modal-body">
                    <input type="hidden" name="recipient_id" id="message_recipient_id">
                    <div class="mb-3">
                        <label class="form-label">To:</label>
                        <div class="alert alert-light" id="messageRecipient"></div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Subject *</label>
                        <input type="text" class="form-control" name="subject" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Message *</label>
                        <textarea class="form-control" name="message" rows="5" required></textarea>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Priority</label>
                        <select class="form-select" name="priority">
                            <option value="normal">Normal</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">Send Message</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    initializeTeamManagement();
});

// Sample team database
const teamDatabase = [
    {
        id: 1,
        name: 'Sarah Williams',
        role: 'Senior Agent',
        department: 'Talent Management',
        email: 'sarah.williams@elite.com',
        projects: 12,
        clients: 8,
        performance: 97,
        status: 'Active',
        workLocation: 'Remote',
        image: 'https://images.unsplash.com/photo-1494790108755-2616b612b5c5?w=80&h=80&fit=crop&crop=face',
        joinDate: '2021-03-15',
        badges: ['Team Lead', 'Remote'],
        statusColor: 'success'
    },
    {
        id: 2,
        name: 'Michael Chen',
        role: 'Talent Scout',
        department: 'Talent Management',
        email: 'michael.chen@elite.com',
        projects: 8,
        clients: 5,
        performance: 95,
        status: 'Active',
        workLocation: 'On-site',
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face',
        joinDate: '2022-01-10',
        badges: ['Scout', 'On-site'],
        statusColor: 'success'
    },
    {
        id: 3,
        name: 'Emma Rodriguez',
        role: 'Project Manager',
        department: 'Operations',
        email: 'emma.rodriguez@elite.com',
        projects: 15,
        clients: 12,
        performance: 92,
        status: 'Away',
        workLocation: 'Hybrid',
        image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face',
        joinDate: '2020-08-22',
        badges: ['Manager', 'Away'],
        statusColor: 'warning'
    },
    {
        id: 4,
        name: 'David Kim',
        role: 'Account Executive',
        department: 'Business Development',
        email: 'david.kim@elite.com',
        projects: 6,
        clients: 4,
        performance: 89,
        status: 'Active',
        workLocation: 'On-site',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
        joinDate: '2022-11-05',
        badges: ['Executive', 'On-site'],
        statusColor: 'success'
    },
    {
        id: 5,
        name: 'Lisa Thompson',
        role: 'Creative Director',
        department: 'Creative Services',
        email: 'lisa.thompson@elite.com',
        projects: 9,
        clients: 7,
        performance: 96,
        status: 'Active',
        workLocation: 'Remote',
        image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face',
        joinDate: '2021-07-18',
        badges: ['Director', 'Remote'],
        statusColor: 'success'
    }
];

let currentTeam = teamDatabase;

function initializeTeamManagement() {
    setupTeamFilters();
    setupViewToggle();
    setupTeamActions();
    setupQuickActions();
    setupFormHandlers();
    displayTeamMembers(teamDatabase);
}

function setupTeamFilters() {
    const filterForm = document.getElementById('teamFilterForm');
    const searchInput = document.getElementById('searchTeam');
    const filterInputs = [
        document.getElementById('filterDepartment'),
        document.getElementById('filterRole'),
        document.getElementById('filterStatus'),
        document.getElementById('sortTeam')
    ];

    filterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        filterTeam();
    });

    searchInput.addEventListener('input', debounce(filterTeam, 300));
    
    filterInputs.forEach(input => {
        if (input) {
            input.addEventListener('change', filterTeam);
        }
    });
}

function setupViewToggle() {
    const viewButtons = document.querySelectorAll('.btn-group .btn');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            viewButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const view = this.innerHTML.includes('Grid') ? 'grid' : 'list';
            toggleTeamView(view);
        });
    });
}

function setupTeamActions() {
    document.addEventListener('click', function(e) {
        // Profile button
        if (e.target.closest('.btn-outline-primary') && e.target.closest('.btn-outline-primary').innerHTML.includes('Profile')) {
            const card = e.target.closest('.card');
            viewTeamMemberProfile(card);
        }
        
        // Message button
        if (e.target.closest('.btn-outline-info') && e.target.closest('.btn-outline-info').innerHTML.includes('Message')) {
            const card = e.target.closest('.card');
            messageTeamMember(card);
        }
        
        // Edit button
        if (e.target.closest('.btn-outline-success') && e.target.closest('.btn-outline-success').innerHTML.includes('Edit')) {
            const card = e.target.closest('.card');
            editTeamMember(card);
        }
        
        // Add member button
        if (e.target.closest('.btn-success') && e.target.closest('.btn-success').innerHTML.includes('Add Member')) {
            showModal('addTeamMemberModal');
        }
    });
}

function setupQuickActions() {
    const quickActions = {
        'Add Team Member': () => showModal('addTeamMemberModal'),
        'Manage Roles': () => alert('Role management would open here\n\nFeatures:\n• Define custom roles\n• Set permissions\n• Role hierarchy\n• Access controls'),
        'Schedule Meeting': () => alert('Meeting scheduler would open here\n\nFeatures:\n• Team calendar integration\n• Meeting room booking\n• Invite participants\n• Agenda planning'),
        'Performance Review': () => alert('Performance review system would open here\n\nFeatures:\n• Review templates\n• Goal tracking\n• Feedback collection\n• Performance analytics'),
        'Team Settings': () => alert('Team settings would open here\n\nFeatures:\n• Department configuration\n• Workflow settings\n• Notification preferences\n• Team policies')
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
    // Add Team Member Form
    document.getElementById('addTeamMemberForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        addTeamMember(formData);
    });
    
    // Edit Team Member Form
    document.getElementById('editTeamMemberForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        updateTeamMember(formData);
    });
    
    // Message Team Member Form
    document.getElementById('messageTeamMemberForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        sendTeamMessage(formData);
    });
}

function filterTeam() {
    const searchTerm = document.getElementById('searchTeam').value.toLowerCase();
    const departmentFilter = document.getElementById('filterDepartment').value;
    const roleFilter = document.getElementById('filterRole').value;
    const statusFilter = document.getElementById('filterStatus').value;
    const sortBy = document.getElementById('sortTeam').value;
    
    let filtered = teamDatabase.filter(member => {
        const matchesSearch = member.name.toLowerCase().includes(searchTerm) ||
                             member.email.toLowerCase().includes(searchTerm) ||
                             member.role.toLowerCase().includes(searchTerm);
        
        const matchesDepartment = !departmentFilter || departmentFilter === 'All Departments' || 
                                 member.department === departmentFilter;
        
        const matchesRole = !roleFilter || roleFilter === 'All Roles' || 
                           member.role === roleFilter;
        
        const matchesStatus = !statusFilter || statusFilter === 'All Status' || 
                             member.status === statusFilter;
        
        return matchesSearch && matchesDepartment && matchesRole && matchesStatus;
    });
    
    // Apply sorting
    if (sortBy.includes('Name')) {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy.includes('Role')) {
        filtered.sort((a, b) => a.role.localeCompare(b.role));
    } else if (sortBy.includes('Performance')) {
        filtered.sort((a, b) => b.performance - a.performance);
    } else if (sortBy.includes('Join Date')) {
        filtered.sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate));
    }
    
    currentTeam = filtered;
    displayTeamMembers(filtered);
    updateTeamStats(filtered);
}

function displayTeamMembers(members) {
    const container = document.getElementById('teamGrid');
    
    if (members.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-users fa-3x text-muted mb-3"></i>
                <h5>No team members found</h5>
                <p class="text-muted">Try adjusting your search criteria</p>
            </div>
        `;
        return;
    }
    
    const membersHtml = members.map(member => `
        <div class="col-md-6 col-lg-4">
            <div class="card h-100 team-member-card" data-member-id="${member.id}">
                <div class="card-body text-center">
                    <div class="position-relative d-inline-block mb-3">
                        <img src="${member.image}" 
                             class="rounded-circle" style="width: 80px; height: 80px; object-fit: cover;" alt="${member.name}">
                        <span class="position-absolute bottom-0 end-0 bg-${member.statusColor} rounded-circle border border-white" 
                              style="width: 20px; height: 20px;"></span>
                    </div>
                    <h6 class="card-title">${member.name}</h6>
                    <p class="text-primary small mb-2">${member.role}</p>
                    <p class="text-muted small mb-3">${member.department}</p>
                    <div class="row text-center small mb-3">
                        <div class="col-4">
                            <strong>${member.projects}</strong><br>
                            <span class="text-muted">Projects</span>
                        </div>
                        <div class="col-4">
                            <strong>${member.clients}</strong><br>
                            <span class="text-muted">Clients</span>
                        </div>
                        <div class="col-4">
                            <strong>${member.performance}%</strong><br>
                            <span class="text-muted">Performance</span>
                        </div>
                    </div>
                    <div class="mb-3">
                        ${member.badges.map(badge => `<span class="badge bg-${getBadgeColor(badge)} me-1">${badge}</span>`).join('')}
                    </div>
                    <div class="btn-group w-100">
                        <button class="btn btn-outline-primary btn-sm">
                            <i class="fas fa-eye"></i> Profile
                        </button>
                        <button class="btn btn-outline-info btn-sm">
                            <i class="fas fa-envelope"></i> Message
                        </button>
                        <button class="btn btn-outline-success btn-sm">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    // Add the "Add Team Member" card
    const addMemberCard = `
        <div class="col-md-6 col-lg-4">
            <div class="card h-100 border-dashed border-2">
                <div class="card-body text-center d-flex flex-column justify-content-center">
                    <i class="fas fa-plus-circle fa-3x text-muted mb-3"></i>
                    <h6 class="card-title text-muted">Add Team Member</h6>
                    <p class="text-muted small mb-3">Invite a new team member to join your agency</p>
                    <button class="btn btn-success">
                        <i class="fas fa-user-plus me-2"></i> Add Member
                    </button>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = membersHtml + addMemberCard;
}

function getBadgeColor(badge) {
    const colorMap = {
        'Team Lead': 'success',
        'Remote': 'info',
        'Scout': 'warning',
        'On-site': 'secondary',
        'Manager': 'primary',
        'Away': 'warning',
        'Executive': 'danger',
        'Director': 'info'
    };
    return colorMap[badge] || 'secondary';
}

function updateTeamStats(members) {
    const statsCards = document.querySelectorAll('.stat-card');
    if (statsCards.length >= 4) {
        statsCards[0].querySelector('h3').textContent = members.length;
        
        // Active projects (sum of all member projects)
        const totalProjects = members.reduce((sum, member) => sum + member.projects, 0);
        statsCards[1].querySelector('h3').textContent = totalProjects;
        
        // Departments (unique count)
        const uniqueDepartments = [...new Set(members.map(m => m.department))].length;
        statsCards[2].querySelector('h3').textContent = uniqueDepartments;
        
        // Average performance
        const avgPerformance = Math.round(members.reduce((sum, member) => sum + member.performance, 0) / members.length);
        statsCards[3].querySelector('h3').textContent = `${avgPerformance}%`;
    }
}

function toggleTeamView(view) {
    const container = document.getElementById('teamGrid');
    const cards = container.querySelectorAll('.col-md-6, .col-lg-4');
    
    if (view === 'list') {
        cards.forEach(card => {
            card.className = 'col-12 mb-3';
        });
    } else {
        cards.forEach(card => {
            card.className = 'col-md-6 col-lg-4';
        });
    }
}

function viewTeamMemberProfile(card) {
    const memberId = parseInt(card.dataset.memberId);
    const member = teamDatabase.find(m => m.id === memberId);
    
    if (member) {
        // Populate modal
        document.getElementById('profileModalTitle').textContent = `${member.name} - Profile`;
        document.getElementById('profileImage').src = member.image;
        document.getElementById('profileName').textContent = member.name;
        document.getElementById('profileRole').textContent = member.role;
        document.getElementById('profileDepartment').textContent = member.department;
        document.getElementById('profileProjects').textContent = member.projects;
        document.getElementById('profilePerformance').textContent = `${member.performance}%`;
        
        // Load profile details
        loadMemberDetails(member);
        loadMemberProjects(member);
        loadMemberActivity(member);
        
        showModal('teamMemberProfileModal');
    }
}

function loadMemberDetails(member) {
    const detailsContainer = document.getElementById('profileDetailsContent');
    detailsContainer.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h6>Contact Information</h6>
                <ul class="list-unstyled">
                    <li><strong>Email:</strong> ${member.email}</li>
                    <li><strong>Department:</strong> ${member.department}</li>
                    <li><strong>Status:</strong> ${member.status}</li>
                    <li><strong>Work Location:</strong> ${member.workLocation}</li>
                </ul>
                
                <h6 class="mt-4">Employment Details</h6>
                <ul class="list-unstyled">
                    <li><strong>Join Date:</strong> ${new Date(member.joinDate).toLocaleDateString()}</li>
                    <li><strong>Employee ID:</strong> ELT${member.id.toString().padStart(3, '0')}</li>
                    <li><strong>Reports To:</strong> Sarah Williams</li>
                </ul>
            </div>
            <div class="col-md-6">
                <h6>Performance Metrics</h6>
                <div class="mb-3">
                    <div class="d-flex justify-content-between">
                        <span class="small">Project Success Rate</span>
                        <span class="fw-bold">${member.performance}%</span>
                    </div>
                    <div class="progress" style="height: 6px;">
                        <div class="progress-bar bg-success" style="width: ${member.performance}%"></div>
                    </div>
                </div>
                <div class="mb-3">
                    <div class="d-flex justify-content-between">
                        <span class="small">Client Satisfaction</span>
                        <span class="fw-bold">${member.performance - 2}%</span>
                    </div>
                    <div class="progress" style="height: 6px;">
                        <div class="progress-bar bg-primary" style="width: ${member.performance - 2}%"></div>
                    </div>
                </div>
                <div class="mb-3">
                    <div class="d-flex justify-content-between">
                        <span class="small">Team Collaboration</span>
                        <span class="fw-bold">${member.performance - 5}%</span>
                    </div>
                    <div class="progress" style="height: 6px;">
                        <div class="progress-bar bg-info" style="width: ${member.performance - 5}%"></div>
                    </div>
                </div>
                
                <h6 class="mt-4">Skills & Expertise</h6>
                <div class="mb-3">
                    <span class="badge bg-primary me-1">Team Leadership</span>
                    <span class="badge bg-success me-1">Client Relations</span>
                    <span class="badge bg-info me-1">Project Management</span>
                    <span class="badge bg-warning">Strategic Planning</span>
                </div>
            </div>
        </div>
    `;
}

function loadMemberProjects(member) {
    const projectsContainer = document.getElementById('profileProjectsContent');
    projectsContainer.innerHTML = `
        <div class="table-responsive">
            <table class="table table-sm">
                <thead>
                    <tr>
                        <th>Project</th>
                        <th>Client</th>
                        <th>Status</th>
                        <th>Completion</th>
                        <th>Deadline</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Vogue Editorial Shoot</td>
                        <td>Vogue Magazine</td>
                        <td><span class="badge bg-success">Completed</span></td>
                        <td>100%</td>
                        <td>Dec 15, 2024</td>
                    </tr>
                    <tr>
                        <td>Nike Campaign</td>
                        <td>Nike Inc.</td>
                        <td><span class="badge bg-primary">In Progress</span></td>
                        <td>75%</td>
                        <td>Dec 20, 2024</td>
                    </tr>
                    <tr>
                        <td>Calvin Klein Runway</td>
                        <td>Calvin Klein</td>
                        <td><span class="badge bg-warning">Planning</span></td>
                        <td>25%</td>
                        <td>Jan 10, 2025</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
}

function loadMemberActivity(member) {
    const activityContainer = document.getElementById('profileActivityContent');
    activityContainer.innerHTML = `
        <div class="timeline">
            <div class="timeline-item">
                <div class="timeline-marker bg-success"></div>
                <div class="timeline-content">
                    <h6 class="timeline-title">Project Completed</h6>
                    <p class="timeline-description">Successfully completed Vogue Editorial project</p>
                    <small class="text-muted">2 hours ago</small>
                </div>
            </div>
            <div class="timeline-item">
                <div class="timeline-marker bg-primary"></div>
                <div class="timeline-content">
                    <h6 class="timeline-title">Client Meeting</h6>
                    <p class="timeline-description">Attended Nike campaign planning meeting</p>
                    <small class="text-muted">1 day ago</small>
                </div>
            </div>
            <div class="timeline-item">
                <div class="timeline-marker bg-info"></div>
                <div class="timeline-content">
                    <h6 class="timeline-title">New Project Assignment</h6>
                    <p class="timeline-description">Assigned to Calvin Klein runway project</p>
                    <small class="text-muted">3 days ago</small>
                </div>
            </div>
        </div>
    `;
}

function messageTeamMember(card) {
    const memberId = parseInt(card.dataset.memberId);
    const member = teamDatabase.find(m => m.id === memberId);
    
    if (member) {
        document.getElementById('messageRecipient').textContent = `${member.name} (${member.role})`;
        document.getElementById('message_recipient_id').value = memberId;
        showModal('messageTeamMemberModal');
    }
}

function editTeamMember(card) {
    const memberId = parseInt(card.dataset.memberId);
    const member = teamDatabase.find(m => m.id === memberId);
    
    if (member) {
        document.getElementById('edit_member_id').value = memberId;
        document.getElementById('edit_full_name').value = member.name;
        document.getElementById('edit_email').value = member.email;
        document.getElementById('edit_role').value = member.role;
        document.getElementById('edit_department').value = member.department;
        document.getElementById('edit_status').value = member.status;
        document.getElementById('edit_work_location').value = member.workLocation;
        
        showModal('editTeamMemberModal');
    }
}

function addTeamMember(formData) {
    const memberData = Object.fromEntries(formData);
    console.log('Adding team member:', memberData);
    
    showToast('Team member added successfully!', 'success');
    hideModal('addTeamMemberModal');
    document.getElementById('addTeamMemberForm').reset();
}

function updateTeamMember(formData) {
    const memberData = Object.fromEntries(formData);
    console.log('Updating team member:', memberData);
    
    showToast('Team member updated successfully!', 'success');
    hideModal('editTeamMemberModal');
}

function sendTeamMessage(formData) {
    const messageData = Object.fromEntries(formData);
    console.log('Sending message:', messageData);
    
    showToast('Message sent successfully!', 'success');
    hideModal('messageTeamMemberModal');
    document.getElementById('messageTeamMemberForm').reset();
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showModal(modalId) {
    const modal = new bootstrap.Modal(document.getElementById(modalId));
    modal.show();
}

function hideModal(modalId) {
    const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
    if (modal) modal.hide();
}

function showToast(message, type = 'info') {
    const toastHtml = `
        <div class="toast align-items-center text-white bg-${type} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
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
    
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}
</script>

<style>
.team-member-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    transition: all 0.3s ease;
}

.border-dashed {
    border-style: dashed !important;
}

.toast-container {
    z-index: 1055;
}

.timeline {
    position: relative;
    padding-left: 30px;
}

.timeline-item {
    position: relative;
    margin-bottom: 20px;
}

.timeline-marker {
    position: absolute;
    left: -35px;
    top: 5px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
}

.timeline-content {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
    border-left: 3px solid #dee2e6;
}

.timeline-title {
    margin-bottom: 5px;
    font-size: 0.9rem;
}

.timeline-description {
    margin-bottom: 5px;
    font-size: 0.8rem;
    color: #6c757d;
}

.modal-xl {
    max-width: 1200px;
}

.nav-tabs .nav-link.active {
    background-color: #6366f1;
    border-color: #6366f1;
    color: white;
}
</style>

<?php echo renderFooter(); ?>