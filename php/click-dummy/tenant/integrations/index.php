<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("API & Integrations - Go Models NYC", "Admin User", "Marketplace Admin", "Tenant");
?>

<div class="d-flex">
    <?php echo renderSidebar('Tenant', getTenantSidebarItems(), 'integrations/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Tenant', 'href' => '../index.php'],
            ['label' => 'API & Integrations']
        ]);
        
        echo createHeroSection(
            "API Keys & Integrations",
            "Manage your API keys, webhooks, and third-party integrations. Connect with external services to extend your platform capabilities.",
            "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1200&h=300&fit=crop",
            [
                ['label' => 'New API Key', 'icon' => 'fas fa-key', 'style' => 'success'],
                ['label' => 'Webhook Setup', 'icon' => 'fas fa-link', 'style' => 'info'],
                ['label' => 'Integration Store', 'icon' => 'fas fa-puzzle-piece', 'style' => 'warning'],
                ['label' => 'API Docs', 'icon' => 'fas fa-book', 'style' => 'primary']
            ]
        );
        ?>
        
        <!-- Integration Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Active APIs', '12', 'fas fa-plug', 'primary');
            echo createStatCard('Webhooks', '8', 'fas fa-link', 'success');
            echo createStatCard('Monthly Calls', '45,230', 'fas fa-chart-line', 'info');
            echo createStatCard('Integrations', '6', 'fas fa-puzzle-piece', 'warning');
            ?>
        </div>

        <!-- Quick Actions -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-md-4">
                                <h6 class="mb-0">Quick Actions</h6>
                            </div>
                            <div class="col-md-8">
                                <div class="btn-group">
                                    <button class="btn btn-success" onclick="createAPIKey()">
                                        <i class="fas fa-key me-2"></i>Generate API Key
                                    </button>
                                    <button class="btn btn-info" onclick="setupWebhook()">
                                        <i class="fas fa-link me-2"></i>Add Webhook
                                    </button>
                                    <button class="btn btn-warning" onclick="browseIntegrations()">
                                        <i class="fas fa-store me-2"></i>Browse Store
                                    </button>
                                    <button class="btn btn-primary" onclick="viewAPILogs()">
                                        <i class="fas fa-history me-2"></i>View Logs
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tabs Navigation -->
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <ul class="nav nav-tabs card-header-tabs" role="tablist">
                            <li class="nav-item">
                                <a class="nav-link active" id="api-keys-tab" data-bs-toggle="tab" href="#api-keys" role="tab">
                                    <i class="fas fa-key me-2"></i>API Keys
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" id="webhooks-tab" data-bs-toggle="tab" href="#webhooks" role="tab">
                                    <i class="fas fa-link me-2"></i>Webhooks
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" id="integrations-tab" data-bs-toggle="tab" href="#integrations" role="tab">
                                    <i class="fas fa-puzzle-piece me-2"></i>Integrations
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" id="logs-tab" data-bs-toggle="tab" href="#logs" role="tab">
                                    <i class="fas fa-history me-2"></i>API Logs
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div class="card-body">
                        <div class="tab-content">
                            <!-- API Keys Tab -->
                            <div class="tab-pane fade show active" id="api-keys" role="tabpanel">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <h5>API Keys Management</h5>
                                    <button class="btn btn-success" onclick="createAPIKey()">
                                        <i class="fas fa-plus me-2"></i>Create API Key
                                    </button>
                                </div>
                                
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Key</th>
                                                <th>Permissions</th>
                                                <th>Last Used</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>
                                                    <strong>Production API</strong><br>
                                                    <small class="text-muted">Main application API key</small>
                                                </td>
                                                <td>
                                                    <code class="api-key" data-key="pk_live_abcd1234...">pk_live_••••••••••••1234</code>
                                                    <button class="btn btn-sm btn-outline-secondary ms-2" onclick="copyAPIKey('pk_live_abcd1234...')">
                                                        <i class="fas fa-copy"></i>
                                                    </button>
                                                </td>
                                                <td>
                                                    <span class="badge bg-success me-1">Read</span>
                                                    <span class="badge bg-warning me-1">Write</span>
                                                    <span class="badge bg-info">Webhooks</span>
                                                </td>
                                                <td>
                                                    <strong>2 hours ago</strong><br>
                                                    <small class="text-muted">from 192.168.1.1</small>
                                                </td>
                                                <td><span class="badge bg-success">Active</span></td>
                                                <td>
                                                    <div class="btn-group btn-group-sm">
                                                        <button class="btn btn-outline-info" onclick="viewAPIKeyDetails('prod')">
                                                            <i class="fas fa-eye"></i>
                                                        </button>
                                                        <button class="btn btn-outline-warning" onclick="editAPIKey('prod')">
                                                            <i class="fas fa-edit"></i>
                                                        </button>
                                                        <button class="btn btn-outline-danger" onclick="revokeAPIKey('prod')">
                                                            <i class="fas fa-ban"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <strong>Development API</strong><br>
                                                    <small class="text-muted">For testing and development</small>
                                                </td>
                                                <td>
                                                    <code class="api-key" data-key="pk_test_efgh5678...">pk_test_••••••••••••5678</code>
                                                    <button class="btn btn-sm btn-outline-secondary ms-2" onclick="copyAPIKey('pk_test_efgh5678...')">
                                                        <i class="fas fa-copy"></i>
                                                    </button>
                                                </td>
                                                <td>
                                                    <span class="badge bg-success me-1">Read</span>
                                                    <span class="badge bg-warning">Write</span>
                                                </td>
                                                <td>
                                                    <strong>1 day ago</strong><br>
                                                    <small class="text-muted">from 192.168.1.100</small>
                                                </td>
                                                <td><span class="badge bg-success">Active</span></td>
                                                <td>
                                                    <div class="btn-group btn-group-sm">
                                                        <button class="btn btn-outline-info" onclick="viewAPIKeyDetails('dev')">
                                                            <i class="fas fa-eye"></i>
                                                        </button>
                                                        <button class="btn btn-outline-warning" onclick="editAPIKey('dev')">
                                                            <i class="fas fa-edit"></i>
                                                        </button>
                                                        <button class="btn btn-outline-danger" onclick="revokeAPIKey('dev')">
                                                            <i class="fas fa-ban"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <strong>Mobile App API</strong><br>
                                                    <small class="text-muted">For mobile application</small>
                                                </td>
                                                <td>
                                                    <code class="api-key" data-key="pk_mobile_ijkl9012...">pk_mobile_••••••••••9012</code>
                                                    <button class="btn btn-sm btn-outline-secondary ms-2" onclick="copyAPIKey('pk_mobile_ijkl9012...')">
                                                        <i class="fas fa-copy"></i>
                                                    </button>
                                                </td>
                                                <td>
                                                    <span class="badge bg-success">Read</span>
                                                </td>
                                                <td>
                                                    <strong>5 minutes ago</strong><br>
                                                    <small class="text-muted">from mobile device</small>
                                                </td>
                                                <td><span class="badge bg-warning">Limited</span></td>
                                                <td>
                                                    <div class="btn-group btn-group-sm">
                                                        <button class="btn btn-outline-info" onclick="viewAPIKeyDetails('mobile')">
                                                            <i class="fas fa-eye"></i>
                                                        </button>
                                                        <button class="btn btn-outline-warning" onclick="editAPIKey('mobile')">
                                                            <i class="fas fa-edit"></i>
                                                        </button>
                                                        <button class="btn btn-outline-danger" onclick="revokeAPIKey('mobile')">
                                                            <i class="fas fa-ban"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <!-- Webhooks Tab -->
                            <div class="tab-pane fade" id="webhooks" role="tabpanel">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <h5>Webhook Endpoints</h5>
                                    <button class="btn btn-success" onclick="setupWebhook()">
                                        <i class="fas fa-plus me-2"></i>Add Webhook
                                    </button>
                                </div>
                                
                                <div class="row">
                                    <div class="col-lg-6 mb-3">
                                        <div class="card">
                                            <div class="card-body">
                                                <div class="d-flex justify-content-between align-items-start mb-3">
                                                    <div>
                                                        <h6 class="card-title">New Talent Registration</h6>
                                                        <code class="small">https://api.external.com/webhooks/talent</code>
                                                    </div>
                                                    <span class="badge bg-success">Active</span>
                                                </div>
                                                <div class="mb-2">
                                                    <strong>Events:</strong>
                                                    <span class="badge bg-primary me-1">talent.created</span>
                                                    <span class="badge bg-primary">talent.updated</span>
                                                </div>
                                                <div class="mb-3">
                                                    <small class="text-muted">Last delivery: 2 hours ago (Success)</small>
                                                </div>
                                                <div class="btn-group btn-group-sm">
                                                    <button class="btn btn-outline-info" onclick="testWebhook('talent')">
                                                        <i class="fas fa-play me-1"></i>Test
                                                    </button>
                                                    <button class="btn btn-outline-warning" onclick="editWebhook('talent')">
                                                        <i class="fas fa-edit me-1"></i>Edit
                                                    </button>
                                                    <button class="btn btn-outline-danger" onclick="deleteWebhook('talent')">
                                                        <i class="fas fa-trash me-1"></i>Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-lg-6 mb-3">
                                        <div class="card">
                                            <div class="card-body">
                                                <div class="d-flex justify-content-between align-items-start mb-3">
                                                    <div>
                                                        <h6 class="card-title">Casting Applications</h6>
                                                        <code class="small">https://crm.agency.com/hooks/applications</code>
                                                    </div>
                                                    <span class="badge bg-success">Active</span>
                                                </div>
                                                <div class="mb-2">
                                                    <strong>Events:</strong>
                                                    <span class="badge bg-info me-1">application.submitted</span>
                                                    <span class="badge bg-info">application.approved</span>
                                                </div>
                                                <div class="mb-3">
                                                    <small class="text-muted">Last delivery: 15 minutes ago (Success)</small>
                                                </div>
                                                <div class="btn-group btn-group-sm">
                                                    <button class="btn btn-outline-info" onclick="testWebhook('applications')">
                                                        <i class="fas fa-play me-1"></i>Test
                                                    </button>
                                                    <button class="btn btn-outline-warning" onclick="editWebhook('applications')">
                                                        <i class="fas fa-edit me-1"></i>Edit
                                                    </button>
                                                    <button class="btn btn-outline-danger" onclick="deleteWebhook('applications')">
                                                        <i class="fas fa-trash me-1"></i>Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-lg-6 mb-3">
                                        <div class="card">
                                            <div class="card-body">
                                                <div class="d-flex justify-content-between align-items-start mb-3">
                                                    <div>
                                                        <h6 class="card-title">Payment Notifications</h6>
                                                        <code class="small">https://billing.company.com/stripe/webhook</code>
                                                    </div>
                                                    <span class="badge bg-warning">Pending</span>
                                                </div>
                                                <div class="mb-2">
                                                    <strong>Events:</strong>
                                                    <span class="badge bg-success me-1">payment.succeeded</span>
                                                    <span class="badge bg-danger">payment.failed</span>
                                                </div>
                                                <div class="mb-3">
                                                    <small class="text-muted">Last delivery: Failed (Retry in 1 hour)</small>
                                                </div>
                                                <div class="btn-group btn-group-sm">
                                                    <button class="btn btn-outline-info" onclick="testWebhook('payments')">
                                                        <i class="fas fa-play me-1"></i>Test
                                                    </button>
                                                    <button class="btn btn-outline-warning" onclick="editWebhook('payments')">
                                                        <i class="fas fa-edit me-1"></i>Edit
                                                    </button>
                                                    <button class="btn btn-outline-danger" onclick="deleteWebhook('payments')">
                                                        <i class="fas fa-trash me-1"></i>Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-lg-6 mb-3">
                                        <div class="card">
                                            <div class="card-body">
                                                <div class="d-flex justify-content-between align-items-start mb-3">
                                                    <div>
                                                        <h6 class="card-title">Email Marketing</h6>
                                                        <code class="small">https://api.mailchimp.com/3.0/webhooks</code>
                                                    </div>
                                                    <span class="badge bg-secondary">Disabled</span>
                                                </div>
                                                <div class="mb-2">
                                                    <strong>Events:</strong>
                                                    <span class="badge bg-secondary me-1">user.subscribed</span>
                                                    <span class="badge bg-secondary">user.unsubscribed</span>
                                                </div>
                                                <div class="mb-3">
                                                    <small class="text-muted">Disabled by user</small>
                                                </div>
                                                <div class="btn-group btn-group-sm">
                                                    <button class="btn btn-outline-success" onclick="enableWebhook('email')">
                                                        <i class="fas fa-play me-1"></i>Enable
                                                    </button>
                                                    <button class="btn btn-outline-warning" onclick="editWebhook('email')">
                                                        <i class="fas fa-edit me-1"></i>Edit
                                                    </button>
                                                    <button class="btn btn-outline-danger" onclick="deleteWebhook('email')">
                                                        <i class="fas fa-trash me-1"></i>Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Integrations Tab -->
                            <div class="tab-pane fade" id="integrations" role="tabpanel">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <h5>Active Integrations</h5>
                                    <button class="btn btn-success" onclick="browseIntegrations()">
                                        <i class="fas fa-store me-2"></i>Browse Store
                                    </button>
                                </div>
                                
                                <div class="row">
                                    <div class="col-lg-4 col-md-6 mb-3">
                                        <div class="card h-100">
                                            <div class="card-body text-center">
                                                <div class="mb-3">
                                                    <i class="fab fa-stripe fa-3x text-primary"></i>
                                                </div>
                                                <h6 class="card-title">Stripe Payments</h6>
                                                <p class="card-text small text-muted">Process payments and manage subscriptions</p>
                                                <div class="mb-3">
                                                    <span class="badge bg-success">Connected</span>
                                                </div>
                                                <div class="btn-group btn-group-sm">
                                                    <button class="btn btn-outline-info" onclick="configureIntegration('stripe')">
                                                        <i class="fas fa-cog"></i> Configure
                                                    </button>
                                                    <button class="btn btn-outline-warning" onclick="disconnectIntegration('stripe')">
                                                        <i class="fas fa-unlink"></i> Disconnect
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-lg-4 col-md-6 mb-3">
                                        <div class="card h-100">
                                            <div class="card-body text-center">
                                                <div class="mb-3">
                                                    <i class="fab fa-mailchimp fa-3x text-warning"></i>
                                                </div>
                                                <h6 class="card-title">Mailchimp</h6>
                                                <p class="card-text small text-muted">Email marketing and automation</p>
                                                <div class="mb-3">
                                                    <span class="badge bg-success">Connected</span>
                                                </div>
                                                <div class="btn-group btn-group-sm">
                                                    <button class="btn btn-outline-info" onclick="configureIntegration('mailchimp')">
                                                        <i class="fas fa-cog"></i> Configure
                                                    </button>
                                                    <button class="btn btn-outline-warning" onclick="disconnectIntegration('mailchimp')">
                                                        <i class="fas fa-unlink"></i> Disconnect
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-lg-4 col-md-6 mb-3">
                                        <div class="card h-100">
                                            <div class="card-body text-center">
                                                <div class="mb-3">
                                                    <i class="fab fa-google fa-3x text-danger"></i>
                                                </div>
                                                <h6 class="card-title">Google Analytics</h6>
                                                <p class="card-text small text-muted">Track website and application analytics</p>
                                                <div class="mb-3">
                                                    <span class="badge bg-success">Connected</span>
                                                </div>
                                                <div class="btn-group btn-group-sm">
                                                    <button class="btn btn-outline-info" onclick="configureIntegration('google')">
                                                        <i class="fas fa-cog"></i> Configure
                                                    </button>
                                                    <button class="btn btn-outline-warning" onclick="disconnectIntegration('google')">
                                                        <i class="fas fa-unlink"></i> Disconnect
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-lg-4 col-md-6 mb-3">
                                        <div class="card h-100">
                                            <div class="card-body text-center">
                                                <div class="mb-3">
                                                    <i class="fab fa-slack fa-3x text-success"></i>
                                                </div>
                                                <h6 class="card-title">Slack</h6>
                                                <p class="card-text small text-muted">Team notifications and communication</p>
                                                <div class="mb-3">
                                                    <span class="badge bg-secondary">Available</span>
                                                </div>
                                                <div class="btn-group btn-group-sm">
                                                    <button class="btn btn-outline-success" onclick="connectIntegration('slack')">
                                                        <i class="fas fa-link"></i> Connect
                                                    </button>
                                                    <button class="btn btn-outline-info" onclick="learnMoreIntegration('slack')">
                                                        <i class="fas fa-info"></i> Learn More
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-lg-4 col-md-6 mb-3">
                                        <div class="card h-100">
                                            <div class="card-body text-center">
                                                <div class="mb-3">
                                                    <i class="fab fa-zapier fa-3x text-info"></i>
                                                </div>
                                                <h6 class="card-title">Zapier</h6>
                                                <p class="card-text small text-muted">Automate workflows with 3000+ apps</p>
                                                <div class="mb-3">
                                                    <span class="badge bg-secondary">Available</span>
                                                </div>
                                                <div class="btn-group btn-group-sm">
                                                    <button class="btn btn-outline-success" onclick="connectIntegration('zapier')">
                                                        <i class="fas fa-link"></i> Connect
                                                    </button>
                                                    <button class="btn btn-outline-info" onclick="learnMoreIntegration('zapier')">
                                                        <i class="fas fa-info"></i> Learn More
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-lg-4 col-md-6 mb-3">
                                        <div class="card h-100">
                                            <div class="card-body text-center">
                                                <div class="mb-3">
                                                    <i class="fas fa-camera fa-3x text-dark"></i>
                                                </div>
                                                <h6 class="card-title">Adobe Creative Cloud</h6>
                                                <p class="card-text small text-muted">Asset management and creative workflows</p>
                                                <div class="mb-3">
                                                    <span class="badge bg-secondary">Available</span>
                                                </div>
                                                <div class="btn-group btn-group-sm">
                                                    <button class="btn btn-outline-success" onclick="connectIntegration('adobe')">
                                                        <i class="fas fa-link"></i> Connect
                                                    </button>
                                                    <button class="btn btn-outline-info" onclick="learnMoreIntegration('adobe')">
                                                        <i class="fas fa-info"></i> Learn More
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- API Logs Tab -->
                            <div class="tab-pane fade" id="logs" role="tabpanel">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <h5>API Request Logs</h5>
                                    <div class="btn-group">
                                        <button class="btn btn-outline-secondary" onclick="refreshLogs()">
                                            <i class="fas fa-sync me-2"></i>Refresh
                                        </button>
                                        <button class="btn btn-outline-primary" onclick="exportLogs()">
                                            <i class="fas fa-download me-2"></i>Export
                                        </button>
                                    </div>
                                </div>
                                
                                <!-- Log Filters -->
                                <div class="row mb-3">
                                    <div class="col-md-3">
                                        <select class="form-select" id="logFilter">
                                            <option value="">All Requests</option>
                                            <option value="success">Success (2xx)</option>
                                            <option value="error">Errors (4xx, 5xx)</option>
                                            <option value="webhook">Webhooks</option>
                                        </select>
                                    </div>
                                    <div class="col-md-3">
                                        <select class="form-select" id="timeFilter">
                                            <option value="1h">Last Hour</option>
                                            <option value="24h" selected>Last 24 Hours</option>
                                            <option value="7d">Last 7 Days</option>
                                            <option value="30d">Last 30 Days</option>
                                        </select>
                                    </div>
                                    <div class="col-md-4">
                                        <input type="text" class="form-control" placeholder="Search logs..." id="searchLogs">
                                    </div>
                                    <div class="col-md-2">
                                        <button class="btn btn-primary w-100" onclick="applyLogFilters()">Filter</button>
                                    </div>
                                </div>
                                
                                <div class="table-responsive">
                                    <table class="table table-sm table-hover">
                                        <thead>
                                            <tr>
                                                <th>Time</th>
                                                <th>Method</th>
                                                <th>Endpoint</th>
                                                <th>Status</th>
                                                <th>Response Time</th>
                                                <th>IP Address</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td><small>14:23:45</small></td>
                                                <td><span class="badge bg-success">GET</span></td>
                                                <td><code>/api/v1/talent</code></td>
                                                <td><span class="badge bg-success">200</span></td>
                                                <td>145ms</td>
                                                <td>192.168.1.1</td>
                                                <td>
                                                    <button class="btn btn-sm btn-outline-info" onclick="viewLogDetails('log1')">
                                                        <i class="fas fa-eye"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td><small>14:22:12</small></td>
                                                <td><span class="badge bg-warning">POST</span></td>
                                                <td><code>/api/v1/castings</code></td>
                                                <td><span class="badge bg-success">201</span></td>
                                                <td>332ms</td>
                                                <td>192.168.1.100</td>
                                                <td>
                                                    <button class="btn btn-sm btn-outline-info" onclick="viewLogDetails('log2')">
                                                        <i class="fas fa-eye"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td><small>14:21:33</small></td>
                                                <td><span class="badge bg-info">PUT</span></td>
                                                <td><code>/api/v1/applications/123</code></td>
                                                <td><span class="badge bg-success">200</span></td>
                                                <td>89ms</td>
                                                <td>10.0.0.50</td>
                                                <td>
                                                    <button class="btn btn-sm btn-outline-info" onclick="viewLogDetails('log3')">
                                                        <i class="fas fa-eye"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td><small>14:20:45</small></td>
                                                <td><span class="badge bg-danger">DELETE</span></td>
                                                <td><code>/api/v1/talent/456</code></td>
                                                <td><span class="badge bg-danger">404</span></td>
                                                <td>23ms</td>
                                                <td>192.168.1.1</td>
                                                <td>
                                                    <button class="btn btn-sm btn-outline-info" onclick="viewLogDetails('log4')">
                                                        <i class="fas fa-eye"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td><small>14:19:12</small></td>
                                                <td><span class="badge bg-secondary">WEBHOOK</span></td>
                                                <td><code>/webhooks/talent-created</code></td>
                                                <td><span class="badge bg-success">200</span></td>
                                                <td>1.2s</td>
                                                <td>External</td>
                                                <td>
                                                    <button class="btn btn-sm btn-outline-info" onclick="viewLogDetails('log5')">
                                                        <i class="fas fa-eye"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                
                                <!-- Pagination -->
                                <nav>
                                    <ul class="pagination pagination-sm justify-content-center">
                                        <li class="page-item disabled">
                                            <span class="page-link">Previous</span>
                                        </li>
                                        <li class="page-item active">
                                            <span class="page-link">1</span>
                                        </li>
                                        <li class="page-item">
                                            <a class="page-link" href="#" onclick="loadLogPage(2)">2</a>
                                        </li>
                                        <li class="page-item">
                                            <a class="page-link" href="#" onclick="loadLogPage(3)">3</a>
                                        </li>
                                        <li class="page-item">
                                            <a class="page-link" href="#" onclick="loadLogPage(2)">Next</a>
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
</div>

