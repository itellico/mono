<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Add-on Pricing Configuration - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'billing/addon-pricing.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Billing & Monetization', 'href' => 'index.php'],
            ['label' => 'Add-on Pricing']
        ]);
        ?>
        
        <!-- Header Section -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h2 class="mb-1">Add-on & Extra Features Pricing</h2>
                <p class="text-muted mb-0">Configure pricing for features beyond subscription limits</p>
            </div>
            <div class="btn-group">
                <button class="btn btn-outline-secondary" onclick="previewPricing()">
                    <i class="fas fa-eye me-2"></i> Preview
                </button>
                <button class="btn btn-primary" onclick="savePricing()">
                    <i class="fas fa-save me-2"></i> Save Changes
                </button>
            </div>
        </div>

        <!-- Pricing Strategy Alert -->
        <div class="alert alert-info mb-4">
            <i class="fas fa-lightbulb me-2"></i>
            <strong>Hybrid Monetization Model:</strong> Combine subscriptions with add-ons and one-time purchases to maximize revenue while providing flexibility to users.
        </div>

        <div class="row g-4">
            <!-- Subscription Add-ons -->
            <div class="col-lg-6">
                <div class="card">
                    <div class="card-header bg-primary text-white">
                        <h5 class="mb-0">
                            <i class="fas fa-plus-circle me-2"></i> Subscription Add-ons
                        </h5>
                        <small>Monthly recurring charges added to base subscription</small>
                    </div>
                    <div class="card-body">
                        <!-- Extra Profiles -->
                        <div class="addon-item mb-4">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <h6 class="mb-1">Additional Profiles</h6>
                                    <p class="text-muted small mb-0">When user exceeds plan's profile limit</p>
                                </div>
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" checked>
                                </div>
                            </div>
                            <div class="row g-2">
                                <div class="col-md-6">
                                    <label class="form-label small">Price per profile/month</label>
                                    <div class="input-group">
                                        <span class="input-group-text">€</span>
                                        <input type="number" class="form-control" value="5" step="0.01">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label small">Billing</label>
                                    <select class="form-select">
                                        <option>Pro-rated monthly</option>
                                        <option>Full month</option>
                                        <option>Immediate charge</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Extra Storage -->
                        <div class="addon-item mb-4">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <h6 class="mb-1">Additional Storage</h6>
                                    <p class="text-muted small mb-0">Extra storage blocks beyond plan limit</p>
                                </div>
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" checked>
                                </div>
                            </div>
                            <div class="row g-2">
                                <div class="col-md-4">
                                    <label class="form-label small">Block size</label>
                                    <div class="input-group">
                                        <input type="number" class="form-control" value="100">
                                        <span class="input-group-text">GB</span>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label small">Price/month</label>
                                    <div class="input-group">
                                        <span class="input-group-text">€</span>
                                        <input type="number" class="form-control" value="10" step="0.01">
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label small">Auto-upgrade</label>
                                    <select class="form-select">
                                        <option>Ask user</option>
                                        <option>Auto-add</option>
                                        <option>Hard limit</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Extra Team Members -->
                        <div class="addon-item mb-4">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <h6 class="mb-1">Additional Team Members</h6>
                                    <p class="text-muted small mb-0">Extra users beyond plan limit</p>
                                </div>
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" checked>
                                </div>
                            </div>
                            <div class="row g-2">
                                <div class="col-md-6">
                                    <label class="form-label small">Price per user/month</label>
                                    <div class="input-group">
                                        <span class="input-group-text">€</span>
                                        <input type="number" class="form-control" value="8" step="0.01">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label small">Minimum purchase</label>
                                    <input type="number" class="form-control" value="1" min="1">
                                </div>
                            </div>
                        </div>

                        <!-- Priority Support -->
                        <div class="addon-item">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <h6 class="mb-1">Priority Support</h6>
                                    <p class="text-muted small mb-0">24/7 dedicated support channel</p>
                                </div>
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" checked>
                                </div>
                            </div>
                            <div class="row g-2">
                                <div class="col-md-6">
                                    <label class="form-label small">Price/month</label>
                                    <div class="input-group">
                                        <span class="input-group-text">€</span>
                                        <input type="number" class="form-control" value="19" step="0.01">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label small">Response time</label>
                                    <select class="form-select">
                                        <option>1 hour</option>
                                        <option>30 minutes</option>
                                        <option>Instant</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- One-Time Purchases -->
            <div class="col-lg-6">
                <div class="card">
                    <div class="card-header bg-success text-white">
                        <h5 class="mb-0">
                            <i class="fas fa-shopping-cart me-2"></i> One-Time Purchases
                        </h5>
                        <small>Individual features and boosts</small>
                    </div>
                    <div class="card-body">
                        <!-- Push to Top -->
                        <div class="addon-item mb-4">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <h6 class="mb-1">Push to Top</h6>
                                    <p class="text-muted small mb-0">Boost profile visibility in search results</p>
                                </div>
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" checked>
                                </div>
                            </div>
                            <div class="row g-2">
                                <div class="col-md-4">
                                    <label class="form-label small">Duration</label>
                                    <div class="input-group">
                                        <input type="number" class="form-control" value="7">
                                        <span class="input-group-text">days</span>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label small">Price</label>
                                    <div class="input-group">
                                        <span class="input-group-text">€</span>
                                        <input type="number" class="form-control" value="10" step="0.01">
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label small">Cooldown</label>
                                    <div class="input-group">
                                        <input type="number" class="form-control" value="3">
                                        <span class="input-group-text">days</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Featured Profile -->
                        <div class="addon-item mb-4">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <h6 class="mb-1">Featured Profile</h6>
                                    <p class="text-muted small mb-0">Homepage and category page featuring</p>
                                </div>
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" checked>
                                </div>
                            </div>
                            <div class="row g-2">
                                <div class="col-md-4">
                                    <label class="form-label small">Duration</label>
                                    <select class="form-select">
                                        <option>7 days</option>
                                        <option>14 days</option>
                                        <option selected>30 days</option>
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label small">Price</label>
                                    <div class="input-group">
                                        <span class="input-group-text">€</span>
                                        <input type="number" class="form-control" value="25" step="0.01">
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label small">Slots available</label>
                                    <input type="number" class="form-control" value="10">
                                </div>
                            </div>
                        </div>

                        <!-- Urgent Casting -->
                        <div class="addon-item mb-4">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <h6 class="mb-1">Urgent Casting Tag</h6>
                                    <p class="text-muted small mb-0">Mark casting calls as urgent</p>
                                </div>
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" checked>
                                </div>
                            </div>
                            <div class="row g-2">
                                <div class="col-md-6">
                                    <label class="form-label small">Price per casting</label>
                                    <div class="input-group">
                                        <span class="input-group-text">€</span>
                                        <input type="number" class="form-control" value="15" step="0.01">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label small">Visual treatment</label>
                                    <select class="form-select">
                                        <option>Red border + icon</option>
                                        <option>Animated badge</option>
                                        <option>Top position</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Profile Verification -->
                        <div class="addon-item">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <h6 class="mb-1">Profile Verification</h6>
                                    <p class="text-muted small mb-0">Blue checkmark verification</p>
                                </div>
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" checked>
                                </div>
                            </div>
                            <div class="row g-2">
                                <div class="col-md-6">
                                    <label class="form-label small">One-time fee</label>
                                    <div class="input-group">
                                        <span class="input-group-text">€</span>
                                        <input type="number" class="form-control" value="50" step="0.01">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label small">Validity</label>
                                    <select class="form-select">
                                        <option>1 year</option>
                                        <option>2 years</option>
                                        <option>Lifetime</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Overage Policies -->
        <div class="card mt-4">
            <div class="card-header">
                <h5 class="mb-0">
                    <i class="fas fa-exclamation-triangle me-2"></i> Overage & Limit Policies
                </h5>
            </div>
            <div class="card-body">
                <div class="row g-4">
                    <div class="col-md-6">
                        <h6>When limits are exceeded:</h6>
                        <div class="form-check mb-2">
                            <input class="form-check-input" type="radio" name="overage" id="overage1" checked>
                            <label class="form-check-label" for="overage1">
                                <strong>Soft limit with notification</strong>
                                <p class="text-muted small mb-0">Allow temporary overage, notify user to upgrade</p>
                            </label>
                        </div>
                        <div class="form-check mb-2">
                            <input class="form-check-input" type="radio" name="overage" id="overage2">
                            <label class="form-check-label" for="overage2">
                                <strong>Auto-add add-ons</strong>
                                <p class="text-muted small mb-0">Automatically charge for extra resources</p>
                            </label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="overage" id="overage3">
                            <label class="form-check-label" for="overage3">
                                <strong>Hard limit</strong>
                                <p class="text-muted small mb-0">Block access until upgrade</p>
                            </label>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h6>Grace period settings:</h6>
                        <div class="mb-3">
                            <label class="form-label">Days before hard enforcement</label>
                            <input type="number" class="form-control" value="7">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Warning threshold (%)</label>
                            <input type="number" class="form-control" value="80">
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" checked>
                            <label class="form-check-label">
                                Send email notifications at 80%, 90%, and 100% usage
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
.addon-item {
    padding: 1rem;
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
    transition: all 0.2s;
}

.addon-item:hover {
    background-color: #f8f9fa;
    border-color: #0d6efd;
}
</style>

<script>
function savePricing() {
    alert('Pricing configuration saved!\n\nThis would update all add-on prices across the platform.');
}

function previewPricing() {
    alert('Preview pricing table as users would see it in their account settings.');
}
</script>

<?php echo renderFooter(); ?>