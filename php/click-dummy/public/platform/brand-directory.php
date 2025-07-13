<?php include '../../includes/header.php'; ?>

<div class="min-h-screen bg-gray-50">
    <!-- Hero Section -->
    <div class="bg-gradient-to-r from-blue-600 to-purple-700">
        <div class="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
            <div class="text-center">
                <h1 class="text-4xl font-bold text-white mb-4">
                    Multi-Industry Talent Platform
                </h1>
                <p class="text-xl text-blue-100 mb-8">
                    Discover talent across modeling, pets, voice & AI, and more industries
                </p>
                <div class="max-w-lg mx-auto">
                    <div class="flex">
                        <input type="text" placeholder="Search across all brands..." 
                               class="flex-1 px-4 py-3 rounded-l-lg border-0 focus:ring-2 focus:ring-white">
                        <button class="bg-white text-blue-600 px-6 py-3 rounded-r-lg hover:bg-gray-50 font-medium">
                            Search All
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Brand Directory -->
    <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
            <h2 class="text-3xl font-bold text-gray-900 mb-4">Our Brand Portfolio</h2>
            <p class="text-gray-600 max-w-2xl mx-auto">
                Each brand serves a specific industry with tailored features, workflows, and community. 
                Explore our growing ecosystem of professional marketplaces.
            </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <!-- Go Models Brand -->
            <div class="bg-white rounded-xl shadow-lg overflow-hidden">
                <div class="h-48 bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center">
                    <div class="text-center text-white">
                        <div class="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span class="text-3xl font-bold">GM</span>
                        </div>
                        <h3 class="text-2xl font-bold">go-models.com</h3>
                    </div>
                </div>
                <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                        <span class="bg-pink-100 text-pink-800 text-sm px-3 py-1 rounded-full">Modeling Industry</span>
                        <span class="text-green-600 font-medium">847 Active Professionals</span>
                    </div>
                    <p class="text-gray-600 mb-4">
                        Premier modeling marketplace featuring fashion, commercial, editorial, and specialized modeling categories. 
                        Complete with portfolio management, casting calls, and professional networking.
                    </p>
                    <div class="space-y-2 mb-6">
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-500">Specialties:</span>
                            <span class="font-medium">Fashion, Commercial, Editorial, Kids</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-500">Active Castings:</span>
                            <span class="font-medium">34 open positions</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-500">Success Rate:</span>
                            <span class="font-medium text-green-600">94% job completion</span>
                        </div>
                    </div>
                    <div class="flex space-x-3">
                        <a href="/public/gomodels/" class="flex-1 bg-pink-600 text-white text-center py-2 rounded-lg hover:bg-pink-700">
                            Explore Platform
                        </a>
                        <button class="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300">
                            View Talent
                        </button>
                    </div>
                </div>
            </div>

            <!-- Go Pets Brand -->
            <div class="bg-white rounded-xl shadow-lg overflow-hidden">
                <div class="h-48 bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center">
                    <div class="text-center text-white">
                        <div class="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span class="text-3xl font-bold">GP</span>
                        </div>
                        <h3 class="text-2xl font-bold">go-pets.com</h3>
                    </div>
                </div>
                <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                        <span class="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">Pet Industry</span>
                        <span class="text-green-600 font-medium">312 Active Pets</span>
                    </div>
                    <p class="text-gray-600 mb-4">
                        Professional pet talent marketplace for photography, commercials, shows, and training services. 
                        Features complete pet profiles, vaccination tracking, and specialized booking system.
                    </p>
                    <div class="space-y-2 mb-6">
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-500">Specialties:</span>
                            <span class="font-medium">Dogs, Cats, Exotic, Shows</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-500">Active Gigs:</span>
                            <span class="font-medium">18 open positions</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-500">Success Rate:</span>
                            <span class="font-medium text-green-600">97% job completion</span>
                        </div>
                    </div>
                    <div class="flex space-x-3">
                        <button class="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                            Explore Platform
                        </button>
                        <button class="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300">
                            View Pets
                        </button>
                    </div>
                </div>
            </div>

            <!-- Voice Agents Brand -->
            <div class="bg-white rounded-xl shadow-lg overflow-hidden">
                <div class="h-48 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                    <div class="text-center text-white">
                        <div class="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span class="text-3xl font-bold">VA</span>
                        </div>
                        <h3 class="text-2xl font-bold">voice-agents.com</h3>
                    </div>
                </div>
                <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                        <span class="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">Voice & AI</span>
                        <span class="text-green-600 font-medium">88 Active Agents</span>
                    </div>
                    <p class="text-gray-600 mb-4">
                        Advanced voice talent and AI agent marketplace featuring narrators, character voices, 
                        and AI-powered voice solutions. Professional-grade demos and project management included.
                    </p>
                    <div class="space-y-2 mb-6">
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-500">Specialties:</span>
                            <span class="font-medium">Narration, Characters, AI Voices</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-500">Active Projects:</span>
                            <span class="font-medium">37 open positions</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-500">Platform Status:</span>
                            <span class="font-medium text-yellow-600">Beta Release</span>
                        </div>
                    </div>
                    <div class="flex space-x-3">
                        <button class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                            Explore Platform
                        </button>
                        <button class="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300">
                            View Agents
                        </button>
                    </div>
                </div>
            </div>

            <!-- Coming Soon Brand -->
            <div class="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-dashed border-gray-300">
                <div class="h-48 bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                    <div class="text-center text-white">
                        <div class="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span class="text-3xl font-bold">?</span>
                        </div>
                        <h3 class="text-2xl font-bold">Next Brand</h3>
                    </div>
                </div>
                <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                        <span class="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full">Coming Soon</span>
                        <span class="text-gray-500 font-medium">Beauty • Fitness • More</span>
                    </div>
                    <p class="text-gray-600 mb-4">
                        We're constantly expanding into new industries. Beauty professionals, fitness trainers, 
                        and specialized talent markets are in development. Join our waitlist to be notified.
                    </p>
                    <div class="space-y-2 mb-6">
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-500">Potential Industries:</span>
                            <span class="font-medium">Beauty, Fitness, Music</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-500">Launch Timeline:</span>
                            <span class="font-medium">Q2 2024</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-500">Waitlist:</span>
                            <span class="font-medium text-blue-600">Join early access</span>
                        </div>
                    </div>
                    <div class="flex space-x-3">
                        <button class="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">
                            Join Waitlist
                        </button>
                        <button class="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300">
                            Request Industry
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Cross-Platform Features -->
        <div class="bg-white rounded-xl shadow-lg p-8 mb-12">
            <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">Cross-Platform Benefits</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="text-center">
                    <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold mb-2">Unified Profile</h3>
                    <p class="text-gray-600">
                        Create one profile that works across all our platforms. Showcase your versatility 
                        and discover opportunities in multiple industries.
                    </p>
                </div>
                <div class="text-center">
                    <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                            <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3z"/>
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold mb-2">Cross-Industry Gigs</h3>
                    <p class="text-gray-600">
                        Some projects need multiple types of talent. A commercial might need both 
                        models and voice actors - find these unique opportunities here.
                    </p>
                </div>
                <div class="text-center">
                    <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold mb-2">Universal Search</h3>
                    <p class="text-gray-600">
                        Search across all platforms simultaneously. Find the perfect talent 
                        regardless of which industry platform they primarily use.
                    </p>
                </div>
            </div>
        </div>

        <!-- Platform Statistics -->
        <div class="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">Platform Performance</h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div class="text-center">
                    <div class="text-3xl font-bold text-blue-600 mb-2">1,247</div>
                    <div class="text-sm text-gray-600">Total Active Professionals</div>
                </div>
                <div class="text-center">
                    <div class="text-3xl font-bold text-green-600 mb-2">89</div>
                    <div class="text-sm text-gray-600">Active Opportunities</div>
                </div>
                <div class="text-center">
                    <div class="text-3xl font-bold text-purple-600 mb-2">95%</div>
                    <div class="text-sm text-gray-600">Average Success Rate</div>
                </div>
                <div class="text-center">
                    <div class="text-3xl font-bold text-yellow-600 mb-2">3</div>
                    <div class="text-sm text-gray-600">Active Industries</div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include '../../includes/footer.php'; ?>