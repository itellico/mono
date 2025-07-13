<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

$titles = [
    'comp-card' => 'Comp Card - User Dashboard',
    'profile' => 'Profile Management - User Dashboard',
    'portfolio' => 'Portfolio Management - User Dashboard',
    'applications' => 'My Applications - User Dashboard', 
    'messages' => 'Messages - User Dashboard',
    'calendar' => 'Calendar - User Dashboard',
    'settings' => 'Settings - User Dashboard'
];

$pageNames = [
    'comp-card' => 'Comp Card',
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
.comp-card-hero { 
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 2rem 0;
    margin: -20px -20px 30px -20px;
}
.comp-card-preview {
    background: white;
    border-radius: 15px;
    padding: 2rem;
    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
    margin-bottom: 2rem;
    position: relative;
    min-height: 600px;
}
.comp-card-front, .comp-card-back {
    width: 100%;
    height: 600px;
    border: 2px solid #e9ecef;
    border-radius: 10px;
    background: white;
    position: relative;
    overflow: hidden;
    display: none;
}
.comp-card-front.active, .comp-card-back.active {
    display: block;
}
.comp-card-header {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    padding: 1rem;
    text-align: center;
}
.comp-card-name {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
}
.comp-card-info {
    font-size: 0.9rem;
    opacity: 0.9;
    margin: 0.25rem 0 0 0;
}
.main-photo-area {
    position: relative;
    width: 60%;
    height: 480px;
    background: #f8f9fa;
    display: flex;
    align-items: center;
    justify-content: center;
    border-right: 1px solid #e9ecef;
}
.main-photo {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.stats-area {
    position: absolute;
    right: 0;
    top: 80px;
    width: 40%;
    height: calc(100% - 80px);
    padding: 1rem;
    background: white;
}
.stat-row {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid #f0f0f0;
    font-size: 0.9rem;
}
.stat-label {
    font-weight: 600;
    color: #495057;
}
.stat-value {
    color: #6c757d;
}
.photo-grid-back {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    padding: 1rem;
    height: calc(100% - 80px);
}
.back-photo-slot {
    background: #f8f9fa;
    border: 2px dashed #dee2e6;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
}
.back-photo {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.upload-section {
    background: white;
    border-radius: 15px;
    padding: 2rem;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    margin-bottom: 2rem;
}
.photo-upload-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-top: 1.5rem;
}
.photo-upload-slot {
    aspect-ratio: 3/4;
    border: 2px dashed #dee2e6;
    border-radius: 10px;
    background: #f8f9fa;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}
.photo-upload-slot:hover {
    border-color: #007bff;
    background: #f0f8ff;
}
.photo-upload-slot.has-image {
    border-color: #28a745;
    border-style: solid;
}
.slot-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    position: absolute;
    top: 0;
    left: 0;
}
.slot-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.7);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 2;
}
.photo-upload-slot:hover .slot-overlay {
    opacity: 1;
}
.slot-label {
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #495057;
    z-index: 3;
    position: relative;
}
.slot-icon {
    font-size: 2rem;
    color: #6c757d;
    margin-bottom: 0.5rem;
    z-index: 3;
    position: relative;
}
.slot-description {
    font-size: 0.8rem;
    color: #6c757d;
    text-align: center;
    z-index: 3;
    position: relative;
}
.card-controls {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 2rem;
}
.card-view-btn {
    padding: 0.75rem 2rem;
    border: 2px solid #007bff;
    background: white;
    color: #007bff;
    border-radius: 25px;
    font-weight: 600;
    transition: all 0.3s ease;
    cursor: pointer;
}
.card-view-btn.active {
    background: #007bff;
    color: white;
}
.card-view-btn:hover {
    background: #007bff;
    color: white;
}
.stats-form {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin-top: 1.5rem;
}
.form-group-inline {
    margin-bottom: 1rem;
}
.form-group-inline label {
    font-weight: 600;
    margin-bottom: 0.25rem;
    color: #495057;
    font-size: 0.9rem;
}
.form-group-inline input, .form-group-inline select {
    font-size: 0.9rem;
    padding: 0.5rem;
}
.download-section {
    background: linear-gradient(135deg, #28a745, #20c997);
    color: white;
    border-radius: 15px;
    padding: 2rem;
    text-align: center;
    margin-bottom: 2rem;
}
.download-btn {
    background: white;
    color: #28a745;
    border: none;
    padding: 1rem 2rem;
    border-radius: 25px;
    font-weight: 600;
    font-size: 1.1rem;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}
.download-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.3);
}
.quality-indicator {
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    z-index: 4;
}
.quality-good {
    background: #28a745;
    color: white;
}
.quality-fair {
    background: #ffc107;
    color: #212529;
}
.quality-poor {
    background: #dc3545;
    color: white;
}
.save-indicator {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
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
            "Create and manage your professional comp card",
            "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=1200&h=300&fit=crop"
        );
        ?>
        
        <!-- Save Indicator -->
        <div id="saveIndicator" class="save-indicator" style="display: none;">
            <div class="alert alert-success mb-0">
                <i class="fas fa-check me-2"></i>Comp card saved successfully
            </div>
        </div>
        
        <div class="row">
            <div class="col-lg-8">
                <!-- Comp Card Preview -->
                <div class="comp-card-preview">
                    <div class="card-controls">
                        <button class="card-view-btn active" onclick="showCardSide('front')">
                            <i class="fas fa-id-card me-2"></i>Front Side
                        </button>
                        <button class="card-view-btn" onclick="showCardSide('back')">
                            <i class="fas fa-images me-2"></i>Back Side
                        </button>
                    </div>
                    
                    <!-- Front Side -->
                    <div class="comp-card-front active" id="frontSide">
                        <div class="comp-card-header">
                            <h3 class="comp-card-name" id="cardName">Emma Johnson</h3>
                            <p class="comp-card-info" id="cardInfo">Fashion Model • New York, NY</p>
                        </div>
                        <div class="main-photo-area">
                            <img id="mainPhoto" src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=600&fit=crop&crop=face" 
                                 alt="Main Photo" class="main-photo">
                        </div>
                        <div class="stats-area">
                            <div class="stat-row">
                                <span class="stat-label">Height:</span>
                                <span class="stat-value" id="displayHeight">5'9"</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">Weight:</span>
                                <span class="stat-value" id="displayWeight">125 lbs</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">Bust:</span>
                                <span class="stat-value" id="displayBust">34"</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">Waist:</span>
                                <span class="stat-value" id="displayWaist">24"</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">Hips:</span>
                                <span class="stat-value" id="displayHips">36"</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">Dress:</span>
                                <span class="stat-value" id="displayDress">Size 4</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">Shoe:</span>
                                <span class="stat-value" id="displayShoe">8.5</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">Hair:</span>
                                <span class="stat-value" id="displayHair">Brown</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">Eyes:</span>
                                <span class="stat-value" id="displayEyes">Brown</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">Agency:</span>
                                <span class="stat-value">ModelHub</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Back Side -->
                    <div class="comp-card-back" id="backSide">
                        <div class="comp-card-header">
                            <h3 class="comp-card-name">Emma Johnson</h3>
                            <p class="comp-card-info">Professional Portfolio</p>
                        </div>
                        <div class="photo-grid-back">
                            <div class="back-photo-slot">
                                <img id="backPhoto1" src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=400&fit=crop" 
                                     alt="Portfolio Photo 1" class="back-photo">
                            </div>
                            <div class="back-photo-slot">
                                <img id="backPhoto2" src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=400&fit=crop" 
                                     alt="Portfolio Photo 2" class="back-photo">
                            </div>
                            <div class="back-photo-slot">
                                <img id="backPhoto3" src="https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=300&h=400&fit=crop" 
                                     alt="Portfolio Photo 3" class="back-photo">
                            </div>
                            <div class="back-photo-slot">
                                <img id="backPhoto4" src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=300&h=400&fit=crop" 
                                     alt="Portfolio Photo 4" class="back-photo">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Photo Upload Section -->
                <div class="upload-section">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h4 class="mb-0">Photo Management</h4>
                        <button class="btn btn-primary" onclick="autoFillPhotos()">
                            <i class="fas fa-magic me-2"></i>Auto-Fill Demo Photos
                        </button>
                    </div>
                    <p class="text-muted">Upload high-quality photos for your comp card. Each photo slot has specific requirements for optimal results.</p>
                    
                    <div class="photo-upload-grid">
                        <!-- Main Headshot -->
                        <div class="photo-upload-slot" onclick="triggerUpload('headshot')" data-slot="headshot">
                            <input type="file" id="headshot" accept="image/*" style="display: none;" onchange="handlePhotoUpload('headshot')">
                            <div class="slot-overlay">
                                <div class="text-center">
                                    <i class="fas fa-camera fa-2x mb-2"></i>
                                    <div>Change Photo</div>
                                </div>
                            </div>
                            <div class="quality-indicator quality-good">High Quality</div>
                            <img src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&h=400&fit=crop&crop=face" 
                                 alt="Headshot" class="slot-image">
                            <div class="slot-label">Main Headshot</div>
                            <div class="slot-description">Professional close-up photo showcasing face and expressions</div>
                        </div>
                        
                        <!-- Full Body Shot -->
                        <div class="photo-upload-slot" onclick="triggerUpload('fullbody')" data-slot="fullbody">
                            <input type="file" id="fullbody" accept="image/*" style="display: none;" onchange="handlePhotoUpload('fullbody')">
                            <div class="slot-overlay">
                                <div class="text-center">
                                    <i class="fas fa-camera fa-2x mb-2"></i>
                                    <div>Change Photo</div>
                                </div>
                            </div>
                            <div class="quality-indicator quality-good">High Quality</div>
                            <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=400&fit=crop" 
                                 alt="Full Body" class="slot-image">
                            <div class="slot-label">Full Body Shot</div>
                            <div class="slot-description">Head-to-toe photo showing complete figure and proportions</div>
                        </div>
                        
                        <!-- Half Body Shot -->
                        <div class="photo-upload-slot" onclick="triggerUpload('halfbody')" data-slot="halfbody">
                            <input type="file" id="halfbody" accept="image/*" style="display: none;" onchange="handlePhotoUpload('halfbody')">
                            <div class="slot-overlay">
                                <div class="text-center">
                                    <i class="fas fa-camera fa-2x mb-2"></i>
                                    <div>Change Photo</div>
                                </div>
                            </div>
                            <div class="quality-indicator quality-good">High Quality</div>
                            <img src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=400&fit=crop" 
                                 alt="Half Body" class="slot-image">
                            <div class="slot-label">Half Body Shot</div>
                            <div class="slot-description">Waist-up photo highlighting upper body and style</div>
                        </div>
                        
                        <!-- Profile Shot -->
                        <div class="photo-upload-slot" onclick="triggerUpload('profile')" data-slot="profile">
                            <input type="file" id="profile" accept="image/*" style="display: none;" onchange="handlePhotoUpload('profile')">
                            <div class="slot-overlay">
                                <div class="text-center">
                                    <i class="fas fa-camera fa-2x mb-2"></i>
                                    <div>Change Photo</div>
                                </div>
                            </div>
                            <div class="quality-indicator quality-good">High Quality</div>
                            <img src="https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=300&h=400&fit=crop" 
                                 alt="Profile Shot" class="slot-image">
                            <div class="slot-label">Profile/Side Shot</div>
                            <div class="slot-description">Side profile showcasing facial bone structure</div>
                        </div>
                        
                        <!-- Specialty Shot -->
                        <div class="photo-upload-slot" onclick="triggerUpload('specialty')" data-slot="specialty">
                            <input type="file" id="specialty" accept="image/*" style="display: none;" onchange="handlePhotoUpload('specialty')">
                            <div class="slot-overlay">
                                <div class="text-center">
                                    <i class="fas fa-camera fa-2x mb-2"></i>
                                    <div>Change Photo</div>
                                </div>
                            </div>
                            <div class="quality-indicator quality-good">High Quality</div>
                            <img src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=300&h=400&fit=crop" 
                                 alt="Specialty Shot" class="slot-image">
                            <div class="slot-label">Specialty Shot</div>
                            <div class="slot-description">Additional photo showcasing unique look or style</div>
                        </div>
                    </div>
                </div>

                <!-- Model Statistics -->
                <div class="upload-section">
                    <h4 class="mb-3">Model Statistics</h4>
                    <p class="text-muted">Keep your measurements current for accurate representation on your comp card.</p>
                    
                    <div class="stats-form">
                        <div class="form-group-inline">
                            <label for="height">Height</label>
                            <input type="text" class="form-control" id="height" value="5'9&quot;" onchange="updateStats()">
                        </div>
                        <div class="form-group-inline">
                            <label for="weight">Weight</label>
                            <input type="text" class="form-control" id="weight" value="125 lbs" onchange="updateStats()">
                        </div>
                        <div class="form-group-inline">
                            <label for="bust">Bust</label>
                            <input type="text" class="form-control" id="bust" value="34&quot;" onchange="updateStats()">
                        </div>
                        <div class="form-group-inline">
                            <label for="waist">Waist</label>
                            <input type="text" class="form-control" id="waist" value="24&quot;" onchange="updateStats()">
                        </div>
                        <div class="form-group-inline">
                            <label for="hips">Hips</label>
                            <input type="text" class="form-control" id="hips" value="36&quot;" onchange="updateStats()">
                        </div>
                        <div class="form-group-inline">
                            <label for="dress">Dress Size</label>
                            <input type="text" class="form-control" id="dress" value="4" onchange="updateStats()">
                        </div>
                        <div class="form-group-inline">
                            <label for="shoe">Shoe Size</label>
                            <input type="text" class="form-control" id="shoe" value="8.5" onchange="updateStats()">
                        </div>
                        <div class="form-group-inline">
                            <label for="hair">Hair Color</label>
                            <select class="form-select" id="hair" onchange="updateStats()">
                                <option>Black</option>
                                <option selected>Brown</option>
                                <option>Blonde</option>
                                <option>Red</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div class="form-group-inline">
                            <label for="eyes">Eye Color</label>
                            <select class="form-select" id="eyes" onchange="updateStats()">
                                <option selected>Brown</option>
                                <option>Blue</option>
                                <option>Green</option>
                                <option>Hazel</option>
                                <option>Other</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-lg-4">
                <!-- Download Section -->
                <div class="download-section">
                    <h4 class="mb-3">
                        <i class="fas fa-download me-2"></i>Download Comp Card
                    </h4>
                    <p class="mb-4">Generate a professional PDF comp card ready for printing and digital distribution.</p>
                    
                    <button class="download-btn" onclick="downloadPDF()">
                        <i class="fas fa-file-pdf me-2"></i>Download PDF
                    </button>
                    
                    <div class="mt-3 small" style="opacity: 0.9;">
                        <div><i class="fas fa-check me-2"></i>Print-ready quality (300 DPI)</div>
                        <div><i class="fas fa-check me-2"></i>Standard 5.5" x 8.5" format</div>
                        <div><i class="fas fa-check me-2"></i>Professional layout</div>
                    </div>
                </div>

                <!-- Comp Card Tips -->
                <?php echo createCard(
                    "Comp Card Tips",
                    '
                    <div class="mb-3">
                        <h6 class="text-primary"><i class="fas fa-lightbulb me-2"></i>Photo Guidelines</h6>
                        <ul class="small mb-0">
                            <li>Use high-resolution images (minimum 1200px)</li>
                            <li>Ensure good lighting and clear focus</li>
                            <li>Keep backgrounds simple and uncluttered</li>
                            <li>Avoid heavy makeup for natural shots</li>
                            <li>Show variety in poses and expressions</li>
                        </ul>
                    </div>
                    <div class="mb-3">
                        <h6 class="text-success"><i class="fas fa-star me-2"></i>Industry Standards</h6>
                        <ul class="small mb-0">
                            <li>Standard size: 5.5" x 8.5" when printed</li>
                            <li>Include current measurements</li>
                            <li>Use professional contact information</li>
                            <li>Update photos every 6-12 months</li>
                        </ul>
                    </div>
                    '
                ); ?>

                <!-- Quick Actions -->
                <?php echo createCard(
                    "Quick Actions",
                    '
                    <div class="d-grid gap-2">
                        <button class="btn btn-primary" onclick="saveCompCard()">
                            <i class="fas fa-save me-2"></i>Save Comp Card
                        </button>
                        <button class="btn btn-outline-primary" onclick="shareCompCard()">
                            <i class="fas fa-share me-2"></i>Share Digital Copy
                        </button>
                        <button class="btn btn-outline-secondary" onclick="resetToDefault()">
                            <i class="fas fa-undo me-2"></i>Reset to Default
                        </button>
                        <button class="btn btn-outline-info" onclick="viewFullscreen()">
                            <i class="fas fa-expand me-2"></i>Fullscreen Preview
                        </button>
                    </div>
                    '
                ); ?>

                <!-- Card Status -->
                <?php echo createCard(
                    "Card Status",
                    '
                    <div class="d-flex align-items-center mb-3">
                        <div class="bg-success rounded-circle me-3" style="width: 12px; height: 12px;"></div>
                        <div>
                            <h6 class="mb-0">Ready for Print</h6>
                            <small class="text-muted">All photos uploaded and high quality</small>
                        </div>
                    </div>
                    <div class="d-flex align-items-center mb-3">
                        <div class="bg-success rounded-circle me-3" style="width: 12px; height: 12px;"></div>
                        <div>
                            <h6 class="mb-0">Measurements Updated</h6>
                            <small class="text-muted">Last updated today</small>
                        </div>
                    </div>
                    <div class="progress mb-2">
                        <div class="progress-bar bg-success" style="width: 100%"></div>
                    </div>
                    <small class="text-muted">Comp card completion: 100%</small>
                    '
                ); ?>
            </div>
        </div>
    </div>
