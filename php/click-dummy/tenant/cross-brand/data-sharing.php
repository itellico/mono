<?php include '../../includes/header.php'; ?>

<div class="min-h-screen bg-gray-50">
    <?php include '../../includes/sidebar.php'; ?>
    
    <div class="lg:ml-64">
        <header class="bg-white shadow">
            <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-900">Cross-Brand Data Sharing</h1>
                        <p class="text-gray-600 mt-1">Configure data sharing between go-models.com and other platform brands</p>
                    </div>
                    <button class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                        Test API Connection
                    </button>
                </div>
            </div>
        </header>

        <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <!-- Current Brand Info -->
            <div class="mb-6">
                <div class="bg-white shadow rounded-lg p-6">
                    <div class="flex items-center">
                        <div class="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <span class="text-white font-bold text-xl">GM</span>
                        </div>
                        <div class="ml-4">
                            <h2 class="text-xl font-semibold">go-models.com</h2>
                            <p class="text-gray-600">Modeling Industry Brand</p>
                            <div class="flex items-center mt-2">
                                <span class="bg-green-100 text-green-800 text-sm px-2 py-1 rounded-full">Active</span>
                                <span class="ml-2 text-sm text-gray-500">847 active professionals</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Data Sharing Connections -->
            <div class="mb-8">
                <h2 class="text-lg font-medium text-gray-900 mb-4">Available Brand Connections</h2>
                <div class="space-y-4">
                    <!-- Voice Agents Connection -->
                    <div class="bg-white rounded-lg shadow">
                        <div class="p-6">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center">
                                    <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                        <span class="text-white font-bold">VA</span>
                                    </div>
                                    <div class="ml-4">
                                        <h3 class="text-lg font-semibold">voice-agents.com</h3>
                                        <p class="text-gray-600">Voice & AI Industry</p>
                                        <div class="flex items-center mt-1">
                                            <span class="bg-yellow-100 text-yellow-800 text-sm px-2 py-1 rounded-full">Beta</span>
                                            <span class="ml-2 text-sm text-gray-500">88 active professionals</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <span class="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">Connected</span>
                                    <div class="text-sm text-gray-500 mt-1">Last sync: 5 minutes ago</div>
                                </div>
                            </div>

                            <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <h4 class="font-medium mb-2">Shared Data Types</h4>
                                    <div class="space-y-1">
                                        <div class="flex items-center">
                                            <input type="checkbox" checked disabled class="mr-2">
                                            <span class="text-sm">Professional profiles</span>
                                        </div>
                                        <div class="flex items-center">
                                            <input type="checkbox" checked disabled class="mr-2">
                                            <span class="text-sm">Cross-industry gigs</span>
                                        </div>
                                        <div class="flex items-center">
                                            <input type="checkbox" class="mr-2">
                                            <span class="text-sm">Portfolio media</span>
                                        </div>
                                        <div class="flex items-center">
                                            <input type="checkbox" class="mr-2">
                                            <span class="text-sm">Performance ratings</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div>
                                    <h4 class="font-medium mb-2">Sync Statistics</h4>
                                    <div class="space-y-1 text-sm">
                                        <div class="flex justify-between">
                                            <span class="text-gray-600">Cross-brand professionals:</span>
                                            <span class="font-medium">23</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-gray-600">Shared gigs:</span>
                                            <span class="font-medium">7</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-gray-600">Success rate:</span>
                                            <span class="font-medium text-green-600">94%</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 class="font-medium mb-2">Recent Activity</h4>
                                    <div class="space-y-2 text-sm">
                                        <div class="flex items-center">
                                            <div class="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                            <span class="text-gray-600">Voice talent matched</span>
                                        </div>
                                        <div class="flex items-center">
                                            <div class="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                            <span class="text-gray-600">Profile sync completed</span>
                                        </div>
                                        <div class="flex items-center">
                                            <div class="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                                            <span class="text-gray-600">Cross-gig posted</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="mt-4 pt-4 border-t border-gray-200 flex space-x-3">
                                <button class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                                    Configure Sharing
                                </button>
                                <button class="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300">
                                    View Logs
                                </button>
                                <button class="bg-red-100 text-red-800 px-4 py-2 rounded hover:bg-red-200">
                                    Disconnect
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Go Pets Connection (Available) -->
                    <div class="bg-white rounded-lg shadow border-2 border-dashed border-gray-300">
                        <div class="p-6">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center">
                                    <div class="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                                        <span class="text-white font-bold">GP</span>
                                    </div>
                                    <div class="ml-4">
                                        <h3 class="text-lg font-semibold">go-pets.com</h3>
                                        <p class="text-gray-600">Pet Industry</p>
                                        <div class="flex items-center mt-1">
                                            <span class="bg-green-100 text-green-800 text-sm px-2 py-1 rounded-full">Active</span>
                                            <span class="ml-2 text-sm text-gray-500">312 active pets</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <span class="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full">Available</span>
                                    <div class="text-sm text-gray-500 mt-1">Not connected</div>
                                </div>
                            </div>

                            <div class="mt-4">
                                <p class="text-gray-600 mb-4">
                                    Connect with go-pets.com to access cross-industry opportunities. Some fashion shoots 
                                    require both models and pets for lifestyle campaigns.
                                </p>
                                <div class="bg-blue-50 p-4 rounded-lg">
                                    <h4 class="font-medium text-blue-900 mb-2">Potential Opportunities</h4>
                                    <ul class="text-sm text-blue-800 space-y-1">
                                        <li>• Pet-model lifestyle campaigns</li>
                                        <li>• Family photo shoots with pets</li>
                                        <li>• Commercial shoots featuring pets and models</li>
                                        <li>• Cross-brand promotional content</li>
                                    </ul>
                                </div>
                            </div>

                            <div class="mt-4 pt-4 border-t border-gray-200">
                                <button class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                                    Connect to go-pets.com
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- API Configuration -->
            <div class="mb-8">
                <h2 class="text-lg font-medium text-gray-900 mb-4">API Configuration</h2>
                <div class="bg-white rounded-lg shadow">
                    <div class="p-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 class="font-medium mb-3">Outbound API Settings</h3>
                                <div class="space-y-3">
                                    <div>
                                        <label class="block text-sm font-medium mb-1">API Endpoint</label>
                                        <input type="text" value="https://api.go-models.com/v2/cross-brand" 
                                               class="w-full px-3 py-2 border border-gray-300 rounded-md" readonly>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium mb-1">API Key</label>
                                        <div class="flex">
                                            <input type="password" value="gm_api_key_****" 
                                                   class="flex-1 px-3 py-2 border border-gray-300 rounded-l-md" readonly>
                                            <button class="bg-gray-200 px-3 py-2 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-300">
                                                Show
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium mb-1">Rate Limit</label>
                                        <select class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                            <option>1000 requests/hour</option>
                                            <option>500 requests/hour</option>
                                            <option>100 requests/hour</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 class="font-medium mb-3">Inbound Data Filters</h3>
                                <div class="space-y-3">
                                    <div>
                                        <label class="block text-sm font-medium mb-1">Accepted Industries</label>
                                        <div class="space-y-2">
                                            <label class="flex items-center">
                                                <input type="checkbox" checked class="mr-2">
                                                <span class="text-sm">Voice & AI</span>
                                            </label>
                                            <label class="flex items-center">
                                                <input type="checkbox" class="mr-2">
                                                <span class="text-sm">Pet Industry</span>
                                            </label>
                                            <label class="flex items-center">
                                                <input type="checkbox" class="mr-2">
                                                <span class="text-sm">Beauty & Wellness</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium mb-1">Minimum Rating</label>
                                        <select class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                            <option>4.5 stars and above</option>
                                            <option>4.0 stars and above</option>
                                            <option>3.5 stars and above</option>
                                            <option>No minimum</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="mt-6 pt-6 border-t border-gray-200">
                            <div class="flex justify-between items-center">
                                <div>
                                    <h4 class="font-medium">Webhook Notifications</h4>
                                    <p class="text-sm text-gray-600">Get notified when cross-brand opportunities arise</p>
                                </div>
                                <label class="flex items-center">
                                    <input type="checkbox" checked class="mr-2">
                                    <span class="text-sm">Enable webhooks</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Analytics -->
            <div class="bg-white rounded-lg shadow">
                <div class="p-6">
                    <h2 class="text-lg font-medium text-gray-900 mb-4">Cross-Brand Performance</h2>
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div class="text-center">
                            <div class="text-2xl font-bold text-blue-600">23</div>
                            <div class="text-sm text-gray-600">Cross-brand professionals</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-green-600">7</div>
                            <div class="text-sm text-gray-600">Active cross-brand gigs</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-purple-600">€2,340</div>
                            <div class="text-sm text-gray-600">Cross-brand revenue</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-yellow-600">94%</div>
                            <div class="text-sm text-gray-600">Success rate</div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
</div>

<?php include '../../includes/footer.php'; ?>