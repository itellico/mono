<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Talent Search - Elite Model Management", "Agency Admin", "Account Manager", "Account");
?>

<div class="d-flex">
    <?php echo renderSidebar('Account', getAccountSidebarItems(), 'search/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Account', 'href' => '../index.php'],
            ['label' => 'Talent Search']
        ]);
        
        echo createHeroSection(
            "Advanced Talent Search",
            "Discover and connect with top talent across multiple marketplaces and platforms",
            "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=300&fit=crop",
            [
                ['label' => 'Save Search', 'icon' => 'fas fa-save', 'style' => 'primary'],
                ['label' => 'Advanced Filters', 'icon' => 'fas fa-filter', 'style' => 'info'],
                ['label' => 'Bulk Contact', 'icon' => 'fas fa-envelope', 'style' => 'success']
            ]
        );
        ?>
        
        <!-- Search Form -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Search Criteria</h5>
                    </div>
                    <div class="card-body">
                        <form id="searchForm">
                            <div class="row g-3">
                                <!-- Basic Search -->
                                <div class="col-md-6">
                                    <label class="form-label">Search Keywords</label>
                                    <input type="text" class="form-control" id="searchKeywords" placeholder="Name, skills, location...">
                                </div>
                                <div class="col-md-3">
                                    <label class="form-label">Category</label>
                                    <select class="form-select" id="searchCategory">
                                        <option>All Categories</option>
                                        <option>Fashion Model</option>
                                        <option>Commercial Model</option>
                                        <option>Editorial Model</option>
                                        <option>Runway Model</option>
                                        <option>Plus Size Model</option>
                                        <option>Fitness Model</option>
                                    </select>
                                </div>
                                <div class="col-md-3">
                                    <label class="form-label">Location</label>
                                    <select class="form-select" id="searchLocation">
                                        <option>All Locations</option>
                                        <option>New York, NY</option>
                                        <option>Los Angeles, CA</option>
                                        <option>Miami, FL</option>
                                        <option>Chicago, IL</option>
                                        <option>International</option>
                                    </select>
                                </div>
                                
                                <!-- Physical Attributes -->
                                <div class="col-md-2">
                                    <label class="form-label">Height Range</label>
                                    <select class="form-select" id="searchHeight">
                                        <option>Any Height</option>
                                        <option>5'2" - 5'6"</option>
                                        <option>5'7" - 5'9"</option>
                                        <option>5'10" - 6'0"</option>
                                        <option>6'0" +</option>
                                    </select>
                                </div>
                                <div class="col-md-2">
                                    <label class="form-label">Age Range</label>
                                    <select class="form-select" id="searchAge">
                                        <option>Any Age</option>
                                        <option>18-25</option>
                                        <option>26-35</option>
                                        <option>36-45</option>
                                        <option>45+</option>
                                    </select>
                                </div>
                                <div class="col-md-2">
                                    <label class="form-label">Experience</label>
                                    <select class="form-select" id="searchExperience">
                                        <option>Any Experience</option>
                                        <option>0-2 years</option>
                                        <option>3-5 years</option>
                                        <option>6-10 years</option>
                                        <option>10+ years</option>
                                    </select>
                                </div>
                                <div class="col-md-2">
                                    <label class="form-label">Availability</label>
                                    <select class="form-select" id="searchAvailability">
                                        <option>Any Availability</option>
                                        <option>Available Now</option>
                                        <option>Available Soon</option>
                                        <option>Booking Ahead</option>
                                    </select>
                                </div>
                                <div class="col-md-2">
                                    <label class="form-label">Rating</label>
                                    <select class="form-select" id="searchRating">
                                        <option>Any Rating</option>
                                        <option>4.5+ Stars</option>
                                        <option>4.0+ Stars</option>
                                        <option>3.5+ Stars</option>
                                        <option>New Models</option>
                                    </select>
                                </div>
                                <div class="col-md-2">
                                    <label class="form-label">Budget Range</label>
                                    <select class="form-select" id="searchBudget">
                                        <option>Any Budget</option>
                                        <option>$500 - $1,500</option>
                                        <option>$1,500 - $3,000</option>
                                        <option>$3,000 - $5,000</option>
                                        <option>$5,000+</option>
                                    </select>
                                </div>
                            </div>
                            <div class="row mt-3">
                                <div class="col-12">
                                    <button type="submit" class="btn btn-primary me-2">
                                        <i class="fas fa-search me-2"></i> Search Talent
                                    </button>
                                    <button type="button" class="btn btn-outline-secondary me-2">
                                        <i class="fas fa-undo me-2"></i> Reset Filters
                                    </button>
                                    <button type="button" class="btn btn-outline-info">
                                        <i class="fas fa-save me-2"></i> Save Search
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Search Results Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Search Results', '2,847', 'fas fa-users', 'primary');
            echo createStatCard('Available Now', '1,234', 'fas fa-check-circle', 'success');
            echo createStatCard('New This Week', '156', 'fas fa-user-plus', 'info');
            echo createStatCard('Favorited', '89', 'fas fa-heart', 'warning');
            ?>
        </div>
        
        <!-- Search Results -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <div>
                            <h5 class="mb-0">Search Results</h5>
                            <small class="text-muted">2,847 models found • Page 1 of 95</small>
                        </div>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary active">
                                <i class="fas fa-th"></i> Grid
                            </button>
                            <button class="btn btn-outline-primary">
                                <i class="fas fa-list"></i> List
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="row g-4" id="searchResults">
                            <!-- Search Result 1 -->
                            <div class="col-md-6 col-lg-3">
                                <div class="card h-100">
                                    <div class="position-relative">
                                        <img src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=250&h=300&fit=crop&crop=face" 
                                             class="card-img-top" style="height: 200px; object-fit: cover;" alt="Emma Johnson">
                                        <div class="position-absolute top-0 end-0 p-2">
                                            <button class="btn btn-light btn-sm rounded-circle">
                                                <i class="fas fa-heart text-muted"></i>
                                            </button>
                                        </div>
                                        <div class="position-absolute top-0 start-0 p-2">
                                            <span class="badge bg-success">Available</span>
                                        </div>
                                    </div>
                                    <div class="card-body p-3">
                                        <h6 class="card-title mb-1">Emma Johnson</h6>
                                        <small class="text-muted d-block mb-2">Fashion Model • NYC</small>
                                        <div class="row text-center small mb-2">
                                            <div class="col-4">
                                                <strong>5'9"</strong><br>
                                                <span class="text-muted">Height</span>
                                            </div>
                                            <div class="col-4">
                                                <strong>8 yrs</strong><br>
                                                <span class="text-muted">Exp</span>
                                            </div>
                                            <div class="col-4">
                                                <strong>4.9★</strong><br>
                                                <span class="text-muted">Rating</span>
                                            </div>
                                        </div>
                                        <div class="d-flex justify-content-between align-items-center mb-2">
                                            <small class="text-muted">Rate:</small>
                                            <strong class="text-success">$2,500/day</strong>
                                        </div>
                                        <div class="btn-group w-100">
                                            <button class="btn btn-outline-primary btn-sm">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            <button class="btn btn-outline-success btn-sm">
                                                <i class="fas fa-envelope"></i>
                                            </button>
                                            <button class="btn btn-outline-info btn-sm">
                                                <i class="fas fa-calendar"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Search Result 2 -->
                            <div class="col-md-6 col-lg-3">
                                <div class="card h-100">
                                    <div class="position-relative">
                                        <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=250&h=300&fit=crop&crop=face" 
                                             class="card-img-top" style="height: 200px; object-fit: cover;" alt="Sofia Martinez">
                                        <div class="position-absolute top-0 end-0 p-2">
                                            <button class="btn btn-light btn-sm rounded-circle">
                                                <i class="fas fa-heart text-danger"></i>
                                            </button>
                                        </div>
                                        <div class="position-absolute top-0 start-0 p-2">
                                            <span class="badge bg-warning text-dark">Busy</span>
                                        </div>
                                    </div>
                                    <div class="card-body p-3">
                                        <h6 class="card-title mb-1">Sofia Martinez</h6>
                                        <small class="text-muted d-block mb-2">Editorial Model • LA</small>
                                        <div class="row text-center small mb-2">
                                            <div class="col-4">
                                                <strong>5'8"</strong><br>
                                                <span class="text-muted">Height</span>
                                            </div>
                                            <div class="col-4">
                                                <strong>6 yrs</strong><br>
                                                <span class="text-muted">Exp</span>
                                            </div>
                                            <div class="col-4">
                                                <strong>4.8★</strong><br>
                                                <span class="text-muted">Rating</span>
                                            </div>
                                        </div>
                                        <div class="d-flex justify-content-between align-items-center mb-2">
                                            <small class="text-muted">Rate:</small>
                                            <strong class="text-success">$2,200/day</strong>
                                        </div>
                                        <div class="btn-group w-100">
                                            <button class="btn btn-outline-primary btn-sm">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            <button class="btn btn-outline-secondary btn-sm" disabled>
                                                <i class="fas fa-clock"></i>
                                            </button>
                                            <button class="btn btn-outline-info btn-sm">
                                                <i class="fas fa-calendar"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Search Result 3 -->
                            <div class="col-md-6 col-lg-3">
                                <div class="card h-100">
                                    <div class="position-relative">
                                        <img src="https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=250&h=300&fit=crop&crop=face" 
                                             class="card-img-top" style="height: 200px; object-fit: cover;" alt="Isabella Chen">
                                        <div class="position-absolute top-0 end-0 p-2">
                                            <button class="btn btn-light btn-sm rounded-circle">
                                                <i class="fas fa-heart text-muted"></i>
                                            </button>
                                        </div>
                                        <div class="position-absolute top-0 start-0 p-2">
                                            <span class="badge bg-success">Available</span>
                                        </div>
                                    </div>
                                    <div class="card-body p-3">
                                        <h6 class="card-title mb-1">Isabella Chen</h6>
                                        <small class="text-muted d-block mb-2">Runway Model • Miami</small>
                                        <div class="row text-center small mb-2">
                                            <div class="col-4">
                                                <strong>5'10"</strong><br>
                                                <span class="text-muted">Height</span>
                                            </div>
                                            <div class="col-4">
                                                <strong>4 yrs</strong><br>
                                                <span class="text-muted">Exp</span>
                                            </div>
                                            <div class="col-4">
                                                <strong>4.9★</strong><br>
                                                <span class="text-muted">Rating</span>
                                            </div>
                                        </div>
                                        <div class="d-flex justify-content-between align-items-center mb-2">
                                            <small class="text-muted">Rate:</small>
                                            <strong class="text-success">$1,800/day</strong>
                                        </div>
                                        <div class="btn-group w-100">
                                            <button class="btn btn-outline-primary btn-sm">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            <button class="btn btn-outline-success btn-sm">
                                                <i class="fas fa-envelope"></i>
                                            </button>
                                            <button class="btn btn-outline-info btn-sm">
                                                <i class="fas fa-calendar"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Search Result 4 -->
                            <div class="col-md-6 col-lg-3">
                                <div class="card h-100">
                                    <div class="position-relative">
                                        <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=250&h=300&fit=crop&crop=face" 
                                             class="card-img-top" style="height: 200px; object-fit: cover;" alt="Aria Thompson">
                                        <div class="position-absolute top-0 end-0 p-2">
                                            <button class="btn btn-light btn-sm rounded-circle">
                                                <i class="fas fa-heart text-muted"></i>
                                            </button>
                                        </div>
                                        <div class="position-absolute top-0 start-0 p-2">
                                            <span class="badge bg-info">Available Soon</span>
                                        </div>
                                    </div>
                                    <div class="card-body p-3">
                                        <h6 class="card-title mb-1">Aria Thompson</h6>
                                        <small class="text-muted d-block mb-2">Commercial Model • Chicago</small>
                                        <div class="row text-center small mb-2">
                                            <div class="col-4">
                                                <strong>5'7"</strong><br>
                                                <span class="text-muted">Height</span>
                                            </div>
                                            <div class="col-4">
                                                <strong>12 yrs</strong><br>
                                                <span class="text-muted">Exp</span>
                                            </div>
                                            <div class="col-4">
                                                <strong>4.7★</strong><br>
                                                <span class="text-muted">Rating</span>
                                            </div>
                                        </div>
                                        <div class="d-flex justify-content-between align-items-center mb-2">
                                            <small class="text-muted">Rate:</small>
                                            <strong class="text-success">$1,600/day</strong>
                                        </div>
                                        <div class="btn-group w-100">
                                            <button class="btn btn-outline-primary btn-sm">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            <button class="btn btn-outline-success btn-sm">
                                                <i class="fas fa-envelope"></i>
                                            </button>
                                            <button class="btn btn-outline-info btn-sm">
                                                <i class="fas fa-calendar"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Pagination -->
                        <div class="d-flex justify-content-center mt-4">
                            <nav>
                                <ul class="pagination">
                                    <li class="page-item disabled">
                                        <span class="page-link">Previous</span>
                                    </li>
                                    <li class="page-item active">
                                        <span class="page-link">1</span>
                                    </li>
                                    <li class="page-item">
                                        <a class="page-link" href="#">2</a>
                                    </li>
                                    <li class="page-item">
                                        <a class="page-link" href="#">3</a>
                                    </li>
                                    <li class="page-item">
                                        <span class="page-link">...</span>
                                    </li>
                                    <li class="page-item">
                                        <a class="page-link" href="#">95</a>
                                    </li>
                                    <li class="page-item">
                                        <a class="page-link" href="#">Next</a>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Bottom Section -->
        <div class="row">
            <div class="col-md-4">
                <?php echo createCard(
                    "Saved Searches",
                    '
                    <div class="list-group list-group-flush">
                        <div class="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                                <strong>Fashion Models NYC</strong><br>
                                <small class="text-muted">127 results</small>
                            </div>
                            <div>
                                <button class="btn btn-outline-primary btn-sm me-1">
                                    <i class="fas fa-search"></i>
                                </button>
                                <button class="btn btn-outline-danger btn-sm">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                                <strong>Editorial 5\'8"+ Models</strong><br>
                                <small class="text-muted">89 results</small>
                            </div>
                            <div>
                                <button class="btn btn-outline-primary btn-sm me-1">
                                    <i class="fas fa-search"></i>
                                </button>
                                <button class="btn btn-outline-danger btn-sm">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                                <strong>Commercial Models 25-35</strong><br>
                                <small class="text-muted">203 results</small>
                            </div>
                            <div>
                                <button class="btn btn-outline-primary btn-sm me-1">
                                    <i class="fas fa-search"></i>
                                </button>
                                <button class="btn btn-outline-danger btn-sm">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    '
                ); ?>
            </div>
            <div class="col-md-8">
                <?php echo createCard(
                    "Search Analytics",
                    '
                    <div class="row text-center">
                        <div class="col-md-3">
                            <h4 class="text-primary">2,847</h4>
                            <small class="text-muted">Total Results</small>
                        </div>
                        <div class="col-md-3">
                            <h4 class="text-success">1,234</h4>
                            <small class="text-muted">Available Now</small>
                        </div>
                        <div class="col-md-3">
                            <h4 class="text-info">156</h4>
                            <small class="text-muted">New This Week</small>
                        </div>
                        <div class="col-md-3">
                            <h4 class="text-warning">4.8★</h4>
                            <small class="text-muted">Avg Rating</small>
                        </div>
                    </div>
                    <hr>
                    <div class="mb-3">
                        <div class="d-flex justify-content-between">
                            <span class="small">Response Rate</span>
                            <span class="fw-bold">89%</span>
                        </div>
                        <div class="progress" style="height: 6px;">
                            <div class="progress-bar bg-success" style="width: 89%"></div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="d-flex justify-content-between">
                            <span class="small">Booking Success</span>
                            <span class="fw-bold">76%</span>
                        </div>
                        <div class="progress" style="height: 6px;">
                            <div class="progress-bar bg-primary" style="width: 76%"></div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="d-flex justify-content-between">
                            <span class="small">Average Rate Range</span>
                            <span class="fw-bold">$1,500 - $2,500</span>
                        </div>
                        <div class="progress" style="height: 6px;">
                            <div class="progress-bar bg-info" style="width: 65%"></div>
                        </div>
                    </div>
                    '
                ); ?>
            </div>
        </div>
    </div>