</div>

<script>
// Load jsPDF library for PDF generation
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
document.head.appendChild(script);

// Card management functions
function showCardSide(side) {
    // Update button states
    document.querySelectorAll('.card-view-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Show/hide card sides
    document.getElementById('frontSide').classList.remove('active');
    document.getElementById('backSide').classList.remove('active');
    
    if (side === 'front') {
        document.getElementById('frontSide').classList.add('active');
    } else {
        document.getElementById('backSide').classList.add('active');
    }
}

function triggerUpload(slotType) {
    document.getElementById(slotType).click();
}

function handlePhotoUpload(slotType) {
    const input = document.getElementById(slotType);
    const slot = document.querySelector(`[data-slot="${slotType}"]`);
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // Update the slot image
            const img = slot.querySelector('.slot-image');
            if (img) {
                img.src = e.target.result;
            } else {
                // Create new image if none exists
                const newImg = document.createElement('img');
                newImg.src = e.target.result;
                newImg.className = 'slot-image';
                newImg.alt = slotType;
                slot.appendChild(newImg);
            }
            
            // Update slot styling
            slot.classList.add('has-image');
            
            // Update quality indicator
            const quality = slot.querySelector('.quality-indicator');
            if (quality) {
                quality.textContent = 'High Quality';
                quality.className = 'quality-indicator quality-good';
            }
            
            // Update comp card preview
            updateCompCardPreview(slotType, e.target.result);
            
            // Save to storage
            savePhotoToStorage(slotType, e.target.result);
            
            showToast('Photo uploaded and saved successfully!', 'success');
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function updateCompCardPreview(slotType, imageSrc) {
    switch(slotType) {
        case 'headshot':
            document.getElementById('mainPhoto').src = imageSrc;
            break;
        case 'fullbody':
            document.getElementById('backPhoto1').src = imageSrc;
            break;
        case 'halfbody':
            document.getElementById('backPhoto2').src = imageSrc;
            break;
        case 'profile':
            document.getElementById('backPhoto3').src = imageSrc;
            break;
        case 'specialty':
            document.getElementById('backPhoto4').src = imageSrc;
            break;
    }
}

function updateStats() {
    // Update all display elements with current form values
    document.getElementById('displayHeight').textContent = document.getElementById('height').value;
    document.getElementById('displayWeight').textContent = document.getElementById('weight').value;
    document.getElementById('displayBust').textContent = document.getElementById('bust').value;
    document.getElementById('displayWaist').textContent = document.getElementById('waist').value;
    document.getElementById('displayHips').textContent = document.getElementById('hips').value;
    document.getElementById('displayDress').textContent = 'Size ' + document.getElementById('dress').value;
    document.getElementById('displayShoe').textContent = document.getElementById('shoe').value;
    document.getElementById('displayHair').textContent = document.getElementById('hair').value;
    document.getElementById('displayEyes').textContent = document.getElementById('eyes').value;
    
    showToast('Statistics updated!', 'info');
}

function autoFillPhotos() {
    const photos = [
        'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&h=400&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=400&fit=crop',
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=400&fit=crop',
        'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=300&h=400&fit=crop',
        'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=300&h=400&fit=crop'
    ];
    
    const slots = ['headshot', 'fullbody', 'halfbody', 'profile', 'specialty'];
    
    slots.forEach((slot, index) => {
        const slotElement = document.querySelector(`[data-slot="${slot}"]`);
        const img = slotElement.querySelector('.slot-image');
        if (img) {
            img.src = photos[index];
        }
        slotElement.classList.add('has-image');
        updateCompCardPreview(slot, photos[index]);
    });
    
    showToast('Demo photos loaded successfully!', 'success');
}

function downloadPDF() {
    // Check if jsPDF is loaded
    if (typeof window.jsPDF === 'undefined') {
        showToast('PDF library loading... Please try again in a moment.', 'warning');
        return;
    }
    
    showToast('Generating PDF... This may take a moment.', 'info');
    
    // Simulate PDF generation delay
    setTimeout(() => {
        try {
            const { jsPDF } = window.jsPDF;
            const doc = new jsPDF();
            
            // Add title
            doc.setFontSize(20);
            doc.text('COMP CARD', 105, 30, { align: 'center' });
            
            // Add model name
            doc.setFontSize(16);
            doc.text('Emma Johnson', 105, 45, { align: 'center' });
            
            // Add contact info
            doc.setFontSize(12);
            doc.text('Fashion Model • New York, NY', 105, 55, { align: 'center' });
            
            // Add measurements
            doc.setFontSize(10);
            let y = 80;
            const stats = [
                ['Height:', document.getElementById('height').value],
                ['Weight:', document.getElementById('weight').value],
                ['Bust:', document.getElementById('bust').value],
                ['Waist:', document.getElementById('waist').value],
                ['Hips:', document.getElementById('hips').value],
                ['Dress:', 'Size ' + document.getElementById('dress').value],
                ['Shoe:', document.getElementById('shoe').value],
                ['Hair:', document.getElementById('hair').value],
                ['Eyes:', document.getElementById('eyes').value]
            ];
            
            stats.forEach(([label, value]) => {
                doc.text(`${label} ${value}`, 20, y);
                y += 10;
            });
            
            // Add note about images
            doc.setFontSize(8);
            doc.text('Professional photos would be embedded in the actual PDF', 20, 220);
            doc.text('Generated by ModelHub Platform', 20, 230);
            
            // Save the PDF
            doc.save('Emma_Johnson_CompCard.pdf');
            showToast('PDF downloaded successfully!', 'success');
            
        } catch (error) {
            console.error('PDF generation error:', error);
            showToast('Error generating PDF. Please try again.', 'error');
        }
    }, 2000);
}

function saveCompCard() {
    showSaveIndicator();
    showToast('Comp card saved successfully!', 'success');
}

function shareCompCard() {
    const url = 'https://platform.com/comp-card/emma-johnson';
    navigator.clipboard.writeText(url).then(() => {
        showToast('Comp card link copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Share link: ' + url, 'info');
    });
}

function resetToDefault() {
    if (confirm('Are you sure you want to reset to default photos and measurements?')) {
        autoFillPhotos();
        // Reset form values
        document.getElementById('height').value = "5'9\"";
        document.getElementById('weight').value = "125 lbs";
        document.getElementById('bust').value = "34\"";
        document.getElementById('waist').value = "24\"";
        document.getElementById('hips').value = "36\"";
        document.getElementById('dress').value = "4";
        document.getElementById('shoe').value = "8.5";
        document.getElementById('hair').value = "Brown";
        document.getElementById('eyes').value = "Brown";
        updateStats();
        showToast('Comp card reset to default values!', 'success');
    }
}

function viewFullscreen() {
    const preview = document.querySelector('.comp-card-preview');
    if (preview.requestFullscreen) {
        preview.requestFullscreen();
    } else if (preview.webkitRequestFullscreen) {
        preview.webkitRequestFullscreen();
    } else if (preview.msRequestFullscreen) {
        preview.msRequestFullscreen();
    }
}

function showSaveIndicator() {
    const indicator = document.getElementById('saveIndicator');
    indicator.style.display = 'block';
    setTimeout(() => {
        indicator.style.display = 'none';
    }, 3000);
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

// Initialize stats on page load
document.addEventListener('DOMContentLoaded', function() {
    loadStoredData();
    updateStats();
    setupAutoSave();
});

// Load data from localStorage
function loadStoredData() {
    const compCardData = window.demoStorage.get('compCard');
    const profileData = window.demoStorage.get('profile');
    
    if (compCardData && compCardData.photos) {
        // Load stored photos
        Object.keys(compCardData.photos).forEach(slotType => {
            const img = document.querySelector(`[data-slot="${slotType}"] .slot-image`);
            if (img && compCardData.photos[slotType]) {
                img.src = compCardData.photos[slotType];
                updateCompCardPreview(slotType, compCardData.photos[slotType]);
            }
        });
    }
    
    if (profileData && profileData.measurements) {
        // Load stored measurements
        const measurements = profileData.measurements;
        document.getElementById('height').value = profileData.height || '';
        document.getElementById('weight').value = profileData.weight || '';
        document.getElementById('bust').value = measurements.bust || '';
        document.getElementById('waist').value = measurements.waist || '';
        document.getElementById('hips').value = measurements.hips || '';
        document.getElementById('dress').value = measurements.dress || '';
        document.getElementById('shoe').value = measurements.shoe || '';
        document.getElementById('hair').value = measurements.hair || 'Brown';
        document.getElementById('eyes').value = measurements.eyes || 'Brown';
    }
}

// Setup auto-save functionality
function setupAutoSave() {
    // Auto-save measurements when changed
    const measurementInputs = document.querySelectorAll('#height, #weight, #bust, #waist, #hips, #dress, #shoe, #hair, #eyes');
    
    measurementInputs.forEach(input => {
        input.addEventListener('change', () => {
            saveMeasurements();
        });
    });
}

// Save measurements to storage
function saveMeasurements() {
    const measurements = {
        bust: document.getElementById('bust').value,
        waist: document.getElementById('waist').value,
        hips: document.getElementById('hips').value,
        dress: document.getElementById('dress').value,
        shoe: document.getElementById('shoe').value,
        hair: document.getElementById('hair').value,
        eyes: document.getElementById('eyes').value
    };
    
    window.demoStorage.updateProfile({
        height: document.getElementById('height').value,
        weight: document.getElementById('weight').value,
        measurements: measurements
    });
    
    window.demoStorage.showToast('Measurements saved automatically', 'success', 2000);
}

// Save photo to storage
function savePhotoToStorage(slotType, imageSrc) {
    const compCardData = window.demoStorage.get('compCard') || {};
    if (!compCardData.photos) {
        compCardData.photos = {};
    }
    
    compCardData.photos[slotType] = imageSrc;
    window.demoStorage.updateCompCard(compCardData);
    
    window.demoStorage.showToast(`${slotType} photo saved`, 'success', 2000);
}
</script>

<!-- Include Demo Storage Utility -->
<script src="../../includes/demo-storage.js"></script>

<?php echo renderFooter(); ?>