<?php
require_once '../includes/header.php';
require_once '../includes/sidebar.php';
require_once '../includes/components.php';
require_once '../includes/footer.php';

echo renderHeader("Platform Architecture Overview - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'overview.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => 'index.php'],
            ['label' => 'Architecture Overview']
        ]);
        ?>
        
        <!-- Header Section -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h2 class="mb-1">Platform Architecture Overview</h2>
                <p class="text-muted mb-0">Visualize how features, plans, and templates work together</p>
            </div>
            <div class="btn-group">
                <button class="btn btn-outline-secondary" onclick="printDiagram()">
                    <i class="fas fa-print me-2"></i> Print
                </button>
                <button class="btn btn-primary" onclick="switchIndustry('modeling')">
                    <i class="fas fa-industry me-2"></i> Switch Industry
                </button>
            </div>
        </div>

        <!-- Industry Selector Tabs -->
        <ul class="nav nav-pills mb-4" id="industryTabs">
            <li class="nav-item">
                <a class="nav-link active" href="#" onclick="showIndustry('modeling')">
                    <i class="fas fa-camera me-2"></i> Modeling Platform
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="showIndustry('pets')">
                    <i class="fas fa-paw me-2"></i> Pet Models Platform
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="showIndustry('freelance')">
                    <i class="fas fa-laptop-code me-2"></i> Freelancer Platform
                </a>
            </li>
        </ul>

        <!-- Modeling Industry Template -->
        <div id="modeling-industry" class="industry-view">
            <div class="alert alert-info mb-4">
                <i class="fas fa-info-circle me-2"></i>
                <strong>Modeling Industry Template:</strong> Complex multi-profile system with agencies, talent management, and guardian accounts.
            </div>

            <!-- Architecture Diagram -->
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0">Component Hierarchy - Modeling Platform</h5>
                </div>
                <div class="card-body">
                    <div class="hierarchy-diagram">
                        <!-- Level 1: Industry Template -->
                        <div class="hierarchy-level">
                            <div class="hierarchy-box template-box">
                                <i class="fas fa-industry fa-2x mb-2"></i>
                                <h5>Modeling Industry Template</h5>
                                <p class="small mb-0">Complete configuration for modeling/talent marketplace</p>
                            </div>
                        </div>

                        <div class="hierarchy-connector"></div>

                        <!-- Level 2: Subscription Plans -->
                        <div class="hierarchy-level">
                            <div class="hierarchy-row">
                                <div class="hierarchy-box plan-box">
                                    <h6>Basic Plan</h6>
                                    <small>Individual models</small>
                                    <div class="price">€29/mo</div>
                                </div>
                                <div class="hierarchy-box plan-box">
                                    <h6>Professional Plan</h6>
                                    <small>Pro photographers</small>
                                    <div class="price">€79/mo</div>
                                </div>
                                <div class="hierarchy-box plan-box">
                                    <h6>Agency Plan</h6>
                                    <small>Model agencies</small>
                                    <div class="price">€299/mo</div>
                                </div>
                                <div class="hierarchy-box plan-box">
                                    <h6>Enterprise Plan</h6>
                                    <small>Large organizations</small>
                                    <div class="price">Custom</div>
                                </div>
                            </div>
                        </div>

                        <div class="hierarchy-connector"></div>

                        <!-- Level 3: Feature Sets -->
                        <div class="hierarchy-level">
                            <h6 class="text-center mb-3">Feature Sets (Bundles)</h6>
                            <div class="hierarchy-row">
                                <div class="hierarchy-box feature-set-box">
                                    <h6>Core Features</h6>
                                    <ul class="small mb-0">
                                        <li>Profile Management</li>
                                        <li>Portfolio</li>
                                        <li>Availability</li>
                                    </ul>
                                </div>
                                <div class="hierarchy-box feature-set-box">
                                    <h6>Agency Features</h6>
                                    <ul class="small mb-0">
                                        <li>Manage Others</li>
                                        <li>Team Access</li>
                                        <li>Commission Tracking</li>
                                    </ul>
                                </div>
                                <div class="hierarchy-box feature-set-box">
                                    <h6>Guardian Features</h6>
                                    <ul class="small mb-0">
                                        <li>Minor Management</li>
                                        <li>Trust Fund</li>
                                        <li>Parental Controls</li>
                                    </ul>
                                </div>
                                <div class="hierarchy-box feature-set-box">
                                    <h6>Business Features</h6>
                                    <ul class="small mb-0">
                                        <li>Invoicing</li>
                                        <li>Analytics</li>
                                        <li>API Access</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div class="hierarchy-connector"></div>

                        <!-- Level 4: Individual Features -->
                        <div class="hierarchy-level">
                            <h6 class="text-center mb-3">Individual Features</h6>
                            <div class="feature-grid">
                                <div class="feature-item">
                                    <i class="fas fa-user-circle"></i>
                                    <span>Multiple Profiles</span>
                                </div>
                                <div class="feature-item">
                                    <i class="fas fa-users"></i>
                                    <span>Manage Others</span>
                                </div>
                                <div class="feature-item">
                                    <i class="fas fa-child"></i>
                                    <span>Minor Management</span>
                                </div>
                                <div class="feature-item">
                                    <i class="fas fa-piggy-bank"></i>
                                    <span>Trust Fund</span>
                                </div>
                                <div class="feature-item">
                                    <i class="fas fa-images"></i>
                                    <span>Portfolio Builder</span>
                                </div>
                                <div class="feature-item">
                                    <i class="fas fa-calendar"></i>
                                    <span>Availability Calendar</span>
                                </div>
                                <div class="feature-item">
                                    <i class="fas fa-file-invoice"></i>
                                    <span>Invoicing System</span>
                                </div>
                                <div class="feature-item">
                                    <i class="fas fa-percentage"></i>
                                    <span>Commission Tracking</span>
                                </div>
                            </div>
                        </div>

                        <div class="hierarchy-connector"></div>

                        <!-- Level 5: Limits -->
                        <div class="hierarchy-level">
                            <h6 class="text-center mb-3">Limits Configuration</h6>
                            <div class="limits-grid">
                                <div class="limit-item">
                                    <strong>Profiles</strong>
                                    <div class="limit-values">
                                        <span class="badge bg-secondary">Basic: 1</span>
                                        <span class="badge bg-primary">Pro: 5</span>
                                        <span class="badge bg-success">Agency: 100</span>
                                        <span class="badge bg-warning">Enterprise: Unlimited</span>
                                    </div>
                                </div>
                                <div class="limit-item">
                                    <strong>Storage</strong>
                                    <div class="limit-values">
                                        <span class="badge bg-secondary">Basic: 5GB</span>
                                        <span class="badge bg-primary">Pro: 50GB</span>
                                        <span class="badge bg-success">Agency: 500GB</span>
                                        <span class="badge bg-warning">Enterprise: 2TB</span>
                                    </div>
                                </div>
                                <div class="limit-item">
                                    <strong>Team Members</strong>
                                    <div class="limit-values">
                                        <span class="badge bg-secondary">Basic: 0</span>
                                        <span class="badge bg-primary">Pro: 2</span>
                                        <span class="badge bg-success">Agency: 20</span>
                                        <span class="badge bg-warning">Enterprise: Unlimited</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Data Schema -->
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Data Schema - Modeling Platform</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-4">
                            <h6>Profile Types</h6>
                            <ul class="list-unstyled">
                                <li><i class="fas fa-check text-success me-2"></i> Fashion Model</li>
                                <li><i class="fas fa-check text-success me-2"></i> Commercial Model</li>
                                <li><i class="fas fa-check text-success me-2"></i> Photographer</li>
                                <li><i class="fas fa-check text-success me-2"></i> Makeup Artist</li>
                                <li><i class="fas fa-check text-success me-2"></i> Stylist</li>
                                <li><i class="fas fa-check text-success me-2"></i> Agency</li>
                            </ul>
                        </div>
                        <div class="col-md-4">
                            <h6>Unique Features</h6>
                            <ul class="list-unstyled">
                                <li><i class="fas fa-star text-warning me-2"></i> Comp Cards</li>
                                <li><i class="fas fa-star text-warning me-2"></i> Measurements</li>
                                <li><i class="fas fa-star text-warning me-2"></i> Casting Calls</li>
                                <li><i class="fas fa-star text-warning me-2"></i> Booking System</li>
                                <li><i class="fas fa-star text-warning me-2"></i> Model Release Forms</li>
                            </ul>
                        </div>
                        <div class="col-md-4">
                            <h6>Account Features</h6>
                            <ul class="list-unstyled">
                                <li><i class="fas fa-users text-primary me-2"></i> Agency Management</li>
                                <li><i class="fas fa-child text-info me-2"></i> Guardian Accounts</li>
                                <li><i class="fas fa-user-friends text-success me-2"></i> Team Collaboration</li>
                                <li><i class="fas fa-percentage text-warning me-2"></i> Commission System</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Pet Models Industry Template -->
        <div id="pets-industry" class="industry-view" style="display: none;">
            <div class="alert alert-warning mb-4">
                <i class="fas fa-paw me-2"></i>
                <strong>Pet Models Template:</strong> Simpler structure focused on pet profiles with owner management.
            </div>

            <!-- Architecture Diagram -->
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0">Component Hierarchy - Pet Models Platform</h5>
                </div>
                <div class="card-body">
                    <div class="hierarchy-diagram">
                        <!-- Level 1: Industry Template -->
                        <div class="hierarchy-level">
                            <div class="hierarchy-box template-box">
                                <i class="fas fa-paw fa-2x mb-2"></i>
                                <h5>Pet Models Industry Template</h5>
                                <p class="small mb-0">Platform for pet modeling and animal talent</p>
                            </div>
                        </div>

                        <div class="hierarchy-connector"></div>

                        <!-- Level 2: Subscription Plans -->
                        <div class="hierarchy-level">
                            <div class="hierarchy-row">
                                <div class="hierarchy-box plan-box">
                                    <h6>Pet Owner</h6>
                                    <small>Single pet profile</small>
                                    <div class="price">€9/mo</div>
                                </div>
                                <div class="hierarchy-box plan-box">
                                    <h6>Multi-Pet</h6>
                                    <small>Up to 5 pets</small>
                                    <div class="price">€19/mo</div>
                                </div>
                                <div class="hierarchy-box plan-box">
                                    <h6>Pet Agency</h6>
                                    <small>Animal talent agency</small>
                                    <div class="price">€49/mo</div>
                                </div>
                            </div>
                        </div>

                        <div class="hierarchy-connector"></div>

                        <!-- Level 3: Feature Sets -->
                        <div class="hierarchy-level">
                            <h6 class="text-center mb-3">Feature Sets (Bundles)</h6>
                            <div class="hierarchy-row">
                                <div class="hierarchy-box feature-set-box">
                                    <h6>Basic Pet Features</h6>
                                    <ul class="small mb-0">
                                        <li>Pet Profile</li>
                                        <li>Photo Gallery</li>
                                        <li>Availability</li>
                                    </ul>
                                </div>
                                <div class="hierarchy-box feature-set-box">
                                    <h6>Professional Features</h6>
                                    <ul class="small mb-0">
                                        <li>Training Certs</li>
                                        <li>Health Records</li>
                                        <li>Booking Calendar</li>
                                    </ul>
                                </div>
                                <div class="hierarchy-box feature-set-box">
                                    <h6>Agency Features</h6>
                                    <ul class="small mb-0">
                                        <li>Multiple Owners</li>
                                        <li>Commission Tracking</li>
                                        <li>Contracts</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div class="hierarchy-connector"></div>

                        <!-- Level 4: Individual Features -->
                        <div class="hierarchy-level">
                            <h6 class="text-center mb-3">Individual Features</h6>
                            <div class="feature-grid">
                                <div class="feature-item">
                                    <i class="fas fa-dog"></i>
                                    <span>Pet Profiles</span>
                                </div>
                                <div class="feature-item">
                                    <i class="fas fa-camera"></i>
                                    <span>Photo Galleries</span>
                                </div>
                                <div class="feature-item">
                                    <i class="fas fa-certificate"></i>
                                    <span>Certifications</span>
                                </div>
                                <div class="feature-item">
                                    <i class="fas fa-notes-medical"></i>
                                    <span>Health Records</span>
                                </div>
                                <div class="feature-item">
                                    <i class="fas fa-calendar-check"></i>
                                    <span>Booking System</span>
                                </div>
                                <div class="feature-item">
                                    <i class="fas fa-video"></i>
                                    <span>Video Portfolios</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Key Differences -->
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Key Differences from Modeling Platform</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <h6 class="text-success">✅ Included Features</h6>
                            <ul>
                                <li>Pet-specific profile fields (breed, age, temperament)</li>
                                <li>Veterinary record management</li>
                                <li>Training certification tracking</li>
                                <li>Pet insurance information</li>
                            </ul>
                        </div>
                        <div class="col-md-6">
                            <h6 class="text-danger">❌ Not Needed</h6>
                            <ul>
                                <li><s>Guardian/Minor management</s> - Not applicable</li>
                                <li><s>Trust Fund features</s> - Not relevant</li>
                                <li><s>Comp Cards</s> - Different format needed</li>
                                <li><s>Human measurements</s> - Pet measurements instead</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Freelancer Industry Template -->
        <div id="freelance-industry" class="industry-view" style="display: none;">
            <div class="alert alert-success mb-4">
                <i class="fas fa-laptop-code me-2"></i>
                <strong>Freelancer Template:</strong> Focus on skills, projects, and professional services.
            </div>

            <!-- Architecture Diagram -->
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0">Component Hierarchy - Freelancer Platform</h5>
                </div>
                <div class="card-body">
                    <div class="hierarchy-diagram">
                        <!-- Level 1: Industry Template -->
                        <div class="hierarchy-level">
                            <div class="hierarchy-box template-box">
                                <i class="fas fa-laptop-code fa-2x mb-2"></i>
                                <h5>Freelancer Industry Template</h5>
                                <p class="small mb-0">Professional services marketplace</p>
                            </div>
                        </div>

                        <div class="hierarchy-connector"></div>

                        <!-- Level 2: Subscription Plans -->
                        <div class="hierarchy-level">
                            <div class="hierarchy-row">
                                <div class="hierarchy-box plan-box">
                                    <h6>Starter</h6>
                                    <small>New freelancers</small>
                                    <div class="price">Free</div>
                                </div>
                                <div class="hierarchy-box plan-box">
                                    <h6>Professional</h6>
                                    <small>Established pros</small>
                                    <div class="price">€29/mo</div>
                                </div>
                                <div class="hierarchy-box plan-box">
                                    <h6>Agency</h6>
                                    <small>Freelance teams</small>
                                    <div class="price">€99/mo</div>
                                </div>
                                <div class="hierarchy-box plan-box">
                                    <h6>Enterprise</h6>
                                    <small>Large teams</small>
                                    <div class="price">€299/mo</div>
                                </div>
                            </div>
                        </div>

                        <div class="hierarchy-connector"></div>

                        <!-- Level 3: Feature Sets -->
                        <div class="hierarchy-level">
                            <h6 class="text-center mb-3">Feature Sets (Bundles)</h6>
                            <div class="hierarchy-row">
                                <div class="hierarchy-box feature-set-box">
                                    <h6>Core Freelancer</h6>
                                    <ul class="small mb-0">
                                        <li>Profile & Skills</li>
                                        <li>Portfolio</li>
                                        <li>Proposals</li>
                                    </ul>
                                </div>
                                <div class="hierarchy-box feature-set-box">
                                    <h6>Project Management</h6>
                                    <ul class="small mb-0">
                                        <li>Time Tracking</li>
                                        <li>Milestones</li>
                                        <li>Client Portal</li>
                                    </ul>
                                </div>
                                <div class="hierarchy-box feature-set-box">
                                    <h6>Business Tools</h6>
                                    <ul class="small mb-0">
                                        <li>Invoicing</li>
                                        <li>Contracts</li>
                                        <li>Payments</li>
                                    </ul>
                                </div>
                                <div class="hierarchy-box feature-set-box">
                                    <h6>Team Features</h6>
                                    <ul class="small mb-0">
                                        <li>Collaboration</li>
                                        <li>Task Assignment</li>
                                        <li>Team Analytics</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div class="hierarchy-connector"></div>

                        <!-- Level 4: Individual Features -->
                        <div class="hierarchy-level">
                            <h6 class="text-center mb-3">Individual Features</h6>
                            <div class="feature-grid">
                                <div class="feature-item">
                                    <i class="fas fa-user-tie"></i>
                                    <span>Professional Profile</span>
                                </div>
                                <div class="feature-item">
                                    <i class="fas fa-code"></i>
                                    <span>Skills Matrix</span>
                                </div>
                                <div class="feature-item">
                                    <i class="fas fa-briefcase"></i>
                                    <span>Project Showcase</span>
                                </div>
                                <div class="feature-item">
                                    <i class="fas fa-file-contract"></i>
                                    <span>Proposal System</span>
                                </div>
                                <div class="feature-item">
                                    <i class="fas fa-clock"></i>
                                    <span>Time Tracking</span>
                                </div>
                                <div class="feature-item">
                                    <i class="fas fa-file-invoice-dollar"></i>
                                    <span>Invoice Generator</span>
                                </div>
                                <div class="feature-item">
                                    <i class="fas fa-comments"></i>
                                    <span>Client Communication</span>
                                </div>
                                <div class="feature-item">
                                    <i class="fas fa-star"></i>
                                    <span>Reviews & Ratings</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Key Differences -->
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Key Differences from Other Templates</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <h6 class="text-success">✅ Unique Features</h6>
                            <ul>
                                <li>Skills assessment and verification</li>
                                <li>Project-based workflows</li>
                                <li>Time tracking and billing</li>
                                <li>Client collaboration tools</li>
                                <li>Escrow payment system</li>
                            </ul>
                        </div>
                        <div class="col-md-6">
                            <h6 class="text-danger">❌ Not Needed</h6>
                            <ul>
                                <li><s>Physical measurements</s> - Not applicable</li>
                                <li><s>Guardian features</s> - Adults only</li>
                                <li><s>Comp cards</s> - Portfolio instead</li>
                                <li><s>Availability calendar</s> - Project timeline instead</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Configuration Flow -->
        <div class="card mt-4">
            <div class="card-header">
                <h5 class="mb-0">Configuration Flow</h5>
            </div>
            <div class="card-body">
                <div class="config-flow">
                    <div class="flow-step">
                        <div class="step-number">1</div>
                        <h6>Create Features</h6>
                        <p class="small mb-0">Define individual capabilities</p>
                    </div>
                    <div class="flow-arrow">→</div>
                    <div class="flow-step">
                        <div class="step-number">2</div>
                        <h6>Build Feature Sets</h6>
                        <p class="small mb-0">Bundle related features</p>
                    </div>
                    <div class="flow-arrow">→</div>
                    <div class="flow-step">
                        <div class="step-number">3</div>
                        <h6>Configure Limits</h6>
                        <p class="small mb-0">Set usage restrictions</p>
                    </div>
                    <div class="flow-arrow">→</div>
                    <div class="flow-step">
                        <div class="step-number">4</div>
                        <h6>Create Plans</h6>
                        <p class="small mb-0">Combine features & pricing</p>
                    </div>
                    <div class="flow-arrow">→</div>
                    <div class="flow-step">
                        <div class="step-number">5</div>
                        <h6>Build Template</h6>
                        <p class="small mb-0">Complete industry package</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