<!-- Create API Key Modal -->
<div class="modal fade" id="createAPIKeyModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Create New API Key</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form id="createAPIKeyForm">
                    <div class="mb-3">
                        <label class="form-label">API Key Name *</label>
                        <input type="text" class="form-control" id="apiKeyName" placeholder="e.g., Production API, Mobile App">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Description</label>
                        <textarea class="form-control" id="apiKeyDescription" rows="2" placeholder="What will this API key be used for?"></textarea>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Permissions</label>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="permRead" checked>
                            <label class="form-check-label" for="permRead">Read Access</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="permWrite">
                            <label class="form-check-label" for="permWrite">Write Access</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="permWebhooks">
                            <label class="form-check-label" for="permWebhooks">Webhook Access</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="permAdmin">
                            <label class="form-check-label" for="permAdmin">Admin Access</label>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Expiration</label>
                        <select class="form-select" id="apiKeyExpiration">
                            <option value="never">Never</option>
                            <option value="30d">30 Days</option>
                            <option value="90d">90 Days</option>
                            <option value="1y">1 Year</option>
                        </select>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-success" onclick="generateAPIKey()">Generate API Key</button>
            </div>
        </div>
    </div>
</div>

<!-- Setup Webhook Modal -->
<div class="modal fade" id="setupWebhookModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Setup New Webhook</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form id="setupWebhookForm">
                    <div class="mb-3">
                        <label class="form-label">Webhook Name *</label>
                        <input type="text" class="form-control" id="webhookName" placeholder="e.g., New User Notification">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Endpoint URL *</label>
                        <input type="url" class="form-control" id="webhookUrl" placeholder="https://your-domain.com/webhook">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Events to Subscribe</label>
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="eventTalentCreated">
                                    <label class="form-check-label" for="eventTalentCreated">talent.created</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="eventTalentUpdated">
                                    <label class="form-check-label" for="eventTalentUpdated">talent.updated</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="eventApplicationSubmitted">
                                    <label class="form-check-label" for="eventApplicationSubmitted">application.submitted</label>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="eventCastingCreated">
                                    <label class="form-check-label" for="eventCastingCreated">casting.created</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="eventPaymentSucceeded">
                                    <label class="form-check-label" for="eventPaymentSucceeded">payment.succeeded</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="eventPaymentFailed">
                                    <label class="form-check-label" for="eventPaymentFailed">payment.failed</label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Secret Key (Optional)</label>
                        <input type="text" class="form-control" id="webhookSecret" placeholder="Used to verify webhook authenticity">
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-success" onclick="createWebhook()">Create Webhook</button>
            </div>
        </div>
    </div>
