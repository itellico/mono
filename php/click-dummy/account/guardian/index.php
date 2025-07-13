<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Guardian Dashboard - Maria Rodriguez", "Guardian", "Profile Manager", "Account");
?>

<div class="d-flex">
    <?php echo renderSidebar('Account', getGuardianSidebarItems(), 'guardian/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Account', 'href' => '../index.php'],
            ['label' => 'Guardian Dashboard']
        ]);
        
        echo createHeroSection(
            "Maria Rodriguez - Guardian Account",
            "Managing mother & hand model + 2 children (Sofia 12, Lucas 8) with comprehensive parental controls",
            "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1200&h=300&fit=crop",
            [
                ['label' => 'Switch Profile', 'icon' => 'fas fa-exchange-alt', 'style' => 'primary'],
                ['label' => 'Manage Settings', 'icon' => 'fas fa-shield-alt', 'style' => 'info'],
                ['label' => 'Switch Account Type', 'icon' => 'fas fa-exchange-alt', 'style' => 'secondary']
            ]
        );
        ?>
        
        <!-- Account Type Badge & Profile Switcher -->
        <div class="row mb-3">
            <div class="col-12">
                <div class="alert alert-warning d-flex align-items-center">
                    <i class="fas fa-users me-3 fs-4"></i>
                    <div class="flex-grow-1">
                        <strong>Guardian Account Active</strong>
                        <p class="mb-0 small">You're viewing the guardian dashboard with multi-profile management and parental controls.</p>
                    </div>
                    <a href="../index.php" class="btn btn-outline-warning btn-sm ms-auto">Switch Account Type</a>
                </div>
            </div>
        </div>

        <!-- Profile Switcher -->
        <div class="row mb-4">
            <div class="col-12">
                <?php echo createCard(
                    "Profile Management",
                    '
                    <div class="row g-3">
                        <div class="col-md-4">
                            <div class="card border-warning h-100" id="profile-maria">
                                <div class="card-body text-center">
                                    <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&crop=face" 
                                         class="rounded-circle mb-3" style="width: 80px; height: 80px;" alt="Maria">
                                    <h6 class="fw-bold text-warning">Maria Rodriguez</h6>
                                    <p class="small text-muted mb-2">Hand Model (Self)</p>
                                    <span class="badge bg-warning mb-2">Currently Active</span>
                                    <div class="small">
                                        <div class="d-flex justify-content-between">
                                            <span>Age:</span>
                                            <span>38</span>
                                        </div>
                                        <div class="d-flex justify-content-between">
                                            <span>Bookings:</span>
                                            <span>3 this month</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card border-light h-100 profile-switch" data-profile="sofia">
                                <div class="card-body text-center">
                                    <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face" 
                                         class="rounded-circle mb-3" style="width: 80px; height: 80px;" alt="Sofia">
                                    <h6 class="fw-bold">Sofia Rodriguez</h6>
                                    <p class="small text-muted mb-2">Model (Daughter, 12)</p>
                                    <span class="badge bg-success mb-2">Available</span>
                                    <div class="small">
                                        <div class="d-flex justify-content-between">
                                            <span>Height:</span>
                                            <span>4\'8"</span>
                                        </div>
                                        <div class="d-flex justify-content-between">
                                            <span>Bookings:</span>
                                            <span>2 this month</span>
                                        </div>
                                    </div>
                                    <button class="btn btn-outline-primary btn-sm mt-2 w-100">Switch to Sofia</button>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card border-light h-100 profile-switch" data-profile="lucas">
                                <div class="card-body text-center">
                                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face" 
                                         class="rounded-circle mb-3" style="width: 80px; height: 80px;" alt="Lucas">
                                    <h6 class="fw-bold">Lucas Rodriguez</h6>
                                    <p class="small text-muted mb-2">Model (Son, 8)</p>
                                    <span class="badge bg-info mb-2">Kids Category</span>
                                    <div class="small">
                                        <div class="d-flex justify-content-between">
                                            <span>Height:</span>
                                            <span>4\'2"</span>
                                        </div>
                                        <div class="d-flex justify-content-between">
                                            <span>Bookings:</span>
                                            <span>2 this month</span>
                                        </div>
                                    </div>
                                    <button class="btn btn-outline-primary btn-sm mt-2 w-100">Switch to Lucas</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    '
                ); ?>
            </div>
        </div>
        
        <!-- Guardian Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Total Managed Profiles', '3', 'fas fa-users', 'primary');
            echo createStatCard('Combined Bookings', '7', 'fas fa-calendar-check', 'success');
            echo createStatCard('Total Monthly Earnings', '$12.8K', 'fas fa-dollar-sign', 'info');
            echo createStatCard('Active Protections', '8', 'fas fa-shield-alt', 'warning');
            ?>
        </div>
        
        <!-- Main Dashboard Content -->
        <div class="row">
            <!-- Left Column -->
            <div class="col-lg-8">
                <!-- Consolidated Bookings Overview -->
                <?php echo createCard(
                    "All Profiles - Upcoming Bookings",
                    '
                    <div class="row g-3">
                        <div class="col-md-6">
                            <div class="card border-warning h-100">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-start mb-3">
                                        <div>
                                            <h6 class="fw-bold text-warning">Maria - Jewelry Campaign</h6>
                                            <small class="text-muted">Hand Modeling - Cartier</small>
                                        </div>
                                        <span class="badge bg-success">Confirmed</span>
                                    </div>
                                    <p class="small text-muted mb-3">Luxury jewelry hand modeling for Cartier\'s holiday collection.</p>
                                    <div class="mb-3">
                                        <div class="d-flex justify-content-between small">
                                            <span>Date:</span>
                                            <span class="fw-bold">Dec 18</span>
                                        </div>
                                        <div class="d-flex justify-content-between small">
                                            <span>Duration:</span>
                                            <span class="fw-bold">4 hours</span>
                                        </div>
                                        <div class="d-flex justify-content-between small">
                                            <span>Fee:</span>
                                            <span class="fw-bold text-success">$2,800</span>
                                        </div>
                                    </div>
                                    <div class="d-flex align-items-center">
                                        <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=30&h=30&fit=crop&crop=face" 
                                             class="rounded-circle me-2" style="width: 30px; height: 30px;" alt="Maria">
                                        <small>Maria (Self)</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card border-info h-100">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-start mb-3">
                                        <div>
                                            <h6 class="fw-bold text-info">Sofia - Gap Kids</h6>
                                            <small class="text-muted">Kids Fashion - Educational Content</small>
                                        </div>
                                        <span class="badge bg-info">School Approved</span>
                                    </div>
                                    <p class="small text-muted mb-3">Back-to-school campaign for Gap Kids with educational focus.</p>
                                    <div class="mb-3">
                                        <div class="d-flex justify-content-between small">
                                            <span>Date:</span>
                                            <span class="fw-bold">Dec 20 (Saturday)</span>
                                        </div>
                                        <div class="d-flex justify-content-between small">
                                            <span>Duration:</span>
                                            <span class="fw-bold">3 hours max</span>
                                        </div>
                                        <div class="d-flex justify-content-between small">
                                            <span>Fee:</span>
                                            <span class="fw-bold text-success">$1,200</span>
                                        </div>
                                    </div>
                                    <div class="d-flex align-items-center">
                                        <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=30&h=30&fit=crop&crop=face" 
                                             class="rounded-circle me-2" style="width: 30px; height: 30px;" alt="Sofia">
                                        <small>Sofia (Daughter, 12)</small>
                                        <span class="badge bg-light text-dark ms-2">Parental Supervision</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    ',
                    '<a href="bookings/index.php" class="btn btn-outline-primary">View All Bookings</a>'
                ); ?>

                <!-- Parental Controls & Protections -->
                <div class="mt-4">
                    <?php echo createCard(
                        "Active Parental Controls",
                        '
                        <div class="row g-3">
                            <div class="col-md-6">
                                <h6 class="text-info">Sofia (12) - Protections</h6>
                                <ul class="list-unstyled small">
                                    <li class="mb-2">
                                        <i class="fas fa-check text-success me-2"></i>
                                        <strong>Content Restrictions:</strong> Educational/Age-appropriate only
                                    </li>
                                    <li class="mb-2">
                                        <i class="fas fa-check text-success me-2"></i>
                                        <strong>Working Hours:</strong> Max 3 hours/day, weekends only during school
                                    </li>
                                    <li class="mb-2">
                                        <i class="fas fa-check text-success me-2"></i>
                                        <strong>Guardian Presence:</strong> Required at all shoots
                                    </li>
                                    <li class="mb-2">
                                        <i class="fas fa-check text-success me-2"></i>
                                        <strong>Background Checks:</strong> All crew verified
                                    </li>
                                </ul>
                            </div>
                            <div class="col-md-6">
                                <h6 class="text-warning">Lucas (8) - Enhanced Protections</h6>
                                <ul class="list-unstyled small">
                                    <li class="mb-2">
                                        <i class="fas fa-check text-success me-2"></i>
                                        <strong>Content Restrictions:</strong> Children\'s products only
                                    </li>
                                    <li class="mb-2">
                                        <i class="fas fa-check text-success me-2"></i>
                                        <strong>Working Hours:</strong> Max 2 hours/day, no school days
                                    </li>
                                    <li class="mb-2">
                                        <i class="fas fa-check text-success me-2"></i>
                                        <strong>Guardian Presence:</strong> Required + education tutor
                                    </li>
                                    <li class="mb-2">
                                        <i class="fas fa-check text-success me-2"></i>
                                        <strong>Image Rights:</strong> Limited usage, no social media
                                    </li>
                                </ul>
                            </div>
                        </div>
                        ',
                        '<a href="protections/index.php" class="btn btn-outline-info me-2">Manage Protections</a><a href="earnings/index.php" class="btn btn-outline-success">Trust Fund Management</a>'
                    ); ?>
                </div>
            </div>

            <!-- Right Column -->
            <div class="col-lg-4">
                <!-- Quick Actions -->
                <?php echo createCard(
                    "Guardian Quick Actions",
                    '
                    <div class="d-grid gap-2">
                        <button class="btn btn-primary" data-action="switch-profile">
                            <i class="fas fa-exchange-alt me-2"></i> Switch Active Profile
                        </button>
                        <button class="btn btn-success" data-action="add-availability">
                            <i class="fas fa-calendar-plus me-2"></i> Manage Availability
                        </button>
                        <button class="btn btn-info" data-action="review-applications">
                            <i class="fas fa-shield-alt me-2"></i> Review Applications
                        </button>
                        <button class="btn btn-warning" data-action="earnings-report">
                            <i class="fas fa-chart-line me-2"></i> Earnings Report
                        </button>
                    </div>
                    '
                ); ?>

                <!-- This Week's Schedule -->
                <div class="mt-3">
                    <?php echo createCard(
                        "Family Schedule Overview",
                        '
                        <div class="mb-3">
                            <h6 class="small fw-bold text-warning">Maria (Hand Model)</h6>
                            <div class="row g-1 text-center small">
                                <div class="col"><div class="bg-light p-1 rounded">Mon<br><small class="text-success">Free</small></div></div>
                                <div class="col"><div class="bg-warning p-1 rounded text-white">Tue<br><small>Shoot</small></div></div>
                                <div class="col"><div class="bg-light p-1 rounded">Wed<br><small class="text-success">Free</small></div></div>
                                <div class="col"><div class="bg-light p-1 rounded">Thu<br><small class="text-success">Free</small></div></div>
                                <div class="col"><div class="bg-light p-1 rounded">Fri<br><small class="text-success">Free</small></div></div>
                                <div class="col"><div class="bg-light p-1 rounded">Sat<br><small class="text-muted">Family</small></div></div>
                                <div class="col"><div class="bg-light p-1 rounded">Sun<br><small class="text-muted">Rest</small></div></div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <h6 class="small fw-bold text-primary">Sofia (12) - School Priority</h6>
                            <div class="row g-1 text-center small">
                                <div class="col"><div class="bg-secondary p-1 rounded text-white">Mon<br><small>School</small></div></div>
                                <div class="col"><div class="bg-secondary p-1 rounded text-white">Tue<br><small>School</small></div></div>
                                <div class="col"><div class="bg-secondary p-1 rounded text-white">Wed<br><small>School</small></div></div>
                                <div class="col"><div class="bg-secondary p-1 rounded text-white">Thu<br><small>School</small></div></div>
                                <div class="col"><div class="bg-secondary p-1 rounded text-white">Fri<br><small>School</small></div></div>
                                <div class="col"><div class="bg-info p-1 rounded text-white">Sat<br><small>Shoot</small></div></div>
                                <div class="col"><div class="bg-light p-1 rounded">Sun<br><small class="text-muted">Family</small></div></div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <h6 class="small fw-bold text-success">Lucas (8) - Protected</h6>
                            <div class="row g-1 text-center small">
                                <div class="col"><div class="bg-secondary p-1 rounded text-white">Mon<br><small>School</small></div></div>
                                <div class="col"><div class="bg-secondary p-1 rounded text-white">Tue<br><small>School</small></div></div>
                                <div class="col"><div class="bg-secondary p-1 rounded text-white">Wed<br><small>School</small></div></div>
                                <div class="col"><div class="bg-secondary p-1 rounded text-white">Thu<br><small>School</small></div></div>
                                <div class="col"><div class="bg-secondary p-1 rounded text-white">Fri<br><small>School</small></div></div>
                                <div class="col"><div class="bg-light p-1 rounded">Sat<br><small class="text-success">Free</small></div></div>
                                <div class="col"><div class="bg-light p-1 rounded">Sun<br><small class="text-muted">Family</small></div></div>
                            </div>
                        </div>
                        '
                    ); ?>
                </div>

                <!-- Earnings Summary -->
                <div class="mt-3">
                    <?php echo createCard(
                        "December Earnings",
                        '
                        <div class="mb-3">
                            <div class="d-flex justify-content-between mb-2">
                                <div class="d-flex align-items-center">
                                    <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=25&h=25&fit=crop&crop=face" 
                                         class="rounded-circle me-2" style="width: 25px; height: 25px;" alt="Maria">
                                    <span class="small">Maria</span>
                                </div>
                                <strong class="text-warning">$8,400</strong>
                            </div>
                            <div class="progress mb-2" style="height: 4px;">
                                <div class="progress-bar bg-warning" style="width: 70%"></div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between mb-2">
                                <div class="d-flex align-items-center">
                                    <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=25&h=25&fit=crop&crop=face" 
                                         class="rounded-circle me-2" style="width: 25px; height: 25px;" alt="Sofia">
                                    <span class="small">Sofia</span>
                                </div>
                                <strong class="text-info">$2,800</strong>
                            </div>
                            <div class="progress mb-2" style="height: 4px;">
                                <div class="progress-bar bg-info" style="width: 45%"></div>
                            </div>
                            <small class="text-muted">→ College Fund: $2,520 (90%)</small>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between mb-2">
                                <div class="d-flex align-items-center">
                                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=25&h=25&fit=crop&crop=face" 
                                         class="rounded-circle me-2" style="width: 25px; height: 25px;" alt="Lucas">
                                    <span class="small">Lucas</span>
                                </div>
                                <strong class="text-success">$1,600</strong>
                            </div>
                            <div class="progress mb-2" style="height: 4px;">
                                <div class="progress-bar bg-success" style="width: 30%"></div>
                            </div>
                            <small class="text-muted">→ Education Fund: $1,440 (90%)</small>
                        </div>
                        <hr>
                        <div class="d-flex justify-content-between">
                            <strong>Total Family</strong>
                            <strong class="text-primary">$12,800</strong>
                        </div>
                        '
                    ); ?>
                </div>

                <!-- Recent Guardian Actions -->
                <div class="mt-3">
                    <?php echo createCard(
                        "Recent Guardian Actions",
                        '
                        <div class="mb-3">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-shield-alt text-success me-3"></i>
                                <div class="flex-grow-1">
                                    <strong class="d-block">Application Approved</strong>
                                    <small class="text-muted">Gap Kids campaign for Sofia</small>
                                </div>
                                <small class="text-muted">2h</small>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-calendar-check text-primary me-3"></i>
                                <div class="flex-grow-1">
                                    <strong class="d-block">Schedule Updated</strong>
                                    <small class="text-muted">Set Lucas unavailable school days</small>
                                </div>
                                <small class="text-muted">1d</small>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-piggy-bank text-warning me-3"></i>
                                <div class="flex-grow-1">
                                    <strong class="d-block">Trust Fund Deposit</strong>
                                    <small class="text-muted">$2,520 to Sofia\'s college fund</small>
                                </div>
                                <small class="text-muted">2d</small>
                            </div>
                        </div>
                        '
                    ); ?>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
