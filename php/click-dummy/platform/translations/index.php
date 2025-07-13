<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Bulk Translation System - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'translations/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Bulk Translation System']
        ]);
        ?>
        
        <!-- Bulk Translation Header -->
        <div class="bg-gradient-primary text-white p-4 rounded mb-4">
            <div class="row align-items-center">
                <div class="col-md-8">
                    <h2 class="mb-2">🌐 Bulk Translation System</h2>
                    <p class="mb-0 opacity-75">Matrix view with LLM-powered auto-translation and mass approval workflow</p>
                </div>
                <div class="col-md-4 text-end">
                    <div class="btn-group">
                        <button class="btn btn-light" onclick="showBulkActions()">
                            <i class="fas fa-magic me-2"></i> LLM Auto-Translate
                        </button>
                        <button class="btn btn-warning" onclick="showLanguageManager()">
                            <i class="fas fa-language me-2"></i> Languages
                        </button>
                        <button class="btn btn-success" onclick="exportTranslations()">
                            <i class="fas fa-download me-2"></i> Export
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Quick Stats -->
        <div class="row g-3 mb-4">
            <div class="col-md-3">
                <div class="card border-0 shadow-sm">
                    <div class="card-body text-center">
                        <div class="display-6 text-primary mb-2">12</div>
                        <h6 class="text-muted mb-0">Active Languages</h6>
                        <small class="text-success">+2 this month</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card border-0 shadow-sm">
                    <div class="card-body text-center">
                        <div class="display-6 text-success mb-2">2,847</div>
                        <h6 class="text-muted mb-0">Translation Keys</h6>
                        <small class="text-info">Ready for bulk edit</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card border-0 shadow-sm">
                    <div class="card-body text-center">
                        <div class="display-6 text-warning mb-2">468</div>
                        <h6 class="text-muted mb-0">Pending Review</h6>
                        <small class="text-danger">LLM + Email templates</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card border-0 shadow-sm">
                    <div class="card-body text-center">
                        <div class="display-6 text-info mb-2">94.2%</div>
                        <h6 class="text-muted mb-0">Completion Rate</h6>
                        <small class="text-success">Across all languages</small>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Bulk Translation Control Panel -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card border-0 shadow-sm">
                    <div class="card-header bg-light">
                        <div class="row align-items-center">
                            <div class="col-md-6">
                                <h5 class="mb-0">🎯 Bulk Translation Control Panel</h5>
                            </div>
                            <div class="col-md-6 text-end">
                                <div class="btn-group" role="group">
                                    <input type="checkbox" class="btn-check" id="select-all" onclick="toggleSelectAll(this)">
                                    <label class="btn btn-outline-primary" for="select-all">
                                        <i class="fas fa-check-square me-2"></i>Select All
                                    </label>
                                    <button class="btn btn-warning" onclick="bulkAutoTranslate()">
                                        <i class="fas fa-robot me-2"></i>LLM Auto-Translate
                                    </button>
                                    <button class="btn btn-success" onclick="bulkApprove()">
                                        <i class="fas fa-check me-2"></i>Approve Selected
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="row g-3 mb-3">
                            <div class="col-md-3">
                                <div class="input-group">
                                    <span class="input-group-text"><i class="fas fa-search"></i></span>
                                    <input type="text" class="form-control" placeholder="Search keys..." id="searchKeys">
                                </div>
                            </div>
                            <div class="col-md-2">
                                <select class="form-select" id="namespaceFilter">
                                    <option value="">All Namespaces</option>
                                    <option value="common">common</option>
                                    <option value="auth">auth</option>
                                    <option value="dashboard">dashboard</option>
                                    <option value="email">email</option>
                                    <option value="email-templates">email-templates</option>
                                    <option value="api">api</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <select class="form-select" id="statusFilter">
                                    <option value="">All Status</option>
                                    <option value="missing">Missing</option>
                                    <option value="pending">Pending Review</option>
                                    <option value="auto-translated">Auto-Translated</option>
                                    <option value="reviewed">Reviewed</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <select class="form-select" id="languageColumns">
                                    <option value="selected">Selected Languages</option>
                                    <option value="all">All Languages</option>
                                    <option value="missing-only">Missing Only</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <div class="btn-group w-100">
                                    <button class="btn btn-outline-secondary" onclick="applyFilters()">
                                        <i class="fas fa-filter me-2"></i>Filter
                                    </button>
                                    <button class="btn btn-outline-secondary" onclick="resetFilters()">
                                        <i class="fas fa-undo me-2"></i>Reset
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Language Selection -->
                        <div class="mb-3">
                            <label class="form-label fw-bold">🌐 Select Languages for Matrix View:</label>
                            <div class="row g-2">
                                <div class="col-auto">
                                    <div class="form-check form-check-inline">
                                        <input class="form-check-input" type="checkbox" id="lang-de" value="de" checked>
                                        <label class="form-check-label" for="lang-de">
                                            <img src="https://flagcdn.com/w20/de.png" class="me-1"> German
                                        </label>
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <div class="form-check form-check-inline">
                                        <input class="form-check-input" type="checkbox" id="lang-es" value="es" checked>
                                        <label class="form-check-label" for="lang-es">
                                            <img src="https://flagcdn.com/w20/es.png" class="me-1"> Spanish
                                        </label>
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <div class="form-check form-check-inline">
                                        <input class="form-check-input" type="checkbox" id="lang-fr" value="fr" checked>
                                        <label class="form-check-label" for="lang-fr">
                                            <img src="https://flagcdn.com/w20/fr.png" class="me-1"> French
                                        </label>
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <div class="form-check form-check-inline">
                                        <input class="form-check-input" type="checkbox" id="lang-it" value="it">
                                        <label class="form-check-label" for="lang-it">
                                            <img src="https://flagcdn.com/w20/it.png" class="me-1"> Italian
                                        </label>
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <div class="form-check form-check-inline">
                                        <input class="form-check-input" type="checkbox" id="lang-pt" value="pt">
                                        <label class="form-check-label" for="lang-pt">
                                            <img src="https://flagcdn.com/w20/pt.png" class="me-1"> Portuguese
                                        </label>
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <div class="form-check form-check-inline">
                                        <input class="form-check-input" type="checkbox" id="lang-ja" value="ja">
                                        <label class="form-check-label" for="lang-ja">
                                            <img src="https://flagcdn.com/w20/jp.png" class="me-1"> Japanese
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Bulk Translation Matrix -->
        <div class="card border-0 shadow-sm">
            <div class="card-header bg-gradient-light">
                <div class="row align-items-center">
                    <div class="col-md-6">
                        <h5 class="mb-0">📊 Translation Matrix</h5>
                        <small class="text-muted">Bulk edit translations across multiple languages</small>
                    </div>
                    <div class="col-md-6 text-end">
                        <span class="badge bg-info me-2">Showing: <span id="showingCount">25</span> of <span id="totalCount">2,847</span></span>
                        <span class="badge bg-warning">Pending Review: <span id="pendingCount">8</span></span>
                    </div>
                </div>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive" style="max-height: 800px; overflow-y: auto;">
                    <table class="table table-hover mb-0" id="translationMatrix">
                        <thead class="table-dark sticky-top">
                            <tr>
                                <th style="width: 50px;">
                                    <input type="checkbox" class="form-check-input" id="selectAllVisible">
                                </th>
                                <th style="width: 250px;">Translation Key</th>
                                <th style="width: 300px;">
                                    <img src="https://flagcdn.com/w20/us.png" class="me-2">English (Source)
                                </th>
                                <th style="width: 300px;" class="lang-column" data-lang="de">
                                    <img src="https://flagcdn.com/w20/de.png" class="me-2">German
                                </th>
                                <th style="width: 300px;" class="lang-column" data-lang="es">
                                    <img src="https://flagcdn.com/w20/es.png" class="me-2">Spanish
                                </th>
                                <th style="width: 300px;" class="lang-column" data-lang="fr">
                                    <img src="https://flagcdn.com/w20/fr.png" class="me-2">French
                                </th>
                                <th style="width: 100px;">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="translationTableBody">
                            <!-- Row 1 -->
                            <tr data-key="common.welcome.title">
                                <td>
                                    <input type="checkbox" class="form-check-input row-select" value="common.welcome.title">
                                </td>
                                <td>
                                    <code class="small">common.welcome.title</code>
                                    <div class="badge bg-secondary small">common</div>
                                </td>
                                <td>
                                    <div class="text-truncate">Welcome to {{platformName}}</div>
                                    <small class="text-muted">Platform welcome message</small>
                                </td>
                                <td class="lang-column" data-lang="de">
                                    <div class="input-group input-group-sm">
                                        <input type="text" class="form-control" value="Willkommen bei {{platformName}}" 
                                               data-key="common.welcome.title" data-lang="de">
                                        <button class="btn btn-outline-success btn-sm" onclick="approveTranslation(this)">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button class="btn btn-outline-info btn-sm" onclick="aiTranslate(this)">
                                            <i class="fas fa-magic"></i>
                                        </button>
                                    </div>
                                    <div class="mt-1">
                                        <span class="badge bg-success small">✓ Reviewed</span>
                                    </div>
                                </td>
                                <td class="lang-column" data-lang="es">
                                    <div class="input-group input-group-sm">
                                        <input type="text" class="form-control" value="Bienvenido a {{platformName}}" 
                                               data-key="common.welcome.title" data-lang="es">
                                        <button class="btn btn-outline-success btn-sm" onclick="approveTranslation(this)">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button class="btn btn-outline-info btn-sm" onclick="aiTranslate(this)">
                                            <i class="fas fa-magic"></i>
                                        </button>
                                    </div>
                                    <div class="mt-1">
                                        <span class="badge bg-success small">✓ Reviewed</span>
                                    </div>
                                </td>
                                <td class="lang-column" data-lang="fr">
                                    <div class="input-group input-group-sm">
                                        <input type="text" class="form-control" value="Bienvenue sur {{platformName}}" 
                                               data-key="common.welcome.title" data-lang="fr">
                                        <button class="btn btn-outline-success btn-sm" onclick="approveTranslation(this)">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button class="btn btn-outline-info btn-sm" onclick="aiTranslate(this)">
                                            <i class="fas fa-magic"></i>
                                        </button>
                                    </div>
                                    <div class="mt-1">
                                        <span class="badge bg-success small">✓ Reviewed</span>
                                    </div>
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary" onclick="editTranslationDetails(this)">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                </td>
                            </tr>
                            
                            <!-- Row 2 -->
                            <tr data-key="auth.login.button">
                                <td>
                                    <input type="checkbox" class="form-check-input row-select" value="auth.login.button">
                                </td>
                                <td>
                                    <code class="small">auth.login.button</code>
                                    <div class="badge bg-info small">auth</div>
                                </td>
                                <td>
                                    <div class="text-truncate">Sign In</div>
                                    <small class="text-muted">Login button text</small>
                                </td>
                                <td class="lang-column" data-lang="de">
                                    <div class="input-group input-group-sm">
                                        <input type="text" class="form-control" value="Anmelden" 
                                               data-key="auth.login.button" data-lang="de">
                                        <button class="btn btn-outline-success btn-sm" onclick="approveTranslation(this)">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button class="btn btn-outline-info btn-sm" onclick="aiTranslate(this)">
                                            <i class="fas fa-magic"></i>
                                        </button>
                                    </div>
                                    <div class="mt-1">
                                        <span class="badge bg-success small">✓ Reviewed</span>
                                    </div>
                                </td>
                                <td class="lang-column" data-lang="es">
                                    <div class="input-group input-group-sm">
                                        <input type="text" class="form-control" value="Iniciar Sesión" 
                                               data-key="auth.login.button" data-lang="es">
                                        <button class="btn btn-outline-success btn-sm" onclick="approveTranslation(this)">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button class="btn btn-outline-info btn-sm" onclick="aiTranslate(this)">
                                            <i class="fas fa-magic"></i>
                                        </button>
                                    </div>
                                    <div class="mt-1">
                                        <span class="badge bg-success small">✓ Reviewed</span>
                                    </div>
                                </td>
                                <td class="lang-column" data-lang="fr">
                                    <div class="input-group input-group-sm">
                                        <input type="text" class="form-control" value="Se connecter" 
                                               data-key="auth.login.button" data-lang="fr">
                                        <button class="btn btn-outline-success btn-sm" onclick="approveTranslation(this)">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button class="btn btn-outline-info btn-sm" onclick="aiTranslate(this)">
                                            <i class="fas fa-magic"></i>
                                        </button>
                                    </div>
                                    <div class="mt-1">
                                        <span class="badge bg-success small">✓ Reviewed</span>
                                    </div>
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary" onclick="editTranslationDetails(this)">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                </td>
                            </tr>
                            
                            <!-- Row 3 - Missing Translations -->
                            <tr data-key="dashboard.stats.users" class="table-warning">
                                <td>
                                    <input type="checkbox" class="form-check-input row-select" value="dashboard.stats.users">
                                </td>
                                <td>
                                    <code class="small">dashboard.stats.users</code>
                                    <div class="badge bg-success small">dashboard</div>
                                </td>
                                <td>
                                    <div class="text-truncate">{{count}} active users</div>
                                    <small class="text-muted">User count display</small>
                                </td>
                                <td class="lang-column" data-lang="de">
                                    <div class="input-group input-group-sm">
                                        <input type="text" class="form-control" value="" 
                                               placeholder="Translation needed..." 
                                               data-key="dashboard.stats.users" data-lang="de">
                                        <button class="btn btn-outline-success btn-sm" onclick="approveTranslation(this)">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button class="btn btn-outline-info btn-sm" onclick="aiTranslate(this)">
                                            <i class="fas fa-magic"></i>
                                        </button>
                                    </div>
                                    <div class="mt-1">
                                        <span class="badge bg-danger small">⚠ Missing</span>
                                    </div>
                                </td>
                                <td class="lang-column" data-lang="es">
                                    <div class="input-group input-group-sm">
                                        <input type="text" class="form-control" value="" 
                                               placeholder="Translation needed..." 
                                               data-key="dashboard.stats.users" data-lang="es">
                                        <button class="btn btn-outline-success btn-sm" onclick="approveTranslation(this)">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button class="btn btn-outline-info btn-sm" onclick="aiTranslate(this)">
                                            <i class="fas fa-magic"></i>
                                        </button>
                                    </div>
                                    <div class="mt-1">
                                        <span class="badge bg-danger small">⚠ Missing</span>
                                    </div>
                                </td>
                                <td class="lang-column" data-lang="fr">
                                    <div class="input-group input-group-sm">
                                        <input type="text" class="form-control" value="" 
                                               placeholder="Translation needed..." 
                                               data-key="dashboard.stats.users" data-lang="fr">
                                        <button class="btn btn-outline-success btn-sm" onclick="approveTranslation(this)">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button class="btn btn-outline-info btn-sm" onclick="aiTranslate(this)">
                                            <i class="fas fa-magic"></i>
                                        </button>
                                    </div>
                                    <div class="mt-1">
                                        <span class="badge bg-danger small">⚠ Missing</span>
                                    </div>
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary" onclick="editTranslationDetails(this)">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                </td>
                            </tr>
                            
                            <!-- Row 4 - Auto-translated -->
                            <tr data-key="email.welcome.subject">
                                <td>
                                    <input type="checkbox" class="form-check-input row-select" value="email.welcome.subject">
                                </td>
                                <td>
                                    <code class="small">email.welcome.subject</code>
                                    <div class="badge bg-warning small">email</div>
                                </td>
                                <td>
                                    <div class="text-truncate">Welcome to {{tenantName}} - Get Started!</div>
                                    <small class="text-muted">Welcome email subject</small>
                                </td>
                                <td class="lang-column" data-lang="de">
                                    <div class="input-group input-group-sm">
                                        <input type="text" class="form-control bg-light" value="Willkommen bei {{tenantName}} - Jetzt starten!" 
                                               data-key="email.welcome.subject" data-lang="de">
                                        <button class="btn btn-outline-success btn-sm" onclick="approveTranslation(this)">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button class="btn btn-outline-info btn-sm" onclick="aiTranslate(this)">
                                            <i class="fas fa-magic"></i>
                                        </button>
                                    </div>
                                    <div class="mt-1">
                                        <span class="badge bg-warning small">🤖 Auto-Translated</span>
                                    </div>
                                </td>
                                <td class="lang-column" data-lang="es">
                                    <div class="input-group input-group-sm">
                                        <input type="text" class="form-control bg-light" value="Bienvenido a {{tenantName}} - ¡Empezar!" 
                                               data-key="email.welcome.subject" data-lang="es">
                                        <button class="btn btn-outline-success btn-sm" onclick="approveTranslation(this)">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button class="btn btn-outline-info btn-sm" onclick="aiTranslate(this)">
                                            <i class="fas fa-magic"></i>
                                        </button>
                                    </div>
                                    <div class="mt-1">
                                        <span class="badge bg-warning small">🤖 Auto-Translated</span>
                                    </div>
                                </td>
                                <td class="lang-column" data-lang="fr">
                                    <div class="input-group input-group-sm">
                                        <input type="text" class="form-control bg-light" value="Bienvenue sur {{tenantName}} - Commencer!" 
                                               data-key="email.welcome.subject" data-lang="fr">
                                        <button class="btn btn-outline-success btn-sm" onclick="approveTranslation(this)">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button class="btn btn-outline-info btn-sm" onclick="aiTranslate(this)">
                                            <i class="fas fa-magic"></i>
                                        </button>
                                    </div>
                                    <div class="mt-1">
                                        <span class="badge bg-warning small">🤖 Auto-Translated</span>
                                    </div>
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary" onclick="editTranslationDetails(this)">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                </td>
                            </tr>
                            
                            <!-- Email Template Rows -->
                            <tr data-key="email-templates.welcome.subject">
                                <td>
                                    <input type="checkbox" class="form-check-input row-select" value="email-templates.welcome.subject">
                                </td>
                                <td>
                                    <code class="small">email-templates.welcome.subject</code>
                                    <div class="badge bg-primary small">email-templates</div>
                                </td>
                                <td>
                                    <div class="text-truncate">Welcome to {{platformName}} - Your journey begins!</div>
                                    <small class="text-muted">Email template subject line</small>
                                </td>
                                <td class="lang-column" data-lang="de">
                                    <div class="input-group input-group-sm">
                                        <input type="text" class="form-control" value="Willkommen bei {{platformName}} - Ihre Reise beginnt!" 
                                               data-key="email-templates.welcome.subject" data-lang="de">
                                        <button class="btn btn-outline-success btn-sm" onclick="approveTranslation(this)">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button class="btn btn-outline-info btn-sm" onclick="aiTranslate(this)">
                                            <i class="fas fa-magic"></i>
                                        </button>
                                    </div>
                                    <div class="mt-1">
                                        <span class="badge bg-success small">✓ Reviewed</span>
                                    </div>
                                </td>
                                <td class="lang-column" data-lang="es">
                                    <div class="input-group input-group-sm">
                                        <input type="text" class="form-control" value="Bienvenido a {{platformName}} - ¡Tu viaje comienza!" 
                                               data-key="email-templates.welcome.subject" data-lang="es">
                                        <button class="btn btn-outline-success btn-sm" onclick="approveTranslation(this)">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button class="btn btn-outline-info btn-sm" onclick="aiTranslate(this)">
                                            <i class="fas fa-magic"></i>
                                        </button>
                                    </div>
                                    <div class="mt-1">
                                        <span class="badge bg-success small">✓ Reviewed</span>
                                    </div>
                                </td>
                                <td class="lang-column" data-lang="fr">
                                    <div class="input-group input-group-sm">
                                        <input type="text" class="form-control" value="Bienvenue sur {{platformName}} - Votre parcours commence!" 
                                               data-key="email-templates.welcome.subject" data-lang="fr">
                                        <button class="btn btn-outline-success btn-sm" onclick="approveTranslation(this)">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button class="btn btn-outline-info btn-sm" onclick="aiTranslate(this)">
                                            <i class="fas fa-magic"></i>
                                        </button>
                                    </div>
                                    <div class="mt-1">
                                        <span class="badge bg-success small">✓ Reviewed</span>
                                    </div>
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary" onclick="editTranslationDetails(this)">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                </td>
                            </tr>
                            
                            <tr data-key="email-templates.welcome.greeting">
                                <td>
                                    <input type="checkbox" class="form-check-input row-select" value="email-templates.welcome.greeting">
                                </td>
                                <td>
                                    <code class="small">email-templates.welcome.greeting</code>
                                    <div class="badge bg-primary small">email-templates</div>
                                </td>
                                <td>
                                    <div class="text-truncate">Hello {{userName}}, welcome to our platform!</div>
                                    <small class="text-muted">Email template greeting</small>
                                </td>
                                <td class="lang-column" data-lang="de">
                                    <div class="input-group input-group-sm">
                                        <input type="text" class="form-control" value="Hallo {{userName}}, willkommen auf unserer Plattform!" 
                                               data-key="email-templates.welcome.greeting" data-lang="de">
                                        <button class="btn btn-outline-success btn-sm" onclick="approveTranslation(this)">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button class="btn btn-outline-info btn-sm" onclick="aiTranslate(this)">
                                            <i class="fas fa-magic"></i>
                                        </button>
                                    </div>
                                    <div class="mt-1">
                                        <span class="badge bg-success small">✓ Reviewed</span>
                                    </div>
                                </td>
                                <td class="lang-column" data-lang="es">
                                    <div class="input-group input-group-sm">
                                        <input type="text" class="form-control" value="¡Hola {{userName}}, bienvenido a nuestra plataforma!" 
                                               data-key="email-templates.welcome.greeting" data-lang="es">
                                        <button class="btn btn-outline-success btn-sm" onclick="approveTranslation(this)">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button class="btn btn-outline-info btn-sm" onclick="aiTranslate(this)">
                                            <i class="fas fa-magic"></i>
                                        </button>
                                    </div>
                                    <div class="mt-1">
                                        <span class="badge bg-success small">✓ Reviewed</span>
                                    </div>
                                </td>
                                <td class="lang-column" data-lang="fr">
                                    <div class="input-group input-group-sm">
                                        <input type="text" class="form-control" value="Bonjour {{userName}}, bienvenue sur notre plateforme!" 
                                               data-key="email-templates.welcome.greeting" data-lang="fr">
                                        <button class="btn btn-outline-success btn-sm" onclick="approveTranslation(this)">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button class="btn btn-outline-info btn-sm" onclick="aiTranslate(this)">
                                            <i class="fas fa-magic"></i>
                                        </button>
                                    </div>
                                    <div class="mt-1">
                                        <span class="badge bg-success small">✓ Reviewed</span>
                                    </div>
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary" onclick="editTranslationDetails(this)">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                </td>
                            </tr>
                            
                            <tr data-key="email-templates.password-reset.subject" class="table-warning">
                                <td>
                                    <input type="checkbox" class="form-check-input row-select" value="email-templates.password-reset.subject">
                                </td>
                                <td>
                                    <code class="small">email-templates.password-reset.subject</code>
                                    <div class="badge bg-primary small">email-templates</div>
                                </td>
                                <td>
                                    <div class="text-truncate">Reset your password for {{platformName}}</div>
                                    <small class="text-muted">Password reset email subject</small>
                                </td>
                                <td class="lang-column" data-lang="de">
                                    <div class="input-group input-group-sm">
                                        <input type="text" class="form-control" value="" 
                                               placeholder="Translation needed..." 
                                               data-key="email-templates.password-reset.subject" data-lang="de">
                                        <button class="btn btn-outline-success btn-sm" onclick="approveTranslation(this)">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button class="btn btn-outline-info btn-sm" onclick="aiTranslate(this)">
                                            <i class="fas fa-magic"></i>
                                        </button>
                                    </div>
                                    <div class="mt-1">
                                        <span class="badge bg-danger small">⚠ Missing</span>
                                    </div>
                                </td>
                                <td class="lang-column" data-lang="es">
                                    <div class="input-group input-group-sm">
                                        <input type="text" class="form-control" value="" 
                                               placeholder="Translation needed..." 
                                               data-key="email-templates.password-reset.subject" data-lang="es">
                                        <button class="btn btn-outline-success btn-sm" onclick="approveTranslation(this)">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button class="btn btn-outline-info btn-sm" onclick="aiTranslate(this)">
                                            <i class="fas fa-magic"></i>
                                        </button>
                                    </div>
                                    <div class="mt-1">
                                        <span class="badge bg-danger small">⚠ Missing</span>
                                    </div>
                                </td>
                                <td class="lang-column" data-lang="fr">
                                    <div class="input-group input-group-sm">
                                        <input type="text" class="form-control" value="" 
                                               placeholder="Translation needed..." 
                                               data-key="email-templates.password-reset.subject" data-lang="fr">
                                        <button class="btn btn-outline-success btn-sm" onclick="approveTranslation(this)">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button class="btn btn-outline-info btn-sm" onclick="aiTranslate(this)">
                                            <i class="fas fa-magic"></i>
                                        </button>
                                    </div>
                                    <div class="mt-1">
                                        <span class="badge bg-danger small">⚠ Missing</span>
                                    </div>
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary" onclick="editTranslationDetails(this)">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                </td>
                            </tr>
                            
                            <tr data-key="email-templates.booking-confirmation.subject">
                                <td>
                                    <input type="checkbox" class="form-check-input row-select" value="email-templates.booking-confirmation.subject">
                                </td>
                                <td>
                                    <code class="small">email-templates.booking-confirmation.subject</code>
                                    <div class="badge bg-primary small">email-templates</div>
                                </td>
                                <td>
                                    <div class="text-truncate">Booking Confirmed: {{jobTitle}} - {{date}}</div>
                                    <small class="text-muted">Booking confirmation subject</small>
                                </td>
                                <td class="lang-column" data-lang="de">
                                    <div class="input-group input-group-sm">
                                        <input type="text" class="form-control bg-light" value="Buchung bestätigt: {{jobTitle}} - {{date}}" 
                                               data-key="email-templates.booking-confirmation.subject" data-lang="de">
                                        <button class="btn btn-outline-success btn-sm" onclick="approveTranslation(this)">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button class="btn btn-outline-info btn-sm" onclick="aiTranslate(this)">
                                            <i class="fas fa-magic"></i>
                                        </button>
                                    </div>
                                    <div class="mt-1">
                                        <span class="badge bg-warning small">🤖 Auto-Translated</span>
                                    </div>
                                </td>
                                <td class="lang-column" data-lang="es">
                                    <div class="input-group input-group-sm">
                                        <input type="text" class="form-control bg-light" value="Reserva Confirmada: {{jobTitle}} - {{date}}" 
                                               data-key="email-templates.booking-confirmation.subject" data-lang="es">
                                        <button class="btn btn-outline-success btn-sm" onclick="approveTranslation(this)">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button class="btn btn-outline-info btn-sm" onclick="aiTranslate(this)">
                                            <i class="fas fa-magic"></i>
                                        </button>
                                    </div>
                                    <div class="mt-1">
                                        <span class="badge bg-warning small">🤖 Auto-Translated</span>
                                    </div>
                                </td>
                                <td class="lang-column" data-lang="fr">
                                    <div class="input-group input-group-sm">
                                        <input type="text" class="form-control bg-light" value="Réservation Confirmée: {{jobTitle}} - {{date}}" 
                                               data-key="email-templates.booking-confirmation.subject" data-lang="fr">
                                        <button class="btn btn-outline-success btn-sm" onclick="approveTranslation(this)">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button class="btn btn-outline-info btn-sm" onclick="aiTranslate(this)">
                                            <i class="fas fa-magic"></i>
                                        </button>
                                    </div>
                                    <div class="mt-1">
                                        <span class="badge bg-warning small">🤖 Auto-Translated</span>
                                    </div>
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary" onclick="editTranslationDetails(this)">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                </td>
                            </tr>
                            
                            <tr data-key="email-templates.casting-invitation.body">
                                <td>
                                    <input type="checkbox" class="form-check-input row-select" value="email-templates.casting-invitation.body">
                                </td>
                                <td>
                                    <code class="small">email-templates.casting-invitation.body</code>
                                    <div class="badge bg-primary small">email-templates</div>
                                </td>
                                <td>
                                    <div class="text-truncate">You have been invited to audition for {{castingTitle}}. Please review the details and respond by {{deadline}}.</div>
                                    <small class="text-muted">Casting invitation body text</small>
                                </td>
                                <td class="lang-column" data-lang="de">
                                    <div class="input-group input-group-sm">
                                        <input type="text" class="form-control" value="Sie wurden zu einem Vorsprechen für {{castingTitle}} eingeladen. Bitte prüfen Sie die Details und antworten Sie bis {{deadline}}." 
                                               data-key="email-templates.casting-invitation.body" data-lang="de">
                                        <button class="btn btn-outline-success btn-sm" onclick="approveTranslation(this)">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button class="btn btn-outline-info btn-sm" onclick="aiTranslate(this)">
                                            <i class="fas fa-magic"></i>
                                        </button>
                                    </div>
                                    <div class="mt-1">
                                        <span class="badge bg-success small">✓ Reviewed</span>
                                    </div>
                                </td>
                                <td class="lang-column" data-lang="es">
                                    <div class="input-group input-group-sm">
                                        <input type="text" class="form-control" value="Has sido invitado a una audición para {{castingTitle}}. Por favor revisa los detalles y responde antes de {{deadline}}." 
                                               data-key="email-templates.casting-invitation.body" data-lang="es">
                                        <button class="btn btn-outline-success btn-sm" onclick="approveTranslation(this)">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button class="btn btn-outline-info btn-sm" onclick="aiTranslate(this)">
                                            <i class="fas fa-magic"></i>
                                        </button>
                                    </div>
                                    <div class="mt-1">
                                        <span class="badge bg-success small">✓ Reviewed</span>
                                    </div>
                                </td>
                                <td class="lang-column" data-lang="fr">
                                    <div class="input-group input-group-sm">
                                        <input type="text" class="form-control" value="Vous avez été invité à une audition pour {{castingTitle}}. Veuillez examiner les détails et répondre avant {{deadline}}." 
                                               data-key="email-templates.casting-invitation.body" data-lang="fr">
                                        <button class="btn btn-outline-success btn-sm" onclick="approveTranslation(this)">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button class="btn btn-outline-info btn-sm" onclick="aiTranslate(this)">
                                            <i class="fas fa-magic"></i>
                                        </button>
                                    </div>
                                    <div class="mt-1">
                                        <span class="badge bg-success small">✓ Reviewed</span>
                                    </div>
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary" onclick="editTranslationDetails(this)">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <!-- Pagination -->
                <div class="card-footer">
                    <div class="row align-items-center">
                        <div class="col-md-6">
                            <span class="text-muted">Showing 1 to 25 of 2,847 entries</span>
                        </div>
                        <div class="col-md-6">
                            <nav>
                                <ul class="pagination pagination-sm justify-content-end mb-0">
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

