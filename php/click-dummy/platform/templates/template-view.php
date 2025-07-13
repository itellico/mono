<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

// Get template ID from URL parameter
$templateId = $_GET['id'] ?? 'fashion-modeling';

// Template data (in a real application, this would come from the database)
$templateData = [
    'fashion-modeling' => [
        'name' => 'Fashion Modeling Agency',
        'description' => 'Complete marketplace for fashion models, agencies, and brands with casting calls and portfolio management',
        'category' => 'Modeling & Fashion',
        'industry' => 'fashion-modeling',
        'status' => 'Active',
        'installations' => 12,
        'rating' => 4.8,
        'lastUpdated' => '2 days ago',
        'features' => ['Portfolio Management', 'Photo Verification', 'Casting Calls', 'Direct Booking', 'Escrow Payments', 'Messaging System'],
        'schema' => 'Model Profile Extended',
        'optionSets' => ['body-measurements', 'clothing-sizes', 'experience-levels', 'hair-eye-colors'],
        'targetUsers' => ['Models', 'Photographers', 'Agencies', 'Casting Directors', 'Brands'],
        'complexity' => 'Medium',
        'setupTime' => '45 minutes',
        'screenshots' => [
            'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=300&fit=crop'
        ]
    ]
];

$template = $templateData[$templateId] ?? $templateData['fashion-modeling'];