// Guardian Account Profile Switching
class GuardianProfileManager {
    constructor() {
        this.currentProfile = 'maria';
        this.setupProfileSwitching();
        this.setupQuickActions();
    }

    setupProfileSwitching() {
        document.querySelectorAll('.profile-switch').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.tagName === 'BUTTON') {
                    const profileName = card.dataset.profile;
                    this.switchProfile(profileName);
                }
            });
        });
    }

    setupQuickActions() {
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.dataset.action;
                this.handleQuickAction(action);
            });
        });
    }

    switchProfile(profileName) {
        // Simulate profile switching
        this.showToast(`Switching to ${this.capitalize(profileName)}'s profile...`, 'info');
        
        setTimeout(() => {
            // In a real implementation, this would redirect or reload with new profile context
            this.showToast(`Now managing ${this.capitalize(profileName)}'s profile`, 'success');
            this.updateActiveProfile(profileName);
        }, 1000);
    }

    updateActiveProfile(profileName) {
        // Update visual indicators
        document.querySelectorAll('.card').forEach(card => {
            card.classList.remove('border-warning');
            card.classList.add('border-light');
        });

        // Update badges
        document.querySelectorAll('.badge').forEach(badge => {
            if (badge.textContent.includes('Currently Active')) {
                badge.textContent = 'Available';
                badge.className = 'badge bg-success mb-2';
            }
        });

        // Set new active profile
        const newActiveCard = document.querySelector(`[data-profile="${profileName}"]`) || 
                             document.getElementById(`profile-${profileName}`);
        if (newActiveCard) {
            newActiveCard.classList.remove('border-light');
            newActiveCard.classList.add('border-warning');
            
            const badge = newActiveCard.querySelector('.badge');
            if (badge) {
                badge.textContent = 'Currently Active';
                badge.className = 'badge bg-warning mb-2';
            }
        }

        this.currentProfile = profileName;
    }

    handleQuickAction(action) {
        const actions = {
            'switch-profile': () => this.showProfileSwitcher(),
            'add-availability': () => this.showToast('Opening availability manager...', 'info'),
            'review-applications': () => this.showToast('Loading pending applications...', 'info'),
            'earnings-report': () => this.showToast('Generating consolidated earnings report...', 'info')
        };

        if (actions[action]) {
            actions[action]();
        }
    }

    showProfileSwitcher() {
        // In a real implementation, this would show a modal or dropdown
        this.showToast('Profile switcher: Click on any profile card to switch', 'info');
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    showToast(message, type = 'info') {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => toast.remove());

        const toastContainer = document.createElement('div');
        toastContainer.className = 'position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';

        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-${this.getToastIcon(type)} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        toastContainer.appendChild(toast);
        document.body.appendChild(toastContainer);

        const bsToast = new bootstrap.Toast(toast, { delay: 4000 });
        bsToast.show();

        // Auto remove after hiding
        toast.addEventListener('hidden.bs.toast', () => {
            toastContainer.remove();
        });
    }

    getToastIcon(type) {
        const icons = {
            'success': 'check-circle',
            'danger': 'exclamation-triangle',
            'warning': 'exclamation-circle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
}

// Initialize Guardian Profile Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GuardianProfileManager();
});
</script>

<?php echo renderFooter(); ?>