</div>

<!-- Save Search Modal -->
<div class="modal fade" id="saveSearchModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Save Search</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form id="saveSearchForm">
                <div class="modal-body">
                    <div class="mb-3">
                        <label class="form-label">Search Name *</label>
                        <input type="text" class="form-control" name="search_name" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Description</label>
                        <textarea class="form-control" name="description" rows="2"></textarea>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" name="email_alerts" id="emailAlerts">
                        <label class="form-check-label" for="emailAlerts">
                            Email me when new matches are found
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Search</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Bulk Contact Modal -->
<div class="modal fade" id="bulkContactModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Bulk Contact Models</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form id="bulkContactForm">
                <div class="modal-body">
                    <div class="alert alert-info">
                        <strong>Selected Models:</strong> <span id="selectedModelsCount">0</span> models
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Message Subject *</label>
                        <input type="text" class="form-control" name="subject" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Message *</label>
                        <textarea class="form-control" name="message" rows="5" required></textarea>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Project/Campaign</label>
                        <select class="form-select" name="project">
                            <option value="">Select Project (Optional)</option>
                            <option value="vogue-editorial">Vogue Paris Editorial</option>
                            <option value="nike-campaign">Nike Global Campaign</option>
                            <option value="calvin-klein">Calvin Klein Campaign</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-success">Send Messages</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    initializeTalentSearch();
});

