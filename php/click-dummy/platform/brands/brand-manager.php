<?php include '../../includes/header.php'; ?>

<div class="min-h-screen bg-gray-50">
    <?php include '../../includes/sidebar.php'; ?>
    
    <div class="lg:ml-64">
        <header class="bg-white shadow">
            <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center">
                    <h1 class="text-3xl font-bold text-gray-900">Multi-Brand Platform Manager</h1>
                    <button class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                        Create New Brand
                    </button>
                </div>
            </div>
        </header>

        <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <!-- Platform Overview -->
            <div class="mb-8">
                <div class="bg-white overflow-hidden shadow rounded-lg">
                    <div class="p-6">
                        <h2 class="text-lg font-medium text-gray-900 mb-4">Platform Overview</h2>
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div class="bg-blue-50 p-4 rounded-lg">
                                <div class="text-2xl font-bold text-blue-600">3</div>
                                <div class="text-sm text-gray-600">Active Brands</div>
                            </div>
                            <div class="bg-green-50 p-4 rounded-lg">
                                <div class="text-2xl font-bold text-green-600">1,247</div>
                                <div class="text-sm text-gray-600">Total Users</div>
                            </div>
                            <div class="bg-yellow-50 p-4 rounded-lg">
                                <div class="text-2xl font-bold text-yellow-600">89</div>
                                <div class="text-sm text-gray-600">Active Gigs</div>
                            </div>
                            <div class="bg-purple-50 p-4 rounded-lg">
                                <div class="text-2xl font-bold text-purple-600">€12,450</div>
                                <div class="text-sm text-gray-600">Monthly Revenue</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Active Brands -->
            <div class="mb-8">
                <h2 class="text-lg font-medium text-gray-900 mb-4">Active Brands</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <!-- Go Models Brand -->
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center mb-4">
                            <div class="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <span class="text-white font-bold text-lg">GM</span>
                            </div>
                            <div class="ml-3">
                                <h3 class="text-lg font-semibold">go-models.com</h3>
                                <p class="text-sm text-gray-500">Modeling Industry</p>
                            </div>
                            <div class="ml-auto">
                                <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Active</span>
                            </div>
                        </div>
                        <div class="space-y-2 mb-4">
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600">Total Users:</span>
                                <span class="font-medium">847</span>
                            </div>
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600">Active Gigs:</span>
                                <span class="font-medium">34</span>
                            </div>
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600">Monthly Revenue:</span>
                                <span class="font-medium">€8,200</span>
                            </div>
                        </div>
                        <div class="flex space-x-2">
                            <button class="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700">
                                Manage
                            </button>
                            <button class="flex-1 bg-gray-200 text-gray-800 py-2 px-3 rounded text-sm hover:bg-gray-300">
                                Analytics
                            </button>
                        </div>
                    </div>

                    <!-- Go Pets Brand -->
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center mb-4">
                            <div class="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                                <span class="text-white font-bold text-lg">GP</span>
                            </div>
                            <div class="ml-3">
                                <h3 class="text-lg font-semibold">go-pets.com</h3>
                                <p class="text-sm text-gray-500">Pet Industry</p>
                            </div>
                            <div class="ml-auto">
                                <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Active</span>
                            </div>
                        </div>
                        <div class="space-y-2 mb-4">
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600">Total Users:</span>
                                <span class="font-medium">312</span>
                            </div>
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600">Active Gigs:</span>
                                <span class="font-medium">18</span>
                            </div>
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600">Monthly Revenue:</span>
                                <span class="font-medium">€2,800</span>
                            </div>
                        </div>
                        <div class="flex space-x-2">
                            <button class="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700">
                                Manage
                            </button>
                            <button class="flex-1 bg-gray-200 text-gray-800 py-2 px-3 rounded text-sm hover:bg-gray-300">
                                Analytics
                            </button>
                        </div>
                    </div>

                    <!-- Voice Agents Brand -->
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center mb-4">
                            <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                <span class="text-white font-bold text-lg">VA</span>
                            </div>
                            <div class="ml-3">
                                <h3 class="text-lg font-semibold">voice-agents.com</h3>
                                <p class="text-sm text-gray-500">AI Voice Industry</p>
                            </div>
                            <div class="ml-auto">
                                <span class="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Beta</span>
                            </div>
                        </div>
                        <div class="space-y-2 mb-4">
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600">Total Users:</span>
                                <span class="font-medium">88</span>
                            </div>
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600">Active Gigs:</span>
                                <span class="font-medium">37</span>
                            </div>
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600">Monthly Revenue:</span>
                                <span class="font-medium">€1,450</span>
                            </div>
                        </div>
                        <div class="flex space-x-2">
                            <button class="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700">
                                Manage
                            </button>
                            <button class="flex-1 bg-gray-200 text-gray-800 py-2 px-3 rounded text-sm hover:bg-gray-300">
                                Analytics
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Cross-Brand Features -->
            <div class="mb-8">
                <h2 class="text-lg font-medium text-gray-900 mb-4">Cross-Brand Management</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-white rounded-lg shadow p-6">
                        <h3 class="text-lg font-semibold mb-3">Data Sharing</h3>
                        <p class="text-gray-600 mb-4">Configure cross-brand data sharing and API integration</p>
                        <div class="space-y-2">
                            <div class="flex justify-between items-center">
                                <span class="text-sm">go-models ↔ voice-agents</span>
                                <button class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Enabled</button>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-sm">go-pets ↔ go-models</span>
                                <button class="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">Disabled</button>
                            </div>
                        </div>
                        <button class="w-full bg-blue-600 text-white py-2 rounded mt-4 hover:bg-blue-700">
                            Configure Integrations
                        </button>
                    </div>

                    <div class="bg-white rounded-lg shadow p-6">
                        <h3 class="text-lg font-semibold mb-3">Global Analytics</h3>
                        <p class="text-gray-600 mb-4">Cross-brand performance and user insights</p>
                        <div class="space-y-2">
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600">Cross-brand users:</span>
                                <span class="font-medium">23</span>
                            </div>
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600">Multi-industry gigs:</span>
                                <span class="font-medium">7</span>
                            </div>
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600">Platform growth:</span>
                                <span class="font-medium text-green-600">+18%</span>
                            </div>
                        </div>
                        <button class="w-full bg-blue-600 text-white py-2 rounded mt-4 hover:bg-blue-700">
                            View Full Analytics
                        </button>
                    </div>
                </div>
            </div>

            <!-- Industry Templates -->
            <div class="mb-8">
                <h2 class="text-lg font-medium text-gray-900 mb-4">Industry Templates</h2>
                <div class="bg-white rounded-lg shadow">
                    <div class="p-6">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div class="border border-gray-200 rounded-lg p-4">
                                <h4 class="font-semibold mb-2">Modeling Industry</h4>
                                <p class="text-sm text-gray-600 mb-3">Portfolio, castings, comp cards, guardian management</p>
                                <div class="flex justify-between items-center">
                                    <span class="text-xs text-green-600">Used by: go-models.com</span>
                                    <button class="text-blue-600 text-sm hover:underline">Configure</button>
                                </div>
                            </div>
                            <div class="border border-gray-200 rounded-lg p-4">
                                <h4 class="font-semibold mb-2">Pet Industry</h4>
                                <p class="text-sm text-gray-600 mb-3">Pet profiles, shows, training, breeding services</p>
                                <div class="flex justify-between items-center">
                                    <span class="text-xs text-green-600">Used by: go-pets.com</span>
                                    <button class="text-blue-600 text-sm hover:underline">Configure</button>
                                </div>
                            </div>
                            <div class="border border-gray-200 rounded-lg p-4">
                                <h4 class="font-semibold mb-2">Voice & AI</h4>
                                <p class="text-sm text-gray-600 mb-3">Voice profiles, demos, AI agents, projects</p>
                                <div class="flex justify-between items-center">
                                    <span class="text-xs text-yellow-600">Used by: voice-agents.com</span>
                                    <button class="text-blue-600 text-sm hover:underline">Configure</button>
                                </div>
                            </div>
                        </div>
                        <div class="mt-6 pt-6 border-t border-gray-200">
                            <button class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                                Create New Industry Template
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
</div>

<?php include '../../includes/footer.php'; ?>