<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

$titles = [
    'profile' => 'Profile Management - User Dashboard',
    'portfolio' => 'Portfolio Management - User Dashboard',
    'applications' => 'My Applications - User Dashboard', 
    'messages' => 'Messages - User Dashboard',
    'calendar' => 'Calendar - User Dashboard',
    'settings' => 'Settings - User Dashboard'
];

$pageNames = [
    'profile' => 'Profile Management',
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
.profile-hero { 
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 2rem 0;
    margin: -20px -20px 30px -20px;
}
.profile-photo {
    position: relative;
    display: inline-block;
}
.profile-photo:hover .photo-overlay {
    opacity: 1;
}
.photo-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
    cursor: pointer;
}
.measurements-card {
    background: #f8f9fa;
    border-radius: 10px;
    padding: 1rem;
    margin-bottom: 1rem;
}
.skill-tag {
    background: #e3f2fd;
    color: #1976d2;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.875rem;
    margin: 0.25rem;
    display: inline-block;
    cursor: pointer;
    transition: all 0.3s ease;
}
.skill-tag:hover {
    background: #1976d2;
    color: white;
}
.profile-section {
    background: white;
    border-radius: 15px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}
.experience-item {
    border-left: 3px solid #007bff;
    padding-left: 1rem;
    margin-bottom: 1.5rem;
}
.save-indicator {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
    transition: all 0.3s ease;
}
.profile-completion {
    background: linear-gradient(135deg, #28a745, #20c997);
    color: white;
    border-radius: 15px;
    padding: 1.5rem;
    text-align: center;
}
.completion-bar {
    background: rgba(255,255,255,0.2);
    height: 10px;
    border-radius: 5px;
    overflow: hidden;
    margin: 1rem 0;
}
.completion-progress {
    background: white;
    height: 100%;
    border-radius: 5px;
    transition: width 0.5s ease;
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
        
        <!-- Save Indicator -->
        <div id="saveIndicator" class="save-indicator" style="display: none;">
            <div class="alert alert-success mb-0">
                <i class="fas fa-check me-2"></i>Changes saved automatically
            </div>
        </div>
        
        <!-- Profile Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Profile Views', '2,341', 'fas fa-eye', 'primary');
            echo createStatCard('Profile Score', '92%', 'fas fa-chart-line', 'success');
            echo createStatCard('Applications', '47', 'fas fa-file-alt', 'info');
            echo createStatCard('Response Rate', '4.9★', 'fas fa-star', 'warning');
            ?>
        </div>

        <div class="row">
            <div class="col-lg-8">
                <!-- Main Profile Information -->
                <div class="profile-section">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h4 class="mb-0">Professional Profile</h4>
                        <div class="btn-group">
                            <button class="btn btn-outline-primary btn-sm" onclick="previewProfile()">
                                <i class="fas fa-eye me-2"></i>Preview Public Profile
                            </button>
                            <button class="btn btn-primary btn-sm" onclick="saveProfile()">
                                <i class="fas fa-save me-2"></i>Save Changes
                            </button>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-4 text-center">
                            <div class="profile-photo mb-3">
                                <img id="profileImage" src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&h=200&fit=crop&crop=face" 
                                     class="rounded-circle" style="width: 180px; height: 180px; object-fit: cover;" alt="Profile">
                                <div class="photo-overlay" onclick="showPhotoUpload()">
                                    <i class="fas fa-camera fa-2x text-white"></i>
                                </div>
                            </div>
                            <input type="file" id="photoInput" accept="image/*" style="display: none;" onchange="handlePhotoUpload(this)">
                            <button class="btn btn-outline-primary btn-sm" onclick="document.getElementById('photoInput').click()">
                                <i class="fas fa-upload me-2"></i>Update Photo
                            </button>
                        </div>
                        <div class="col-md-8">
                            <form id="profileForm">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Professional Name</label>
                                            <input type="text" class="form-control" id="professionalName" value="Emma Johnson" onchange="markUnsaved()">
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">Email Address</label>
                                            <input type="email" class="form-control" id="email" value="emma.johnson@email.com" onchange="markUnsaved()">
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">Phone Number</label>
                                            <input type="tel" class="form-control" id="phone" value="+1 (555) 123-4567" onchange="markUnsaved()">
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">Location</label>
                                            <input type="text" class="form-control" id="location" value="New York, NY" onchange="markUnsaved()">
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Primary Category</label>
                                            <select class="form-select" id="category" onchange="markUnsaved()">
                                                <option selected>Fashion Model</option>
                                                <option>Commercial Model</option>
                                                <option>Fitness Model</option>
                                                <option>Editorial Model</option>
                                                <option>Runway Model</option>
                                                <option>Beauty Model</option>
                                            </select>
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">Experience Level</label>
                                            <select class="form-select" id="experience" onchange="markUnsaved()">
                                                <option>Beginner (0-2 years)</option>
                                                <option>Intermediate (2-5 years)</option>
                                                <option selected>Experienced (5-10 years)</option>
                                                <option>Expert (10+ years)</option>
                                            </select>
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">Hourly Rate</label>
                                            <div class="input-group">
                                                <span class="input-group-text">$</span>
                                                <input type="number" class="form-control" id="hourlyRate" value="150" onchange="markUnsaved()">
                                                <span class="input-group-text">/hour</span>
                                            </div>
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">Day Rate</label>
                                            <div class="input-group">
                                                <span class="input-group-text">$</span>
                                                <input type="number" class="form-control" id="dayRate" value="1200" onchange="markUnsaved()">
                                                <span class="input-group-text">/day</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <!-- Physical Measurements -->
                <div class="profile-section">
                    <h5 class="mb-3">Physical Measurements</h5>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="measurements-card">
                                <div class="row">
                                    <div class="col-6">
                                        <label class="form-label">Height</label>
                                        <input type="text" class="form-control" id="height" value="5'9&quot;" onchange="markUnsaved()">
                                    </div>
                                    <div class="col-6">
                                        <label class="form-label">Weight</label>
                                        <input type="text" class="form-control" id="weight" value="125 lbs" onchange="markUnsaved()">
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="measurements-card">
                                <div class="row">
                                    <div class="col-4">
                                        <label class="form-label">Bust</label>
                                        <input type="text" class="form-control" id="bust" value="34&quot;" onchange="markUnsaved()">
                                    </div>
                                    <div class="col-4">
                                        <label class="form-label">Waist</label>
                                        <input type="text" class="form-control" id="waist" value="24&quot;" onchange="markUnsaved()">
                                    </div>
                                    <div class="col-4">
                                        <label class="form-label">Hips</label>
                                        <input type="text" class="form-control" id="hips" value="36&quot;" onchange="markUnsaved()">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row mt-3">
                        <div class="col-md-3">
                            <label class="form-label">Hair Color</label>
                            <select class="form-select" id="hairColor" onchange="markUnsaved()">
                                <option>Black</option>
                                <option selected>Brown</option>
                                <option>Blonde</option>
                                <option>Red</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Eye Color</label>
                            <select class="form-select" id="eyeColor" onchange="markUnsaved()">
                                <option selected>Brown</option>
                                <option>Blue</option>
                                <option>Green</option>
                                <option>Hazel</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Shoe Size</label>
                            <input type="text" class="form-control" id="shoeSize" value="8.5" onchange="markUnsaved()">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Dress Size</label>
                            <input type="text" class="form-control" id="dressSize" value="4" onchange="markUnsaved()">
                        </div>
                    </div>
                </div>

                <!-- Professional Bio -->
                <div class="profile-section">
                    <h5 class="mb-3">Professional Bio</h5>
                    <div class="mb-3">
                        <label class="form-label">Bio Summary</label>
                        <textarea class="form-control" id="bioSummary" rows="4" onchange="markUnsaved()" placeholder="Write a compelling professional bio...">Experienced fashion model with 8+ years in the industry. Specializing in high-fashion editorial work and commercial campaigns. Featured in Vogue, Harper's Bazaar, and worked with major brands including Nike, H&M, and Zara.</textarea>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Skills & Specialties</label>
                        <div id="skillsContainer" class="mb-2">
                            <span class="skill-tag">Fashion Modeling</span>
                            <span class="skill-tag">Editorial Work</span>
                            <span class="skill-tag">Commercial Campaigns</span>
                            <span class="skill-tag">Runway Walking</span>
                            <span class="skill-tag">Beauty Shoots</span>
                            <span class="skill-tag">Lifestyle Photography</span>
                        </div>
                        <div class="input-group">
                            <input type="text" class="form-control" id="newSkill" placeholder="Add a new skill...">
                            <button class="btn btn-outline-primary" onclick="addSkill()">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Experience Timeline -->
                <div class="profile-section">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h5 class="mb-0">Experience Timeline</h5>
                        <button class="btn btn-outline-primary btn-sm" onclick="addExperience()">
                            <i class="fas fa-plus me-2"></i>Add Experience
                        </button>
                    </div>
                    <div id="experienceTimeline">
                        <div class="experience-item">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 class="mb-1">Lead Model - Vogue Editorial Shoot</h6>
                                    <p class="text-muted mb-1">Vogue Magazine</p>
                                    <small class="text-muted">January 2024</small>
                                </div>
                                <button class="btn btn-sm btn-outline-danger" onclick="removeExperience(this)">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                            <p class="mt-2 mb-0">Featured as lead model in 8-page editorial spread for Vogue's spring fashion issue.</p>
                        </div>
                        <div class="experience-item">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 class="mb-1">Brand Ambassador - Nike Campaign</h6>
                                    <p class="text-muted mb-1">Nike</p>
                                    <small class="text-muted">November 2023</small>
                                </div>
                                <button class="btn btn-sm btn-outline-danger" onclick="removeExperience(this)">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                            <p class="mt-2 mb-0">Global campaign for Nike's athletic wear line, including print and digital advertising.</p>
                        </div>
                        <div class="experience-item">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 class="mb-1">Runway Model - Paris Fashion Week</h6>
                                    <p class="text-muted mb-1">Various Designers</p>
                                    <small class="text-muted">September 2023</small>
                                </div>
                                <button class="btn btn-sm btn-outline-danger" onclick="removeExperience(this)">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                            <p class="mt-2 mb-0">Walked for multiple designers during Paris Fashion Week, including Chanel and Dior shows.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-lg-4">
                <!-- Profile Completion -->
                <div class="profile-completion mb-4">
                    <h5 class="mb-3">Profile Completion</h5>
                    <div class="completion-bar">
                        <div class="completion-progress" style="width: 85%"></div>
                    </div>
                    <h3 class="mb-2">85%</h3>
                    <p class="mb-3">Your profile is looking great! Complete the remaining sections to increase visibility.</p>
                    <div class="text-start">
                        <small class="d-block"><i class="fas fa-check text-success me-2"></i>Basic Information</small>
                        <small class="d-block"><i class="fas fa-check text-success me-2"></i>Professional Photo</small>
                        <small class="d-block"><i class="fas fa-check text-success me-2"></i>Measurements</small>
                        <small class="d-block"><i class="fas fa-times text-warning me-2"></i>Portfolio Images (3+ required)</small>
                        <small class="d-block"><i class="fas fa-times text-warning me-2"></i>Professional References</small>
                    </div>
                </div>

                <!-- Public Profile Visibility -->
                <div class="card mb-4" style="border: 2px solid #007bff;">
                    <div class="card-header bg-primary text-white">
                        <h5 class="mb-0">
                            <i class="fas fa-globe me-2"></i>Public Profile
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <h6 class="mb-0">Profile Visibility</h6>
                                <small class="text-muted">Make your profile publicly searchable</small>
                            </div>
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="profileVisibilityToggle" checked onchange="toggleProfileVisibility()">
                            </div>
                        </div>
                        
                        <div id="profileOnlineStatus" class="alert alert-success mb-3">
                            <i class="fas fa-check-circle me-2"></i>
                            Your profile is <strong>ONLINE</strong> and visible to everyone
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label small">Public Profile URL</label>
                            <div class="input-group">
                                <input type="text" class="form-control form-control-sm" id="profileUrl" value="https://platform.com/profile/emma-johnson" readonly>
                                <button class="btn btn-outline-secondary btn-sm" onclick="copyProfileUrl()">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="d-grid gap-2">
                            <a href="/public/profile/index.php?u=emma-johnson&preview=true" class="btn btn-primary" target="_blank">
                                <i class="fas fa-eye me-2"></i>Preview Public Profile
                            </a>
                            <button class="btn btn-outline-secondary btn-sm" onclick="showPublicProfileSettings()">
                                <i class="fas fa-cog me-2"></i>Public Profile Settings
                            </button>
                        </div>
                        
                        <hr>
                        
                        <div class="small">
                            <h6 class="text-muted mb-2">Public Profile Stats</h6>
                            <div class="d-flex justify-content-between mb-1">
                                <span>Profile Views (30 days)</span>
                                <strong>2,341</strong>
                            </div>
                            <div class="d-flex justify-content-between mb-1">
                                <span>Contact Requests</span>
                                <strong>47</strong>
                            </div>
                            <div class="d-flex justify-content-between">
                                <span>Search Appearances</span>
                                <strong>189</strong>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <?php echo createCard(
                    "Quick Actions",
                    '
                    <div class="d-grid gap-2">
                        <button class="btn btn-primary" onclick="uploadPortfolioPhotos()">
                            <i class="fas fa-images me-2"></i>Upload Portfolio Photos
                        </button>
                        <button class="btn btn-outline-primary" onclick="addReferences()">
                            <i class="fas fa-user-friends me-2"></i>Add References
                        </button>
                        <button class="btn btn-outline-secondary" onclick="exportProfile()">
                            <i class="fas fa-download me-2"></i>Export Profile PDF
                        </button>
                        <button class="btn btn-outline-info" onclick="shareProfile()">
                            <i class="fas fa-share me-2"></i>Share Profile Link
                        </button>
                    </div>
                    '
                ); ?>

                <!-- Profile Tips -->
                <?php echo createCard(
                    "Profile Tips",
                    '
                    <div class="mb-3">
                        <h6 class="text-primary"><i class="fas fa-lightbulb me-2"></i>Boost Your Visibility</h6>
                        <ul class="small mb-0">
                            <li>Add at least 5 high-quality portfolio photos</li>
                            <li>Complete your measurements section</li>
                            <li>Write a compelling bio (150+ words)</li>
                            <li>Add professional references</li>
                            <li>Keep your availability calendar updated</li>
                        </ul>
                    </div>
                    <div class="mb-3">
                        <h6 class="text-success"><i class="fas fa-chart-line me-2"></i>Profile Performance</h6>
                        <small class="d-block text-muted">+127% views this month</small>
                        <small class="d-block text-muted">+45% application responses</small>
                        <small class="d-block text-muted">Top 15% in your category</small>
                    </div>
                    '
                ); ?>

                <!-- Account Status -->
                <?php echo createCard(
                    "Account Status",
                    '
                    <div class="d-flex align-items-center mb-3">
                        <div class="bg-success rounded-circle me-3" style="width: 12px; height: 12px;"></div>
                        <div>
                            <h6 class="mb-0">Verified Professional</h6>
                            <small class="text-muted">Account verified on Jan 15, 2024</small>
                        </div>
                    </div>
                    <div class="d-flex align-items-center mb-3">
                        <div class="bg-warning rounded-circle me-3" style="width: 12px; height: 12px;"></div>
                        <div>
                            <h6 class="mb-0">Premium Features</h6>
                            <small class="text-muted">Upgrade to unlock advanced tools</small>
                        </div>
                    </div>
                    <button class="btn btn-outline-warning btn-sm w-100">
                        <i class="fas fa-crown me-2"></i>Upgrade to Premium
                    </button>
                    '
                ); ?>
            </div>
        </div>
    </div>
</div>

<!-- Add Experience Modal -->
<div class="modal fade" id="addExperienceModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Add Experience</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form id="experienceForm">
                    <div class="mb-3">
                        <label class="form-label">Job Title</label>
                        <input type="text" class="form-control" id="expTitle" placeholder="e.g., Fashion Model, Brand Ambassador">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Company/Client</label>
                        <input type="text" class="form-control" id="expCompany" placeholder="e.g., Vogue, Nike, Local Studio">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Date</label>
                        <input type="month" class="form-control" id="expDate">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Description</label>
                        <textarea class="form-control" id="expDescription" rows="3" placeholder="Describe your role and achievements..."></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="saveExperience()">Add Experience</button>
            </div>
        </div>
    </div>
</div>

<script>
let unsavedChanges = false;

document.addEventListener('DOMContentLoaded', function() {
    // Auto-save functionality
    setInterval(() => {
        if (unsavedChanges) {
            autoSave();
        }
    }, 30000); // Auto-save every 30 seconds
    
    // Prevent accidental navigation
    window.addEventListener('beforeunload', function(e) {
        if (unsavedChanges) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
});

function markUnsaved() {
    unsavedChanges = true;
    document.title = "• " + document.title.replace("• ", "");
}

function markSaved() {
    unsavedChanges = false;
    document.title = document.title.replace("• ", "");
    showSaveIndicator();
}

function showSaveIndicator() {
    const indicator = document.getElementById('saveIndicator');
    indicator.style.display = 'block';
    setTimeout(() => {
        indicator.style.display = 'none';
    }, 3000);
}

function autoSave() {
    // Simulate auto-save
    console.log('Auto-saving profile...');
    markSaved();
}

function saveProfile() {
    // Collect all form data
    const profileData = {
        professionalName: document.getElementById('professionalName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        location: document.getElementById('location').value,
        category: document.getElementById('category').value,
        experience: document.getElementById('experience').value,
        hourlyRate: document.getElementById('hourlyRate').value,
        dayRate: document.getElementById('dayRate').value,
        measurements: {
            height: document.getElementById('height').value,
            weight: document.getElementById('weight').value,
            bust: document.getElementById('bust').value,
            waist: document.getElementById('waist').value,
            hips: document.getElementById('hips').value,
            hairColor: document.getElementById('hairColor').value,
            eyeColor: document.getElementById('eyeColor').value,
            shoeSize: document.getElementById('shoeSize').value,
            dressSize: document.getElementById('dressSize').value
        },
        bio: document.getElementById('bioSummary').value
    };
    
    console.log('Saving profile data:', profileData);
    markSaved();
    showToast('Profile saved successfully!', 'success');
}

function handlePhotoUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('profileImage').src = e.target.result;
            markUnsaved();
            showToast('Photo uploaded! Remember to save your changes.', 'info');
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function showPhotoUpload() {
    document.getElementById('photoInput').click();
}

function addSkill() {
    const newSkillInput = document.getElementById('newSkill');
    const skillText = newSkillInput.value.trim();
    
    if (skillText) {
        const skillsContainer = document.getElementById('skillsContainer');
        const skillTag = document.createElement('span');
        skillTag.className = 'skill-tag';
        skillTag.innerHTML = skillText + ' <i class="fas fa-times ms-1" onclick="removeSkill(this.parentElement)" style="cursor: pointer;"></i>';
        skillsContainer.appendChild(skillTag);
        
        newSkillInput.value = '';
        markUnsaved();
        showToast('Skill added successfully!', 'success');
    }
}

function removeSkill(skillElement) {
    skillElement.remove();
    markUnsaved();
}

function addExperience() {
    const modal = new bootstrap.Modal(document.getElementById('addExperienceModal'));
    modal.show();
}

function saveExperience() {
    const title = document.getElementById('expTitle').value;
    const company = document.getElementById('expCompany').value;
    const date = document.getElementById('expDate').value;
    const description = document.getElementById('expDescription').value;
    
    if (title && company && date) {
        const timeline = document.getElementById('experienceTimeline');
        const experienceItem = document.createElement('div');
        experienceItem.className = 'experience-item';
        
        const dateObj = new Date(date);
        const formattedDate = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        
        experienceItem.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <h6 class="mb-1">${title}</h6>
                    <p class="text-muted mb-1">${company}</p>
                    <small class="text-muted">${formattedDate}</small>
                </div>
                <button class="btn btn-sm btn-outline-danger" onclick="removeExperience(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <p class="mt-2 mb-0">${description}</p>
        `;
        
        timeline.insertBefore(experienceItem, timeline.firstChild);
        
        // Clear form
        document.getElementById('experienceForm').reset();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addExperienceModal'));
        modal.hide();
        
        markUnsaved();
        showToast('Experience added successfully!', 'success');
    } else {
        showToast('Please fill in all required fields.', 'warning');
    }
}

function removeExperience(button) {
    if (confirm('Are you sure you want to remove this experience?')) {
        button.closest('.experience-item').remove();
        markUnsaved();
        showToast('Experience removed.', 'info');
    }
}

function previewProfile() {
    window.open('/public/profile/index.php?u=emma-johnson&preview=true', '_blank');
    showToast('Opening public profile preview...', 'info');
}

function uploadPortfolioPhotos() {
    window.location.href = '../portfolio/index.php';
}

function addReferences() {
    showToast('References feature coming soon!', 'info');
}

function exportProfile() {
    showToast('Generating PDF export...', 'info');
    setTimeout(() => {
        showToast('Profile PDF downloaded!', 'success');
    }, 2000);
}

function shareProfile() {
    // Simulate copying to clipboard
    const profileUrl = 'https://platform.com/profile/emma-johnson';
    navigator.clipboard.writeText(profileUrl).then(() => {
        showToast('Profile link copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Profile link: ' + profileUrl, 'info');
    });
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} position-fixed`;
    toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    toast.innerHTML = `
        ${message}
        <button type="button" class="btn-close float-end" onclick="this.parentElement.remove()"></button>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 4000);
}

// Handle enter key for adding skills
document.getElementById('newSkill').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addSkill();
    }
});

// Public Profile Functions
function toggleProfileVisibility() {
    const toggle = document.getElementById('profileVisibilityToggle');
    const statusDiv = document.getElementById('profileOnlineStatus');
    
    if (toggle.checked) {
        statusDiv.className = 'alert alert-success mb-3';
        statusDiv.innerHTML = '<i class="fas fa-check-circle me-2"></i>Your profile is <strong>ONLINE</strong> and visible to everyone';
        showToast('Profile is now publicly visible!', 'success');
    } else {
        statusDiv.className = 'alert alert-warning mb-3';
        statusDiv.innerHTML = '<i class="fas fa-eye-slash me-2"></i>Your profile is <strong>OFFLINE</strong> and not publicly visible';
        showToast('Profile is now private and not publicly visible.', 'info');
    }
    
    markUnsaved();
}

function copyProfileUrl() {
    const urlInput = document.getElementById('profileUrl');
    urlInput.select();
    urlInput.setSelectionRange(0, 99999); // For mobile devices
    
    navigator.clipboard.writeText(urlInput.value).then(() => {
        showToast('Profile URL copied to clipboard!', 'success');
    }).catch(() => {
        // Fallback for older browsers
        document.execCommand('copy');
        showToast('Profile URL copied to clipboard!', 'success');
    });
}

function showPublicProfileSettings() {
    // Create and show modal for public profile settings
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Public Profile Settings</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label class="form-label">SEO Description</label>
                        <textarea class="form-control" rows="3" placeholder="Brief description for search engines...">Experienced fashion model specializing in editorial and commercial work</textarea>
                    </div>
                    <div class="mb-3">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="showContactInfo" checked>
                            <label class="form-check-label" for="showContactInfo">
                                Show contact information
                            </label>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="showRates" checked>
                            <label class="form-check-label" for="showRates">
                                Display rate information
                            </label>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="allowPortfolioDownload">
                            <label class="form-check-label" for="allowPortfolioDownload">
                                Allow portfolio image downloads
                            </label>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Custom URL (Optional)</label>
                        <div class="input-group">
                            <span class="input-group-text">platform.com/</span>
                            <input type="text" class="form-control" value="emma-johnson" placeholder="custom-url">
                        </div>
                        <div class="form-text">Choose a custom URL for your profile</div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" onclick="savePublicProfileSettings()">Save Settings</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
    
    // Clean up when modal is hidden
    modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
    });
}

function savePublicProfileSettings() {
    showToast('Public profile settings saved!', 'success');
    const modal = bootstrap.Modal.getInstance(document.querySelector('.modal'));
    modal.hide();
}

// localStorage Integration
document.addEventListener('DOMContentLoaded', function() {
    loadStoredProfileData();
    setupProfileAutoSave();
});

function loadStoredProfileData() {
    const profileData = window.demoStorage.get('profile');
    
    if (profileData) {
        // Load basic profile info
        document.getElementById('profileName').value = profileData.name || '';
        document.getElementById('profileTitle').value = profileData.title || '';
        document.getElementById('profileBio').value = profileData.bio || '';
        document.getElementById('profileLocation').value = profileData.location || '';
        document.getElementById('profilePhone').value = profileData.phone || '';
        document.getElementById('profileEmail').value = profileData.email || '';
        document.getElementById('profileWebsite').value = profileData.website || '';
        
        // Load measurements if they exist
        if (profileData.measurements) {
            document.getElementById('measurementHeight').value = profileData.height || '';
            document.getElementById('measurementWeight').value = profileData.weight || '';
            document.getElementById('measurementBust').value = profileData.measurements.bust || '';
            document.getElementById('measurementWaist').value = profileData.measurements.waist || '';
            document.getElementById('measurementHips').value = profileData.measurements.hips || '';
            document.getElementById('measurementDress').value = profileData.measurements.dress || '';
            document.getElementById('measurementShoe').value = profileData.measurements.shoe || '';
            document.getElementById('measurementHair').value = profileData.measurements.hair || '';
            document.getElementById('measurementEyes').value = profileData.measurements.eyes || '';
        }
        
        // Load skills
        if (profileData.skills && Array.isArray(profileData.skills)) {
            const skillsContainer = document.getElementById('skillsList');
            skillsContainer.innerHTML = '';
            profileData.skills.forEach(skill => {
                addSkillToList(skill);
            });
        }
        
        // Load social media
        if (profileData.social) {
            document.getElementById('socialInstagram').value = profileData.social.instagram || '';
            document.getElementById('socialTwitter').value = profileData.social.twitter || '';
            document.getElementById('socialLinkedin').value = profileData.social.linkedin || '';
        }
        
        // Load profile visibility
        if (profileData.profileVisible !== undefined) {
            document.getElementById('profileVisibilityToggle').checked = profileData.profileVisible;
            toggleProfileVisibility();
        }
    }
}

function setupProfileAutoSave() {
    // Auto-save on input changes with debouncing
    const inputs = document.querySelectorAll('#profileName, #profileTitle, #profileBio, #profileLocation, #profilePhone, #profileEmail, #profileWebsite, #measurementHeight, #measurementWeight, #measurementBust, #measurementWaist, #measurementHips, #measurementDress, #measurementShoe, #measurementHair, #measurementEyes, #socialInstagram, #socialTwitter, #socialLinkedin');
    
    let saveTimeout;
    
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            clearTimeout(saveTimeout);
            markUnsaved();
            
            saveTimeout = setTimeout(() => {
                saveProfileToStorage();
            }, 1000); // Save after 1 second of no typing
        });
    });
    
    // Save immediately on certain actions
    document.getElementById('profileVisibilityToggle').addEventListener('change', () => {
        saveProfileToStorage();
    });
}

function saveProfileToStorage() {
    const profileData = {
        name: document.getElementById('profileName').value,
        title: document.getElementById('profileTitle').value,
        bio: document.getElementById('profileBio').value,
        location: document.getElementById('profileLocation').value,
        phone: document.getElementById('profilePhone').value,
        email: document.getElementById('profileEmail').value,
        website: document.getElementById('profileWebsite').value,
        height: document.getElementById('measurementHeight').value,
        weight: document.getElementById('measurementWeight').value,
        measurements: {
            bust: document.getElementById('measurementBust').value,
            waist: document.getElementById('measurementWaist').value,
            hips: document.getElementById('measurementHips').value,
            dress: document.getElementById('measurementDress').value,
            shoe: document.getElementById('measurementShoe').value,
            hair: document.getElementById('measurementHair').value,
            eyes: document.getElementById('measurementEyes').value
        },
        skills: getSkillsArray(),
        social: {
            instagram: document.getElementById('socialInstagram').value,
            twitter: document.getElementById('socialTwitter').value,
            linkedin: document.getElementById('socialLinkedin').value
        },
        profileVisible: document.getElementById('profileVisibilityToggle').checked
    };
    
    window.demoStorage.updateProfile(profileData);
    markSaved();
    window.demoStorage.showToast('Profile saved automatically', 'success', 2000);
}

function getSkillsArray() {
    const skillElements = document.querySelectorAll('#skillsList .skill-tag');
    return Array.from(skillElements).map(el => el.textContent.replace('×', '').trim());
}

function addSkillToList(skillText) {
    const skillsContainer = document.getElementById('skillsList');
    const skillElement = document.createElement('span');
    skillElement.className = 'skill-tag';
    skillElement.innerHTML = `${skillText} <span class="remove-skill" onclick="removeSkill(this)">×</span>`;
    skillsContainer.appendChild(skillElement);
}

// Enhanced addSkill function that saves to storage
function addSkillEnhanced() {
    const input = document.getElementById('newSkill');
    const skillText = input.value.trim();
    
    if (skillText && !isSkillExists(skillText)) {
        addSkillToList(skillText);
        input.value = '';
        saveProfileToStorage(); // Auto-save when skills change
        showToast('Skill added: ' + skillText, 'success');
    }
}

// Enhanced removeSkill function that saves to storage
function removeSkillEnhanced(element) {
    const skillText = element.parentElement.textContent.replace('×', '').trim();
    element.parentElement.remove();
    saveProfileToStorage(); // Auto-save when skills change
    showToast('Skill removed: ' + skillText, 'info');
}
</script>

<!-- Include Demo Storage Utility -->
<script src="../../includes/demo-storage.js"></script>

<?php echo renderFooter(); ?>