<!-- Bulk Actions Modal -->
<div class="modal fade" id="bulkActionsModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">🤖 LLM Bulk Auto-Translation</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-md-6">
                        <h6>Source Language</h6>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="sourceLanguage" id="source-en" value="en" checked>
                            <label class="form-check-label" for="source-en">
                                <img src="https://flagcdn.com/w20/us.png" class="me-2">English (US)
                            </label>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h6>Target Languages</h6>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="target-de" value="de" checked>
                            <label class="form-check-label" for="target-de">
                                <img src="https://flagcdn.com/w20/de.png" class="me-2">German
                            </label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="target-es" value="es" checked>
                            <label class="form-check-label" for="target-es">
                                <img src="https://flagcdn.com/w20/es.png" class="me-2">Spanish
                            </label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="target-fr" value="fr" checked>
                            <label class="form-check-label" for="target-fr">
                                <img src="https://flagcdn.com/w20/fr.png" class="me-2">French
                            </label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="target-it" value="it">
                            <label class="form-check-label" for="target-it">
                                <img src="https://flagcdn.com/w20/it.png" class="me-2">Italian
                            </label>
                        </div>
                    </div>
                </div>
                <hr>
                <div class="row">
                    <div class="col-md-6">
                        <h6>Translation Scope</h6>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="translationScope" id="scope-missing" value="missing" checked>
                            <label class="form-check-label" for="scope-missing">
                                Missing translations only (468 keys)
                            </label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="translationScope" id="scope-selected" value="selected">
                            <label class="form-check-label" for="scope-selected">
                                Selected keys only (<span id="selectedKeysCount">0</span> keys)
                            </label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="translationScope" id="scope-all" value="all">
                            <label class="form-check-label" for="scope-all">
                                All keys (2,847 keys)
                            </label>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h6>LLM Settings</h6>
                        <div class="mb-3">
                            <label class="form-label">AI Model</label>
                            <select class="form-select">
                                <option>GPT-4 (High Quality)</option>
                                <option>GPT-3.5 (Fast)</option>
                                <option>Claude (Balanced)</option>
                            </select>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="contextAware" checked>
                            <label class="form-check-label" for="contextAware">
                                Context-aware translations
                            </label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="preserveVariables" checked>
                            <label class="form-check-label" for="preserveVariables">
                                Preserve {{variables}}
                            </label>
                        </div>
                    </div>
                </div>
                <div class="alert alert-info mt-3">
                    <i class="fas fa-info-circle me-2"></i>
                    <strong>Note:</strong> All LLM translations will require human review before going live. Estimated cost: $13.75 for 468 keys including email templates.
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-warning" onclick="startBulkTranslation()">
                    <i class="fas fa-robot me-2"></i>Start Auto-Translation
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Language Manager Modal -->
<div class="modal fade" id="languageManagerModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">🌐 Language Manager</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="row mb-3">
                    <div class="col-md-8">
                        <h6>Active Languages</h6>
                    </div>
                    <div class="col-md-4 text-end">
                        <button class="btn btn-primary btn-sm" onclick="addNewLanguage()">
                            <i class="fas fa-plus me-2"></i>Add Language
                        </button>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Language</th>
                                <th>Progress</th>
                                <th>Last Updated</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <img src="https://flagcdn.com/w20/us.png" class="me-2">English (US)
                                    <span class="badge bg-primary ms-2">Primary</span>
                                </td>
                                <td>
                                    <div class="progress" style="height: 20px;">
                                        <div class="progress-bar bg-success" style="width: 100%">100%</div>
                                    </div>
                                </td>
                                <td>Today</td>
                                <td>
                                    <button class="btn btn-sm btn-outline-secondary" disabled>
                                        <i class="fas fa-cog"></i>
                                    </button>
                                </td>
                            </tr>
                            <tr>
                                <td><img src="https://flagcdn.com/w20/de.png" class="me-2">German</td>
                                <td>
                                    <div class="progress" style="height: 20px;">
                                        <div class="progress-bar bg-warning" style="width: 98.5%">98.5%</div>
                                    </div>
                                </td>
                                <td>2 hours ago</td>
                                <td>
                                    <button class="btn btn-sm btn-outline-secondary">
                                        <i class="fas fa-cog"></i>
                                    </button>
                                </td>
                            </tr>
                            <tr>
                                <td><img src="https://flagcdn.com/w20/es.png" class="me-2">Spanish</td>
                                <td>
                                    <div class="progress" style="height: 20px;">
                                        <div class="progress-bar bg-info" style="width: 89.2%">89.2%</div>
                                    </div>
                                </td>
                                <td>1 day ago</td>
                                <td>
                                    <button class="btn btn-sm btn-outline-secondary">
                                        <i class="fas fa-cog"></i>
                                    </button>
                                </td>
                            </tr>
                            <tr>
                                <td><img src="https://flagcdn.com/w20/fr.png" class="me-2">French</td>
                                <td>
                                    <div class="progress" style="height: 20px;">
                                        <div class="progress-bar bg-info" style="width: 91.7%">91.7%</div>
                                    </div>
                                </td>
                                <td>3 days ago</td>
                                <td>
                                    <button class="btn btn-sm btn-outline-secondary">
                                        <i class="fas fa-cog"></i>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
