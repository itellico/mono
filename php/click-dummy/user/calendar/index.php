<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

$titles = [
    'portfolio' => 'Portfolio Management - User Dashboard',
    'applications' => 'My Applications - User Dashboard', 
    'messages' => 'Messages - User Dashboard',
    'calendar' => 'Calendar - User Dashboard',
    'settings' => 'Settings - User Dashboard'
];

$pageNames = [
    'portfolio' => 'Portfolio Management',
    'applications' => 'My Applications',
    'messages' => 'Messages', 
    'calendar' => 'Calendar',
    'settings' => 'Settings'
];

$currentDir = basename(__DIR__);
echo renderHeader($titles[$currentDir], "Emma Johnson", "Fashion Model", "User");
?>

<style>
.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
    background: #e9ecef;
    border: 1px solid #e9ecef;
}
.calendar-header {
    background: #f8f9fa;
    padding: 1rem;
    text-align: center;
    font-weight: bold;
    border-bottom: 2px solid #dee2e6;
}
.calendar-day {
    background: white;
    min-height: 120px;
    padding: 0.5rem;
    position: relative;
    transition: all 0.2s ease;
}
.calendar-day:hover {
    background: #f8f9fa;
    cursor: pointer;
}
.calendar-day.today {
    background: #e3f2fd;
    border: 2px solid #2196f3;
}
.calendar-day.other-month {
    background: #f8f9fa;
    color: #6c757d;
}
.calendar-day.has-booking {
    background: #e8f5e8;
}
.calendar-day.available {
    background: #fff3cd;
}
.booking-item {
    background: #28a745;
    color: white;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 0.75rem;
    margin-bottom: 2px;
    cursor: pointer;
    transition: all 0.2s ease;
}
.booking-item:hover {
    background: #218838;
    transform: scale(1.02);
}
.booking-item.pending {
    background: #ffc107;
    color: #212529;
}
.booking-item.available {
    background: #17a2b8;
}
.availability-toggle {
    position: absolute;
    top: 5px;
    right: 5px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    cursor: pointer;
}
.availability-toggle.available {
    background: #28a745;
}
.availability-toggle.unavailable {
    background: #dc3545;
}
.time-slot {
    border: 1px solid #e9ecef;
    padding: 0.5rem;
    margin-bottom: 0.25rem;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
}
.time-slot:hover {
    background: #f8f9fa;
}
.time-slot.booked {
    background: #d4edda;
    border-color: #28a745;
}
.time-slot.available {
    background: #fff3cd;
    border-color: #ffc107;
}
</style>