</div>

<script>
// API & Integrations Management JavaScript
let apiKeys = [];
let webhooks = [];
let currentTab = 'api-keys';

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    console.log('ClickDami API & Integrations - Fully Interactive Version Loaded');
});

// API Key Management Functions
function createAPIKey() {
    const modal = new bootstrap.Modal(document.getElementById('createAPIKeyModal'));
    modal.show();
}

function generateAPIKey() {
    const name = document.getElementById('apiKeyName').value;
    const description = document.getElementById('apiKeyDescription').value;
    
    if (!name.trim()) {
        showToast('error', 'API Key name is required');
        return;
    }
    
    // Generate a mock API key
    const keyPrefix = name.toLowerCase().includes('test') ? 'pk_test' : 
                     name.toLowerCase().includes('mobile') ? 'pk_mobile' : 'pk_live';
    const randomKey = keyPrefix + '_' + Math.random().toString(36).substr(2, 16);
    
    // Close modal and reset form
    bootstrap.Modal.getInstance(document.getElementById('createAPIKeyModal')).hide();
    document.getElementById('createAPIKeyForm').reset();
    
    showToast('success', `API Key "${name}" created successfully!`);
    
    // Show the generated key in a special modal (in real app, this would only be shown once)
    setTimeout(() => {
        alert(`Your new API Key: ${randomKey}\n\nIMPORTANT: Save this key now. You won't be able to see it again!`);
    }, 500);
}

