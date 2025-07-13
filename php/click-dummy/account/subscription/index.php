<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("My Subscription - itellico Marketplace", "Emma Johnson", "Professional Model", "Account");
?>

<div class="d-flex">
    <?php echo renderSidebar('Account', getAccountSidebarItems(), 'subscription/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Account', 'href' => '../index.php'],
            ['label' => 'My Subscription']
        ]);
        ?>
        
        <!-- Header Section -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h2 class="mb-1">My Subscription</h2>
                <p class="text-muted mb-0">Manage your subscription, add-ons, and billing</p>
            </div>
            <div>
                <button class="btn btn-outline-primary" onclick="viewInvoices()">
                    <i class="fas fa-receipt me-2"></i> View Invoices
                </button>
            </div>
        </div>

        <!-- Current Plan Overview -->
        <div class="card mb-4">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <div class="d-flex align-items-center mb-3">
                            <div class="plan-icon bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 60px; height: 60px;">
                                <i class="fas fa-crown fa-2x"></i>
                            </div>
                            <div>
                                <h3 class="mb-1">Professional Plan</h3>
                                <p class="text-muted mb-0">Perfect for individual professionals</p>
                            </div>
                        </div>
                        <div class="row g-3">
                            <div class="col-auto">
                                <div>
                                    <small class="text-muted">Monthly Cost</small>
                                    <h5 class="mb-0">€49/month</h5>
                                </div>
                            </div>
                            <div class="col-auto">
                                <div>
                                    <small class="text-muted">Next Billing Date</small>
                                    <h5 class="mb-0">Feb 15, 2025</h5>
                                </div>
                            </div>
                            <div class="col-auto">
                                <div>
                                    <small class="text-muted">Status</small>
                                    <h5 class="mb-0"><span class="badge bg-success">Active</span></h5>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 text-md-end">
                        <button class="btn btn-primary mb-2 me-2" onclick="upgradePlan()">
                            <i class="fas fa-arrow-up me-2"></i> Upgrade Plan
                        </button>
                        <button class="btn btn-outline-danger mb-2" onclick="cancelSubscription()">
                            <i class="fas fa-times me-2"></i> Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Usage & Limits -->
        <div class="row g-4 mb-4">
            <div class="col-lg-8">
                <div class="card h-100">
                    <div class="card-header">
                        <h5 class="mb-0">Usage & Limits</h5>
                    </div>
                    <div class="card-body">
                        <!-- Profiles Usage -->
                        <div class="usage-item mb-4">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <div>
                                    <h6 class="mb-1">Professional Profiles</h6>
                                    <p class="text-muted small mb-0">Create multiple professional profiles</p>
                                </div>
                                <div class="text-end">
                                    <strong>3 of 5</strong> used
                                </div>
                            </div>
                            <div class="progress" style="height: 8px;">
                                <div class="progress-bar" role="progressbar" style="width: 60%"></div>
                            </div>
                        </div>

                        <!-- Storage Usage -->
                        <div class="usage-item mb-4">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <div>
                                    <h6 class="mb-1">Storage Space</h6>
                                    <p class="text-muted small mb-0">For portfolios and media files</p>
                                </div>
                                <div class="text-end">
                                    <strong>12.5 GB of 20 GB</strong> used
                                </div>
                            </div>
                            <div class="progress" style="height: 8px;">
                                <div class="progress-bar bg-warning" role="progressbar" style="width: 62.5%"></div>
                            </div>
                            <div class="mt-2">
                                <button class="btn btn-sm btn-outline-primary" onclick="addStorage()">
                                    <i class="fas fa-plus me-1"></i> Add More Storage
                                </button>
                            </div>
                        </div>

                        <!-- Bookings -->
                        <div class="usage-item mb-4">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <div>
                                    <h6 class="mb-1">Active Bookings</h6>
                                    <p class="text-muted small mb-0">Simultaneous bookings allowed</p>
                                </div>
                                <div class="text-end">
                                    <strong>8 of 10</strong> active
                                </div>
                            </div>
                            <div class="progress" style="height: 8px;">
                                <div class="progress-bar bg-info" role="progressbar" style="width: 80%"></div>
                            </div>
                        </div>

                        <!-- Messages -->
                        <div class="usage-item">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <div>
                                    <h6 class="mb-1">Messages This Month</h6>
                                    <p class="text-muted small mb-0">Direct messages to clients</p>
                                </div>
                                <div class="text-end">
                                    <strong>156 of 500</strong> sent
                                </div>
                            </div>
                            <div class="progress" style="height: 8px;">
                                <div class="progress-bar bg-success" role="progressbar" style="width: 31.2%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Active Add-ons -->
            <div class="col-lg-4">
                <div class="card h-100">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Active Add-ons</h5>
                        <a href="#" class="btn btn-sm btn-primary">
                            <i class="fas fa-plus"></i>
                        </a>
                    </div>
                    <div class="card-body">
                        <!-- Extra Storage Add-on -->
                        <div class="addon-item p-3 border rounded mb-3">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 class="mb-1">Extra Storage</h6>
                                    <p class="text-muted small mb-0">+100 GB storage space</p>
                                </div>
                                <div class="text-end">
                                    <strong>€10/mo</strong>
                                    <a href="#" class="d-block small text-danger" onclick="removeAddon('storage')">Remove</a>
                                </div>
                            </div>
                        </div>

                        <!-- Priority Support Add-on -->
                        <div class="addon-item p-3 border rounded mb-3">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 class="mb-1">Priority Support</h6>
                                    <p class="text-muted small mb-0">24/7 dedicated support</p>
                                </div>
                                <div class="text-end">
                                    <strong>€19/mo</strong>
                                    <a href="#" class="d-block small text-danger" onclick="removeAddon('support')">Remove</a>
                                </div>
                            </div>
                        </div>

                        <hr>
                        
                        <div class="d-flex justify-content-between">
                            <strong>Add-ons Total:</strong>
                            <strong>€29/mo</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- One-Time Features -->
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="mb-0">Boost Your Profile</h5>
            </div>
            <div class="card-body">
                <div class="row g-3">
                    <!-- Push to Top -->
                    <div class="col-md-4">
                        <div class="feature-card border rounded p-3 h-100">
                            <div class="text-center mb-3">
                                <i class="fas fa-rocket fa-3x text-primary"></i>
                            </div>
                            <h6 class="text-center">Push to Top</h6>
                            <p class="text-muted small text-center">Boost your profile visibility in search results for 7 days</p>
                            <div class="text-center">
                                <h5 class="text-primary mb-2">€10</h5>
                                <button class="btn btn-sm btn-primary w-100" onclick="purchaseBoost('push-to-top')">
                                    Purchase Now
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Featured Profile -->
                    <div class="col-md-4">
                        <div class="feature-card border rounded p-3 h-100">
                            <div class="text-center mb-3">
                                <i class="fas fa-star fa-3x text-warning"></i>
                            </div>
                            <h6 class="text-center">Featured Profile</h6>
                            <p class="text-muted small text-center">Get featured on homepage and category pages for 30 days</p>
                            <div class="text-center">
                                <h5 class="text-warning mb-2">€25</h5>
                                <button class="btn btn-sm btn-warning w-100" onclick="purchaseBoost('featured')">
                                    Purchase Now
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Profile Verification -->
                    <div class="col-md-4">
                        <div class="feature-card border rounded p-3 h-100">
                            <div class="text-center mb-3">
                                <i class="fas fa-check-circle fa-3x text-success"></i>
                            </div>
                            <h6 class="text-center">Profile Verification</h6>
                            <p class="text-muted small text-center">Get the blue checkmark verification badge</p>
                            <div class="text-center">
                                <h5 class="text-success mb-2">€50</h5>
                                <button class="btn btn-sm btn-success w-100" onclick="purchaseBoost('verification')">
                                    Verify Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Billing Summary -->
        <div class="row g-4">
            <!-- Next Invoice -->
            <div class="col-lg-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Next Invoice Preview</h5>
                    </div>
                    <div class="card-body">
                        <table class="table table-sm">
                            <tbody>
                                <tr>
                                    <td>Professional Plan (Feb 15 - Mar 14)</td>
                                    <td class="text-end">€49.00</td>
                                </tr>
                                <tr>
                                    <td>Extra Storage Add-on</td>
                                    <td class="text-end">€10.00</td>
                                </tr>
                                <tr>
                                    <td>Priority Support Add-on</td>
                                    <td class="text-end">€19.00</td>
                                </tr>
                                <tr class="border-top">
                                    <td><strong>Subtotal</strong></td>
                                    <td class="text-end"><strong>€78.00</strong></td>
                                </tr>
                                <tr>
                                    <td>VAT (20%)</td>
                                    <td class="text-end">€15.60</td>
                                </tr>
                                <tr class="border-top">
                                    <td><h5 class="mb-0">Total Due</h5></td>
                                    <td class="text-end"><h5 class="mb-0 text-primary">€93.60</h5></td>
                                </tr>
                            </tbody>
                        </table>
                        <div class="text-center mt-3">
                            <button class="btn btn-outline-primary btn-sm">
                                <i class="fas fa-credit-card me-2"></i> Update Payment Method
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Payment Method -->
            <div class="col-lg-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Payment Information</h5>
                    </div>
                    <div class="card-body">
                        <div class="payment-method mb-3">
                            <div class="d-flex align-items-center">
                                <i class="fab fa-cc-visa fa-2x text-primary me-3"></i>
                                <div>
                                    <h6 class="mb-0">Visa ending in 4242</h6>
                                    <small class="text-muted">Expires 12/2025</small>
                                </div>
                                <div class="ms-auto">
                                    <span class="badge bg-success">Default</span>
                                </div>
                            </div>
                        </div>
                        
                        <hr>
                        
                        <h6>Billing Address</h6>
                        <address class="text-muted">
                            Emma Johnson<br>
                            123 Fashion Street<br>
                            London, W1A 1AA<br>
                            United Kingdom
                        </address>
                        
                        <div class="d-grid gap-2">
                            <button class="btn btn-outline-primary">
                                <i class="fas fa-edit me-2"></i> Update Billing Info
                            </button>
                            <button class="btn btn-outline-secondary">
                                <i class="fas fa-download me-2"></i> Download Tax Invoice
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
.plan-icon {
    font-size: 1.5rem;
}