<div class="d-flex">
    <?php echo renderSidebar('User', getUserSidebarItems(), $currentDir . '/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Dashboard', 'href' => '../index.php'],
            ['label' => $pageNames[$currentDir]]
        ]);
        
        echo createHeroSection(
            $pageNames[$currentDir],
            "Manage your " . strtolower($pageNames[$currentDir]),
            "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=1200&h=300&fit=crop"
        );
        ?>
        
        <!-- Calendar Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('This Month Bookings', '12', 'fas fa-calendar-check', 'success');
            echo createStatCard('Available Days', '18', 'fas fa-calendar-day', 'info');
            echo createStatCard('Pending Requests', '3', 'fas fa-clock', 'warning');
            echo createStatCard('Total Earnings', '$8,450', 'fas fa-dollar-sign', 'primary');
            ?>
        </div>

        <!-- Calendar Controls -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h3 class="mb-0">December 2024</h3>
                <small class="text-muted">Manage your availability and bookings</small>
            </div>
            <div class="btn-group" role="group">
                <button class="btn btn-outline-secondary" id="prevMonth">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button class="btn btn-outline-secondary" id="todayBtn">Today</button>
                <button class="btn btn-outline-secondary" id="nextMonth">
                    <i class="fas fa-chevron-right"></i>
                </button>
                <div class="btn-group ms-2" role="group">
                    <button class="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown">
                        <i class="fas fa-plus"></i> Add
                    </button>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" href="#"><i class="fas fa-calendar-plus me-2"></i>Mark Available</a></li>
                        <li><a class="dropdown-item" href="#"><i class="fas fa-ban me-2"></i>Block Time</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="#"><i class="fas fa-repeat me-2"></i>Set Recurring Availability</a></li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- Main Calendar View -->
        <div class="row">
            <div class="col-lg-9">
                <!-- Calendar Grid -->
                <div class="card">
                    <div class="card-body p-0">
                        <div class="calendar-grid">
                            <!-- Calendar Headers -->
                            <div class="calendar-header">Sunday</div>
                            <div class="calendar-header">Monday</div>
                            <div class="calendar-header">Tuesday</div>
                            <div class="calendar-header">Wednesday</div>
                            <div class="calendar-header">Thursday</div>
                            <div class="calendar-header">Friday</div>
                            <div class="calendar-header">Saturday</div>
                            
                            <!-- Week 1 -->
                            <div class="calendar-day other-month">
                                <span class="text-muted">24</span>
                            </div>
                            <div class="calendar-day other-month">
                                <span class="text-muted">25</span>
                            </div>
                            <div class="calendar-day other-month">
                                <span class="text-muted">26</span>
                            </div>
                            <div class="calendar-day other-month">
                                <span class="text-muted">27</span>
                            </div>
                            <div class="calendar-day other-month">
                                <span class="text-muted">28</span>
                            </div>
                            <div class="calendar-day other-month">
                                <span class="text-muted">29</span>
                            </div>
                            <div class="calendar-day other-month">
                                <span class="text-muted">30</span>
                            </div>
                            
                            <!-- Week 2 -->
                            <div class="calendar-day">
                                <span>1</span>
                                <div class="availability-toggle available"></div>
                            </div>
                            <div class="calendar-day">
                                <span>2</span>
                                <div class="availability-toggle available"></div>
                            </div>
                            <div class="calendar-day has-booking">
                                <span>3</span>
                                <div class="booking-item">Vogue Shoot</div>
                                <div class="booking-item">9:00 AM - 5:00 PM</div>
                            </div>
                            <div class="calendar-day available">
                                <span>4</span>
                                <div class="availability-toggle available"></div>
                                <div class="booking-item available">Available</div>
                            </div>
                            <div class="calendar-day">
                                <span>5</span>
                                <div class="availability-toggle available"></div>
                            </div>
                            <div class="calendar-day">
                                <span>6</span>
                                <div class="availability-toggle unavailable"></div>
                            </div>
                            <div class="calendar-day">
                                <span>7</span>
                                <div class="availability-toggle available"></div>
                            </div>
                            
                            <!-- Week 3 -->
                            <div class="calendar-day">
                                <span>8</span>
                                <div class="availability-toggle available"></div>
                            </div>
                            <div class="calendar-day">
                                <span>9</span>
                                <div class="availability-toggle available"></div>
                            </div>
                            <div class="calendar-day today">
                                <span>10</span>
                                <div class="availability-toggle available"></div>
                                <div class="booking-item pending">Nike Callback</div>
                                <div class="booking-item pending">2:00 PM</div>
                            </div>
                            <div class="calendar-day">
                                <span>11</span>
                                <div class="availability-toggle available"></div>
                            </div>
                            <div class="calendar-day has-booking">
                                <span>12</span>
                                <div class="booking-item">H&M Shoot</div>
                                <div class="booking-item">10:00 AM - 6:00 PM</div>
                            </div>
                            <div class="calendar-day">
                                <span>13</span>
                                <div class="availability-toggle available"></div>
                            </div>
                            <div class="calendar-day">
                                <span>14</span>
                                <div class="availability-toggle unavailable"></div>
                            </div>
                            
                            <!-- Week 4 -->
                            <div class="calendar-day available">
                                <span>15</span>
                                <div class="availability-toggle available"></div>
                                <div class="booking-item available">Available</div>
                            </div>
                            <div class="calendar-day">
                                <span>16</span>
                                <div class="availability-toggle available"></div>
                            </div>
                            <div class="calendar-day">
                                <span>17</span>
                                <div class="availability-toggle available"></div>
                            </div>
                            <div class="calendar-day has-booking">
                                <span>18</span>
                                <div class="booking-item">Zara Campaign</div>
                                <div class="booking-item">11:00 AM - 4:00 PM</div>
                            </div>
                            <div class="calendar-day">
                                <span>19</span>
                                <div class="availability-toggle available"></div>
                            </div>
                            <div class="calendar-day">
                                <span>20</span>
                                <div class="availability-toggle available"></div>
                            </div>
                            <div class="calendar-day">
                                <span>21</span>
                                <div class="availability-toggle unavailable"></div>
                            </div>
                            
                            <!-- Week 5 -->
                            <div class="calendar-day">
                                <span>22</span>
                                <div class="availability-toggle available"></div>
                            </div>
                            <div class="calendar-day">
                                <span>23</span>
                                <div class="availability-toggle available"></div>
                            </div>
                            <div class="calendar-day">
                                <span>24</span>
                                <div class="availability-toggle unavailable"></div>
                            </div>
                            <div class="calendar-day">
                                <span>25</span>
                                <div class="availability-toggle unavailable"></div>
                            </div>
                            <div class="calendar-day">
                                <span>26</span>
                                <div class="availability-toggle unavailable"></div>
                            </div>
                            <div class="calendar-day">
                                <span>27</span>
                                <div class="availability-toggle available"></div>
                            </div>
                            <div class="calendar-day">
                                <span>28</span>
                                <div class="availability-toggle available"></div>
                            </div>
                            
                            <!-- Week 6 -->
                            <div class="calendar-day">
                                <span>29</span>
                                <div class="availability-toggle available"></div>
                            </div>
                            <div class="calendar-day">
                                <span>30</span>
                                <div class="availability-toggle available"></div>
                            </div>
                            <div class="calendar-day">
                                <span>31</span>
                                <div class="availability-toggle available"></div>
                            </div>
                            <div class="calendar-day other-month">
                                <span class="text-muted">1</span>
                            </div>
                            <div class="calendar-day other-month">
                                <span class="text-muted">2</span>
                            </div>
                            <div class="calendar-day other-month">
                                <span class="text-muted">3</span>
                            </div>
                            <div class="calendar-day other-month">
                                <span class="text-muted">4</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Calendar Legend -->
                <div class="mt-3">
                    <div class="d-flex flex-wrap gap-3 align-items-center">
                        <small class="text-muted">Legend:</small>
                        <div class="d-flex align-items-center gap-1">
                            <div class="availability-toggle available"></div>
                            <small>Available</small>
                        </div>
                        <div class="d-flex align-items-center gap-1">
                            <div class="availability-toggle unavailable"></div>
                            <small>Unavailable</small>
                        </div>
                        <div class="d-flex align-items-center gap-1">
                            <div class="booking-item" style="display: inline-block; margin: 0;">Confirmed</div>
                            <small>Booking</small>
                        </div>
                        <div class="d-flex align-items-center gap-1">
                            <div class="booking-item pending" style="display: inline-block; margin: 0;">Pending</div>
                            <small>Request</small>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Sidebar -->
            <div class="col-lg-3">
                <!-- Today's Schedule -->
                <?php echo createCard(
                    "Today's Schedule",
                    '
                    <div class="mb-3">
                        <h6 class="fw-bold text-primary">December 10, 2024</h6>
                        <small class="text-muted">Tuesday</small>
                    </div>
                    
                    <div class="time-slot booked">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <strong class="d-block">Nike Callback</strong>
                                <small class="text-muted">Virtual Meeting</small>
                            </div>
                            <span class="badge bg-warning">2:00 PM</span>
                        </div>
                    </div>
                    
                    <div class="time-slot available">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <strong class="d-block">Available</strong>
                                <small class="text-muted">Open for bookings</small>
                            </div>
                            <span class="badge bg-success">3:00 PM - 6:00 PM</span>
                        </div>
                    </div>
                    
                    <hr>
                    <div class="text-center">
                        <button class="btn btn-outline-primary btn-sm me-2">
                            <i class="fas fa-plus"></i> Add Availability
                        </button>
                        <button class="btn btn-outline-secondary btn-sm">
                            <i class="fas fa-ban"></i> Block Time
                        </button>
                    </div>
                    '
                ); ?>
                
                <!-- Upcoming Bookings -->
                <div class="mt-3">
                    <?php echo createCard(
                        "Upcoming Bookings",
                        '
                        <div class="mb-3">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 class="fw-bold mb-1">Vogue Editorial</h6>
                                    <small class="text-muted">Tomorrow • 9:00 AM - 5:00 PM</small>
                                </div>
                                <span class="badge bg-success">Confirmed</span>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 class="fw-bold mb-1">H&M Campaign</h6>
                                    <small class="text-muted">Dec 12 • 10:00 AM - 6:00 PM</small>
                                </div>
                                <span class="badge bg-success">Confirmed</span>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 class="fw-bold mb-1">Zara Shoot</h6>
                                    <small class="text-muted">Dec 18 • 11:00 AM - 4:00 PM</small>
                                </div>
                                <span class="badge bg-success">Confirmed</span>
                            </div>
                        </div>
                        
                        <div class="text-center">
                            <a href="../applications/index.php" class="btn btn-outline-primary btn-sm">View All Applications</a>
                        </div>
                        '
                    ); ?>
                </div>
                
                <!-- Booking Requests -->
                <div class="mt-3">
                    <?php echo createCard(
                        "Pending Requests",
                        '
                        <div class="mb-3">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 class="fw-bold mb-1">Elle Magazine</h6>
                                    <small class="text-muted">Dec 15 • Portfolio Shoot</small>
                                    <div class="mt-1">
                                        <small class="text-success">$2,800 day rate</small>
                                    </div>
                                </div>
                                <div class="btn-group-vertical">
                                    <button class="btn btn-success btn-sm">
                                        <i class="fas fa-check"></i>
                                    </button>
                                    <button class="btn btn-danger btn-sm">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 class="fw-bold mb-1">Independent Client</h6>
                                    <small class="text-muted">Dec 20 • Portrait Session</small>
                                    <div class="mt-1">
                                        <small class="text-success">$650 session fee</small>
                                    </div>
                                </div>
                                <div class="btn-group-vertical">
                                    <button class="btn btn-success btn-sm">
                                        <i class="fas fa-check"></i>
                                    </button>
                                    <button class="btn btn-danger btn-sm">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="text-center">
                            <button class="btn btn-outline-info btn-sm">Review All Requests</button>
                        </div>
                        '
                    ); ?>
                </div>
                
                <!-- Quick Actions -->
                <div class="mt-3">
                    <?php echo createCard(
                        "Quick Actions",
                        '
                        <div class="d-grid gap-2">
                            <button class="btn btn-primary">
                                <i class="fas fa-calendar-plus me-2"></i>Set Availability
                            </button>
                            <button class="btn btn-outline-primary">
                                <i class="fas fa-repeat me-2"></i>Recurring Schedule
                            </button>
                            <button class="btn btn-outline-secondary">
                                <i class="fas fa-download me-2"></i>Export Calendar
                            </button>
                            <button class="btn btn-outline-info">
                                <i class="fas fa-bell me-2"></i>Notification Settings
                            </button>
                        </div>
                        '
                    ); ?>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Calendar navigation
    const prevMonth = document.getElementById('prevMonth');
    const nextMonth = document.getElementById('nextMonth');
    const todayBtn = document.getElementById('todayBtn');
    
    prevMonth.addEventListener('click', function() {
        // Previous month logic would go here
        console.log('Previous month clicked');
    });
    
    nextMonth.addEventListener('click', function() {
        // Next month logic would go here
        console.log('Next month clicked');
    });
    
    todayBtn.addEventListener('click', function() {
        // Go to today logic would go here
        console.log('Today clicked');
    });
    
    // Calendar day click handlers
    const calendarDays = document.querySelectorAll('.calendar-day:not(.other-month)');
    calendarDays.forEach(day => {
        day.addEventListener('click', function() {
            const dayNumber = this.querySelector('span').textContent;
            console.log(`Day ${dayNumber} clicked`);
            
            // Show day details or booking modal
            // This would open a modal for managing that day's availability
        });
    });
    
    // Availability toggle handlers
    const availabilityToggles = document.querySelectorAll('.availability-toggle');
    availabilityToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent day click
            
            if (this.classList.contains('available')) {
                this.classList.remove('available');
                this.classList.add('unavailable');
            } else {
                this.classList.remove('unavailable');
                this.classList.add('available');
            }
        });
    });
    
    // Booking item click handlers
    const bookingItems = document.querySelectorAll('.booking-item');
    bookingItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent day click
            console.log('Booking clicked:', this.textContent);
            
            // Show booking details modal
        });
    });
    
    // Time slot handlers
    const timeSlots = document.querySelectorAll('.time-slot');
    timeSlots.forEach(slot => {
        slot.addEventListener('click', function() {
            console.log('Time slot clicked:', this.textContent);
            
            // Show time slot details or edit modal
        });
    });
});
</script>

<?php echo renderFooter(); ?>
