<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Limit Resolution Rules - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'limits/resolution-rules.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Features & Limits', 'href' => '#'],
            ['label' => 'Limit Resolution Rules']
        ]);
        ?>
        
        <!-- Header Section -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h2 class="mb-1">Limit Resolution Rules</h2>
                <p class="text-muted mb-0">Configure how limits are calculated across platform hierarchy</p>
            </div>
            <div class="btn-group">
                <button class="btn btn-outline-secondary" onclick="testResolution()">
                    <i class="fas fa-vial me-2"></i> Test Resolution
                </button>
                <button class="btn btn-primary" onclick="saveRules()">
                    <i class="fas fa-save me-2"></i> Save Rules
                </button>
            </div>
        </div>

        <!-- Resolution Strategy -->
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="mb-0">Limit Resolution Strategy</h5>
            </div>
            <div class="card-body">
                <div class="alert alert-info mb-4">
                    <i class="fas fa-info-circle me-2"></i>
                    <strong>Current Strategy:</strong> Limits are resolved from most restrictive to least restrictive across the hierarchy.
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <h6>Resolution Order (Top to Bottom)</h6>
                        <div class="resolution-flow">
                            <div class="resolution-step">
                                <div class="step-number">1</div>
                                <div class="step-content">
                                    <h6 class="mb-1">Platform Limits</h6>
                                    <small class="text-muted">Global maximum enforced system-wide</small>
                                </div>
                            </div>
                            <div class="flow-connector"></div>
                            <div class="resolution-step">
                                <div class="step-number">2</div>
                                <div class="step-content">
                                    <h6 class="mb-1">Tenant Limits</h6>
                                    <small class="text-muted">Per-tenant maximums and overrides</small>
                                </div>
                            </div>
                            <div class="flow-connector"></div>
                            <div class="resolution-step">
                                <div class="step-number">3</div>
                                <div class="step-content">
                                    <h6 class="mb-1">Plan Limits</h6>
                                    <small class="text-muted">Subscription plan restrictions</small>
                                </div>
                            </div>
                            <div class="flow-connector"></div>
                            <div class="resolution-step">
                                <div class="step-number">4</div>
                                <div class="step-content">
                                    <h6 class="mb-1">Account Limits</h6>
                                    <small class="text-muted">Account-specific overrides</small>
                                </div>
                            </div>
                            <div class="flow-connector"></div>
                            <div class="resolution-step final">
                                <div class="step-number">✓</div>
                                <div class="step-content">
                                    <h6 class="mb-1">Effective Limit</h6>
                                    <small class="text-muted">Final calculated value</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h6>Resolution Formula</h6>
                        <div class="formula-box">
                            <code class="d-block mb-3">
                                Effective Limit = MIN(
                                    Platform_Limit,
                                    Tenant_Limit,
                                    Plan_Limit,
                                    Account_Override
                                )
                            </code>
                            <p class="text-muted small mb-2">
                                The most restrictive limit always wins to ensure system stability and prevent abuse.
                            </p>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="allowOverrides" checked>
                                <label class="form-check-label" for="allowOverrides">
                                    Allow tenant admins to set more restrictive limits
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="allowExceptions">
                                <label class="form-check-label" for="allowExceptions">
                                    Allow platform admin to grant exceptions
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Limit Examples -->
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="mb-0">Resolution Examples</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Limit Type</th>
                                <th>Platform</th>
                                <th>Tenant</th>
                                <th>Plan</th>
                                <th>Account</th>
                                <th>Effective</th>
                                <th>Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Max Profiles</strong></td>
                                <td>1000</td>
                                <td>500</td>
                                <td>100</td>
                                <td>-</td>
                                <td><span class="badge bg-primary">100</span></td>
                                <td><small class="text-muted">Plan limit is most restrictive</small></td>
                            </tr>
                            <tr>
                                <td><strong>Storage (GB)</strong></td>
                                <td>10000</td>
                                <td>5000</td>
                                <td>1000</td>
                                <td>500</td>
                                <td><span class="badge bg-primary">500</span></td>
                                <td><small class="text-muted">Account override is most restrictive</small></td>
                            </tr>
                            <tr>
                                <td><strong>Team Members</strong></td>
                                <td>100</td>
                                <td>200 ⚠️</td>
                                <td>50</td>
                                <td>-</td>
                                <td><span class="badge bg-primary">50</span></td>
                                <td><small class="text-muted">Plan limit applies (tenant exceeds platform)</small></td>
                            </tr>
                            <tr class="table-warning">
                                <td><strong>API Calls/hour</strong></td>
                                <td>10000</td>
                                <td>5000</td>
                                <td>Unlimited</td>
                                <td>-</td>
                                <td><span class="badge bg-primary">5000</span></td>
                                <td><small class="text-muted">Tenant limit applies (plan unlimited ignored)</small></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Override Management -->
        <div class="row">
            <div class="col-lg-6">
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">Override Permissions</h5>
                    </div>
                    <div class="card-body">
                        <h6>Who Can Override Limits:</h6>
                        <div class="override-rules">
                            <div class="rule-item mb-3">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 class="mb-1">Platform Admin</h6>
                                        <small class="text-muted">Can override any limit at any level</small>
                                    </div>
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" checked disabled>
                                    </div>
                                </div>
                            </div>
                            <div class="rule-item mb-3">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 class="mb-1">Tenant Admin</h6>
                                        <small class="text-muted">Can set more restrictive limits only</small>
                                    </div>
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" checked>
                                    </div>
                                </div>
                            </div>
                            <div class="rule-item mb-3">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 class="mb-1">Account Manager</h6>
                                        <small class="text-muted">Can set team member limits</small>
                                    </div>
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" checked>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-lg-6">
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">Special Rules</h5>
                    </div>
                    <div class="card-body">
                        <div class="special-rule mb-3">
                            <h6>Unlimited Values</h6>
                            <p class="text-muted small">How to handle "unlimited" in calculations:</p>
                            <select class="form-select">
                                <option selected>Treat as system maximum (999999)</option>
                                <option>Ignore in MIN calculation</option>
                                <option>Use next lowest limit</option>
                            </select>
                        </div>
                        <div class="special-rule mb-3">
                            <h6>Zero Values</h6>
                            <p class="text-muted small">When a limit is set to zero:</p>
                            <select class="form-select">
                                <option selected>Feature is disabled</option>
                                <option>Use default minimum</option>
                                <option>Inherit from parent</option>
                            </select>
                        </div>
                        <div class="special-rule">
                            <h6>Conflict Handling</h6>
                            <p class="text-muted small">When limits conflict with features:</p>
                            <select class="form-select">
                                <option selected>Limit takes precedence</option>
                                <option>Feature requirement wins</option>
                                <option>Prompt for resolution</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Test Resolution -->
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Test Limit Resolution</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-3">
                        <label class="form-label">Limit Type</label>
                        <select class="form-select">
                            <option>Max Profiles</option>
                            <option>Storage (GB)</option>
                            <option>Team Members</option>
                            <option>API Calls/hour</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">Platform</label>
                        <input type="number" class="form-control" value="1000">
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">Tenant</label>
                        <input type="number" class="form-control" value="500">
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">Plan</label>
                        <input type="number" class="form-control" value="100">
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">Account</label>
                        <input type="number" class="form-control" placeholder="Optional">
                    </div>
                    <div class="col-md-1 d-flex align-items-end">
                        <button class="btn btn-primary w-100" onclick="calculateLimit()">
                            <i class="fas fa-calculator"></i>
                        </button>
                    </div>
                </div>
                <div id="testResult" class="mt-3" style="display: none;">
                    <div class="alert alert-success">
                        <h6>Resolution Result</h6>
                        <p class="mb-1"><strong>Effective Limit:</strong> <span id="effectiveLimit">100</span></p>
                        <p class="mb-0"><small>Applied from: <span id="appliedFrom">Plan Level</span></small></p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
