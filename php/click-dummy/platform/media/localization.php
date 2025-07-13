<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Media Localization Center - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'media/localization.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Media Library', 'href' => 'index.php'],
            ['label' => 'Localization Center']
        ]);
        ?>
        
        <!-- Header Section -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h2 class="mb-1">Media Localization Center</h2>
                <p class="text-muted mb-0">Manage media translations, cultural adaptations, and SEO optimization</p>
            </div>
            <div class="btn-group">
                <button class="btn btn-outline-secondary" onclick="analyzeSEOGaps()">
                    <i class="fas fa-search me-2"></i> SEO Analysis
                </button>
                <button class="btn btn-outline-info" onclick="bulkTranslate()">
                    <i class="fas fa-globe me-2"></i> Bulk Translate
                </button>
                <button class="btn btn-primary" onclick="createLocalization()">
                    <i class="fas fa-plus me-2"></i> New Localization
                </button>
            </div>
        </div>

        <!-- Localization Stats -->
        <div class="row g-3 mb-4">
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">
                            <i class="fas fa-images me-2"></i> Total Media
                        </h6>
                        <h3 class="mb-0">2,847</h3>
                        <small class="text-success">+23 this month</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">
                            <i class="fas fa-globe me-2"></i> Languages
                        </h6>
                        <h3 class="mb-0">12</h3>
                        <small class="text-muted">Active locales</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">
                            <i class="fas fa-robot me-2"></i> AI Generated
                        </h6>
                        <h3 class="mb-0 text-info">847</h3>
                        <small class="text-muted">Auto-localized</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">
                            <i class="fas fa-exclamation-triangle me-2"></i> Needs Review
                        </h6>
                        <h3 class="mb-0 text-warning">156</h3>
                        <small class="text-muted">Pending approval</small>
                    </div>
                </div>
            </div>
        </div>

        <!-- Language Progress Overview -->
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="mb-0">Localization Progress by Language</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-4">
                        <div class="language-progress-item mb-3">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <div class="d-flex align-items-center">
                                    <span class="flag-icon flag-icon-es me-2"></span>
                                    <span class="fw-bold">Spanish (ES)</span>
                                </div>
                                <div class="text-end">
                                    <span class="badge bg-success">95%</span>
                                    <small class="text-muted d-block">2,700 / 2,847</small>
                                </div>
                            </div>
                            <div class="progress" style="height: 6px;">
                                <div class="progress-bar bg-success" style="width: 95%"></div>
                            </div>
                        </div>
                        
                        <div class="language-progress-item mb-3">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <div class="d-flex align-items-center">
                                    <span class="flag-icon flag-icon-fr me-2"></span>
                                    <span class="fw-bold">French (FR)</span>
                                </div>
                                <div class="text-end">
                                    <span class="badge bg-success">92%</span>
                                    <small class="text-muted d-block">2,619 / 2,847</small>
                                </div>
                            </div>
                            <div class="progress" style="height: 6px;">
                                <div class="progress-bar bg-success" style="width: 92%"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-4">
                        <div class="language-progress-item mb-3">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <div class="d-flex align-items-center">
                                    <span class="flag-icon flag-icon-ar me-2"></span>
                                    <span class="fw-bold">Arabic (AR)</span>
                                </div>
                                <div class="text-end">
                                    <span class="badge bg-warning">67%</span>
                                    <small class="text-muted d-block">1,907 / 2,847</small>
                                </div>
                            </div>
                            <div class="progress" style="height: 6px;">
                                <div class="progress-bar bg-warning" style="width: 67%"></div>
                            </div>
                        </div>
                        
                        <div class="language-progress-item mb-3">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <div class="d-flex align-items-center">
                                    <span class="flag-icon flag-icon-zh me-2"></span>
                                    <span class="fw-bold">Chinese (ZH)</span>
                                </div>
                                <div class="text-end">
                                    <span class="badge bg-warning">72%</span>
                                    <small class="text-muted d-block">2,050 / 2,847</small>
                                </div>
                            </div>
                            <div class="progress" style="height: 6px;">
                                <div class="progress-bar bg-warning" style="width: 72%"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-4">
                        <div class="language-progress-item mb-3">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <div class="d-flex align-items-center">
                                    <span class="flag-icon flag-icon-ja me-2"></span>
                                    <span class="fw-bold">Japanese (JA)</span>
                                </div>
                                <div class="text-end">
                                    <span class="badge bg-danger">23%</span>
                                    <small class="text-muted d-block">655 / 2,847</small>
                                </div>
                            </div>
                            <div class="progress" style="height: 6px;">
                                <div class="progress-bar bg-danger" style="width: 23%"></div>
                            </div>
                        </div>
                        
                        <div class="language-progress-item mb-3">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <div class="d-flex align-items-center">
                                    <span class="flag-icon flag-icon-ko me-2"></span>
                                    <span class="fw-bold">Korean (KO)</span>
                                </div>
                                <div class="text-end">
                                    <span class="badge bg-danger">18%</span>
                                    <small class="text-muted d-block">512 / 2,847</small>
                                </div>
                            </div>
                            <div class="progress" style="height: 6px;">
                                <div class="progress-bar bg-danger" style="width: 18%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Media Localization Dashboard -->
        <div class="card">
            <div class="card-header">
                <div class="row align-items-center">
                    <div class="col-md-6">
                        <h5 class="mb-0">Media Assets Requiring Localization</h5>
                    </div>
                    <div class="col-md-6">
                        <div class="d-flex align-items-center justify-content-end">
                            <div class="btn-group btn-group-sm me-3">
                                <button class="btn btn-outline-secondary active" onclick="filterStatus('all')">All</button>
                                <button class="btn btn-outline-secondary" onclick="filterStatus('pending')">Pending</button>
                                <button class="btn btn-outline-secondary" onclick="filterStatus('auto')">Auto-Generated</button>
                                <button class="btn btn-outline-secondary" onclick="filterStatus('manual')">Manual</button>
                            </div>
                            <div class="dropdown">
                                <button class="btn btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                                    <i class="fas fa-filter"></i> Filter
                                </button>
                                <ul class="dropdown-menu">
                                    <li><a class="dropdown-item" href="#" onclick="filterByType('image')">Images Only</a></li>
                                    <li><a class="dropdown-item" href="#" onclick="filterByType('video')">Videos Only</a></li>
                                    <li><a class="dropdown-item" href="#" onclick="filterByType('document')">Documents Only</a></li>
                                    <li><hr class="dropdown-divider"></li>
                                    <li><a class="dropdown-item" href="#" onclick="filterByPriority('high')">High Priority</a></li>
                                    <li><a class="dropdown-item" href="#" onclick="filterByPriority('seo')">SEO Critical</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th style="width: 60px;">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="selectAll">
                                    </div>
                                </th>
                                <th>Media Asset</th>
                                <th>Type</th>
                                <th>Localization Status</th>
                                <th>SEO Impact</th>
                                <th>Cultural Adaptation</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="mediaLocalizationTable">
                            <!-- Hero Background Image -->
                            <tr>
                                <td>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" value="hero-bg-1">
                                    </div>
                                </td>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <img src="https://picsum.photos/60/40?random=1" class="rounded me-3" alt="Hero">
                                        <div>
                                            <h6 class="mb-0">hero-financial-planning.jpg</h6>
                                            <small class="text-muted">Platform → Templates → Hero Images</small>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span class="badge bg-info">Image</span>
                                </td>
                                <td>
                                    <div class="localization-status">
                                        <div class="status-item">
                                            <span class="flag-icon flag-icon-es"></span>
                                            <span class="badge bg-success">✓</span>
                                        </div>
                                        <div class="status-item">
                                            <span class="flag-icon flag-icon-fr"></span>
                                            <span class="badge bg-success">✓</span>
                                        </div>
                                        <div class="status-item">
                                            <span class="flag-icon flag-icon-ar"></span>
                                            <span class="badge bg-warning">AI</span>
                                        </div>
                                        <div class="status-item">
                                            <span class="flag-icon flag-icon-zh"></span>
                                            <span class="badge bg-danger">✗</span>
                                        </div>
                                        <div class="status-item">
                                            <span class="flag-icon flag-icon-ja"></span>
                                            <span class="badge bg-danger">✗</span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div class="seo-impact">
                                        <span class="badge bg-success">High</span>
                                        <small class="text-muted d-block">Landing page hero</small>
                                    </div>
                                </td>
                                <td>
                                    <div class="cultural-status">
                                        <span class="badge bg-warning">
                                            <i class="fas fa-exclamation-triangle me-1"></i> Needs Review
                                        </span>
                                        <small class="text-muted d-block">Western business imagery</small>
                                    </div>
                                </td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="openLocalizationModal('hero-bg-1')">
                                            <i class="fas fa-globe"></i>
                                        </button>
                                        <button class="btn btn-outline-info" onclick="generateAIVersions('hero-bg-1')">
                                            <i class="fas fa-robot"></i>
                                        </button>
                                        <button class="btn btn-outline-secondary" onclick="analyzeSEO('hero-bg-1')">
                                            <i class="fas fa-search"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>

                            <!-- Product Icon -->
                            <tr>
                                <td>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" value="product-icon-1">
                                    </div>
                                </td>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <div class="icon-preview me-3">
                                            <i class="fas fa-piggy-bank fa-2x text-success"></i>
                                        </div>
                                        <div>
                                            <h6 class="mb-0">savings-icon.svg</h6>
                                            <small class="text-muted">Platform → UI Icons → Financial</small>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span class="badge bg-secondary">Icon</span>
                                </td>
                                <td>
                                    <div class="localization-status">
                                        <div class="status-item">
                                            <span class="flag-icon flag-icon-es"></span>
                                            <span class="badge bg-success">✓</span>
                                        </div>
                                        <div class="status-item">
                                            <span class="flag-icon flag-icon-fr"></span>
                                            <span class="badge bg-success">✓</span>
                                        </div>
                                        <div class="status-item">
                                            <span class="flag-icon flag-icon-ar"></span>
                                            <span class="badge bg-danger">✗</span>
                                        </div>
                                        <div class="status-item">
                                            <span class="flag-icon flag-icon-zh"></span>
                                            <span class="badge bg-warning">AI</span>
                                        </div>
                                        <div class="status-item">
                                            <span class="flag-icon flag-icon-ja"></span>
                                            <span class="badge bg-danger">✗</span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div class="seo-impact">
                                        <span class="badge bg-info">Medium</span>
                                        <small class="text-muted d-block">Product features</small>
                                    </div>
                                </td>
                                <td>
                                    <div class="cultural-status">
                                        <span class="badge bg-danger">
                                            <i class="fas fa-ban me-1"></i> Culturally Inappropriate
                                        </span>
                                        <small class="text-muted d-block">Pig imagery offensive in Islamic countries</small>
                                    </div>
                                </td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="openLocalizationModal('product-icon-1')">
                                            <i class="fas fa-globe"></i>
                                        </button>
                                        <button class="btn btn-outline-warning" onclick="suggestCulturalAlternatives('product-icon-1')">
                                            <i class="fas fa-lightbulb"></i>
                                        </button>
                                        <button class="btn btn-outline-secondary" onclick="analyzeSEO('product-icon-1')">
                                            <i class="fas fa-search"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>

                            <!-- Marketing Banner -->
                            <tr>
                                <td>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" value="marketing-banner-1">
                                    </div>
                                </td>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <img src="https://picsum.photos/60/40?random=2" class="rounded me-3" alt="Banner">
                                        <div>
                                            <h6 class="mb-0">new-year-promo.jpg</h6>
                                            <small class="text-muted">Platform → Marketing → Seasonal</small>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span class="badge bg-info">Image</span>
                                </td>
                                <td>
                                    <div class="localization-status">
                                        <div class="status-item">
                                            <span class="flag-icon flag-icon-es"></span>
                                            <span class="badge bg-warning">AI</span>
                                        </div>
                                        <div class="status-item">
                                            <span class="flag-icon flag-icon-fr"></span>
                                            <span class="badge bg-warning">AI</span>
                                        </div>
                                        <div class="status-item">
                                            <span class="flag-icon flag-icon-ar"></span>
                                            <span class="badge bg-danger">✗</span>
                                        </div>
                                        <div class="status-item">
                                            <span class="flag-icon flag-icon-zh"></span>
                                            <span class="badge bg-danger">✗</span>
                                        </div>
                                        <div class="status-item">
                                            <span class="flag-icon flag-icon-ja"></span>
                                            <span class="badge bg-danger">✗</span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div class="seo-impact">
                                        <span class="badge bg-success">High</span>
                                        <small class="text-muted d-block">Marketing campaigns</small>
                                    </div>
                                </td>
                                <td>
                                    <div class="cultural-status">
                                        <span class="badge bg-warning">
                                            <i class="fas fa-calendar-alt me-1"></i> Date-Specific
                                        </span>
                                        <small class="text-muted d-block">Different New Year dates</small>
                                    </div>
                                </td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="openLocalizationModal('marketing-banner-1')">
                                            <i class="fas fa-globe"></i>
                                        </button>
                                        <button class="btn btn-outline-info" onclick="generateAIVersions('marketing-banner-1')">
                                            <i class="fas fa-robot"></i>
                                        </button>
                                        <button class="btn btn-outline-secondary" onclick="analyzeSEO('marketing-banner-1')">
                                            <i class="fas fa-search"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>

                            <!-- Instructional Video -->
                            <tr>
                                <td>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" value="tutorial-video-1">
                                    </div>
                                </td>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <div class="video-preview me-3">
                                            <i class="fas fa-play-circle fa-2x text-primary"></i>
                                        </div>
                                        <div>
                                            <h6 class="mb-0">how-to-setup-account.mp4</h6>
                                            <small class="text-muted">Platform → Tutorials → Onboarding</small>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span class="badge bg-primary">Video</span>
                                </td>
                                <td>
                                    <div class="localization-status">
                                        <div class="status-item">
                                            <span class="flag-icon flag-icon-es"></span>
                                            <span class="badge bg-success">✓</span>
                                        </div>
                                        <div class="status-item">
                                            <span class="flag-icon flag-icon-fr"></span>
                                            <span class="badge bg-danger">✗</span>
                                        </div>
                                        <div class="status-item">
                                            <span class="flag-icon flag-icon-ar"></span>
                                            <span class="badge bg-danger">✗</span>
                                        </div>
                                        <div class="status-item">
                                            <span class="flag-icon flag-icon-zh"></span>
                                            <span class="badge bg-danger">✗</span>
                                        </div>
                                        <div class="status-item">
                                            <span class="flag-icon flag-icon-ja"></span>
                                            <span class="badge bg-danger">✗</span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div class="seo-impact">
                                        <span class="badge bg-success">High</span>
                                        <small class="text-muted d-block">User onboarding</small>
                                    </div>
                                </td>
                                <td>
                                    <div class="cultural-status">
                                        <span class="badge bg-info">
                                            <i class="fas fa-comments me-1"></i> Voice-Over Needed
                                        </span>
                                        <small class="text-muted d-block">Multilingual narration</small>
                                    </div>
                                </td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="openVideoLocalizationModal('tutorial-video-1')">
                                            <i class="fas fa-video"></i>
                                        </button>
                                        <button class="btn btn-outline-info" onclick="generateSubtitles('tutorial-video-1')">
                                            <i class="fas fa-closed-captioning"></i>
                                        </button>
                                        <button class="btn btn-outline-secondary" onclick="analyzeSEO('tutorial-video-1')">
                                            <i class="fas fa-search"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Pagination -->
                <div class="d-flex justify-content-between align-items-center mt-4">
                    <div>
                        <small class="text-muted">Showing 1-4 of 156 assets requiring localization</small>
                    </div>
                    <nav>
                        <ul class="pagination pagination-sm mb-0">
                            <li class="page-item disabled">
                                <a class="page-link" href="#">Previous</a>
                            </li>
                            <li class="page-item active">
                                <a class="page-link" href="#">1</a>
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

        <!-- AI Automation Panel -->
        <div class="row mt-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="fas fa-robot me-2"></i> AI Automation Center
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="automation-option mb-3">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="mb-1">Auto-Generate Alt Text</h6>
                                    <small class="text-muted">AI-powered SEO-optimized descriptions</small>
                                </div>
                                <button class="btn btn-outline-primary btn-sm" onclick="runAIAltText()">
                                    <i class="fas fa-play"></i> Run
                                </button>
                            </div>
                        </div>
                        
                        <div class="automation-option mb-3">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="mb-1">Cultural Adaptation Check</h6>
                                    <small class="text-muted">Identify culturally inappropriate content</small>
                                </div>
                                <button class="btn btn-outline-warning btn-sm" onclick="runCulturalCheck()">
                                    <i class="fas fa-search"></i> Analyze
                                </button>
                            </div>
                        </div>
                        
                        <div class="automation-option mb-3">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="mb-1">Batch Text Replacement</h6>
                                    <small class="text-muted">Replace embedded text in images</small>
                                </div>
                                <button class="btn btn-outline-info btn-sm" onclick="runBatchTextReplace()">
                                    <i class="fas fa-magic"></i> Process
                                </button>
                            </div>
                        </div>
                        
                        <div class="automation-option">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="mb-1">SEO Optimization</h6>
                                    <small class="text-muted">Enhance images for search ranking</small>
                                </div>
                                <button class="btn btn-outline-success btn-sm" onclick="runSEOOptimization()">
                                    <i class="fas fa-chart-line"></i> Optimize
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="fas fa-chart-pie me-2"></i> Localization Analytics
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="metric-item d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <h6 class="mb-0">SEO Impact Score</h6>
                                <small class="text-muted">Overall localization effectiveness</small>
                            </div>
                            <div class="text-end">
                                <h4 class="mb-0 text-success">8.7/10</h4>
                                <small class="text-success">+0.3 this month</small>
                            </div>
                        </div>
                        
                        <div class="metric-item d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <h6 class="mb-0">Cultural Compliance</h6>
                                <small class="text-muted">Appropriate content percentage</small>
                            </div>
                            <div class="text-end">
                                <h4 class="mb-0 text-warning">67%</h4>
                                <small class="text-warning">12 issues found</small>
                            </div>
                        </div>
                        
                        <div class="metric-item d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <h6 class="mb-0">Auto-Generation Rate</h6>
                                <small class="text-muted">Successfully AI-generated content</small>
                            </div>
                            <div class="text-end">
                                <h4 class="mb-0 text-info">84%</h4>
                                <small class="text-info">AI efficiency</small>
                            </div>
                        </div>
                        
                        <div class="metric-item d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-0">Translation Quality</h6>
                                <small class="text-muted">Human approval rate</small>
                            </div>
                            <div class="text-end">
                                <h4 class="mb-0 text-primary">92%</h4>
                                <small class="text-primary">High quality</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Media Localization Modal -->