.bg-gradient-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.bg-gradient-light {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.table-responsive {
    scrollbar-width: thin;
    scrollbar-color: #6c757d #f8f9fa;
}

.table-responsive::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

.table-responsive::-webkit-scrollbar-track {
    background: #f8f9fa;
}

.table-responsive::-webkit-scrollbar-thumb {
    background: #6c757d;
    border-radius: 4px;
}

.lang-column {
    min-width: 300px;
}

.form-check-input:checked[type="checkbox"] {
    background-color: #0d6efd;
    border-color: #0d6efd;
}

.btn-group .btn-check:checked + .btn {
    background-color: #0d6efd;
    border-color: #0d6efd;
    color: white;
}

.sticky-top {
    position: sticky;
    top: 0;
    z-index: 10;
}

.badge.small {
    font-size: 0.75em;
}

.input-group-sm .form-control {
    font-size: 0.875rem;
}

.table-hover tbody tr:hover {
    background-color: rgba(0, 0, 0, 0.025);
}

.table-warning {
    background-color: rgba(255, 193, 7, 0.1);
}

.table-warning:hover {
    background-color: rgba(255, 193, 7, 0.2);
}
</style>

<script>
// Global variables
let selectedKeys = new Set();
let currentLanguages = ['de', 'es', 'fr'];

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    updateLanguageColumns();
    updateSelectedKeysCount();
    
    // Add event listeners
    document.querySelectorAll('input[type="checkbox"][id^="lang-"]').forEach(checkbox => {
        checkbox.addEventListener('change', updateLanguageColumns);
    });
    
    document.querySelectorAll('.row-select').forEach(checkbox => {
        checkbox.addEventListener('change', updateSelectedKeysCount);
    });
    
    document.getElementById('selectAllVisible').addEventListener('change', function() {
        document.querySelectorAll('.row-select').forEach(checkbox => {
            checkbox.checked = this.checked;
            if (this.checked) {
                selectedKeys.add(checkbox.value);
            } else {
                selectedKeys.delete(checkbox.value);
            }
        });
        updateSelectedKeysCount();
    });
});