.hierarchy-diagram {
    padding: 2rem;
    background: #f8f9fa;
    border-radius: 0.5rem;
}

.hierarchy-level {
    margin-bottom: 2rem;
    position: relative;
}

.hierarchy-connector {
    width: 2px;
    height: 40px;
    background: #dee2e6;
    margin: 0 auto;
}

.hierarchy-row {
    display: flex;
    justify-content: center;
    gap: 1rem;
    flex-wrap: wrap;
}

.hierarchy-box {
    background: white;
    border: 2px solid #dee2e6;
    border-radius: 0.5rem;
    padding: 1rem;
    text-align: center;
    min-width: 150px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transition: all 0.2s;
}

.hierarchy-box:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.template-box {
    border-color: #0d6efd;
    background: #e7f3ff;
    max-width: 400px;
    margin: 0 auto;
}

.plan-box {
    border-color: #198754;
    background: #d1f3e0;
}

.feature-set-box {
    border-color: #ffc107;
    background: #fff3cd;
}

.price {
    font-size: 1.2rem;
    font-weight: bold;
    color: #198754;
    margin-top: 0.5rem;
}

.feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    padding: 1rem;
}

.feature-item {
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
    padding: 0.75rem;
    text-align: center;
    transition: all 0.2s;
}

.feature-item:hover {
    background: #e7f3ff;
    border-color: #0d6efd;
}

