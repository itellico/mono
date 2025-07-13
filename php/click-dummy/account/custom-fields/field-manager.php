<?php include '../../includes/header.php'; ?>

<div class="min-h-screen bg-gray-50">
    <?php include '../../includes/sidebar.php'; ?>
    
    <div class="lg:ml-64">
        <header class="bg-white shadow">
            <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-900">Custom Field Manager</h1>
                        <p class="text-gray-600 mt-1">Configure custom fields for your agency's specific needs</p>
                    </div>
                    <button class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                        Add Custom Field
                    </button>
                </div>
            </div>
        </header>

        <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <!-- Account-Level Notice -->
            <div class="mb-6">
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                            </svg>
                        </div>
                        <div class="ml-3">
                            <h3 class="text-sm font-medium text-blue-800">Account-Level Customization</h3>
                            <p class="mt-1 text-sm text-blue-700">
                                Custom fields are configured at the account level. These fields will be available for all users within your agency account.
                                Tenant-level categories and workflows are managed separately by the brand administrators.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Current Custom Fields -->
            <div class="mb-8">
                <h2 class="text-lg font-medium text-gray-900 mb-4">Active Custom Fields</h2>
                <div class="bg-white shadow rounded-lg">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <div class="flex justify-between items-center">
                            <h3 class="text-lg font-medium">User Profile Fields</h3>
                            <button class="text-blue-600 hover:text-blue-700 text-sm">+ Add Field</button>
                        </div>
                    </div>
                    <div class="divide-y divide-gray-200">
                        <!-- Field 1 -->
                        <div class="px-6 py-4">
                            <div class="flex items-center justify-between">
                                <div class="flex-1">
                                    <div class="flex items-center">
                                        <span class="text-sm font-medium text-gray-900">Agency Rating</span>
                                        <span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            Number
                                        </span>
                                        <span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            Required
                                        </span>
                                    </div>
                                    <p class="text-sm text-gray-500 mt-1">Internal rating for model performance (1-10)</p>
                                    <div class="text-xs text-gray-400 mt-1">
                                        Validation: Min: 1, Max: 10 • Default: 5
                                    </div>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <button class="text-gray-400 hover:text-gray-600">
                                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                                        </svg>
                                    </button>
                                    <button class="text-gray-400 hover:text-red-600">
                                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Field 2 -->
                        <div class="px-6 py-4">
                            <div class="flex items-center justify-between">
                                <div class="flex-1">
                                    <div class="flex items-center">
                                        <span class="text-sm font-medium text-gray-900">Preferred Brands</span>
                                        <span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Multi-Select
                                        </span>
                                        <span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            Optional
                                        </span>
                                    </div>
                                    <p class="text-sm text-gray-500 mt-1">Fashion brands the model prefers to work with</p>
                                    <div class="text-xs text-gray-400 mt-1">
                                        Options: Gucci, Prada, Versace, Armani, Dolce & Gabbana, Other
                                    </div>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <button class="text-gray-400 hover:text-gray-600">
                                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                                        </svg>
                                    </button>
                                    <button class="text-gray-400 hover:text-red-600">
                                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Field 3 -->
                        <div class="px-6 py-4">
                            <div class="flex items-center justify-between">
                                <div class="flex-1">
                                    <div class="flex items-center">
                                        <span class="text-sm font-medium text-gray-900">Agency Notes</span>
                                        <span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                            Text Area
                                        </span>
                                        <span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            Optional
                                        </span>
                                    </div>
                                    <p class="text-sm text-gray-500 mt-1">Internal notes about model's performance, preferences, etc.</p>
                                    <div class="text-xs text-gray-400 mt-1">
                                        Max length: 1000 characters • Rich text enabled
                                    </div>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <button class="text-gray-400 hover:text-gray-600">
                                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                                        </svg>
                                    </button>
                                    <button class="text-gray-400 hover:text-red-600">
                                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Field Type Templates -->
            <div class="mb-8">
                <h2 class="text-lg font-medium text-gray-900 mb-4">Available Field Types</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <!-- Text Field -->
                    <div class="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer">
                        <div class="flex items-center mb-2">
                            <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4z"/>
                                </svg>
                            </div>
                            <h3 class="ml-2 font-medium">Text Field</h3>
                        </div>
                        <p class="text-sm text-gray-600">Single line text input with validation</p>
                        <div class="text-xs text-gray-400 mt-2">
                            Best for: Names, titles, short descriptions
                        </div>
                    </div>

                    <!-- Number Field -->
                    <div class="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer">
                        <div class="flex items-center mb-2">
                            <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"/>
                                </svg>
                            </div>
                            <h3 class="ml-2 font-medium">Number Field</h3>
                        </div>
                        <p class="text-sm text-gray-600">Numeric input with min/max validation</p>
                        <div class="text-xs text-gray-400 mt-2">
                            Best for: Ratings, measurements, prices
                        </div>
                    </div>

                    <!-- Select Field -->
                    <div class="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer">
                        <div class="flex items-center mb-2">
                            <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg class="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/>
                                </svg>
                            </div>
                            <h3 class="ml-2 font-medium">Select Dropdown</h3>
                        </div>
                        <p class="text-sm text-gray-600">Single choice from predefined options</p>
                        <div class="text-xs text-gray-400 mt-2">
                            Best for: Categories, skill levels, preferences
                        </div>
                    </div>

                    <!-- Multi-Select -->
                    <div class="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer">
                        <div class="flex items-center mb-2">
                            <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <svg class="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/>
                                </svg>
                            </div>
                            <h3 class="ml-2 font-medium">Multi-Select</h3>
                        </div>
                        <p class="text-sm text-gray-600">Multiple choices from predefined options</p>
                        <div class="text-xs text-gray-400 mt-2">
                            Best for: Skills, languages, brands
                        </div>
                    </div>

                    <!-- Text Area -->
                    <div class="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer">
                        <div class="flex items-center mb-2">
                            <div class="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <svg class="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2v8h12V6H4z" clip-rule="evenodd"/>
                                </svg>
                            </div>
                            <h3 class="ml-2 font-medium">Text Area</h3>
                        </div>
                        <p class="text-sm text-gray-600">Multi-line text with rich formatting</p>
                        <div class="text-xs text-gray-400 mt-2">
                            Best for: Notes, descriptions, comments
                        </div>
                    </div>

                    <!-- Boolean -->
                    <div class="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer">
                        <div class="flex items-center mb-2">
                            <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                <svg class="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                                </svg>
                            </div>
                            <h3 class="ml-2 font-medium">Yes/No Toggle</h3>
                        </div>
                        <p class="text-sm text-gray-600">Boolean field with checkbox or toggle</p>
                        <div class="text-xs text-gray-400 mt-2">
                            Best for: Availability, permissions, features
                        </div>
                    </div>
                </div>
            </div>

            <!-- Best Practices -->
            <div class="bg-white rounded-lg shadow">
                <div class="p-6">
                    <h2 class="text-lg font-medium text-gray-900 mb-4">Custom Field Best Practices</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 class="font-medium mb-3 text-green-800">✅ Do's</h3>
                            <ul class="text-sm space-y-2">
                                <li class="flex items-start">
                                    <span class="w-2 h-2 bg-green-500 rounded-full mr-2 mt-1.5"></span>
                                    Use clear, descriptive field names
                                </li>
                                <li class="flex items-start">
                                    <span class="w-2 h-2 bg-green-500 rounded-full mr-2 mt-1.5"></span>
                                    Add helpful descriptions for complex fields
                                </li>
                                <li class="flex items-start">
                                    <span class="w-2 h-2 bg-green-500 rounded-full mr-2 mt-1.5"></span>
                                    Set appropriate validation rules
                                </li>
                                <li class="flex items-start">
                                    <span class="w-2 h-2 bg-green-500 rounded-full mr-2 mt-1.5"></span>
                                    Keep option lists manageable (< 20 items)
                                </li>
                                <li class="flex items-start">
                                    <span class="w-2 h-2 bg-green-500 rounded-full mr-2 mt-1.5"></span>
                                    Use consistent naming conventions
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 class="font-medium mb-3 text-red-800">❌ Don'ts</h3>
                            <ul class="text-sm space-y-2">
                                <li class="flex items-start">
                                    <span class="w-2 h-2 bg-red-500 rounded-full mr-2 mt-1.5"></span>
                                    Duplicate standard profile fields
                                </li>
                                <li class="flex items-start">
                                    <span class="w-2 h-2 bg-red-500 rounded-full mr-2 mt-1.5"></span>
                                    Create too many required fields
                                </li>
                                <li class="flex items-start">
                                    <span class="w-2 h-2 bg-red-500 rounded-full mr-2 mt-1.5"></span>
                                    Use unclear abbreviations
                                </li>
                                <li class="flex items-start">
                                    <span class="w-2 h-2 bg-red-500 rounded-full mr-2 mt-1.5"></span>
                                    Make fields that change frequently required
                                </li>
                                <li class="flex items-start">
                                    <span class="w-2 h-2 bg-red-500 rounded-full mr-2 mt-1.5"></span>
                                    Store sensitive data in custom fields
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