// Show/hide language columns based on selection
function updateLanguageColumns() {
    const activeLanguages = [];
    document.querySelectorAll('input[type="checkbox"][id^="lang-"]:checked').forEach(checkbox => {
        activeLanguages.push(checkbox.value);
    });
    
    // Show/hide columns
    document.querySelectorAll('.lang-column').forEach(column => {
        const lang = column.dataset.lang;
        if (activeLanguages.includes(lang)) {
            column.style.display = 'table-cell';
        } else {
            column.style.display = 'none';
        }
    });
    
    currentLanguages = activeLanguages;
}

// Update selected keys count
function updateSelectedKeysCount() {
    const checkedBoxes = document.querySelectorAll('.row-select:checked');
    selectedKeys.clear();
    checkedBoxes.forEach(checkbox => {
        selectedKeys.add(checkbox.value);
    });
    
    document.getElementById('selectedKeysCount').textContent = selectedKeys.size;
}

// Toggle select all
function toggleSelectAll(checkbox) {
    document.querySelectorAll('.row-select').forEach(rowCheckbox => {
        rowCheckbox.checked = checkbox.checked;
        if (checkbox.checked) {
            selectedKeys.add(rowCheckbox.value);
        } else {
            selectedKeys.delete(rowCheckbox.value);
        }
    });
    updateSelectedKeysCount();
}