function copyAPIKey(key) {
    navigator.clipboard.writeText(key).then(() => {
        showToast('success', 'API Key copied to clipboard!');
    }).catch(() => {
        showToast('error', 'Failed to copy API Key');
    });
}

function viewAPIKeyDetails(keyId) {
    showToast('info', `Loading API Key details for: ${keyId}`);
    // In real implementation, this would open a detailed modal
}

function editAPIKey(keyId) {
    showToast('info', `Edit mode for API Key: ${keyId}`);
    // In real implementation, this would open an edit modal
}

function revokeAPIKey(keyId) {
    if (confirm('Are you sure you want to revoke this API key? This action cannot be undone and will break any integrations using this key.')) {
        showToast('success', `API Key ${keyId} has been revoked successfully!`);
        // In real implementation, this would disable the key
    }
}

// Webhook Management Functions
function setupWebhook() {
    const modal = new bootstrap.Modal(document.getElementById('setupWebhookModal'));
    modal.show();
}

function createWebhook() {
    const name = document.getElementById('webhookName').value;
    const url = document.getElementById('webhookUrl').value;
    
    if (!name.trim() || !url.trim()) {
        showToast('error', 'Webhook name and URL are required');
        return;
    }
    
    // Close modal and reset form
    bootstrap.Modal.getInstance(document.getElementById('setupWebhookModal')).hide();
    document.getElementById('setupWebhookForm').reset();
    
    showToast('success', `Webhook "${name}" created successfully!`);
}