// Sample talent database for search functionality
const talentDatabase = [
    {
        id: 1,
        name: 'Emma Johnson',
        category: 'Fashion Model',
        location: 'New York, NY',
        height: "5'9\"",
        age: 24,
        experience: 8,
        rating: 4.9,
        availability: 'Available',
        rate: 2500,
        image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=250&h=300&fit=crop&crop=face',
        skills: ['Runway', 'Editorial', 'Commercial']
    },
    {
        id: 2,
        name: 'Sofia Martinez',
        category: 'Editorial Model',
        location: 'Los Angeles, CA',
        height: "5'8\"",
        age: 26,
        experience: 6,
        rating: 4.8,
        availability: 'Busy',
        rate: 2200,
        image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=250&h=300&fit=crop&crop=face',
        skills: ['Editorial', 'High Fashion', 'Artistic']
    },
    {
        id: 3,
        name: 'Isabella Chen',
        category: 'Runway Model',
        location: 'Miami, FL',
        height: "5'10\"",
        age: 22,
        experience: 4,
        rating: 4.9,
        availability: 'Available',
        rate: 1800,
        image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=250&h=300&fit=crop&crop=face',
        skills: ['Runway', 'High Fashion', 'Editorial']
    },
    {
        id: 4,
        name: 'Aria Thompson',
        category: 'Commercial Model',
        location: 'Chicago, IL',
        height: "5'7\"",
        age: 28,
        experience: 12,
        rating: 4.7,
        availability: 'Available Soon',
        rate: 1600,
        image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=250&h=300&fit=crop&crop=face',
        skills: ['Commercial', 'Lifestyle', 'Product']
    },
    {
        id: 5,
        name: 'Marcus Williams',
        category: 'Fitness Model',
        location: 'New York, NY',
        height: "6'2\"",
        age: 30,
        experience: 7,
        rating: 4.8,
        availability: 'Available',
        rate: 1400,
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&h=300&fit=crop&crop=face',
        skills: ['Fitness', 'Athletic', 'Commercial']
    },
    {
        id: 6,
        name: 'Luna Rodriguez',
        category: 'Plus Size Model',
        location: 'Los Angeles, CA',
        height: "5'6\"",
        age: 25,
        experience: 5,
        rating: 4.9,
        availability: 'Available',
        rate: 1900,
        image: 'https://images.unsplash.com/photo-1494790108755-2616c80ce413?w=250&h=300&fit=crop&crop=face',
        skills: ['Plus Size', 'Commercial', 'Lifestyle']
    }
];