echo renderHeader("Template: " . $template['name'] . " - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'templates/template-view.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Industry Templates', 'href' => 'index.php'],
            ['label' => $template['name']]
        ]);
        ?>
        
        <!-- Template Header -->
        <div class="row mb-4">
            <div class="col-md-8">
                <div class="d-flex align-items-start">
                    <div class="me-3">
                        <div class="bg-primary rounded-circle d-flex align-items-center justify-content-center" style="width: 60px; height: 60px;">
                            <i class="fas fa-layer-group fa-2x text-white"></i>
                        </div>
                    </div>
                    <div class="flex-grow-1">
                        <h2 class="mb-1"><?= htmlspecialchars($template['name']) ?></h2>
                        <p class="text-muted mb-2"><?= htmlspecialchars($template['description']) ?></p>
                        <div class="d-flex align-items-center gap-3">
                            <span class="badge bg-<?= $template['status'] === 'Active' ? 'success' : 'warning' ?>"><?= $template['status'] ?></span>
                            <span class="text-muted">
                                <i class="fas fa-star text-warning me-1"></i><?= $template['rating'] ?> rating
                            </span>
                            <span class="text-muted">
                                <i class="fas fa-download me-1"></i><?= $template['installations'] ?> installations
                            </span>
                            <span class="text-muted">
                                <i class="fas fa-clock me-1"></i>Updated <?= $template['lastUpdated'] ?>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-4 text-end">
                <div class="btn-group mb-2">
                    <button class="btn btn-primary" onclick="installTemplate()">
                        <i class="fas fa-plus me-2"></i> Install Template
                    </button>
                    <button class="btn btn-outline-primary dropdown-toggle" data-bs-toggle="dropdown">
                        <i class="fas fa-cog"></i>
                    </button>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" href="template-builder.php?id=<?= $templateId ?>"><i class="fas fa-edit me-2"></i> Edit Template</a></li>
                        <li><a class="dropdown-item" href="../schemas/schema-builder.php?template=<?= $templateId ?>"><i class="fas fa-database me-2"></i> Edit Schema</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="#" onclick="cloneTemplate()"><i class="fas fa-copy me-2"></i> Clone Template</a></li>
                        <li><a class="dropdown-item" href="#" onclick="exportTemplate()"><i class="fas fa-download me-2"></i> Export Template</a></li>
                    </ul>
                </div>
                <div class="small text-muted">
                    Setup time: <?= $template['setupTime'] ?><br>
                    Complexity: <?= $template['complexity'] ?>
                </div>
            </div>
        </div>
        
        <!-- Template Overview Tabs -->
        <ul class="nav nav-tabs mb-4" id="templateTabs" role="tablist">
            <li class="nav-item" role="presentation">
                <button class="nav-link active" id="overview-tab" data-bs-toggle="tab" data-bs-target="#overview" type="button" role="tab">
                    <i class="fas fa-info-circle me-2"></i> Overview
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="schema-tab" data-bs-toggle="tab" data-bs-target="#schema" type="button" role="tab">
                    <i class="fas fa-database me-2"></i> Schema & Fields
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="features-tab" data-bs-toggle="tab" data-bs-target="#features" type="button" role="tab">
                    <i class="fas fa-puzzle-piece me-2"></i> Features
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="screenshots-tab" data-bs-toggle="tab" data-bs-target="#screenshots" type="button" role="tab">
                    <i class="fas fa-images me-2"></i> Screenshots
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="installations-tab" data-bs-toggle="tab" data-bs-target="#installations" type="button" role="tab">
                    <i class="fas fa-users me-2"></i> Installations
                </button>
            </li>
        </ul>
        
        <div class="tab-content" id="templateTabContent">
            <!-- Overview Tab -->
            <div class="tab-pane fade show active" id="overview" role="tabpanel">
                <div class="row">
                    <div class="col-md-8">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Template Details</h5>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6 class="fw-bold">Target Users</h6>
                                        <div class="mb-3">
                                            <?php foreach ($template['targetUsers'] as $user): ?>
                                            <span class="badge bg-primary me-1 mb-1"><?= $user ?></span>
                                            <?php endforeach; ?>
                                        </div>
                                        
                                        <h6 class="fw-bold">Industry Category</h6>
                                        <p class="text-muted"><?= $template['category'] ?></p>
                                        
                                        <h6 class="fw-bold">Schema Integration</h6>
                                        <p class="text-muted">
                                            Uses <strong><?= $template['schema'] ?></strong> with <?= count($template['optionSets']) ?> option sets
                                        </p>
                                    </div>
                                    <div class="col-md-6">
                                        <h6 class="fw-bold">Key Features</h6>
                                        <ul class="list-unstyled">
                                            <?php foreach (array_slice($template['features'], 0, 6) as $feature): ?>
                                            <li class="mb-1">
                                                <i class="fas fa-check-circle text-success me-2"></i><?= $feature ?>
                                            </li>
                                            <?php endforeach; ?>
                                        </ul>
                                    </div>
                                </div>
                                
                                <hr>
                                
                                <h6 class="fw-bold mb-3">Template Description</h6>
                                <p><?= htmlspecialchars($template['description']) ?></p>
                                <p class="text-muted">This template provides a complete marketplace solution for the fashion modeling industry, including advanced features for portfolio management, casting call distribution, and secure booking workflows. The template integrates with our schema builder to provide customizable user profiles and utilizes multiple option sets for regional customization.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Template Stats</h5>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between">
                                        <span>Rating</span>
                                        <span class="fw-bold"><?= $template['rating'] ?>/5.0</span>
                                    </div>
                                    <div class="progress" style="height: 6px;">
                                        <div class="progress-bar bg-warning" style="width: <?= ($template['rating'] / 5) * 100 ?>%"></div>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between">
                                        <span>Installations</span>
                                        <span class="fw-bold"><?= $template['installations'] ?></span>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between">
                                        <span>Features</span>
                                        <span class="fw-bold"><?= count($template['features']) ?></span>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between">
                                        <span>Option Sets</span>
                                        <span class="fw-bold"><?= count($template['optionSets']) ?></span>
                                    </div>
                                </div>
                                
                                <hr>
                                
                                <h6 class="fw-bold">Support & Updates</h6>
                                <div class="small text-muted">
                                    <div class="d-flex align-items-center mb-1">
                                        <i class="fas fa-check-circle text-success me-2"></i>
                                        Regular updates
                                    </div>
                                    <div class="d-flex align-items-center mb-1">
                                        <i class="fas fa-check-circle text-success me-2"></i>
                                        Community support
                                    </div>
                                    <div class="d-flex align-items-center mb-1">
                                        <i class="fas fa-check-circle text-success me-2"></i>
                                        Documentation included
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Schema & Fields Tab -->
            <div class="tab-pane fade" id="schema" role="tabpanel">
                <div class="row">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">Schema: <?= $template['schema'] ?></h5>
                                <a href="../schemas/schema-builder.php?template=<?= $templateId ?>" class="btn btn-outline-primary btn-sm">
                                    <i class="fas fa-edit me-2"></i> Edit Schema
                                </a>
                            </div>
                            <div class="card-body">
                                <p class="text-muted mb-3">This template uses a comprehensive schema designed specifically for modeling industry professionals.</p>
                                
                                <h6 class="fw-bold mb-3">Schema Fields</h6>
                                <div class="row">
                                    <div class="col-6">
                                        <div class="small">
                                            <div class="mb-2">
                                                <i class="fas fa-user text-primary me-2"></i>
                                                <strong>Basic Info</strong>
                                            </div>
                                            <div class="ps-3 mb-2">
                                                <div>• Full Name</div>
                                                <div>• Date of Birth</div>
                                                <div>• Gender</div>
                                                <div>• Contact Info</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-6">
                                        <div class="small">
                                            <div class="mb-2">
                                                <i class="fas fa-ruler text-success me-2"></i>
                                                <strong>Measurements</strong>
                                            </div>
                                            <div class="ps-3 mb-2">
                                                <div>• Height</div>
                                                <div>• Weight</div>
                                                <div>• Body Measurements</div>
                                                <div>• Clothing Sizes</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="row">
                                    <div class="col-6">
                                        <div class="small">
                                            <div class="mb-2">
                                                <i class="fas fa-palette text-warning me-2"></i>
                                                <strong>Appearance</strong>
                                            </div>
                                            <div class="ps-3 mb-2">
                                                <div>• Hair Color</div>
                                                <div>• Eye Color</div>
                                                <div>• Skin Tone</div>
                                                <div>• Special Features</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-6">
                                        <div class="small">
                                            <div class="mb-2">
                                                <i class="fas fa-star text-info me-2"></i>
                                                <strong>Experience</strong>
                                            </div>
                                            <div class="ps-3 mb-2">
                                                <div>• Experience Level</div>
                                                <div>• Portfolio Link</div>
                                                <div>• Specializations</div>
                                                <div>• Availability</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">Option Sets Integration</h5>
                                <a href="../options/index.php" class="btn btn-outline-info btn-sm">
                                    <i class="fas fa-cog me-2"></i> Manage Options
                                </a>
                            </div>
                            <div class="card-body">
                                <p class="text-muted mb-3">This template integrates with <?= count($template['optionSets']) ?> option sets for regional and industry-specific customization.</p>
                                
                                <div class="option-set-item mb-3">
                                    <div class="d-flex align-items-center mb-2">
                                        <i class="fas fa-ruler-combined text-primary me-2"></i>
                                        <strong>Body Measurements</strong>
                                        <span class="badge bg-success ms-2">Global</span>
                                    </div>
                                    <div class="small text-muted ps-3">
                                        Height, weight, and body measurement standards with automatic regional conversions (US/EU/Asia)
                                    </div>
                                </div>
                                
                                <div class="option-set-item mb-3">
                                    <div class="d-flex align-items-center mb-2">
                                        <i class="fas fa-tshirt text-info me-2"></i>
                                        <strong>Clothing Sizes</strong>
                                        <span class="badge bg-warning ms-2">Regional</span>
                                    </div>
                                    <div class="small text-muted ps-3">
                                        Clothing size standards (XS-XL, numerical) with regional size chart mappings
                                    </div>
                                </div>
                                
                                <div class="option-set-item mb-3">
                                    <div class="d-flex align-items-center mb-2">
                                        <i class="fas fa-graduation-cap text-success me-2"></i>
                                        <strong>Experience Levels</strong>
                                        <span class="badge bg-info ms-2">Standard</span>
                                    </div>
                                    <div class="small text-muted ps-3">
                                        Beginner, Amateur, Professional, Expert levels with industry-specific criteria
                                    </div>
                                </div>
                                
                                <div class="option-set-item mb-3">
                                    <div class="d-flex align-items-center mb-2">
                                        <i class="fas fa-eye text-warning me-2"></i>
                                        <strong>Hair & Eye Colors</strong>
                                        <span class="badge bg-secondary ms-2">Fixed</span>
                                    </div>
                                    <div class="small text-muted ps-3">
                                        Comprehensive color options for hair and eye colors including natural and styled variations
                                    </div>
                                </div>
                                
                                <div class="mt-3">
                                    <small class="text-muted">
                                        <i class="fas fa-info-circle me-1"></i>
                                        Option sets automatically adapt to the tenant's regional settings and can be customized per installation.
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Features Tab -->
            <div class="tab-pane fade" id="features" role="tabpanel">
                <div class="row">
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">Core Features</h6>
                            </div>
                            <div class="card-body">
                                <div class="feature-item mb-3">
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-check-circle text-success me-2"></i>
                                        <strong>Portfolio Management</strong>
                                    </div>
                                    <div class="small text-muted ps-3">Complete photo and video portfolio with approval workflows</div>
                                </div>
                                
                                <div class="feature-item mb-3">
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-check-circle text-success me-2"></i>
                                        <strong>Photo Verification</strong>
                                    </div>
                                    <div class="small text-muted ps-3">Identity and photo authenticity verification system</div>
                                </div>
                                
                                <div class="feature-item mb-3">
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-check-circle text-success me-2"></i>
                                        <strong>Search & Filters</strong>
                                    </div>
                                    <div class="small text-muted ps-3">Advanced search with schema-based filtering options</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">Business Features</h6>
                            </div>
                            <div class="card-body">
                                <div class="feature-item mb-3">
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-check-circle text-success me-2"></i>
                                        <strong>Casting Calls</strong>
                                    </div>
                                    <div class="small text-muted ps-3">Create and manage casting calls with automated matching</div>
                                </div>
                                
                                <div class="feature-item mb-3">
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-check-circle text-success me-2"></i>
                                        <strong>Direct Booking</strong>
                                    </div>
                                    <div class="small text-muted ps-3">Instant booking system with calendar integration</div>
                                </div>
                                
                                <div class="feature-item mb-3">
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-check-circle text-success me-2"></i>
                                        <strong>Escrow Payments</strong>
                                    </div>
                                    <div class="small text-muted ps-3">Secure payment processing with escrow protection</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">Advanced Features</h6>
                            </div>
                            <div class="card-body">
                                <div class="feature-item mb-3">
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-check-circle text-success me-2"></i>
                                        <strong>Messaging System</strong>
                                    </div>
                                    <div class="small text-muted ps-3">Real-time messaging with file sharing capabilities</div>
                                </div>
                                
                                <div class="feature-item mb-3">
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-times-circle text-muted me-2"></i>
                                        <strong>Video Portfolios</strong>
                                    </div>
                                    <div class="small text-muted ps-3">Optional: Video portfolio and demo reel management</div>
                                </div>
                                
                                <div class="feature-item mb-3">
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-times-circle text-muted me-2"></i>
                                        <strong>AI Matching</strong>
                                    </div>
                                    <div class="small text-muted ps-3">Premium: AI-powered model-to-job matching</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Screenshots Tab -->
            <div class="tab-pane fade" id="screenshots" role="tabpanel">
                <div class="row">
                    <?php foreach ($template['screenshots'] as $index => $screenshot): ?>
                    <div class="col-md-4 mb-4">
                        <div class="card">
                            <img src="<?= $screenshot ?>" class="card-img-top" alt="Screenshot <?= $index + 1 ?>" style="height: 200px; object-fit: cover;">
                            <div class="card-body">
                                <h6 class="card-title">
                                    <?php
                                    $titles = ['Model Portfolio View', 'Casting Call Dashboard', 'Search & Filters'];
                                    echo $titles[$index] ?? 'Template View';
                                    ?>
                                </h6>
                                <p class="card-text small text-muted">
                                    <?php
                                    $descriptions = [
                                        'Complete model profile with portfolio gallery and booking information',
                                        'Casting director dashboard showing active calls and applications',
                                        'Advanced search interface with schema-based filtering options'
                                    ];
                                    echo $descriptions[$index] ?? 'Template interface screenshot';
                                    ?>
                                </p>
                            </div>
                        </div>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>
            
            <!-- Installations Tab -->
            <div class="tab-pane fade" id="installations" role="tabpanel">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Template Installations (<?= $template['installations'] ?>)</h5>
                    </div>
                    <div class="card-body">
                        <?php
                        $installations = [
                            ['tenant' => 'ModelScope Pro', 'domain' => 'modelscope.com', 'installed' => '2 weeks ago', 'status' => 'Active'],
                            ['tenant' => 'Elite Fashion Agency', 'domain' => 'elitefashion.net', 'installed' => '1 month ago', 'status' => 'Active'],
                            ['tenant' => 'Fashion Forward Models', 'domain' => 'fashionforward.io', 'installed' => '1 month ago', 'status' => 'Active'],
                            ['tenant' => 'NYC Casting Hub', 'domain' => 'nyccastinghub.com', 'installed' => '2 months ago', 'status' => 'Active'],
                            ['tenant' => 'Global Models Network', 'domain' => 'globalmodels.org', 'installed' => '3 months ago', 'status' => 'Active']
                        ];
                        ?>
                        
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Tenant Name</th>
                                        <th>Domain</th>
                                        <th>Installed</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($installations as $installation): ?>
                                    <tr>
                                        <td>
                                            <strong><?= htmlspecialchars($installation['tenant']) ?></strong>
                                        </td>
                                        <td>
                                            <a href="https://<?= htmlspecialchars($installation['domain']) ?>" target="_blank" class="text-decoration-none">
                                                <?= htmlspecialchars($installation['domain']) ?>
                                                <i class="fas fa-external-link-alt ms-1 small"></i>
                                            </a>
                                        </td>
                                        <td><?= $installation['installed'] ?></td>
                                        <td>
                                            <span class="badge bg-<?= $installation['status'] === 'Active' ? 'success' : 'warning' ?>">
                                                <?= $installation['status'] ?>
                                            </span>
                                        </td>
                                        <td>
                                            <div class="btn-group btn-group-sm">
                                                <button class="btn btn-outline-primary" onclick="viewInstallation('<?= htmlspecialchars($installation['domain']) ?>')">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                                <button class="btn btn-outline-info" onclick="manageInstallation('<?= htmlspecialchars($installation['tenant']) ?>')">
                                                    <i class="fas fa-cog"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
function installTemplate() {
    alert('Install Template\n\nThis would start the template installation wizard:\n- Select target tenant\n- Configure schema fields\n- Set up option sets\n- Customize features\n- Deploy template');
}

function cloneTemplate() {
    alert('Clone Template\n\nThis would create a copy of this template:\n- Duplicate all configurations\n- Reset usage statistics\n- Allow customization\n- Maintain compatibility');
}

function exportTemplate() {
    alert('Export Template\n\nThis would generate a complete template package:\n- Template configuration\n- Schema definitions\n- Option set mappings\n- Feature settings\n- Installation guide');
}

function viewInstallation(domain) {
    window.open('https://' + domain, '_blank');
}

function manageInstallation(tenant) {
    alert('Manage Installation: ' + tenant + '\n\nThis would open the tenant management interface:\n- View installation details\n- Update template version\n- Manage customizations\n- Monitor performance');
}
</script>

<?php echo renderFooter(); ?>