.usage-item {
    padding: 1rem;
    border-radius: 0.375rem;
    transition: all 0.2s;
}

.usage-item:hover {
    background-color: #f8f9fa;
}

.progress {
    background-color: #e9ecef;
}

.feature-card {
    transition: all 0.2s;
}

.feature-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.addon-item {
    background-color: #f8f9fa;
}
</style>

<script>
function upgradePlan() {
    window.location.href = '../plans/compare.php';
}

function cancelSubscription() {
    if (confirm('Are you sure you want to cancel your subscription?\n\nYour subscription will remain active until Feb 15, 2025.\nYou can reactivate anytime before this date.')) {
        alert('Cancellation process would start here with retention offers');
    }
}

function viewInvoices() {
    window.location.href = 'invoices.php';
}

function addStorage() {
    alert('Storage add-on selection:\n- 100 GB for €10/month\n- 500 GB for €40/month\n- 1 TB for €75/month');
}

function removeAddon(type) {
    if (confirm(`Remove ${type} add-on?\n\nThis will take effect at the next billing cycle.`)) {
        alert('Add-on scheduled for removal');
    }
}

function purchaseBoost(type) {
    const boosts = {
        'push-to-top': { name: 'Push to Top', price: '€10', duration: '7 days' },
        'featured': { name: 'Featured Profile', price: '€25', duration: '30 days' },
        'verification': { name: 'Profile Verification', price: '€50', duration: 'Lifetime' }
    };
    
    const boost = boosts[type];
    if (confirm(`Purchase ${boost.name} for ${boost.price}?\n\nDuration: ${boost.duration}\n\nThis will be charged immediately to your payment method.`)) {
        alert(`${boost.name} activated!\n\nYou'll receive a confirmation email shortly.`);
    }
}
</script>

<?php echo renderFooter(); ?>