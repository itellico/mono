<?php include '../../includes/header.php'; ?>

<div class="min-h-screen bg-gray-50">
    <?php include '../../includes/sidebar.php'; ?>
    
    <div class="lg:ml-64">
        <header class="bg-white shadow">
            <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-900">Modeling Industry Gig Templates</h1>
                        <p class="text-gray-600 mt-1">Configure industry-specific gig templates for go-models.com</p>
                    </div>
                    <button class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                        Create Custom Template
                    </button>
                </div>
            </div>
        </header>

        <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <!-- Template Categories -->
            <div class="mb-8">
                <div class="border-b border-gray-200">
                    <nav class="-mb-px flex space-x-8">
                        <button class="border-blue-500 text-blue-600 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm">
                            Active Templates
                        </button>
                        <button class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm">
                            Industry Standards
                        </button>
                        <button class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm">
                            Custom Templates
                        </button>
                    </nav>
                </div>
            </div>

            <!-- Active Templates -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <!-- Fashion Shoot Template -->
                <div class="bg-white rounded-lg shadow">
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center">
                                <div class="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4z"/>
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <h3 class="text-lg font-semibold">Fashion Shoot</h3>
                                    <p class="text-sm text-gray-500">High-fashion photography template</p>
                                </div>
                            </div>
                            <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Active</span>
                        </div>

                        <div class="mb-4">
                            <h4 class="font-medium mb-2">Required Fields:</h4>
                            <div class="grid grid-cols-2 gap-2 text-sm">
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                    Height/Weight Requirements
                                </div>
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                    Portfolio Examples
                                </div>
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                    Experience Level
                                </div>
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                    Wardrobe Requirements
                                </div>
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                    Makeup/Hair Skills
                                </div>
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                    Travel Availability
                                </div>
                            </div>
                        </div>

                        <div class="mb-4">
                            <h4 class="font-medium mb-2">Industry-Specific Requirements:</h4>
                            <div class="bg-gray-50 p-3 rounded text-sm">
                                <div class="space-y-1">
                                    <div><strong>Measurements:</strong> Bust, Waist, Hips, Dress size</div>
                                    <div><strong>Comp Card:</strong> Required with recent photos</div>
                                    <div><strong>Agency Representation:</strong> Optional field</div>
                                    <div><strong>Runway Experience:</strong> Yes/No with details</div>
                                </div>
                            </div>
                        </div>

                        <div class="mb-4">
                            <div class="flex justify-between items-center text-sm">
                                <span class="text-gray-600">Usage:</span>
                                <span class="font-medium">Used in 18 active gigs</span>
                            </div>
                            <div class="flex justify-between items-center text-sm">
                                <span class="text-gray-600">Success Rate:</span>
                                <span class="font-medium text-green-600">92% completion</span>
                            </div>
                        </div>

                        <div class="flex space-x-2">
                            <button class="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                                Edit Template
                            </button>
                            <button class="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300">
                                View Gigs
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Runway Show Template -->
                <div class="bg-white rounded-lg shadow">
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center">
                                <div class="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                    <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <h3 class="text-lg font-semibold">Runway Show</h3>
                                    <p class="text-sm text-gray-500">Fashion week and runway template</p>
                                </div>
                            </div>
                            <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Active</span>
                        </div>

                        <div class="mb-4">
                            <h4 class="font-medium mb-2">Required Fields:</h4>
                            <div class="grid grid-cols-2 gap-2 text-sm">
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                                    Runway Experience
                                </div>
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                                    Walking Videos
                                </div>
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                                    Shoe Size
                                </div>
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                                    Designer Preferences
                                </div>
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                                    Fashion Week Availability
                                </div>
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                                    International Travel
                                </div>
                            </div>
                        </div>

                        <div class="mb-4">
                            <h4 class="font-medium mb-2">Industry-Specific Requirements:</h4>
                            <div class="bg-gray-50 p-3 rounded text-sm">
                                <div class="space-y-1">
                                    <div><strong>Walking Video:</strong> Mandatory 30-60 second clip</div>
                                    <div><strong>Body Type:</strong> Specific to designer requirements</div>
                                    <div><strong>Rehearsal Availability:</strong> Multi-day commitment</div>
                                    <div><strong>Previous Shows:</strong> Portfolio of runway work</div>
                                </div>
                            </div>
                        </div>

                        <div class="mb-4">
                            <div class="flex justify-between items-center text-sm">
                                <span class="text-gray-600">Usage:</span>
                                <span class="font-medium">Used in 7 active gigs</span>
                            </div>
                            <div class="flex justify-between items-center text-sm">
                                <span class="text-gray-600">Success Rate:</span>
                                <span class="font-medium text-green-600">87% completion</span>
                            </div>
                        </div>

                        <div class="flex space-x-2">
                            <button class="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                                Edit Template
                            </button>
                            <button class="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300">
                                View Gigs
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Commercial Template -->
                <div class="bg-white rounded-lg shadow">
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center">
                                <div class="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                                    <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/>
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <h3 class="text-lg font-semibold">Commercial Shoot</h3>
                                    <p class="text-sm text-gray-500">Brand advertising and commercial template</p>
                                </div>
                            </div>
                            <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Active</span>
                        </div>

                        <div class="mb-4">
                            <h4 class="font-medium mb-2">Required Fields:</h4>
                            <div class="grid grid-cols-2 gap-2 text-sm">
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    Acting Experience
                                </div>
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    Brand Alignment
                                </div>
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    Product Usage Rights
                                </div>
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    Social Media Following
                                </div>
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    Lifestyle Match
                                </div>
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    Usage Duration
                                </div>
                            </div>
                        </div>

                        <div class="mb-4">
                            <h4 class="font-medium mb-2">Industry-Specific Requirements:</h4>
                            <div class="bg-gray-50 p-3 rounded text-sm">
                                <div class="space-y-1">
                                    <div><strong>Brand History:</strong> Previous commercial work</div>
                                    <div><strong>Usage Rights:</strong> Detailed licensing terms</div>
                                    <div><strong>Social Media:</strong> Follower count and engagement</div>
                                    <div><strong>Exclusivity:</strong> Non-compete agreements</div>
                                </div>
                            </div>
                        </div>

                        <div class="mb-4">
                            <div class="flex justify-between items-center text-sm">
                                <span class="text-gray-600">Usage:</span>
                                <span class="font-medium">Used in 12 active gigs</span>
                            </div>
                            <div class="flex justify-between items-center text-sm">
                                <span class="text-gray-600">Success Rate:</span>
                                <span class="font-medium text-green-600">96% completion</span>
                            </div>
                        </div>

                        <div class="flex space-x-2">
                            <button class="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                                Edit Template
                            </button>
                            <button class="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300">
                                View Gigs
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Cross-Industry Template -->
                <div class="bg-white rounded-lg shadow border-2 border-blue-200">
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center">
                                <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"/>
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <h3 class="text-lg font-semibold">Cross-Industry Project</h3>
                                    <p class="text-sm text-gray-500">Multi-brand collaboration template</p>
                                </div>
                            </div>
                            <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Cross-Brand</span>
                        </div>

                        <div class="mb-4">
                            <h4 class="font-medium mb-2">Combined Requirements:</h4>
                            <div class="grid grid-cols-2 gap-2 text-sm">
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                    Model + Voice Actor
                                </div>
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                    Multi-skill Portfolio
                                </div>
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                    Cross-Brand Profile
                                </div>
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                    Platform Integration
                                </div>
                            </div>
                        </div>

                        <div class="mb-4">
                            <h4 class="font-medium mb-2">Cross-Brand Integration:</h4>
                            <div class="bg-blue-50 p-3 rounded text-sm">
                                <div class="space-y-1">
                                    <div><strong>Shared Profile:</strong> Synced across go-models & voice-agents</div>
                                    <div><strong>Combined Skills:</strong> Modeling + voice work capabilities</div>
                                    <div><strong>Cross-Platform:</strong> Available on multiple brands</div>
                                    <div><strong>Unified Booking:</strong> Single point coordination</div>
                                </div>
                            </div>
                        </div>

                        <div class="mb-4">
                            <div class="flex justify-between items-center text-sm">
                                <span class="text-gray-600">Usage:</span>
                                <span class="font-medium">Used in 3 active gigs</span>
                            </div>
                            <div class="flex justify-between items-center text-sm">
                                <span class="text-gray-600">Success Rate:</span>
                                <span class="font-medium text-blue-600">100% completion</span>
                            </div>
                        </div>

                        <div class="flex space-x-2">
                            <button class="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                                Edit Template
                            </button>
                            <button class="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300">
                                View Gigs
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Template Configuration -->
            <div class="bg-white rounded-lg shadow">
                <div class="p-6">
                    <h2 class="text-lg font-medium text-gray-900 mb-4">Template Configuration</h2>
                    <p class="text-gray-600 mb-6">Customize how gig templates work within the modeling industry context.</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 class="font-medium mb-4">Default Fields for All Templates</h3>
                            <div class="space-y-3">
                                <label class="flex items-center">
                                    <input type="checkbox" checked class="mr-3">
                                    <span class="text-sm">Professional headshot required</span>
                                </label>
                                <label class="flex items-center">
                                    <input type="checkbox" checked class="mr-3">
                                    <span class="text-sm">Full body shot required</span>
                                </label>
                                <label class="flex items-center">
                                    <input type="checkbox" checked class="mr-3">
                                    <span class="text-sm">Height and measurements</span>
                                </label>
                                <label class="flex items-center">
                                    <input type="checkbox" class="mr-3">
                                    <span class="text-sm">Agency representation details</span>
                                </label>
                                <label class="flex items-center">
                                    <input type="checkbox" checked class="mr-3">
                                    <span class="text-sm">Experience level breakdown</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <h3 class="font-medium mb-4">Industry-Specific Settings</h3>
                            <div class="space-y-3">
                                <div>
                                    <label class="block text-sm font-medium mb-1">Measurement Units</label>
                                    <select class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                        <option>Imperial (feet/inches, lbs)</option>
                                        <option>Metric (cm, kg)</option>
                                        <option>Both options</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium mb-1">Default Rate Structure</label>
                                    <select class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                        <option>Hourly rates</option>
                                        <option>Day rates</option>
                                        <option>Project rates</option>
                                        <option>Usage-based rates</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium mb-1">Portfolio Requirements</label>
                                    <select class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                        <option>Minimum 5 professional photos</option>
                                        <option>Minimum 10 professional photos</option>
                                        <option>No minimum requirement</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="mt-8 pt-6 border-t border-gray-200">
                        <div class="flex justify-between items-center">
                            <div>
                                <h4 class="font-medium">Cross-Brand Template Sharing</h4>
                                <p class="text-sm text-gray-600">Allow other brands to use your modeling templates as base templates</p>
                            </div>
                            <label class="flex items-center">
                                <input type="checkbox" checked class="mr-2">
                                <span class="text-sm">Enable template sharing</span>
                            </label>
                        </div>
                    </div>

                    <div class="mt-6 flex space-x-3">
                        <button class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                            Save Configuration
                        </button>
                        <button class="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300">
                            Reset to Defaults
                        </button>
                    </div>
                </div>
            </div>
        </main>
    </div>
</div>

<?php include '../../includes/footer.php'; ?>