let currentResults = talentDatabase;
let selectedModels = new Set();

function initializeTalentSearch() {
    setupSearchForm();
    setupViewToggle();
    setupSearchResults();
    setupQuickActions();
    setupSavedSearches();
    displaySearchResults(talentDatabase);
}

function setupSearchForm() {
    const searchForm = document.getElementById('searchForm');
    const searchInputs = [
        document.getElementById('searchKeywords'),
        document.getElementById('searchCategory'),
        document.getElementById('searchLocation'),
        document.getElementById('searchHeight'),
        document.getElementById('searchAge'),
        document.getElementById('searchExperience'),
        document.getElementById('searchAvailability'),
        document.getElementById('searchRating'),
        document.getElementById('searchBudget')
    ];

    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        performSearch();
    });

    // Real-time search on input changes
    searchInputs.forEach(input => {
        if (input) {
            input.addEventListener('input', debounce(performSearch, 300));
            input.addEventListener('change', performSearch);
        }
    });

    // Reset filters button
    document.querySelector('.btn-outline-secondary').addEventListener('click', function() {
        searchForm.reset();
        performSearch();
    });
}

function setupViewToggle() {
    const viewButtons = document.querySelectorAll('.btn-group .btn');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            viewButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const view = this.innerHTML.includes('Grid') ? 'grid' : 'list';
            toggleSearchView(view);
        });
    });
}

