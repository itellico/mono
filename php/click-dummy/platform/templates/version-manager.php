<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Template Version Manager - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'templates/version-manager.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Industry Templates', 'href' => 'index.php'],
            ['label' => 'Version Manager']
        ]);
        ?>
        
        <!-- Header Section -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h2 class="mb-1">Template Version Manager</h2>
                <p class="text-muted mb-0">Manage template versions, migrations, and rollbacks</p>
            </div>
            <div class="btn-group">
                <button class="btn btn-outline-secondary" onclick="checkCompatibility()">
                    <i class="fas fa-check-double me-2"></i> Check Compatibility
                </button>
                <button class="btn btn-primary" onclick="createNewVersion()">
                    <i class="fas fa-plus me-2"></i> Create Version
                </button>
            </div>
        </div>

        <!-- Version Overview -->
        <div class="row g-3 mb-4">
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">Active Templates</h6>
                        <h3 class="mb-0">12</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">Total Versions</h6>
                        <h3 class="mb-0">47</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">Pending Migrations</h6>
                        <h3 class="mb-0 text-warning">3</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">Update Available</h6>
                        <h3 class="mb-0 text-success">5</h3>
                    </div>
                </div>
            </div>
        </div>

        <!-- Template Versions -->
        <div class="card">
            <div class="card-header">
                <ul class="nav nav-tabs card-header-tabs">
                    <li class="nav-item">
                        <a class="nav-link active" href="#" onclick="showTemplate('modeling')">
                            <i class="fas fa-camera me-2"></i> Modeling Platform
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#" onclick="showTemplate('freelance')">
                            <i class="fas fa-laptop-code me-2"></i> Freelancer Platform
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#" onclick="showTemplate('marketplace')">
                            <i class="fas fa-store me-2"></i> General Marketplace
                        </a>
                    </li>
                </ul>
            </div>
            <div class="card-body">
                <!-- Modeling Platform Versions -->
                <div id="modeling-versions" class="template-versions">
                    <div class="version-timeline">
                        <!-- Current Version -->
                        <div class="version-item current">
                            <div class="version-marker"></div>
                            <div class="version-content">
                                <div class="d-flex justify-content-between align-items-start">
                                    <div>
                                        <h5 class="mb-1">
                                            v2.3.0 
                                            <span class="badge bg-success ms-2">Current</span>
                                            <span class="badge bg-primary ms-1">Stable</span>
                                        </h5>
                                        <p class="text-muted mb-2">Released: Dec 15, 2024</p>
                                        <h6>Major Features:</h6>
                                        <ul class="mb-3">
                                            <li>Added Guardian Account system</li>
                                            <li>Trust Fund management for minors</li>
                                            <li>Enhanced commission tracking</li>
                                            <li>Multi-currency support</li>
                                        </ul>
                                        <div class="d-flex gap-2">
                                            <span class="badge bg-light text-dark">15 Tenants Using</span>
                                            <span class="badge bg-light text-dark">No Breaking Changes</span>
                                        </div>
                                    </div>
                                    <div class="btn-group-vertical">
                                        <button class="btn btn-sm btn-outline-primary" onclick="viewChangelog('2.3.0')">
                                            <i class="fas fa-list"></i> Changelog
                                        </button>
                                        <button class="btn btn-sm btn-outline-secondary" onclick="viewMigration('2.3.0')">
                                            <i class="fas fa-code"></i> Migration
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Previous Version -->
                        <div class="version-item">
                            <div class="version-marker"></div>
                            <div class="version-content">
                                <div class="d-flex justify-content-between align-items-start">
                                    <div>
                                        <h5 class="mb-1">
                                            v2.2.1
                                            <span class="badge bg-secondary ms-2">Previous</span>
                                        </h5>
                                        <p class="text-muted mb-2">Released: Nov 20, 2024</p>
                                        <h6>Changes:</h6>
                                        <ul class="mb-3">
                                            <li>Fixed portfolio image limits</li>
                                            <li>Improved search performance</li>
                                            <li>Added comp card templates</li>
                                        </ul>
                                        <div class="d-flex gap-2">
                                            <span class="badge bg-light text-dark">8 Tenants Using</span>
                                            <span class="badge bg-warning text-dark">3 Pending Updates</span>
                                        </div>
                                    </div>
                                    <div class="btn-group-vertical">
                                        <button class="btn btn-sm btn-outline-primary" onclick="migrateTenants('2.2.1', '2.3.0')">
                                            <i class="fas fa-arrow-up"></i> Migrate
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger" onclick="rollback('2.2.1')">
                                            <i class="fas fa-undo"></i> Rollback
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Beta Version -->
                        <div class="version-item beta">
                            <div class="version-marker"></div>
                            <div class="version-content">
                                <div class="d-flex justify-content-between align-items-start">
                                    <div>
                                        <h5 class="mb-1">
                                            v2.4.0-beta
                                            <span class="badge bg-warning ms-2">Beta</span>
                                            <span class="badge bg-danger ms-1">Breaking Changes</span>
                                        </h5>
                                        <p class="text-muted mb-2">Expected: Jan 30, 2025</p>
                                        <h6>Planned Features:</h6>
                                        <ul class="mb-3">
                                            <li>AI-powered matching system</li>
                                            <li>Video portfolio support</li>
                                            <li>Real-time collaboration tools</li>
                                            <li class="text-danger">⚠️ New permission structure (breaking)</li>
                                        </ul>
                                        <div class="d-flex gap-2">
                                            <span class="badge bg-light text-dark">2 Beta Testers</span>
                                            <span class="badge bg-danger">Requires Migration</span>
                                        </div>
                                    </div>
                                    <div class="btn-group-vertical">
                                        <button class="btn btn-sm btn-outline-warning" onclick="joinBeta('2.4.0')">
                                            <i class="fas fa-flask"></i> Test Beta
                                        </button>
                                        <button class="btn btn-sm btn-outline-primary" onclick="viewRoadmap('2.4.0')">
                                            <i class="fas fa-road"></i> Roadmap
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Migration Management -->
        <div class="row mt-4">
            <div class="col-lg-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Migration Queue</h5>
                    </div>
                    <div class="card-body">
                        <div class="migration-item mb-3">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="mb-1">Go Models Inc.</h6>
                                    <small class="text-muted">v2.1.0 → v2.3.0 (2 versions behind)</small>
                                </div>
                                <button class="btn btn-sm btn-primary" onclick="startMigration('go-models')">
                                    <i class="fas fa-play"></i> Start
                                </button>
                            </div>
                            <div class="progress mt-2" style="height: 5px;">
                                <div class="progress-bar" style="width: 0%"></div>
                            </div>
                        </div>
                        <div class="migration-item mb-3">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="mb-1">Elite Talent Agency</h6>
                                    <small class="text-muted">v2.2.1 → v2.3.0 (1 version behind)</small>
                                </div>
                                <button class="btn btn-sm btn-warning" onclick="scheduleMigration('elite')">
                                    <i class="fas fa-clock"></i> Schedule
                                </button>
                            </div>
                        </div>
                        <div class="migration-item">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="mb-1">Fashion Forward</h6>
                                    <small class="text-muted">v2.2.1 → v2.3.0 (1 version behind)</small>
                                </div>
                                <span class="badge bg-info">Scheduled: Jan 15</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-lg-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Version Compatibility Matrix</h5>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>From</th>
                                        <th>To</th>
                                        <th>Compatible</th>
                                        <th>Auto-Migrate</th>
                                        <th>Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>v2.2.1</td>
                                        <td>v2.3.0</td>
                                        <td><i class="fas fa-check text-success"></i></td>
                                        <td><i class="fas fa-check text-success"></i></td>
                                        <td>Seamless upgrade</td>
                                    </tr>
                                    <tr>
                                        <td>v2.1.0</td>
                                        <td>v2.3.0</td>
                                        <td><i class="fas fa-check text-success"></i></td>
                                        <td><i class="fas fa-exclamation text-warning"></i></td>
                                        <td>Manual review recommended</td>
                                    </tr>
                                    <tr>
                                        <td>v2.3.0</td>
                                        <td>v2.4.0-beta</td>
                                        <td><i class="fas fa-times text-danger"></i></td>
                                        <td><i class="fas fa-times text-danger"></i></td>
                                        <td>Breaking changes</td>
                                    </tr>
                                    <tr>
                                        <td>v1.x.x</td>
                                        <td>v2.3.0</td>
                                        <td><i class="fas fa-times text-danger"></i></td>
                                        <td><i class="fas fa-times text-danger"></i></td>
                                        <td>Major version incompatible</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Version Control Settings -->
        <div class="card mt-4">
            <div class="card-header">
                <h5 class="mb-0">Version Control Settings</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <h6>Update Policy</h6>
                        <div class="form-check mb-2">
                            <input class="form-check-input" type="radio" name="update-policy" id="up1" checked>
                            <label class="form-check-label" for="up1">
                                <strong>Manual Updates Only</strong> - Tenants must approve all updates
                            </label>
                        </div>
                        <div class="form-check mb-2">
                            <input class="form-check-input" type="radio" name="update-policy" id="up2">
                            <label class="form-check-label" for="up2">
                                <strong>Auto-Update Minor Versions</strong> - Auto-apply patches and minor updates
                            </label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="update-policy" id="up3">
                            <label class="form-check-label" for="up3">
                                <strong>Scheduled Updates</strong> - Update during maintenance windows
                            </label>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h6>Rollback Options</h6>
                        <div class="mb-3">
                            <label class="form-label">Keep Previous Versions</label>
                            <select class="form-select">
                                <option>Last 3 versions</option>
                                <option selected>Last 5 versions</option>
                                <option>All versions</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Rollback Window</label>
                            <select class="form-select">
                                <option>24 hours</option>
                                <option>7 days</option>
                                <option selected>30 days</option>
                                <option>No limit</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Why Version Manager Explanation -->
        <div class="card mt-4">
            <div class="card-header bg-info text-white">
                <h5 class="mb-0">
                    <i class="fas fa-question-circle me-2"></i> Why is Template Version Manager Necessary?
                </h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-lg-6">
                        <h6 class="text-danger mb-3">🚨 Without Version Manager (The Problems)</h6>
                        
                        <div class="scenario-box mb-3">
                            <h6 class="text-danger">Scenario 1: Breaking Changes</h6>
                            <p class="mb-2">You update the "Modeling Platform" template to add new features. Suddenly:</p>
                            <ul class="text-danger">
                                <li>15 existing tenants' sites break because they relied on old structure</li>
                                <li>Guardian accounts stop working because permission names changed</li>
                                <li>Commission calculations fail due to new field requirements</li>
                                <li>No way to undo the damage quickly</li>
                            </ul>
                        </div>

                        <div class="scenario-box mb-3">
                            <h6 class="text-danger">Scenario 2: Incompatible Updates</h6>
                            <p class="mb-2">A tenant is running v1.5 and you release v3.0:</p>
                            <ul class="text-danger">
                                <li>Database schema completely different</li>
                                <li>Features they paid for no longer exist</li>
                                <li>Their customizations are lost</li>
                                <li>Data corruption from incompatible structures</li>
                            </ul>
                        </div>

                        <div class="scenario-box">
                            <h6 class="text-danger">Scenario 3: No Rollback Option</h6>
                            <p class="mb-2">After updating, a major bug is discovered:</p>
                            <ul class="text-danger">
                                <li>Tenants lose revenue due to broken features</li>
                                <li>No way to revert to working version</li>
                                <li>Emergency fixes create more problems</li>
                                <li>Customer trust destroyed</li>
                            </ul>
                        </div>
                    </div>

                    <div class="col-lg-6">
                        <h6 class="text-success mb-3">✅ With Version Manager (The Solutions)</h6>
                        
                        <div class="scenario-box mb-3">
                            <h6 class="text-success">Solution 1: Safe Updates</h6>
                            <p class="mb-2">When you improve the template:</p>
                            <ul class="text-success">
                                <li>Each tenant stays on their current version until ready</li>
                                <li>Migration scripts handle data transformation safely</li>
                                <li>Compatibility checks prevent breaking changes</li>
                                <li>Beta testing with select tenants first</li>
                            </ul>
                        </div>

                        <div class="scenario-box mb-3">
                            <h6 class="text-success">Solution 2: Gradual Migration</h6>
                            <p class="mb-2">For major updates:</p>
                            <ul class="text-success">
                                <li>Clear upgrade path from any version</li>
                                <li>Automatic data migration scripts</li>
                                <li>Preserve customizations during upgrade</li>
                                <li>Test migrations before applying</li>
                            </ul>
                        </div>

                        <div class="scenario-box">
                            <h6 class="text-success">Solution 3: Emergency Recovery</h6>
                            <p class="mb-2">If problems occur:</p>
                            <ul class="text-success">
                                <li>One-click rollback to previous version</li>
                                <li>Data integrity preserved</li>
                                <li>Minimal downtime (minutes not hours)</li>
                                <li>Tenant confidence maintained</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <hr class="my-4">

                <div class="real-world-example">
                    <h5 class="mb-3">🌍 Real-World Example</h5>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="card border-primary">
                                <div class="card-body">
                                    <h6 class="card-title text-primary">Your Situation</h6>
                                    <p>You have 50 modeling agencies using your platform. You want to add:</p>
                                    <ul>
                                        <li>AI-powered model matching</li>
                                        <li>Video portfolios</li>
                                        <li>New commission structure</li>
                                    </ul>
                                    <p class="mb-0"><strong>Problem:</strong> These changes modify core database structure and permissions.</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card border-success">
                                <div class="card-body">
                                    <h6 class="card-title text-success">Version Manager Solution</h6>
                                    <ol class="mb-0">
                                        <li>Create v2.4.0 with new features</li>
                                        <li>Test with 2 beta agencies first</li>
                                        <li>Fix issues found in beta</li>
                                        <li>Create migration scripts for data</li>
                                        <li>Let agencies upgrade when ready</li>
                                        <li>Keep v2.3.0 running for others</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="alert alert-warning mt-4">
                    <h6 class="alert-heading">⚡ The Bottom Line</h6>
                    <p class="mb-0">
                        <strong>Without Version Manager:</strong> One update can break 50 client sites = business disaster<br>
                        <strong>With Version Manager:</strong> Safe updates, happy clients, sustainable growth
                    </p>
                </div>

                <div class="key-benefits mt-4">
                    <h5 class="mb-3">🎯 Key Benefits Summary</h5>
                    <div class="row g-3">
                        <div class="col-md-3">
                            <div class="benefit-card text-center">
                                <i class="fas fa-shield-alt fa-3x text-primary mb-2"></i>
                                <h6>Protection</h6>
                                <p class="small">Never break existing tenant sites</p>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="benefit-card text-center">
                                <i class="fas fa-clock fa-3x text-success mb-2"></i>
                                <h6>Flexibility</h6>
                                <p class="small">Tenants update on their schedule</p>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="benefit-card text-center">
                                <i class="fas fa-undo fa-3x text-warning mb-2"></i>
                                <h6>Recovery</h6>
                                <p class="small">Instant rollback if needed</p>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="benefit-card text-center">
                                <i class="fas fa-chart-line fa-3x text-info mb-2"></i>
                                <h6>Growth</h6>
                                <p class="small">Scale without fear</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