function testWebhook(webhookId) {
    showToast('info', `Testing webhook: ${webhookId}...`);
    
    // Simulate webhook test
    setTimeout(() => {
        const success = Math.random() > 0.2; // 80% success rate
        if (success) {
            showToast('success', `Webhook test successful! Response: 200 OK`);
        } else {
            showToast('error', `Webhook test failed! Response: 500 Internal Server Error`);
        }
    }, 1500);
}

function editWebhook(webhookId) {
    showToast('info', `Edit mode for webhook: ${webhookId}`);
    // In real implementation, this would open an edit modal
}

function deleteWebhook(webhookId) {
    if (confirm('Are you sure you want to delete this webhook? This action cannot be undone.')) {
        showToast('success', `Webhook ${webhookId} deleted successfully!`);
        // In real implementation, this would remove the webhook
    }
}

function enableWebhook(webhookId) {
    showToast('success', `Webhook ${webhookId} has been enabled!`);
    // In real implementation, this would enable the webhook
}

// Integration Management Functions
function browseIntegrations() {
    showToast('info', 'Opening Integration Store...');
    // In real implementation, this would open integration marketplace
}

function configureIntegration(integrationId) {
    showToast('info', `Opening configuration for ${integrationId}...`);
    // In real implementation, this would open integration settings
}