<div class="modal fade" id="localizationModal" tabindex="-1">
    <div class="modal-dialog modal-xl">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Media Localization: <span id="modalImageName">hero-financial-planning.jpg</span></h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-md-6">
                        <h6>Original Image</h6>
                        <div class="image-preview-container">
                            <img src="https://picsum.photos/400/300?random=1" class="img-fluid rounded" alt="Original">
                            <div class="image-info mt-2">
                                <small class="text-muted">Original: English (EN)</small>
                            </div>
                        </div>
                        
                        <div class="mt-3">
                            <h6>SEO Information</h6>
                            <div class="form-group mb-2">
                                <label class="form-label">Original Alt Text</label>
                                <input type="text" class="form-control" value="Professional financial planning consultation with advisor" readonly>
                            </div>
                            <div class="form-group mb-2">
                                <label class="form-label">File Name</label>
                                <input type="text" class="form-control" value="hero-financial-planning.jpg" readonly>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Cultural Notes</label>
                                <textarea class="form-control" rows="2" readonly>Western business setting, professional attire, handshake gesture</textarea>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6">
                        <div class="language-tabs">
                            <ul class="nav nav-tabs" role="tablist">
                                <li class="nav-item">
                                    <a class="nav-link active" data-bs-toggle="tab" href="#spanish-tab" role="tab">
                                        <span class="flag-icon flag-icon-es me-2"></span> Spanish
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" data-bs-toggle="tab" href="#arabic-tab" role="tab">
                                        <span class="flag-icon flag-icon-ar me-2"></span> Arabic
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" data-bs-toggle="tab" href="#chinese-tab" role="tab">
                                        <span class="flag-icon flag-icon-zh me-2"></span> Chinese
                                    </a>
                                </li>
                            </ul>
                            
                            <div class="tab-content mt-3">
                                <div class="tab-pane fade show active" id="spanish-tab">
                                    <div class="localized-preview">
                                        <img src="https://picsum.photos/400/300?random=10" class="img-fluid rounded" alt="Spanish Version">
                                        <div class="status-badge">
                                            <span class="badge bg-success">✓ Localized</span>
                                        </div>
                                    </div>
                                    
                                    <div class="mt-3">
                                        <div class="form-group mb-2">
                                            <label class="form-label">Spanish Alt Text</label>
                                            <input type="text" class="form-control" value="Consulta profesional de planificación financiera con asesor">
                                        </div>
                                        <div class="form-group mb-2">
                                            <label class="form-label">Localized File Name</label>
                                            <input type="text" class="form-control" value="hero-planificacion-financiera.jpg">
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">Cultural Adaptations</label>
                                            <textarea class="form-control" rows="2">Adapted for Spanish business culture, formal meeting setting maintained</textarea>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="tab-pane fade" id="arabic-tab">
                                    <div class="localized-preview">
                                        <div class="missing-localization">
                                            <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                                            <h6>Missing Arabic Localization</h6>
                                            <p class="text-muted">This image needs cultural adaptation for Arabic markets</p>
                                        </div>
                                    </div>
                                    
                                    <div class="mt-3">
                                        <div class="form-group mb-2">
                                            <label class="form-label">Arabic Alt Text</label>
                                            <input type="text" class="form-control" placeholder="استشارة مالية مهنية مع مستشار" dir="rtl">
                                        </div>
                                        <div class="form-group mb-2">
                                            <label class="form-label">Localized File Name</label>
                                            <input type="text" class="form-control" placeholder="hero-financial-planning-ar.jpg">
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">Required Cultural Changes</label>
                                            <textarea class="form-control" rows="2">Consider: Gender-appropriate imagery, Islamic financial principles, Arabic text direction</textarea>
                                        </div>
                                        <div class="mt-3">
                                            <button class="btn btn-primary" onclick="generateAILocalization('arabic')">
                                                <i class="fas fa-robot me-2"></i> Generate AI Version
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="tab-pane fade" id="chinese-tab">
                                    <div class="localized-preview">
                                        <div class="ai-generated-preview">
                                            <img src="https://picsum.photos/400/300?random=20" class="img-fluid rounded" alt="Chinese Version">
                                            <div class="status-badge">
                                                <span class="badge bg-warning">AI Generated</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="mt-3">
                                        <div class="form-group mb-2">
                                            <label class="form-label">Chinese Alt Text</label>
                                            <input type="text" class="form-control" value="专业理财规划咨询与顾问">
                                        </div>
                                        <div class="form-group mb-2">
                                            <label class="form-label">Localized File Name</label>
                                            <input type="text" class="form-control" value="hero-financial-planning-zh.jpg">
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">AI Adaptations Applied</label>
                                            <textarea class="form-control" rows="2">Asian business setting, appropriate colors (avoid white/black), Chinese cultural elements</textarea>
                                        </div>
                                        <div class="mt-3">
                                            <button class="btn btn-success" onclick="approveAIGeneration('chinese')">
                                                <i class="fas fa-check me-2"></i> Approve
                                            </button>
                                            <button class="btn btn-outline-warning" onclick="refineAIGeneration('chinese')">
                                                <i class="fas fa-edit me-2"></i> Refine
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" class="btn btn-info" onclick="generateAllMissing()">
                    <i class="fas fa-robot me-2"></i> Generate All Missing
                </button>
                <button type="button" class="btn btn-primary" onclick="saveLocalizations()">
                    <i class="fas fa-save me-2"></i> Save Localizations
                </button>
            </div>
        </div>
    </div>