.version-timeline {
    position: relative;
    padding-left: 30px;
}

.version-timeline::before {
    content: '';
    position: absolute;
    left: 10px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #dee2e6;
}

.version-item {
    position: relative;
    margin-bottom: 2rem;
}

.version-marker {
    position: absolute;
    left: -25px;
    top: 5px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    border: 3px solid #6c757d;
}

.version-item.current .version-marker {
    border-color: #198754;
    background: #198754;
}

.version-item.beta .version-marker {
    border-color: #ffc107;
    background: #ffc107;
}

.version-content {
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 0.5rem;
    border: 1px solid #dee2e6;
}

.version-item.current .version-content {
    border-color: #198754;
}

.migration-item {
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 0.375rem;
}

.scenario-box {
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 0.375rem;
    border: 1px solid #dee2e6;
}

.scenario-box h6 {
    font-size: 1rem;
    margin-bottom: 0.5rem;
}

.real-world-example {
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 0.5rem;
}

.benefit-card {
    padding: 1.5rem;
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 0.5rem;
    height: 100%;
    transition: all 0.2s;
}

.benefit-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
</style>

<script>
function createNewVersion() {
    alert('Create new template version:\n\n1. Define version number (semantic versioning)\n2. Document changes\n3. Create migration scripts\n4. Test compatibility\n5. Set release date');
}