// Main bulk translation functions
function showBulkActions() {
    const modal = new bootstrap.Modal(document.getElementById('bulkActionsModal'));
    modal.show();
}

function showLanguageManager() {
    const modal = new bootstrap.Modal(document.getElementById('languageManagerModal'));
    modal.show();
}

function startBulkTranslation() {
    const selectedLanguages = [];
    document.querySelectorAll('input[id^="target-"]:checked').forEach(checkbox => {
        selectedLanguages.push(checkbox.value);
    });
    
    const scope = document.querySelector('input[name="translationScope"]:checked').value;
    const model = document.querySelector('select').value;
    
    showToast('info', `Starting bulk translation for ${selectedLanguages.length} languages using ${model}...`);
    
    // Simulate bulk translation progress
    setTimeout(() => {
        showToast('warning', 'Translating 468 keys including email templates... This may take a few minutes.');
    }, 1000);
    
    setTimeout(() => {
        showToast('success', `Bulk translation completed! 468 translations (including email templates) added to review queue.`);
        
        // Update UI to show auto-translated items
        document.querySelectorAll('.badge.bg-danger').forEach(badge => {
            if (badge.textContent.includes('Missing')) {
                badge.className = 'badge bg-warning small';
                badge.innerHTML = '🤖 Auto-Translated';
                
                // Update input field
                const row = badge.closest('tr');
                const input = row.querySelector('input[type="text"]');
                if (input.value === '') {
                    const key = row.dataset.key;
                    if (key === 'dashboard.stats.users') {
                        input.value = '{{count}} aktive Benutzer';
                        input.className = 'form-control bg-light';
                    }
                }
            }
        });
        
        // Update stats
        document.getElementById('pendingCount').textContent = '468';
    }, 3000);
    
    // Close modal
    bootstrap.Modal.getInstance(document.getElementById('bulkActionsModal')).hide();
}

