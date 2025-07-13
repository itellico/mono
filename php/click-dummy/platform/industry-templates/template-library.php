<?php include '../../includes/header.php'; ?>

<div class="min-h-screen bg-gray-50">
    <?php include '../../includes/sidebar.php'; ?>
    
    <div class="lg:ml-64">
        <header class="bg-white shadow">
            <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center">
                    <h1 class="text-3xl font-bold text-gray-900">Industry Template Library</h1>
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
                            Available Templates
                        </button>
                        <button class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm">
                            Custom Templates
                        </button>
                    </nav>
                </div>
            </div>

            <!-- Active Templates -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <!-- Modeling Industry Template -->
                <div class="bg-white rounded-lg shadow-lg">
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center">
                                <div class="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <h3 class="text-lg font-semibold">Modeling Industry</h3>
                                    <p class="text-sm text-gray-500">Complete modeling marketplace solution</p>
                                </div>
                            </div>
                            <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Active</span>
                        </div>

                        <div class="mb-4">
                            <h4 class="font-medium mb-2">Core Features:</h4>
                            <div class="grid grid-cols-2 gap-2 text-sm">
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    Portfolio Management
                                </div>
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    Casting System
                                </div>
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    Comp Card Generator
                                </div>
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    Guardian Management
                                </div>
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    Measurement System
                                </div>
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    Booking Calendar
                                </div>
                            </div>
                        </div>

                        <div class="mb-4">
                            <h4 class="font-medium mb-2">Gig Templates:</h4>
                            <div class="flex flex-wrap gap-2">
                                <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Fashion Shoot</span>
                                <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Runway Show</span>
                                <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Commercial</span>
                                <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Editorial</span>
                            </div>
                        </div>

                        <div class="border-t pt-4">
                            <div class="flex justify-between items-center">
                                <div class="text-sm text-gray-600">
                                    Used by: <strong>go-models.com</strong>
                                </div>
                                <div class="flex space-x-2">
                                    <button class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                                        Configure
                                    </button>
                                    <button class="bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm hover:bg-gray-300">
                                        View Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Pet Industry Template -->
                <div class="bg-white rounded-lg shadow-lg">
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center">
                                <div class="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                                    <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 2L3 7v11a2 2 0 002 2h10a2 2 0 002-2V7l-7-5z"/>
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <h3 class="text-lg font-semibold">Pet Industry</h3>
                                    <p class="text-sm text-gray-500">Pet talent and services marketplace</p>
                                </div>
                            </div>
                            <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Active</span>
                        </div>

                        <div class="mb-4">
                            <h4 class="font-medium mb-2">Core Features:</h4>
                            <div class="grid grid-cols-2 gap-2 text-sm">
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    Pet Profiles
                                </div>
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    Training Records
                                </div>
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    Vaccination Tracking
                                </div>
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    Show Management
                                </div>
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    Breeding Services
                                </div>
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    Media Gallery
                                </div>
                            </div>
                        </div>

                        <div class="mb-4">
                            <h4 class="font-medium mb-2">Gig Templates:</h4>
                            <div class="flex flex-wrap gap-2">
                                <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Photo Shoot</span>
                                <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Commercial</span>
                                <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Dog Show</span>
                                <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Training</span>
                            </div>
                        </div>

                        <div class="border-t pt-4">
                            <div class="flex justify-between items-center">
                                <div class="text-sm text-gray-600">
                                    Used by: <strong>go-pets.com</strong>
                                </div>
                                <div class="flex space-x-2">
                                    <button class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                                        Configure
                                    </button>
                                    <button class="bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm hover:bg-gray-300">
                                        View Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Voice & AI Template -->
                <div class="bg-white rounded-lg shadow-lg">
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center">
                                <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                    <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M7 4V2a1 1 0 011-1h4a1 1 0 011 1v2h3a1 1 0 110 2h-1v9a2 2 0 01-2 2H7a2 2 0 01-2-2V6H4a1 1 0 110-2h3z"/>
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <h3 class="text-lg font-semibold">Voice & AI Industry</h3>
                                    <p class="text-sm text-gray-500">Voice talent and AI agent marketplace</p>
                                </div>
                            </div>
                            <span class="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Beta</span>
                        </div>

                        <div class="mb-4">
                            <h4 class="font-medium mb-2">Core Features:</h4>
                            <div class="grid grid-cols-2 gap-2 text-sm">
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                    Voice Profiles
                                </div>
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                    Demo Reels
                                </div>
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                    Accent Library
                                </div>
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                    AI Agent Profiles
                                </div>
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                    Project Management
                                </div>
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                    Client Reviews
                                </div>
                            </div>
                        </div>

                        <div class="mb-4">
                            <h4 class="font-medium mb-2">Gig Templates:</h4>
                            <div class="flex flex-wrap gap-2">
                                <span class="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">Narrator</span>
                                <span class="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">Character Voice</span>
                                <span class="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">AI Agent</span>
                                <span class="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">Audiobook</span>
                            </div>
                        </div>

                        <div class="border-t pt-4">
                            <div class="flex justify-between items-center">
                                <div class="text-sm text-gray-600">
                                    Used by: <strong>voice-agents.com</strong>
                                </div>
                                <div class="flex space-x-2">
                                    <button class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                                        Configure
                                    </button>
                                    <button class="bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm hover:bg-gray-300">
                                        View Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Beauty Industry Template (Planned) -->
                <div class="bg-white rounded-lg shadow-lg border-2 border-dashed border-gray-300">
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center">
                                <div class="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                                    <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <h3 class="text-lg font-semibold">Beauty Industry</h3>
                                    <p class="text-sm text-gray-500">Makeup artists and beauty professionals</p>
                                </div>
                            </div>
                            <span class="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">Planned</span>
                        </div>

                        <div class="mb-4">
                            <h4 class="font-medium mb-2">Planned Features:</h4>
                            <div class="grid grid-cols-2 gap-2 text-sm text-gray-500">
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                                    Artist Portfolios
                                </div>
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                                    Service Booking
                                </div>
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                                    Product Integration
                                </div>
                                <div class="flex items-center">
                                    <span class="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                                    Location Services
                                </div>
                            </div>
                        </div>

                        <div class="border-t pt-4">
                            <div class="flex justify-between items-center">
                                <div class="text-sm text-gray-600">
                                    Target brand: <strong>go-beauty.com</strong>
                                </div>
                                <div class="flex space-x-2">
                                    <button class="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700">
                                        Start Development
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Template Configuration -->
            <div class="bg-white rounded-lg shadow">
                <div class="p-6">
                    <h2 class="text-lg font-medium text-gray-900 mb-4">Generic Gig System Configuration</h2>
                    <p class="text-gray-600 mb-6">All industry templates use the same underlying gig system with configurable fields and workflows.</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <h3 class="font-medium mb-3">Common Features</h3>
                            <ul class="text-sm space-y-2">
                                <li class="flex items-center">
                                    <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                    User profiles & authentication
                                </li>
                                <li class="flex items-center">
                                    <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                    Generic gig posting system
                                </li>
                                <li class="flex items-center">
                                    <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                    Media upload & management
                                </li>
                                <li class="flex items-center">
                                    <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                    Booking & calendar system
                                </li>
                                <li class="flex items-center">
                                    <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                    Payment processing
                                </li>
                            </ul>
                        </div>
                        
                        <div>
                            <h3 class="font-medium mb-3">Configurable Elements</h3>
                            <ul class="text-sm space-y-2">
                                <li class="flex items-center">
                                    <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    Profile fields & validation
                                </li>
                                <li class="flex items-center">
                                    <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    Gig requirements templates
                                </li>
                                <li class="flex items-center">
                                    <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    Category hierarchies
                                </li>
                                <li class="flex items-center">
                                    <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    Workflow automation
                                </li>
                                <li class="flex items-center">
                                    <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    Brand styling & content
                                </li>
                            </ul>
                        </div>
                        
                        <div>
                            <h3 class="font-medium mb-3">Cross-Brand Features</h3>
                            <ul class="text-sm space-y-2">
                                <li class="flex items-center">
                                    <span class="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                                    API data sharing
                                </li>
                                <li class="flex items-center">
                                    <span class="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                                    Multi-industry profiles
                                </li>
                                <li class="flex items-center">
                                    <span class="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                                    Universal search
                                </li>
                                <li class="flex items-center">
                                    <span class="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                                    Cross-platform gigs
                                </li>
                                <li class="flex items-center">
                                    <span class="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                                    Unified analytics
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
</div>

<?php include '../../includes/footer.php'; ?>