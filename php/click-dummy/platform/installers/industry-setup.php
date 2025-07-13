<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Industry Setup & Installers", "Platform Admin", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'installers/industry-setup.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Global Resources', 'href' => '../resources/index.php'],
            ['label' => 'Industry Installers']
        ]);
        ?>
        
        <!-- Header Section -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h2 class="mb-1">Industry Setup & Installers</h2>
                <p class="text-muted mb-0">Configure and install industry-specific templates and configurations</p>
            </div>
            <button class="btn btn-primary" onclick="createCustomInstaller()">
                <i class="fas fa-plus me-2"></i> Create Custom Installer
            </button>
        </div>

        <!-- Installation Status Overview -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Available Industries', '5', 'fas fa-code-branch', 'primary');
            echo createStatCard('Installed Templates', '3', 'fas fa-check-circle', 'success');
            echo createStatCard('Pending Updates', '1', 'fas fa-clock', 'warning');
            echo createStatCard('Custom Installers', '2', 'fas fa-cog', 'info');
            ?>
        </div>

        <!-- Available Industry Installers -->
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="mb-0">Available Industry Templates</h5>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover mb-0">
                        <thead>
                            <tr>
                                <th>Industry</th>
                                <th>Description</th>
                                <th>Version</th>
                                <th>Status</th>
                                <th>Used By</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <div class="industry-icon bg-primary text-white rounded-circle me-3" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                                            <i class="fas fa-camera"></i>
                                        </div>
                                        <div>
                                            <strong>Modeling Industry</strong>
                                            <div class="small text-muted">modeling-industry-v2</div>
                                        </div>
                                    </div>
                                </td>
                                <td>Complete modeling platform with portfolios, castings, comp cards, and guardian management</td>
                                <td><span class="badge bg-info">v2.1.0</span></td>
                                <td><span class="badge bg-success">Installed</span></td>
                                <td>go-models.com</td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="configureIndustry('modeling')">
                                            <i class="fas fa-cog"></i> Configure
                                        </button>
                                        <button class="btn btn-outline-info" onclick="updateIndustry('modeling')">
                                            <i class="fas fa-sync"></i> Update
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <div class="industry-icon bg-success text-white rounded-circle me-3" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                                            <i class="fas fa-paw"></i>
                                        </div>
                                        <div>
                                            <strong>Pet Industry</strong>
                                            <div class="small text-muted">pet-industry-v1</div>
                                        </div>
                                    </div>
                                </td>
                                <td>Pet modeling and services platform with shows, training, and breeding management</td>
                                <td><span class="badge bg-info">v1.8.2</span></td>
                                <td><span class="badge bg-success">Installed</span></td>
                                <td>go-pets.com</td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="configureIndustry('pets')">
                                            <i class="fas fa-cog"></i> Configure
                                        </button>
                                        <button class="btn btn-outline-info" onclick="updateIndustry('pets')">
                                            <i class="fas fa-sync"></i> Update
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <div class="industry-icon bg-warning text-dark rounded-circle me-3" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                                            <i class="fas fa-microphone"></i>
                                        </div>
                                        <div>
                                            <strong>Voice & AI Industry</strong>
                                            <div class="small text-muted">voice-ai-industry-beta</div>
                                        </div>
                                    </div>
                                </td>
                                <td>Voice talent platform with AI agents, demos, and project management</td>
                                <td><span class="badge bg-warning">v0.9.1-beta</span></td>
                                <td><span class="badge bg-warning">Beta</span></td>
                                <td>voice-agents.com</td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="configureIndustry('voice')">
                                            <i class="fas fa-cog"></i> Configure
                                        </button>
                                        <button class="btn btn-outline-warning" onclick="promoteIndustry('voice')">
                                            <i class="fas fa-arrow-up"></i> Promote
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <div class="industry-icon bg-secondary text-white rounded-circle me-3" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                                            <i class="fas fa-palette"></i>
                                        </div>
                                        <div>
                                            <strong>Beauty Industry</strong>
                                            <div class="small text-muted">beauty-industry-v1</div>
                                        </div>
                                    </div>
                                </td>
                                <td>Beauty and makeup artist platform with portfolio management and booking system</td>
                                <td><span class="badge bg-info">v1.0.0</span></td>
                                <td><span class="badge bg-secondary">Available</span></td>
                                <td>-</td>
                                <td>
                                    <button class="btn btn-outline-success btn-sm" onclick="installIndustry('beauty')">
                                        <i class="fas fa-download"></i> Install
                                    </button>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <div class="industry-icon bg-dark text-white rounded-circle me-3" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                                            <i class="fas fa-music"></i>
                                        </div>
                                        <div>
                                            <strong>Music Industry</strong>
                                            <div class="small text-muted">music-industry-v1</div>
                                        </div>
                                    </div>
                                </td>
                                <td>Musicians and artists platform with demos, gigs, and collaboration tools</td>
                                <td><span class="badge bg-info">v1.2.0</span></td>
                                <td><span class="badge bg-secondary">Available</span></td>
                                <td>-</td>
                                <td>
                                    <button class="btn btn-outline-success btn-sm" onclick="installIndustry('music')">
                                        <i class="fas fa-download"></i> Install
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Installation Configuration -->
        <div class="row">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Installation Settings</h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label class="form-label">Default Installation Mode</label>
                            <select class="form-select">
                                <option value="full">Full Installation (All Features)</option>
                                <option value="basic">Basic Installation (Core Features Only)</option>
                                <option value="custom">Custom Installation (Select Features)</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="autoUpdate" checked>
                                <label class="form-check-label" for="autoUpdate">
                                    Enable automatic updates for industry templates
                                </label>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="backupBeforeUpdate" checked>
                                <label class="form-check-label" for="backupBeforeUpdate">
                                    Create backup before updates
                                </label>
                            </div>
                        </div>
                        <button class="btn btn-primary">Save Settings</button>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Installation History</h5>
                    </div>
                    <div class="card-body">
                        <div class="timeline">
                            <div class="timeline-item">
                                <div class="timeline-marker bg-success"></div>
                                <div class="timeline-content">
                                    <h6>Modeling Industry v2.1.0</h6>
                                    <p class="small text-muted mb-1">Installed successfully</p>
                                    <small class="text-muted">2 hours ago</small>
                                </div>
                            </div>
                            <div class="timeline-item">
                                <div class="timeline-marker bg-warning"></div>
                                <div class="timeline-content">
                                    <h6>Voice & AI Industry v0.9.1</h6>
                                    <p class="small text-muted mb-1">Beta installation completed</p>
                                    <small class="text-muted">1 day ago</small>
                                </div>
                            </div>
                            <div class="timeline-item">
                                <div class="timeline-marker bg-success"></div>
                                <div class="timeline-content">
                                    <h6>Pet Industry v1.8.2</h6>
                                    <p class="small text-muted mb-1">Updated from v1.8.1</p>
                                    <small class="text-muted">3 days ago</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