function connectIntegration(integrationId) {
    showToast('info', `Initiating connection to ${integrationId}...`);
    
    // Simulate connection process
    setTimeout(() => {
        showToast('success', `Successfully connected to ${integrationId}!`);
    }, 2000);
}

function disconnectIntegration(integrationId) {
    if (confirm(`Are you sure you want to disconnect ${integrationId}? This will stop all data synchronization.`)) {
        showToast('success', `Disconnected from ${integrationId} successfully!`);
        // In real implementation, this would disconnect the integration
    }
}

function learnMoreIntegration(integrationId) {
    showToast('info', `Opening documentation for ${integrationId}...`);
    // In real implementation, this would open integration docs
}

// Log Management Functions
function viewAPILogs() {
    // Switch to logs tab
    const logsTab = document.getElementById('logs-tab');
    const tabInstance = new bootstrap.Tab(logsTab);
    tabInstance.show();
    
    showToast('info', 'Loading API logs...');
}

function refreshLogs() {
    showToast('success', 'API logs refreshed!');
    // In real implementation, this would reload the logs
}

function exportLogs() {
    showToast('info', 'Preparing log export...');
    
    // Simulate export
    setTimeout(() => {
        showToast('success', 'Logs exported successfully! Download will start shortly.');
    }, 1500);
}