function bulkAutoTranslate() {
    if (selectedKeys.size === 0) {
        showToast('warning', 'Please select at least one translation key.');
        return;
    }
    
    showToast('info', `Starting auto-translation for ${selectedKeys.size} selected keys...`);
    
    // Simulate auto-translation for selected keys
    setTimeout(() => {
        selectedKeys.forEach(key => {
            const row = document.querySelector(`tr[data-key="${key}"]`);
            if (row) {
                const badges = row.querySelectorAll('.badge.bg-danger');
                badges.forEach(badge => {
                    if (badge.textContent.includes('Missing')) {
                        badge.className = 'badge bg-warning small';
                        badge.innerHTML = '🤖 Auto-Translated';
                    }
                });
                
                // Update input fields
                const inputs = row.querySelectorAll('input[type="text"]');
                inputs.forEach(input => {
                    if (input.value === '') {
                        input.value = `[AI Translation for ${key}]`;
                        input.className = 'form-control bg-light';
                    }
                });
            }
        });
        
        showToast('success', `Auto-translation completed for ${selectedKeys.size} keys!`);
        
        // Clear selection
        document.querySelectorAll('.row-select').forEach(checkbox => {
            checkbox.checked = false;
        });
        selectedKeys.clear();
        updateSelectedKeysCount();
    }, 2000);
}

