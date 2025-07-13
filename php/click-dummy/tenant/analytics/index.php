<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Analytics Dashboard - Go Models NYC", "Admin User", "Marketplace Admin", "Tenant");
?>

<div class="d-flex">
    <?php echo renderSidebar('Tenant', getTenantSidebarItems(), 'analytics/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Tenant', 'href' => '../index.php'],
            ['label' => 'Analytics']
        ]);
        
        echo createHeroSection(
            "Analytics & Insights",
            "Comprehensive marketplace analytics and performance metrics for data-driven decisions",
            "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=300&fit=crop",
            [
                ['label' => 'Export Report', 'icon' => 'fas fa-download', 'style' => 'primary'],
                ['label' => 'Custom Report', 'icon' => 'fas fa-chart-line', 'style' => 'info'],
                ['label' => 'Schedule Report', 'icon' => 'fas fa-clock', 'style' => 'success']
            ]
        );
        ?>
        
        <!-- Time Period Filter -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-body">
                        <div class="row g-3 align-items-center">
                            <div class="col-md-2">
                                <label class="form-label mb-0">Time Period:</label>
                            </div>
                            <div class="col-md-2">
                                <select class="form-select">
                                    <option>Last 7 days</option>
                                    <option>Last 30 days</option>
                                    <option selected>Last 90 days</option>
                                    <option>Last 12 months</option>
                                    <option>Custom Range</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <input type="date" class="form-control" value="2024-09-15">
                            </div>
                            <div class="col-md-2">
                                <input type="date" class="form-control" value="2024-12-15">
                            </div>
                            <div class="col-md-2">
                                <button class="btn btn-primary w-100">
                                    <i class="fas fa-chart-bar me-2"></i> Update
                                </button>
                            </div>
                            <div class="col-md-2">
                                <button class="btn btn-outline-success w-100">
                                    <i class="fas fa-download me-2"></i> Export
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Key Metrics -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Total Revenue', '$125,890', 'fas fa-dollar-sign', 'success');
            echo createStatCard('Bookings', '2,847', 'fas fa-calendar-check', 'primary');
            echo createStatCard('Active Models', '1,892', 'fas fa-users', 'info');
            echo createStatCard('Success Rate', '94.2%', 'fas fa-chart-line', 'warning');
            ?>
        </div>
        
        <!-- Charts Row -->
        <div class="row mb-4">
            <div class="col-lg-8">
                <?php echo createCard(
                    "Revenue & Bookings Trend",
                    '
                    <div class="mb-3">
                        <div class="btn-group btn-group-sm" role="group">
                            <button type="button" class="btn btn-outline-primary active">Revenue</button>
                            <button type="button" class="btn btn-outline-primary">Bookings</button>
                            <button type="button" class="btn btn-outline-primary">Models</button>
                            <button type="button" class="btn btn-outline-primary">Success Rate</button>
                        </div>
                    </div>
                    <div style="height: 300px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                        <div class="text-center">
                            <i class="fas fa-chart-line fa-3x text-muted mb-3"></i>
                            <h5 class="text-muted">Revenue Trend Chart</h5>
                            <p class="text-muted">90-day revenue growth: +23.5%</p>
                            <div class="mt-3">
                                <span class="badge bg-success me-2">↗ $47K increase</span>
                                <span class="badge bg-info">4.2% monthly growth</span>
                            </div>
                        </div>
                    </div>
                    '
                ); ?>
            </div>
            <div class="col-lg-4">
                <?php echo createCard(
                    "Model Categories",
                    '
                    <div style="height: 200px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                        <div class="text-center">
                            <i class="fas fa-chart-pie fa-2x text-muted mb-2"></i>
                            <h6 class="text-muted">Distribution Chart</h6>
                        </div>
                    </div>
                    <div class="mb-2">
                        <div class="d-flex justify-content-between">
                            <span class="small">Fashion Models</span>
                            <strong>51%</strong>
                        </div>
                        <div class="progress mb-2" style="height: 4px;">
                            <div class="progress-bar bg-primary" style="width: 51%"></div>
                        </div>
                    </div>
                    <div class="mb-2">
                        <div class="d-flex justify-content-between">
                            <span class="small">Commercial</span>
                            <strong>36%</strong>
                        </div>
                        <div class="progress mb-2" style="height: 4px;">
                            <div class="progress-bar bg-success" style="width: 36%"></div>
                        </div>
                    </div>
                    <div class="mb-2">
                        <div class="d-flex justify-content-between">
                            <span class="small">Editorial</span>
                            <strong>13%</strong>
                        </div>
                        <div class="progress mb-2" style="height: 4px;">
                            <div class="progress-bar bg-info" style="width: 13%"></div>
                        </div>
                    </div>
                    '
                ); ?>
            </div>
        </div>
        
        <!-- Performance Tables -->
        <div class="row mb-4">
            <div class="col-lg-6">
                <?php
                $topModelsHeaders = ['Model', 'Bookings', 'Revenue', 'Rating'];
                $topModelsRows = [
                    [
                        '<div class="d-flex align-items-center"><img src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=30&h=30&fit=crop&crop=face" class="rounded-circle me-2" style="width: 30px; height: 30px;"><strong>Emma Johnson</strong></div>',
                        '23',
                        '$28,450',
                        '<span class="text-warning">★★★★★</span> 4.9'
                    ],
                    [
                        '<div class="d-flex align-items-center"><img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=30&h=30&fit=crop&crop=face" class="rounded-circle me-2" style="width: 30px; height: 30px;"><strong>Sofia Martinez</strong></div>',
                        '19',
                        '$22,890',
                        '<span class="text-warning">★★★★★</span> 4.8'
                    ],
                    [
                        '<div class="d-flex align-items-center"><img src="https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=30&h=30&fit=crop&crop=face" class="rounded-circle me-2" style="width: 30px; height: 30px;"><strong>Isabella Chen</strong></div>',
                        '17',
                        '$19,230',
                        '<span class="text-warning">★★★★★</span> 4.9'
                    ],
                    [
                        '<div class="d-flex align-items-center"><img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=30&h=30&fit=crop&crop=face" class="rounded-circle me-2" style="width: 30px; height: 30px;"><strong>Aria Thompson</strong></div>',
                        '15',
                        '$18,670',
                        '<span class="text-warning">★★★★☆</span> 4.7'
                    ]
                ];
                echo createDataTable('Top Performing Models', $topModelsHeaders, $topModelsRows, false);
                ?>
            </div>
            <div class="col-lg-6">
                <?php
                $topClientsHeaders = ['Client', 'Bookings', 'Revenue', 'Satisfaction'];
                $topClientsRows = [
                    [
                        '<div class="d-flex align-items-center"><img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=30&h=30&fit=crop" class="rounded me-2" style="width: 30px; height: 30px;"><strong>Vogue Magazine</strong></div>',
                        '8',
                        '$45,600',
                        '<span class="badge bg-success">Excellent</span>'
                    ],
                    [
                        '<div class="d-flex align-items-center"><img src="https://images.unsplash.com/photo-1556906781-9a412961c28c?w=30&h=30&fit=crop" class="rounded me-2" style="width: 30px; height: 30px;"><strong>Nike Inc.</strong></div>',
                        '12',
                        '$38,400',
                        '<span class="badge bg-success">Excellent</span>'
                    ],
                    [
                        '<div class="d-flex align-items-center"><img src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=30&h=30&fit=crop" class="rounded me-2" style="width: 30px; height: 30px;"><strong>H&M Fashion</strong></div>',
                        '15',
                        '$27,750',
                        '<span class="badge bg-success">Excellent</span>'
                    ],
                    [
                        '<div class="d-flex align-items-center"><img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=30&h=30&fit=crop" class="rounded me-2" style="width: 30px; height: 30px;"><strong>Zara Fashion</strong></div>',
                        '9',
                        '$24,300',
                        '<span class="badge bg-warning text-dark">Good</span>'
                    ]
                ];
                echo createDataTable('Top Clients', $topClientsHeaders, $topClientsRows, false);
                ?>
            </div>
        </div>
        
        <!-- Bottom Analytics Row -->
        <div class="row">
            <div class="col-lg-4">
                <?php echo createCard(
                    "Booking Success Rate",
                    '
                    <div class="text-center mb-4">
                        <h2 class="text-success">94.2%</h2>
                        <p class="text-muted">Average success rate</p>
                    </div>
                    <div class="mb-3">
                        <div class="d-flex justify-content-between">
                            <span class="small">Fashion Bookings</span>
                            <strong>96%</strong>
                        </div>
                        <div class="progress mb-2" style="height: 6px;">
                            <div class="progress-bar bg-primary" style="width: 96%"></div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="d-flex justify-content-between">
                            <span class="small">Commercial Bookings</span>
                            <strong>93%</strong>
                        </div>
                        <div class="progress mb-2" style="height: 6px;">
                            <div class="progress-bar bg-success" style="width: 93%"></div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="d-flex justify-content-between">
                            <span class="small">Editorial Bookings</span>
                            <strong>91%</strong>
                        </div>
                        <div class="progress mb-2" style="height: 6px;">
                            <div class="progress-bar bg-info" style="width: 91%"></div>
                        </div>
                    </div>
                    '
                ); ?>
            </div>
            <div class="col-lg-4">
                <?php echo createCard(
                    "Monthly Growth",
                    '
                    <div class="row text-center">
                        <div class="col-6">
                            <h4 class="text-primary">+23%</h4>
                            <small class="text-muted">Revenue Growth</small>
                        </div>
                        <div class="col-6">
                            <h4 class="text-success">+18%</h4>
                            <small class="text-muted">New Models</small>
                        </div>
                    </div>
                    <hr>
                    <div class="row text-center">
                        <div class="col-6">
                            <h4 class="text-info">+12%</h4>
                            <small class="text-muted">Casting Calls</small>
                        </div>
                        <div class="col-6">
                            <h4 class="text-warning">+8%</h4>
                            <small class="text-muted">Client Base</small>
                        </div>
                    </div>
                    <hr>
                    <div class="text-center">
                        <span class="badge bg-success me-2">↗ Trending Up</span>
                        <small class="text-muted">All metrics improving</small>
                    </div>
                    '
                ); ?>
            </div>
            <div class="col-lg-4">
                <?php echo createCard(
                    "Quick Insights",
                    '
                    <div class="mb-3">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-star text-warning me-3"></i>
                            <div class="flex-grow-1">
                                <strong class="d-block">Peak Performance</strong>
                                <small class="text-muted">Highest bookings in Q4</small>
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-trending-up text-success me-3"></i>
                            <div class="flex-grow-1">
                                <strong class="d-block">Growth Trend</strong>
                                <small class="text-muted">23% increase in revenue</small>
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-heart text-danger me-3"></i>
                            <div class="flex-grow-1">
                                <strong class="d-block">Client Satisfaction</strong>
                                <small class="text-muted">96% positive feedback</small>
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-clock text-info me-3"></i>
                            <div class="flex-grow-1">
                                <strong class="d-block">Response Time</strong>
                                <small class="text-muted">Average 2.3 hours</small>
                            </div>
                        </div>
                    </div>
                    '
                ); ?>
            </div>
        </div>
    </div>
</div>

<?php echo renderFooter(); ?>