function setupSearchResults() {
    document.addEventListener('click', function(e) {
        // Favorite button
        if (e.target.closest('.btn-light.rounded-circle')) {
            toggleFavorite(e.target.closest('.btn-light.rounded-circle'));
        }
        
        // Model selection checkbox
        if (e.target.type === 'checkbox' && e.target.name === 'model_select') {
            toggleModelSelection(e.target);
        }
        
        // Action buttons
        if (e.target.closest('.btn-outline-primary')) {
            const card = e.target.closest('.card');
            viewModelProfile(card);
        }
        
        if (e.target.closest('.btn-outline-success')) {
            const card = e.target.closest('.card');
            contactModel(card);
        }
        
        if (e.target.closest('.btn-outline-info')) {
            const card = e.target.closest('.card');
            bookModel(card);
        }
    });
}

function setupQuickActions() {
    // Save Search action
    document.querySelector('[data-bs-target="#saveSearchModal"], .btn-outline-info').addEventListener('click', function() {
        if (this.innerHTML.includes('Save Search')) {
            showModal('saveSearchModal');
        }
    });

    // Bulk Contact action
    document.querySelector('.btn-success').addEventListener('click', function() {
        if (selectedModels.size > 0) {
            document.getElementById('selectedModelsCount').textContent = selectedModels.size;
            showModal('bulkContactModal');
        } else {
            showToast('Please select models to contact', 'warning');
        }
    });

    // Save search form
    document.getElementById('saveSearchForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveCurrentSearch();
    });

    // Bulk contact form
    document.getElementById('bulkContactForm').addEventListener('submit', function(e) {
        e.preventDefault();
        sendBulkMessages();
    });
}