</div>

<style>
.localization-status {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
}

.status-item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.flag-icon {
    width: 16px;
    height: 12px;
    background-size: cover;
    background-position: center;
    border-radius: 2px;
}

.flag-icon-es { background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2"><rect width="3" height="2" fill="%23c60b1e"/><rect width="3" height="1" y="0.5" fill="%23ffc400"/></svg>'); }
.flag-icon-fr { background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2"><rect width="1" height="2" fill="%23002854"/><rect width="1" height="2" x="1" fill="%23ffffff"/><rect width="1" height="2" x="2" fill="%23ce1126"/></svg>'); }
.flag-icon-ar { background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2"><rect width="3" height="2" fill="%23007A3D"/><text x="1.5" y="1.2" text-anchor="middle" fill="white" font-size="0.6">AR</text></svg>'); }
.flag-icon-zh { background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2"><rect width="3" height="2" fill="%23DE2910"/><circle cx="0.6" cy="0.4" r="0.15" fill="%23FFDE00"/></svg>'); }
.flag-icon-ja { background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2"><rect width="3" height="2" fill="%23ffffff"/><circle cx="1.5" cy="1" r="0.6" fill="%23bc002d"/></svg>'); }
.flag-icon-ko { background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2"><rect width="3" height="2" fill="%23ffffff"/><circle cx="1.5" cy="1" r="0.3" fill="%23cd2e3a"/></svg>'); }

.seo-impact, .cultural-status {
    text-align: center;
}

.language-progress-item {
    padding: 0.75rem;
    border-radius: 0.375rem;
    transition: background-color 0.2s;
}

.language-progress-item:hover {
    background-color: #f8f9fa;
}

.automation-option {
    padding: 0.75rem;
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
    transition: all 0.2s;
}

.automation-option:hover {
    background-color: #f8f9fa;
    border-color: #0d6efd;
}

.metric-item {
    padding: 0.75rem;
    border-radius: 0.375rem;
    transition: background-color 0.2s;
}

.metric-item:hover {
    background-color: #f8f9fa;
}

.image-preview-container {
    position: relative;
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
    overflow: hidden;
}

.localized-preview {
    position: relative;
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
    overflow: hidden;
}

.status-badge {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
}

.missing-localization, .ai-generated-preview {
    padding: 2rem;
    text-align: center;
    background: #f8f9fa;
    border-radius: 0.375rem;
}

.icon-preview {
    width: 60px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8f9fa;
    border-radius: 0.375rem;
}

.video-preview {
    width: 60px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8f9fa;
    border-radius: 0.375rem;
}
</style>

<script>
function analyzeSEOGaps() {
    alert('Running SEO analysis to identify high-impact localization opportunities...');
}

function bulkTranslate() {
    alert('Opening bulk translation interface for selected media assets...');
}

function createLocalization() {
    alert('Creating new localization project...');
}

function filterStatus(status) {
    console.log(`Filtering by status: ${status}`);
    // Update active filter button
    document.querySelectorAll('.btn-group .btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

function filterByType(type) {
    console.log(`Filtering by type: ${type}`);
}

function filterByPriority(priority) {
    console.log(`Filtering by priority: ${priority}`);
}

function openLocalizationModal(imageId) {
    const modal = new bootstrap.Modal(document.getElementById('localizationModal'));
    document.getElementById('modalImageName').textContent = imageId;
    modal.show();
}

function openVideoLocalizationModal(videoId) {
    alert(`Opening video localization interface for: ${videoId}`);
}

function generateAIVersions(imageId) {
    alert(`Generating AI versions for: ${imageId}`);
}

function analyzeSEO(imageId) {
    alert(`Analyzing SEO impact for: ${imageId}`);
}

function suggestCulturalAlternatives(imageId) {
    alert(`Suggesting cultural alternatives for: ${imageId}`);
}

function generateSubtitles(videoId) {
    alert(`Generating multilingual subtitles for: ${videoId}`);
}

function runAIAltText() {
    alert('Running AI alt text generation for all images...');
}

function runCulturalCheck() {
    alert('Analyzing all media for cultural appropriateness...');
}

function runBatchTextReplace() {
    alert('Starting batch text replacement process...');
}

function runSEOOptimization() {
    alert('Optimizing all media for SEO performance...');
}

function generateAILocalization(language) {
    alert(`Generating AI localization for: ${language}`);
}

function approveAIGeneration(language) {
    alert(`Approving AI generation for: ${language}`);
}

function refineAIGeneration(language) {
    alert(`Opening refinement interface for: ${language}`);
}

function generateAllMissing() {
    alert('Generating all missing localizations using AI...');
}

function saveLocalizations() {
    alert('Saving all localization changes...');
    bootstrap.Modal.getInstance(document.getElementById('localizationModal')).hide();
}

// Select all checkbox functionality
document.getElementById('selectAll').addEventListener('change', function() {
    const checkboxes = document.querySelectorAll('#mediaLocalizationTable input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = this.checked;
    });
});
</script>

<?php echo renderFooter(); ?>