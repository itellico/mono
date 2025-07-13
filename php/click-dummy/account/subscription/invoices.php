<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Billing History - itellico Marketplace", "Emma Johnson", "Professional Model", "Account");
?>

<div class="d-flex">
    <?php echo renderSidebar('Account', getAccountSidebarItems(), 'subscription/invoices.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Account', 'href' => '../index.php'],
            ['label' => 'My Subscription', 'href' => 'index.php'],
            ['label' => 'Billing History']
        ]);
        ?>
        
        <!-- Header Section -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h2 class="mb-1">Billing History</h2>
                <p class="text-muted mb-0">View and download your invoices and receipts</p>
            </div>
            <div class="btn-group">
                <button class="btn btn-outline-secondary" onclick="exportInvoices()">
                    <i class="fas fa-download me-2"></i> Export All
                </button>
                <button class="btn btn-primary" onclick="window.location.href='index.php'">
                    <i class="fas fa-arrow-left me-2"></i> Back to Subscription
                </button>
            </div>
        </div>

        <!-- Summary Cards -->
        <div class="row g-3 mb-4">
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">Total Spent (2024)</h6>
                        <h3 class="mb-0">€1,247.80</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">Average Monthly</h6>
                        <h3 class="mb-0">€103.98</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">Last Payment</h6>
                        <h3 class="mb-0">€93.60</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">Next Payment</h6>
                        <h3 class="mb-0">Feb 15, 2025</h3>
                    </div>
                </div>
            </div>
        </div>

        <!-- Filters -->
        <div class="card mb-3">
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-md-3">
                        <label class="form-label">Year</label>
                        <select class="form-select">
                            <option>2025</option>
                            <option selected>2024</option>
                            <option>2023</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">Type</label>
                        <select class="form-select">
                            <option>All Transactions</option>
                            <option>Subscriptions</option>
                            <option>Add-ons</option>
                            <option>One-time Purchases</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">Status</label>
                        <select class="form-select">
                            <option>All</option>
                            <option>Paid</option>
                            <option>Pending</option>
                            <option>Failed</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">&nbsp;</label>
                        <button class="btn btn-primary w-100">Apply Filters</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Invoices Table -->
        <div class="card">
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Invoice #</th>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- January 2025 -->
                            <tr>
                                <td><code>INV-2025-0142</code></td>
                                <td>Jan 15, 2025</td>
                                <td>
                                    <div>Professional Plan - Monthly</div>
                                    <small class="text-muted">Includes: Extra Storage, Priority Support</small>
                                </td>
                                <td><strong>€93.60</strong></td>
                                <td><span class="badge bg-success">Paid</span></td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="viewInvoice('INV-2025-0142')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-outline-primary" onclick="downloadInvoice('INV-2025-0142')">
                                            <i class="fas fa-download"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>

                            <!-- December 2024 -->
                            <tr>
                                <td><code>INV-2024-1847</code></td>
                                <td>Dec 15, 2024</td>
                                <td>
                                    <div>Professional Plan - Monthly</div>
                                    <small class="text-muted">Includes: Extra Storage, Priority Support</small>
                                </td>
                                <td><strong>€93.60</strong></td>
                                <td><span class="badge bg-success">Paid</span></td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="viewInvoice('INV-2024-1847')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-outline-primary" onclick="downloadInvoice('INV-2024-1847')">
                                            <i class="fas fa-download"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>

                            <!-- One-time purchase -->
                            <tr>
                                <td><code>INV-2024-1823</code></td>
                                <td>Dec 8, 2024</td>
                                <td>
                                    <div>Push to Top - 7 Days</div>
                                    <small class="text-muted">One-time purchase</small>
                                </td>
                                <td><strong>€10.00</strong></td>
                                <td><span class="badge bg-success">Paid</span></td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="viewInvoice('INV-2024-1823')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-outline-primary" onclick="downloadInvoice('INV-2024-1823')">
                                            <i class="fas fa-download"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>

                            <!-- November 2024 -->
                            <tr>
                                <td><code>INV-2024-1654</code></td>
                                <td>Nov 15, 2024</td>
                                <td>
                                    <div>Professional Plan - Monthly</div>
                                    <small class="text-muted">Includes: Extra Storage, Priority Support</small>
                                </td>
                                <td><strong>€93.60</strong></td>
                                <td><span class="badge bg-success">Paid</span></td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="viewInvoice('INV-2024-1654')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-outline-primary" onclick="downloadInvoice('INV-2024-1654')">
                                            <i class="fas fa-download"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>

                            <!-- Featured Profile purchase -->
                            <tr>
                                <td><code>INV-2024-1598</code></td>
                                <td>Nov 2, 2024</td>
                                <td>
                                    <div>Featured Profile - 30 Days</div>
                                    <small class="text-muted">One-time purchase</small>
                                </td>
                                <td><strong>€25.00</strong></td>
                                <td><span class="badge bg-success">Paid</span></td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="viewInvoice('INV-2024-1598')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-outline-primary" onclick="downloadInvoice('INV-2024-1598')">
                                            <i class="fas fa-download"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>

                            <!-- October 2024 -->
                            <tr>
                                <td><code>INV-2024-1432</code></td>
                                <td>Oct 15, 2024</td>
                                <td>
                                    <div>Professional Plan - Monthly</div>
                                    <small class="text-muted">Includes: Extra Storage</small>
                                </td>
                                <td><strong>€71.40</strong></td>
                                <td><span class="badge bg-success">Paid</span></td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="viewInvoice('INV-2024-1432')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-outline-primary" onclick="downloadInvoice('INV-2024-1432')">
                                            <i class="fas fa-download"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>

                            <!-- Plan upgrade -->
                            <tr>
                                <td><code>INV-2024-1387</code></td>
                                <td>Oct 1, 2024</td>
                                <td>
                                    <div>Plan Upgrade - Basic to Professional</div>
                                    <small class="text-muted">Pro-rated charge</small>
                                </td>
                                <td><strong>€24.50</strong></td>
                                <td><span class="badge bg-success">Paid</span></td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="viewInvoice('INV-2024-1387')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-outline-primary" onclick="downloadInvoice('INV-2024-1387')">
                                            <i class="fas fa-download"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>

                            <!-- Refund -->
                            <tr>
                                <td><code>REF-2024-0089</code></td>
                                <td>Sep 28, 2024</td>
                                <td>
                                    <div>Refund - Duplicate Charge</div>
                                    <small class="text-muted">Credited to payment method</small>
                                </td>
                                <td class="text-success"><strong>-€10.00</strong></td>
                                <td><span class="badge bg-info">Refunded</span></td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="viewInvoice('REF-2024-0089')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-outline-primary" onclick="downloadInvoice('REF-2024-0089')">
                                            <i class="fas fa-download"></i>
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
                        Showing 1-8 of 47 invoices
                    </div>
                    <nav>
                        <ul class="pagination mb-0">
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
                                <a class="page-link" href="#">4</a>
                            </li>
                            <li class="page-item">
                                <a class="page-link" href="#">5</a>
                            </li>
                            <li class="page-item">
                                <a class="page-link" href="#">Next</a>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>
        </div>

        <!-- Tax Information -->
        <div class="card mt-4">
            <div class="card-header">
                <h5 class="mb-0">Tax Information</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <h6>Tax Settings</h6>
                        <p class="text-muted">VAT Number: <strong>GB123456789</strong></p>
                        <p class="text-muted">Tax Rate: <strong>20% (UK Standard)</strong></p>
                        <button class="btn btn-sm btn-outline-primary">Update Tax Info</button>
                    </div>
                    <div class="col-md-6">
                        <h6>Annual Tax Summary</h6>
                        <p class="text-muted">Total Paid (2024): <strong>€1,039.83</strong></p>
                        <p class="text-muted">Total VAT (2024): <strong>€207.97</strong></p>
                        <button class="btn btn-sm btn-outline-primary">Download Tax Report</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
function viewInvoice(invoiceId) {
    alert(`Opening invoice ${invoiceId} in preview mode`);
}

function downloadInvoice(invoiceId) {
    alert(`Downloading invoice ${invoiceId} as PDF`);
}

function exportInvoices() {
    alert('Export options:\n- PDF (All invoices)\n- CSV (Transaction list)\n- ZIP (Individual PDFs)');
}
</script>

<?php echo renderFooter(); ?>