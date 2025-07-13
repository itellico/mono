<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Revenue Analytics - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'revenue/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Revenue Analytics']
        ]);
        
        echo createHeroSection(
            "Revenue Analytics",
            "Comprehensive revenue tracking across all marketplace tenants",
            "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=1200&h=300&fit=crop",
            [
                ['label' => 'Export Report', 'icon' => 'fas fa-download', 'style' => 'success'],
                ['label' => 'Share Dashboard', 'icon' => 'fas fa-share', 'style' => 'light']
            ]
        );
        ?>
        
        <!-- Revenue Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Total Revenue', '$847.2K', 'fas fa-dollar-sign', 'success');
            echo createStatCard('Monthly Growth', '+12.5%', 'fas fa-trending-up', 'primary');
            echo createStatCard('Active Subscriptions', '156', 'fas fa-users', 'info');
            echo createStatCard('Avg. Revenue Per User', '$5.43', 'fas fa-user-dollar', 'warning');
            ?>
        </div>
        
        <!-- Revenue Charts -->
        <div class="row mb-4">
            <div class="col-md-8">
                <?php echo createCard(
                    "Revenue Trend (Last 12 Months)",
                    '<canvas id="revenueChart" style="height: 350px;"></canvas>'
                ); ?>
            </div>
            <div class="col-md-4">
                <?php echo createCard(
                    "Revenue by Plan Type",
                    '
                    <div class="text-center mb-3">
                        <h3 class="text-success">$847.2K</h3>
                        <small class="text-muted">Total Monthly Revenue</small>
                    </div>
                    <div class="mb-3">
                        <div class="d-flex justify-content-between">
                            <span>Enterprise Plans</span>
                            <span class="fw-bold">$425.6K (50.2%)</span>
                        </div>
                        <div class="progress mb-2" style="height: 8px;">
                            <div class="progress-bar bg-success" style="width: 50.2%"></div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="d-flex justify-content-between">
                            <span>Pro Plans</span>
                            <span class="fw-bold">$296.5K (35.0%)</span>
                        </div>
                        <div class="progress mb-2" style="height: 8px;">
                            <div class="progress-bar bg-primary" style="width: 35.0%"></div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="d-flex justify-content-between">
                            <span>Standard Plans</span>
                            <span class="fw-bold">$125.1K (14.8%)</span>
                        </div>
                        <div class="progress mb-2" style="height: 8px;">
                            <div class="progress-bar bg-info" style="width: 14.8%"></div>
                        </div>
                    </div>
                    '
                ); ?>
            </div>
        </div>
        
        <!-- Top Revenue Tenants -->
        <div class="row mb-4">
            <div class="col-md-6">
                <?php echo createCard(
                    "Top Revenue Generating Tenants",
                    '
                    <div class="mb-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center">
                                <img src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=40&h=40&fit=crop" 
                                     class="rounded me-3" style="width: 40px; height: 40px; object-fit: cover;" alt="Go Models NYC">
                                <div>
                                    <strong>Go Models NYC</strong><br>
                                    <small class="text-muted">Enterprise Plan</small>
                                </div>
                            </div>
                            <div class="text-end">
                                <strong class="text-success">$125,000</strong><br>
                                <small class="text-muted">+8.2%</small>
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center">
                                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face" 
                                     class="rounded me-3" style="width: 40px; height: 40px; object-fit: cover;" alt="Elite Models">
                                <div>
                                    <strong>Elite Model Management</strong><br>
                                    <small class="text-muted">Pro Plan</small>
                                </div>
                            </div>
                            <div class="text-end">
                                <strong class="text-success">$89,500</strong><br>
                                <small class="text-muted">+12.7%</small>
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center">
                                <img src="https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=40&h=40&fit=crop" 
                                     class="rounded me-3" style="width: 40px; height: 40px; object-fit: cover;" alt="Voice Talent">
                                <div>
                                    <strong>Voice Talent Hub</strong><br>
                                    <small class="text-muted">Pro Plan</small>
                                </div>
                            </div>
                            <div class="text-end">
                                <strong class="text-success">$45,200</strong><br>
                                <small class="text-muted">+15.3%</small>
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center">
                                <img src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=40&h=40&fit=crop" 
                                     class="rounded me-3" style="width: 40px; height: 40px; object-fit: cover;" alt="Fitness Models">
                                <div>
                                    <strong>Fitness Models Plus</strong><br>
                                    <small class="text-muted">Pro Plan</small>
                                </div>
                            </div>
                            <div class="text-end">
                                <strong class="text-success">$32,100</strong><br>
                                <small class="text-muted">+22.1%</small>
                            </div>
                        </div>
                    </div>
                    '
                ); ?>
            </div>
            <div class="col-md-6">
                <?php echo createCard(
                    "Revenue Metrics",
                    '
                    <div class="row text-center">
                        <div class="col-6 mb-3">
                            <h3 class="text-primary">$2.8M</h3>
                            <small class="text-muted">Annual Revenue</small>
                        </div>
                        <div class="col-6 mb-3">
                            <h3 class="text-success">$847K</h3>
                            <small class="text-muted">Monthly Revenue</small>
                        </div>
                        <div class="col-6">
                            <h3 class="text-info">$28.2K</h3>
                            <small class="text-muted">Daily Average</small>
                        </div>
                        <div class="col-6">
                            <h3 class="text-warning">12.5%</h3>
                            <small class="text-muted">Growth Rate</small>
                        </div>
                    </div>
                    <hr>
                    <h6 class="fw-bold mb-3">Payment Methods</h6>
                    <div class="mb-2">
                        <div class="d-flex justify-content-between">
                            <span>Credit Cards</span>
                            <span class="fw-bold">78.5%</span>
                        </div>
                        <div class="progress mb-2" style="height: 6px;">
                            <div class="progress-bar bg-primary" style="width: 78.5%"></div>
                        </div>
                    </div>
                    <div class="mb-2">
                        <div class="d-flex justify-content-between">
                            <span>Bank Transfers</span>
                            <span class="fw-bold">15.2%</span>
                        </div>
                        <div class="progress mb-2" style="height: 6px;">
                            <div class="progress-bar bg-success" style="width: 15.2%"></div>
                        </div>
                    </div>
                    <div class="mb-2">
                        <div class="d-flex justify-content-between">
                            <span>Digital Wallets</span>
                            <span class="fw-bold">6.3%</span>
                        </div>
                        <div class="progress mb-2" style="height: 6px;">
                            <div class="progress-bar bg-info" style="width: 6.3%"></div>
                        </div>
                    </div>
                    '
                ); ?>
            </div>
        </div>
        
        <!-- Revenue Details Table -->
        <?php
        $headers = ['Tenant', 'Plan', 'Monthly Revenue', 'Annual Revenue', 'Growth', 'Last Payment', 'Status'];
        $rows = [
            ['Go Models NYC', 'Enterprise', '$125,000', '$1,500,000', '<span class="text-success">+8.2%</span>', '2 days ago', '<span class="badge bg-success">Paid</span>'],
            ['Elite Model Management', 'Pro', '$89,500', '$1,074,000', '<span class="text-success">+12.7%</span>', '1 day ago', '<span class="badge bg-success">Paid</span>'],
            ['Voice Talent Hub', 'Pro', '$45,200', '$542,400', '<span class="text-success">+15.3%</span>', '3 days ago', '<span class="badge bg-success">Paid</span>'],
            ['Fitness Models Plus', 'Pro', '$32,100', '$385,200', '<span class="text-success">+22.1%</span>', '1 day ago', '<span class="badge bg-success">Paid</span>'],
            ['Dance Academy Pro', 'Pro', '$28,900', '$346,800', '<span class="text-success">+18.5%</span>', '5 days ago', '<span class="badge bg-success">Paid</span>'],
            ['Pet Stars Pro', 'Standard', '$18,750', '$225,000', '<span class="text-success">+5.8%</span>', '2 days ago', '<span class="badge bg-success">Paid</span>'],
            ['Creative Photographers', 'Standard', '$15,800', '$189,600', '<span class="text-success">+9.2%</span>', '4 days ago', '<span class="badge bg-success">Paid</span>'],
            ['Kids Talent Hub', 'Standard', '$12,400', '$148,800', '<span class="text-success">+25.1%</span>', '6 days ago', '<span class="badge bg-warning">Trial</span>']
        ];
        echo createDataTable('Revenue Details by Tenant', $headers, $rows);
        ?>
    </div>
</div>

<script>
// Custom revenue chart
document.addEventListener('DOMContentLoaded', function() {
    const ctx = document.getElementById('revenueChart');
    if (ctx) {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Monthly Revenue',
                    data: [520000, 580000, 642000, 695000, 728000, 756000, 784000, 812000, 835000, 847200, 863000, 892000],
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return '$' + (value / 1000) + 'K';
                            }
                        }
                    }
                }
            }
        });
    }
});
</script>

<?php echo renderFooter(); ?>