function bulkApprove() {
    if (selectedKeys.size === 0) {
        showToast('warning', 'Please select at least one translation key.');
        return;
    }
    
    showToast('info', `Approving ${selectedKeys.size} selected translations...`);
    
    // Simulate approval process
    setTimeout(() => {
        selectedKeys.forEach(key => {
            const row = document.querySelector(`tr[data-key="${key}"]`);
            if (row) {
                const badges = row.querySelectorAll('.badge.bg-warning');
                badges.forEach(badge => {
                    if (badge.textContent.includes('Auto-Translated')) {
                        badge.className = 'badge bg-success small';
                        badge.innerHTML = '✓ Reviewed';
                    }
                });
                
                // Update input styling
                const inputs = row.querySelectorAll('input[type="text"]');
                inputs.forEach(input => {
                    input.className = 'form-control';
                });
            }
        });
        
        showToast('success', `${selectedKeys.size} translations approved successfully!`);
        
        // Clear selection
        document.querySelectorAll('.row-select').forEach(checkbox => {
            checkbox.checked = false;
        });
        selectedKeys.clear();
        updateSelectedKeysCount();
    }, 1500);
}

// Individual translation functions
function aiTranslate(button) {
    const input = button.closest('.input-group').querySelector('input');
    const key = input.dataset.key;
    const lang = input.dataset.lang;
    
    showToast('info', `Getting AI translation for ${key} in ${lang}...`);
    
    // Simulate AI translation
    setTimeout(() => {
        if (input.value === '') {
            const translations = {
                'dashboard.stats.users': {
                    'de': '{{count}} aktive Benutzer',
                    'es': '{{count}} usuarios activos',
                    'fr': '{{count}} utilisateurs actifs'
                }
            };
            
            if (translations[key] && translations[key][lang]) {
                input.value = translations[key][lang];
                input.className = 'form-control bg-light';
                
                // Update badge
                const badge = button.closest('td').querySelector('.badge');
                badge.className = 'badge bg-warning small';
                badge.innerHTML = '🤖 Auto-Translated';
            }
        }
        
        showToast('success', `AI translation completed for ${key}!`);
    }, 1000);
}