function setupSavedSearches() {
    // Load saved search
    document.querySelectorAll('.btn-outline-primary').forEach(btn => {
        if (btn.innerHTML.includes('fa-search')) {
            btn.addEventListener('click', function() {
                const searchItem = this.closest('.list-group-item');
                const searchName = searchItem.querySelector('strong').textContent;
                loadSavedSearch(searchName);
            });
        }
    });

    // Delete saved search
    document.querySelectorAll('.btn-outline-danger').forEach(btn => {
        if (btn.innerHTML.includes('fa-trash')) {
            btn.addEventListener('click', function() {
                const searchItem = this.closest('.list-group-item');
                const searchName = searchItem.querySelector('strong').textContent;
                deleteSavedSearch(searchName);
            });
        }
    });
}

function performSearch() {
    const keywords = document.getElementById('searchKeywords').value.toLowerCase();
    const category = document.getElementById('searchCategory').value;
    const location = document.getElementById('searchLocation').value;
    const height = document.getElementById('searchHeight').value;
    const age = document.getElementById('searchAge').value;
    const experience = document.getElementById('searchExperience').value;
    const availability = document.getElementById('searchAvailability').value;
    const rating = document.getElementById('searchRating').value;
    const budget = document.getElementById('searchBudget').value;

    let filtered = talentDatabase.filter(model => {
        // Keywords search
        if (keywords && !model.name.toLowerCase().includes(keywords) && 
            !model.skills.some(skill => skill.toLowerCase().includes(keywords)) &&
            !model.location.toLowerCase().includes(keywords)) {
            return false;
        }

        // Category filter
        if (category && category !== 'All Categories' && !model.category.includes(category.replace(' Model', ''))) {
            return false;
        }

        // Location filter
        if (location && location !== 'All Locations' && !model.location.includes(location.split(',')[0])) {
            return false;
        }

        // Height filter
        if (height && height !== 'Any Height') {
            const modelHeight = parseInt(model.height.replace(/['"]/g, ''));
            const [minHeight, maxHeight] = height.split(' - ').map(h => parseInt(h.replace(/['"]/g, '')));
            if (maxHeight && (modelHeight < minHeight || modelHeight > maxHeight)) {
                return false;
            }
            if (!maxHeight && height.includes('+') && modelHeight < minHeight) {
                return false;
            }
        }

        // Age filter
        if (age && age !== 'Any Age') {
            const [minAge, maxAge] = age.split('-').map(a => parseInt(a.replace('+', '')));
            if (maxAge && (model.age < minAge || model.age > maxAge)) {
                return false;
            }
            if (!maxAge && age.includes('+') && model.age < minAge) {
                return false;
            }
        }

        // Experience filter
        if (experience && experience !== 'Any Experience') {
            const expValue = parseInt(experience);
            if (experience.includes('-')) {
                const [minExp, maxExp] = experience.split('-').map(e => parseInt(e));
                if (model.experience < minExp || model.experience > maxExp) {
                    return false;
                }
            } else if (experience.includes('+') && model.experience < expValue) {
                return false;
            }
        }

        // Availability filter
        if (availability && availability !== 'Any Availability') {
            if (availability === 'Available Now' && model.availability !== 'Available') {
                return false;
            }
            if (availability === 'Available Soon' && !['Available', 'Available Soon'].includes(model.availability)) {
                return false;
            }
        }

        // Rating filter
        if (rating && rating !== 'Any Rating') {
            const minRating = parseFloat(rating);
            if (model.rating < minRating) {
                return false;
            }
        }

        // Budget filter
        if (budget && budget !== 'Any Budget') {
            const [minBudget, maxBudget] = budget.replace(/[$,]/g, '').split(' - ').map(b => parseInt(b));
            if (maxBudget && (model.rate < minBudget || model.rate > maxBudget)) {
                return false;
            }
            if (!maxBudget && budget.includes('+') && model.rate < minBudget) {
                return false;
            }
        }

        return true;
    });

    currentResults = filtered;
    displaySearchResults(filtered);
    updateSearchStats(filtered);
}

function displaySearchResults(results) {
    const container = document.getElementById('searchResults');
    
    if (results.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-search fa-3x text-muted mb-3"></i>
                <h5>No models found</h5>
                <p class="text-muted">Try adjusting your search criteria</p>
            </div>
        `;
        return;
    }

    container.innerHTML = results.map(model => `
        <div class="col-md-6 col-lg-3">
            <div class="card h-100 model-search-card" data-model-id="${model.id}">
                <div class="position-relative">
                    <img src="${model.image}" 
                         class="card-img-top" style="height: 200px; object-fit: cover;" alt="${model.name}">
                    <div class="position-absolute top-0 end-0 p-2">
                        <button class="btn btn-light btn-sm rounded-circle">
                            <i class="fas fa-heart text-muted"></i>
                        </button>
                    </div>
                    <div class="position-absolute top-0 start-0 p-2">
                        <span class="badge bg-${getAvailabilityColor(model.availability)}">${model.availability}</span>
                    </div>
                    <div class="position-absolute bottom-0 start-0 p-2">
                        <input type="checkbox" name="model_select" value="${model.id}" class="form-check-input">
                    </div>
                </div>
                <div class="card-body p-3">
                    <h6 class="card-title mb-1">${model.name}</h6>
                    <small class="text-muted d-block mb-2">${model.category} • ${model.location.split(',')[0]}</small>
                    <div class="row text-center small mb-2">
                        <div class="col-4">
                            <strong>${model.height}</strong><br>
                            <span class="text-muted">Height</span>
                        </div>
                        <div class="col-4">
                            <strong>${model.experience} yrs</strong><br>
                            <span class="text-muted">Exp</span>
                        </div>
                        <div class="col-4">
                            <strong>${model.rating}★</strong><br>
                            <span class="text-muted">Rating</span>
                        </div>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <small class="text-muted">Rate:</small>
                        <strong class="text-success">$${model.rate.toLocaleString()}/day</strong>
                    </div>
                    <div class="btn-group w-100">
                        <button class="btn btn-outline-primary btn-sm" title="View Profile">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-success btn-sm" title="Contact" ${model.availability === 'Busy' ? 'disabled' : ''}>
                            <i class="fas fa-envelope"></i>
                        </button>
                        <button class="btn btn-outline-info btn-sm" title="Book">
                            <i class="fas fa-calendar"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function updateSearchStats(results) {
    const statsCards = document.querySelectorAll('.stat-card');
    if (statsCards.length >= 4) {
        statsCards[0].querySelector('h3').textContent = results.length.toLocaleString();
        statsCards[1].querySelector('h3').textContent = results.filter(m => m.availability === 'Available').length.toLocaleString();
        
        // Simulate new this week
        const newThisWeek = Math.floor(results.length * 0.15);
        statsCards[2].querySelector('h3').textContent = newThisWeek;
        
        // Simulate favorited
        const favorited = Math.floor(results.length * 0.05);
        statsCards[3].querySelector('h3').textContent = favorited;
    }

    // Update results header
    const resultsHeader = document.querySelector('.card-header small');
    if (resultsHeader) {
        const totalPages = Math.ceil(results.length / 30);
        resultsHeader.textContent = `${results.length.toLocaleString()} models found • Page 1 of ${totalPages}`;
    }
}

function getAvailabilityColor(availability) {
    switch (availability) {
        case 'Available': return 'success';
        case 'Busy': return 'warning';
        case 'Available Soon': return 'info';
        default: return 'secondary';
    }
}

function toggleSearchView(view) {
    const container = document.getElementById('searchResults');
    const cards = container.querySelectorAll('.col-md-6, .col-lg-3');
    
    if (view === 'list') {
        cards.forEach(card => {
            card.className = 'col-12 mb-3';
        });
    } else {
        cards.forEach(card => {
            card.className = 'col-md-6 col-lg-3';
        });
    }
}

function toggleFavorite(button) {
    const icon = button.querySelector('i');
    if (icon.classList.contains('text-muted')) {
        icon.className = 'fas fa-heart text-danger';
        showToast('Added to favorites', 'success');
    } else {
        icon.className = 'fas fa-heart text-muted';
        showToast('Removed from favorites', 'info');
    }
}

function toggleModelSelection(checkbox) {
    const modelId = parseInt(checkbox.value);
    if (checkbox.checked) {
        selectedModels.add(modelId);
    } else {
        selectedModels.delete(modelId);
    }
    
    // Update bulk action button state
    const bulkButton = document.querySelector('.btn-success');
    if (selectedModels.size > 0) {
        bulkButton.innerHTML = `<i class="fas fa-envelope me-2"></i> Bulk Contact (${selectedModels.size})`;
        bulkButton.disabled = false;
    } else {
        bulkButton.innerHTML = '<i class="fas fa-envelope me-2"></i> Bulk Contact';
        bulkButton.disabled = true;
    }
}

function viewModelProfile(card) {
    const modelId = parseInt(card.dataset.modelId);
    const model = talentDatabase.find(m => m.id === modelId);
    if (model) {
        showToast(`Opening ${model.name}'s profile...`, 'info');
        // In a real app, this would navigate to the model's profile page
    }
}

function contactModel(card) {
    const modelId = parseInt(card.dataset.modelId);
    const model = talentDatabase.find(m => m.id === modelId);
    if (model) {
        showToast(`Opening message composer for ${model.name}...`, 'info');
        // In a real app, this would open a message composer
    }
}

function bookModel(card) {
    const modelId = parseInt(card.dataset.modelId);
    const model = talentDatabase.find(m => m.id === modelId);
    if (model) {
        showToast(`Opening booking form for ${model.name}...`, 'info');
        // In a real app, this would open a booking form
    }
}

function saveCurrentSearch() {
    const formData = new FormData(document.getElementById('saveSearchForm'));
    const searchData = Object.fromEntries(formData);
    
    console.log('Saving search:', searchData);
    showToast('Search saved successfully!', 'success');
    hideModal('saveSearchModal');
    document.getElementById('saveSearchForm').reset();
}

function sendBulkMessages() {
    const formData = new FormData(document.getElementById('bulkContactForm'));
    const messageData = Object.fromEntries(formData);
    
    console.log('Sending bulk messages to:', Array.from(selectedModels), messageData);
    showToast(`Messages sent to ${selectedModels.size} models!`, 'success');
    hideModal('bulkContactModal');
    document.getElementById('bulkContactForm').reset();
    
    // Clear selections
    selectedModels.clear();
    document.querySelectorAll('input[name="model_select"]').forEach(cb => cb.checked = false);
    toggleModelSelection({ checked: false, value: '0' }); // Reset button
}

function loadSavedSearch(searchName) {
    // Simulate loading a saved search
    showToast(`Loading saved search: ${searchName}`, 'info');
    
    // Example: Load specific search criteria
    if (searchName === 'Fashion Models NYC') {
        document.getElementById('searchCategory').value = 'Fashion Model';
        document.getElementById('searchLocation').value = 'New York, NY';
        performSearch();
    }
}

function deleteSavedSearch(searchName) {
    if (confirm(`Delete saved search "${searchName}"?`)) {
        showToast(`Deleted saved search: ${searchName}`, 'info');
        // In a real app, this would remove the search from the database and update the UI
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showModal(modalId) {
    const modal = new bootstrap.Modal(document.getElementById(modalId));
    modal.show();
}

function hideModal(modalId) {
    const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
    if (modal) modal.hide();
}

function showToast(message, type = 'info') {
    const toastHtml = `
        <div class="toast align-items-center text-white bg-${type} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    const toastElement = toastContainer.lastElementChild;
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}
</script>

<style>
.model-search-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    transition: all 0.3s ease;
}

.model-search-card .form-check-input {
    transform: scale(1.2);
}

.toast-container {
    z-index: 1055;
}

.stat-card:hover {
    transform: translateY(-2px);
    transition: transform 0.2s ease;
}

#searchResults.list-view .card {
    margin-bottom: 15px;
}

#searchResults.list-view .card-body {
    display: flex;
    align-items: center;
    gap: 20px;
}

#searchResults.list-view .card img {
    width: 80px;
    height: 80px;
    object-fit: cover;
}
</style>

<?php echo renderFooter(); ?>