function applyLogFilters() {
    const filter = document.getElementById('logFilter').value;
    const timeFilter = document.getElementById('timeFilter').value;
    const search = document.getElementById('searchLogs').value;
    
    showToast('success', `Applied filters: ${filter || 'all'}, ${timeFilter}, search: "${search}"`);
    // In real implementation, this would filter the logs
}

function viewLogDetails(logId) {
    showToast('info', `Loading details for log: ${logId}`);
    // In real implementation, this would show detailed log information
}

function loadLogPage(page) {
    showToast('info', `Loading page ${page} of logs...`);
    // In real implementation, this would load the specified page
}

// Toast notification function
function showToast(type, message) {
    const toastHtml = `
        <div class="toast align-items-center text-bg-${type === 'error' ? 'danger' : type === 'info' ? 'info' : 'success'} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'info' ? 'info-circle' : 'check-circle'} me-2"></i>
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
    
    toastContainer.innerHTML = toastHtml;
    const toastElement = toastContainer.querySelector('.toast');
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}
</script>

<style>
.api-key {
    font-family: 'Courier New', monospace;
    background-color: #f8f9fa;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    border: 1px solid #dee2e6;
}

.card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    transition: all 0.2s ease;
}

.nav-tabs .nav-link {
    color: #495057;
}

.nav-tabs .nav-link.active {
    color: #495057;
    font-weight: 500;
}

.table-responsive {
    max-height: 400px;
    overflow-y: auto;
}

.badge {
    font-size: 0.75rem;
}

.btn-group-sm .btn {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
}
</style>

<?php echo renderFooter(); ?>