.timeline {
    position: relative;
    padding-left: 30px;
}

.timeline::before {
    content: '';
    position: absolute;
    left: 15px;
    top: 0;
    bottom: 0;
    width: 2px;
    background-color: #dee2e6;
}

.timeline-item {
    position: relative;
    margin-bottom: 20px;
}

.timeline-marker {
    position: absolute;
    left: -37px;
    top: 5px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid #fff;
}

.timeline-content h6 {
    margin-bottom: 5px;
    font-size: 0.9rem;
}
</style>

<script>
function installIndustry(industry) {
    alert('Install ' + industry + ' industry template\\n\\nThis would:\\n- Download industry template\\n- Install required database schemas\\n- Configure default categories and tags\\n- Set up industry-specific workflows');
}

function configureIndustry(industry) {
    alert('Configure ' + industry + ' industry\\n\\nOpen configuration panel for:\\n- Categories and tags\\n- Custom fields\\n- Workflows\\n- Business rules');
}

function updateIndustry(industry) {
    alert('Update ' + industry + ' industry template\\n\\nThis would:\\n- Check for updates\\n- Create backup\\n- Install new version\\n- Migrate configurations');
}

function promoteIndustry(industry) {
    alert('Promote ' + industry + ' from beta to production\\n\\nThis would:\\n- Run final tests\\n- Update version to stable\\n- Enable full feature set\\n- Notify users');
}

function createCustomInstaller() {
    alert('Create Custom Industry Installer\\n\\nBuild your own industry template with:\\n- Custom categories and tags\\n- Industry-specific fields\\n- Workflow definitions\\n- Business rules');
}
</script>

<?php echo renderFooter(); ?>