function approveTranslation(button) {
    const input = button.closest('.input-group').querySelector('input');
    const key = input.dataset.key;
    const lang = input.dataset.lang;
    
    if (input.value.trim() === '') {
        showToast('warning', 'Please enter a translation before approving.');
        return;
    }
    
    showToast('success', `Translation approved for ${key} in ${lang}!`);
    
    // Update badge
    const badge = button.closest('td').querySelector('.badge');
    badge.className = 'badge bg-success small';
    badge.innerHTML = '✓ Reviewed';
    
    // Update input styling
    input.className = 'form-control';
}

function editTranslationDetails(button) {
    const row = button.closest('tr');
    const key = row.dataset.key;
    showToast('info', `Opening detailed editor for ${key}...`);
}

// Filter functions
function applyFilters() {
    const searchTerm = document.getElementById('searchKeys').value.toLowerCase();
    const namespace = document.getElementById('namespaceFilter').value;
    const status = document.getElementById('statusFilter').value;
    
    document.querySelectorAll('#translationTableBody tr').forEach(row => {
        const key = row.dataset.key;
        const keyNamespace = key.split('.')[0];
        const badges = row.querySelectorAll('.badge');
        
        let statusMatch = true;
        if (status) {
            statusMatch = Array.from(badges).some(badge => {
                const badgeText = badge.textContent.toLowerCase();
                return (status === 'missing' && badgeText.includes('missing')) ||
                       (status === 'pending' && badgeText.includes('pending')) ||
                       (status === 'auto-translated' && badgeText.includes('auto-translated')) ||
                       (status === 'reviewed' && badgeText.includes('reviewed'));
            });
        }
        
        const searchMatch = searchTerm === '' || key.toLowerCase().includes(searchTerm);
        const namespaceMatch = namespace === '' || keyNamespace === namespace;
        
        row.style.display = (searchMatch && namespaceMatch && statusMatch) ? 'table-row' : 'none';
    });
    
    showToast('info', 'Filters applied successfully!');
}

function resetFilters() {
    document.getElementById('searchKeys').value = '';
    document.getElementById('namespaceFilter').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('languageColumns').value = 'selected';
    
    document.querySelectorAll('#translationTableBody tr').forEach(row => {
        row.style.display = 'table-row';
    });
    
    showToast('info', 'Filters reset successfully!');
}

// Export functions
function exportTranslations() {
    showToast('info', 'Preparing translation export...');
    
    setTimeout(() => {
        showToast('success', 'Translation files exported successfully!');
        
        // Simulate download
        const link = document.createElement('a');
        link.href = 'data:application/json;charset=utf-8,{}';
        link.download = 'translations-export.json';
        link.click();
    }, 2000);
}

// Toast notification function
function showToast(type, message) {
    const toastHtml = `
        <div class="toast align-items-center text-bg-${type === 'error' ? 'danger' : type === 'info' ? 'info' : type === 'warning' ? 'warning' : 'success'} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'info' ? 'info-circle' : type === 'warning' ? 'exclamation-triangle' : 'check-circle'} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '1090';
        document.body.appendChild(toastContainer);
    }
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    const toastElement = toastContainer.lastElementChild;
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
}

// Additional functions for compatibility
function addNewLanguage() {
    showToast('info', 'Language addition feature will be implemented...');
}
</script>

<?php echo renderFooter(); ?>