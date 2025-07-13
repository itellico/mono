<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Applications Management - Go Models NYC", "Admin User", "Marketplace Admin", "Tenant");
?>

<div class="d-flex">
    <?php echo renderSidebar('Tenant', getTenantSidebarItems(), 'applications/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Tenant', 'href' => '../index.php'],
            ['label' => 'Applications']
        ]);
        
        echo createHeroSection(
            "Applications Management",
            "Review and manage all casting applications from talent in your marketplace",
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=300&fit=crop",
            [
                ['label' => 'Review All', 'icon' => 'fas fa-eye', 'style' => 'primary'],
                ['label' => 'Approve Selected', 'icon' => 'fas fa-check', 'style' => 'success'],
                ['label' => 'Send Messages', 'icon' => 'fas fa-envelope', 'style' => 'info']
            ]
        );
        ?>
        
        <!-- Application Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('New Applications', '89', 'fas fa-file-alt', 'primary');
            echo createStatCard('Under Review', '156', 'fas fa-clock', 'warning');
            echo createStatCard('Approved', '234', 'fas fa-check-circle', 'success');
            echo createStatCard('Total Today', '67', 'fas fa-calendar-day', 'info');
            ?>
        </div>
        
        <!-- Filter and Status Bar -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-md-3">
                                <input type="text" class="form-control" placeholder="Search by model name...">
                            </div>
                            <div class="col-md-2">
                                <select class="form-select">
                                    <option>All Castings</option>
                                    <option>Vogue Summer Campaign</option>
                                    <option>Nike Athletic Campaign</option>
                                    <option>H&M Fall Collection</option>
                                    <option>Zara Commercial</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <select class="form-select">
                                    <option>All Status</option>
                                    <option>New</option>
                                    <option>Under Review</option>
                                    <option>Approved</option>
                                    <option>Rejected</option>
                                    <option>Withdrawn</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <select class="form-select">
                                    <option>All Dates</option>
                                    <option>Today</option>
                                    <option>This Week</option>
                                    <option>This Month</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <select class="form-select">
                                    <option>Sort by Date</option>
                                    <option>Sort by Rating</option>
                                    <option>Sort by Experience</option>
                                    <option>Sort by Status</option>
                                </select>
                            </div>
                            <div class="col-md-1">
                                <button type="submit" class="btn btn-primary w-100">
                                    <i class="fas fa-search"></i>
                                </button>
                            </div>
                        </div>
                        <div class="row mt-3">
                            <div class="col-12">
                                <div class="btn-group me-2">
                                    <button class="btn btn-outline-success btn-sm">
                                        <i class="fas fa-check me-1"></i> Approve Selected
                                    </button>
                                    <button class="btn btn-outline-danger btn-sm">
                                        <i class="fas fa-times me-1"></i> Reject Selected
                                    </button>
                                    <button class="btn btn-outline-info btn-sm">
                                        <i class="fas fa-envelope me-1"></i> Message Selected
                                    </button>
                                </div>
                                <small class="text-muted">Select applications below to perform bulk actions</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Applications Table -->
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <div class="d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Recent Applications</h5>
                            <div>
                                <input type="checkbox" class="form-check-input me-2" id="selectAll">
                                <label for="selectAll" class="form-check-label">Select All</label>
                            </div>
                        </div>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-hover mb-0">
                                <thead class="table-light">
                                    <tr>
                                        <th width="50px">
                                            <input type="checkbox" class="form-check-input">
                                        </th>
                                        <th>Model</th>
                                        <th>Casting Call</th>
                                        <th>Applied</th>
                                        <th>Experience</th>
                                        <th>Rating</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            <input type="checkbox" class="form-check-input">
                                        </td>
                                        <td>
                                            <div class="d-flex align-items-center">
                                                <img src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=40&h=40&fit=crop&crop=face" 
                                                     class="rounded-circle me-3" style="width: 40px; height: 40px; object-fit: cover;" alt="Emma">
                                                <div>
                                                    <strong>Emma Johnson</strong><br>
                                                    <small class="text-muted">Fashion Model • NYC</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <strong>Vogue Summer Campaign</strong><br>
                                            <small class="text-muted">Vogue Magazine</small>
                                        </td>
                                        <td>
                                            <strong>2 hours ago</strong><br>
                                            <small class="text-muted">Dec 10, 2024</small>
                                        </td>
                                        <td>
                                            <strong>47 Jobs</strong><br>
                                            <small class="text-muted">8 years</small>
                                        </td>
                                        <td>
                                            <span class="text-warning">★★★★★</span><br>
                                            <small class="text-muted">(4.9)</small>
                                        </td>
                                        <td>
                                            <span class="badge bg-primary">New</span>
                                        </td>
                                        <td>
                                            <div class="btn-group btn-group-sm">
                                                <button class="btn btn-outline-primary" title="View Application">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                                <button class="btn btn-outline-success" title="Approve">
                                                    <i class="fas fa-check"></i>
                                                </button>
                                                <button class="btn btn-outline-danger" title="Reject">
                                                    <i class="fas fa-times"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <input type="checkbox" class="form-check-input">
                                        </td>
                                        <td>
                                            <div class="d-flex align-items-center">
                                                <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=40&h=40&fit=crop&crop=face" 
                                                     class="rounded-circle me-3" style="width: 40px; height: 40px; object-fit: cover;" alt="Sofia">
                                                <div>
                                                    <strong>Sofia Martinez</strong><br>
                                                    <small class="text-muted">Editorial Model • LA</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <strong>Nike Athletic Campaign</strong><br>
                                            <small class="text-muted">Nike Inc.</small>
                                        </td>
                                        <td>
                                            <strong>4 hours ago</strong><br>
                                            <small class="text-muted">Dec 10, 2024</small>
                                        </td>
                                        <td>
                                            <strong>62 Jobs</strong><br>
                                            <small class="text-muted">6 years</small>
                                        </td>
                                        <td>
                                            <span class="text-warning">★★★★★</span><br>
                                            <small class="text-muted">(4.8)</small>
                                        </td>
                                        <td>
                                            <span class="badge bg-warning text-dark">Under Review</span>
                                        </td>
                                        <td>
                                            <div class="btn-group btn-group-sm">
                                                <button class="btn btn-outline-primary" title="View Application">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                                <button class="btn btn-outline-success" title="Approve">
                                                    <i class="fas fa-check"></i>
                                                </button>
                                                <button class="btn btn-outline-danger" title="Reject">
                                                    <i class="fas fa-times"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <input type="checkbox" class="form-check-input">
                                        </td>
                                        <td>
                                            <div class="d-flex align-items-center">
                                                <img src="https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=40&h=40&fit=crop&crop=face" 
                                                     class="rounded-circle me-3" style="width: 40px; height: 40px; object-fit: cover;" alt="Isabella">
                                                <div>
                                                    <strong>Isabella Chen</strong><br>
                                                    <small class="text-muted">Runway Model • Miami</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <strong>H&M Fall Collection</strong><br>
                                            <small class="text-muted">H&M Fashion</small>
                                        </td>
                                        <td>
                                            <strong>6 hours ago</strong><br>
                                            <small class="text-muted">Dec 10, 2024</small>
                                        </td>
                                        <td>
                                            <strong>35 Jobs</strong><br>
                                            <small class="text-muted">4 years</small>
                                        </td>
                                        <td>
                                            <span class="text-warning">★★★★★</span><br>
                                            <small class="text-muted">(4.9)</small>
                                        </td>
                                        <td>
                                            <span class="badge bg-success">Approved</span>
                                        </td>
                                        <td>
                                            <div class="btn-group btn-group-sm">
                                                <button class="btn btn-outline-primary" title="View Application">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                                <button class="btn btn-outline-info" title="Message">
                                                    <i class="fas fa-envelope"></i>
                                                </button>
                                                <button class="btn btn-outline-secondary" title="History">
                                                    <i class="fas fa-history"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <input type="checkbox" class="form-check-input">
                                        </td>
                                        <td>
                                            <div class="d-flex align-items-center">
                                                <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face" 
                                                     class="rounded-circle me-3" style="width: 40px; height: 40px; object-fit: cover;" alt="Aria">
                                                <div>
                                                    <strong>Aria Thompson</strong><br>
                                                    <small class="text-muted">Commercial Model • Chicago</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <strong>Zara Commercial Shoot</strong><br>
                                            <small class="text-muted">Zara Fashion</small>
                                        </td>
                                        <td>
                                            <strong>8 hours ago</strong><br>
                                            <small class="text-muted">Dec 9, 2024</small>
                                        </td>
                                        <td>
                                            <strong>89 Jobs</strong><br>
                                            <small class="text-muted">12 years</small>
                                        </td>
                                        <td>
                                            <span class="text-warning">★★★★☆</span><br>
                                            <small class="text-muted">(4.7)</small>
                                        </td>
                                        <td>
                                            <span class="badge bg-danger">Rejected</span>
                                        </td>
                                        <td>
                                            <div class="btn-group btn-group-sm">
                                                <button class="btn btn-outline-primary" title="View Application">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                                <button class="btn btn-outline-info" title="Message">
                                                    <i class="fas fa-envelope"></i>
                                                </button>
                                                <button class="btn btn-outline-secondary" title="History">
                                                    <i class="fas fa-history"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <input type="checkbox" class="form-check-input">
                                        </td>
                                        <td>
                                            <div class="d-flex align-items-center">
                                                <img src="https://images.unsplash.com/photo-1494790108755-2616b612b5c5?w=40&h=40&fit=crop&crop=face" 
                                                     class="rounded-circle me-3" style="width: 40px; height: 40px; object-fit: cover;" alt="Maya">
                                                <div>
                                                    <strong>Maya Rodriguez</strong><br>
                                                    <small class="text-muted">Plus Size Model • NYC</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <strong>Elle Editorial Feature</strong><br>
                                            <small class="text-muted">Elle Magazine</small>
                                        </td>
                                        <td>
                                            <strong>1 day ago</strong><br>
                                            <small class="text-muted">Dec 9, 2024</small>
                                        </td>
                                        <td>
                                            <strong>156 Jobs</strong><br>
                                            <small class="text-muted">9 years</small>
                                        </td>
                                        <td>
                                            <span class="text-warning">★★★★★</span><br>
                                            <small class="text-muted">(4.6)</small>
                                        </td>
                                        <td>
                                            <span class="badge bg-secondary">Withdrawn</span>
                                        </td>
                                        <td>
                                            <div class="btn-group btn-group-sm">
                                                <button class="btn btn-outline-primary" title="View Application">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                                <button class="btn btn-outline-info" title="Message">
                                                    <i class="fas fa-envelope"></i>
                                                </button>
                                                <button class="btn btn-outline-secondary" title="History">
                                                    <i class="fas fa-history"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="card-footer">
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">Showing 5 of 234 applications</small>
                            <nav>
                                <ul class="pagination pagination-sm mb-0">
                                    <li class="page-item disabled">
                                        <span class="page-link">Previous</span>
                                    </li>
                                    <li class="page-item active">
                                        <span class="page-link">1</span>
                                    </li>
                                    <li class="page-item">
                                        <a class="page-link" href="#">2</a>
                                    </li>
                                    <li class="page-item">
                                        <a class="page-link" href="#">3</a>
                                    </li>
                                    <li class="page-item">
                                        <a class="page-link" href="#">Next</a>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php echo renderFooter(); ?>