.resolution-flow {
    max-width: 400px;
    margin: 0 auto;
}

.resolution-step {
    display: flex;
    align-items: center;
    padding: 1rem;
    background: white;
    border: 2px solid #dee2e6;
    border-radius: 0.5rem;
    margin-bottom: 0.5rem;
}

.resolution-step.final {
    background: #d1f3e0;
    border-color: #198754;
}

.step-number {
    width: 30px;
    height: 30px;
    background: #0d6efd;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    margin-right: 1rem;
    flex-shrink: 0;
}

.resolution-step.final .step-number {
    background: #198754;
}

.flow-connector {
    width: 2px;
    height: 20px;
    background: #dee2e6;
    margin: 0 auto;
    margin-left: 15px;
}

.formula-box {
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 0.5rem;
    border: 1px solid #dee2e6;
}

.rule-item {
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 0.375rem;
}

.special-rule {
    padding-bottom: 1rem;
    border-bottom: 1px solid #dee2e6;
}

.special-rule:last-child {
    border-bottom: none;
    padding-bottom: 0;
}
</style>

<script>
function testResolution() {
    alert('Opening resolution testing interface...\n\nYou can test how limits resolve across different scenarios.');
}

function saveRules() {
    alert('Saving limit resolution rules...\n\nThis will affect how all limits are calculated across the platform.');
}

function calculateLimit() {
    // Get all values
    const inputs = document.querySelectorAll('.row input[type="number"]');
    const values = Array.from(inputs).map(input => parseInt(input.value) || Infinity);
    
    // Find minimum
    const effectiveLimit = Math.min(...values.filter(v => v > 0));
    
    // Determine which level
    let appliedFrom = 'Platform Level';
    if (effectiveLimit === values[1]) appliedFrom = 'Tenant Level';
    else if (effectiveLimit === values[2]) appliedFrom = 'Plan Level';
    else if (effectiveLimit === values[3] && values[3] !== Infinity) appliedFrom = 'Account Level';
    
    // Show result
    document.getElementById('effectiveLimit').textContent = effectiveLimit === Infinity ? 'Unlimited' : effectiveLimit;
    document.getElementById('appliedFrom').textContent = appliedFrom;
    document.getElementById('testResult').style.display = 'block';
}
</script>

<?php echo renderFooter(); ?>