.feature-item i {
    display: block;
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
    color: #0d6efd;
}

.limits-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    padding: 1rem;
}

.limit-item {
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
    padding: 1rem;
    text-align: center;
}

.limit-values {
    margin-top: 0.5rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    justify-content: center;
}

.config-flow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    padding: 2rem;
    background: #f8f9fa;
    border-radius: 0.5rem;
}

.flow-step {
    text-align: center;
    position: relative;
    flex: 1;
    min-width: 120px;
}

.step-number {
    width: 40px;
    height: 40px;
    background: #0d6efd;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    margin: 0 auto 0.5rem;
}

.flow-arrow {
    font-size: 2rem;
    color: #6c757d;
    margin: 0 1rem;
}

@media (max-width: 768px) {
    .config-flow {
        flex-direction: column;
    }
    
    .flow-arrow {
        transform: rotate(90deg);
        margin: 1rem 0;
    }
}
</style>

<script>
function showIndustry(industry) {
    // Hide all industry views
    document.querySelectorAll('.industry-view').forEach(view => {
        view.style.display = 'none';
    });
    
    // Show selected industry
    document.getElementById(industry + '-industry').style.display = 'block';
    
    // Update tab active states
    document.querySelectorAll('#industryTabs .nav-link').forEach(tab => {
        tab.classList.remove('active');
        if (tab.textContent.toLowerCase().includes(industry)) {
            tab.classList.add('active');
        }
    });
}

function switchIndustry() {
    const industries = ['modeling', 'pets', 'freelance'];
    const currentActive = document.querySelector('#industryTabs .nav-link.active');
    let currentIndex = 0;
    
    industries.forEach((industry, index) => {
        if (currentActive.textContent.toLowerCase().includes(industry)) {
            currentIndex = index;
        }
    });
    
    const nextIndex = (currentIndex + 1) % industries.length;
    showIndustry(industries[nextIndex]);
}

function printDiagram() {
    window.print();
}
</script>

<?php echo renderFooter(); ?>