function checkCompatibility() {
    alert('Running compatibility check...\n\nChecking:\n- Feature dependencies\n- Schema changes\n- Breaking changes\n- Migration paths');
}

function showTemplate(template) {
    // Update tab active states
    document.querySelectorAll('.nav-link').forEach(tab => {
        tab.classList.remove('active');
        if (tab.textContent.toLowerCase().includes(template)) {
            tab.classList.add('active');
        }
    });
}

function viewChangelog(version) {
    alert(`Changelog for v${version}:\n\n- Added Guardian Account system\n- Trust Fund management for minors\n- Enhanced commission tracking\n- Multi-currency support\n- Bug fixes and performance improvements`);
}

function viewMigration(version) {
    alert(`Migration script for v${version}:\n\n1. Backup current data\n2. Update schema\n3. Migrate guardian accounts\n4. Update permissions\n5. Verify data integrity`);
}

function migrateTenants(from, to) {
    if (confirm(`Migrate all tenants from v${from} to v${to}?\n\nThis will:\n- Backup current state\n- Run migration scripts\n- Update tenant configurations\n- Send notifications`)) {
        alert('Migration started. You will be notified when complete.');
    }
}

function startMigration(tenant) {
    alert(`Starting migration for ${tenant}...\n\nEstimated time: 15 minutes`);
}

function scheduleMigration(tenant) {
    alert(`Schedule migration for ${tenant}\n\nSelect maintenance window for automatic migration.`);
}

function rollback(version) {
    if (confirm(`Rollback to v${version}?\n\nThis will:\n- Restore previous configuration\n- Revert schema changes\n- Notify affected tenants`)) {
        alert('Rollback initiated. This may take several minutes.');
    }
}

function joinBeta(version) {
    alert(`Join beta program for v${version}\n\nWarning: Beta versions may contain bugs and breaking changes.`);
}

function viewRoadmap(version) {
    alert(`Roadmap for v${version}:\n\n- AI-powered matching system\n- Video portfolio support\n- Real-time collaboration\n- New permission structure\n- Performance improvements`);
}
</script>

<?php echo renderFooter(); ?>