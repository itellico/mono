/**
 * Demo Storage Utility - Client-side persistence for Click-Dummy platform
 * Provides localStorage management for realistic demo functionality
 */

class DemoStorage {
    constructor() {
        this.prefix = 'clickdummy_';
        this.initializeDefaults();
    }

    /**
     * Initialize default demo data if not exists
     */
    initializeDefaults() {
        if (!this.get('initialized')) {
            this.setDefaults();
            this.set('initialized', true);
        }
    }

    /**
     * Set default demo data
     */
    setDefaults() {
        // User Profile Data
        this.set('profile', {
            name: 'Emma Johnson',
            title: 'Fashion Model',
            bio: 'Experienced fashion model with 8+ years in the industry. Specializing in high-fashion editorial work and commercial campaigns.',
            location: 'New York, NY',
            phone: '+1 (555) 123-4567',
            email: 'emma.johnson@example.com',
            website: 'emmajohnson.com',
            experience: '8+ years',
            height: '5\'9"',
            weight: '125 lbs',
            measurements: {
                bust: '34"',
                waist: '24"',
                hips: '36"',
                dress: '4',
                shoe: '8.5',
                hair: 'Brown',
                eyes: 'Brown'
            },
            skills: ['Fashion Modeling', 'Editorial Work', 'Commercial Campaigns', 'Runway Walking', 'Beauty Shoots', 'Lifestyle Photography'],
            social: {
                instagram: 'emmajohnson',
                twitter: 'emmaj_model',
                linkedin: 'emma-johnson-model'
            },
            profileVisible: true,
            onlineStatus: true,
            lastUpdated: new Date().toISOString()
        });

        // Portfolio Data
        this.set('portfolio', [
            {
                id: 1,
                title: 'Vogue Style Editorial',
                image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&h=600&fit=crop',
                category: 'Fashion',
                views: 892,
                rating: 4.9,
                date: '2024-01-15',
                featured: true
            },
            {
                id: 2,
                title: 'Magazine Cover Story',
                image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=600&fit=crop',
                category: 'Editorial',
                views: 1205,
                rating: 4.8,
                date: '2024-01-10',
                featured: true
            },
            {
                id: 3,
                title: 'Commercial Campaign',
                image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&h=600&fit=crop',
                category: 'Commercial',
                views: 756,
                rating: 4.9,
                date: '2024-01-05',
                featured: false
            },
            {
                id: 4,
                title: 'Fashion Week Runway',
                image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=600&fit=crop',
                category: 'Runway',
                views: 1100,
                rating: 4.7,
                date: '2023-12-20',
                featured: true
            }
        ]);

        // Messages Data
        this.set('conversations', [
            {
                id: 1,
                name: 'Marcus Rodriguez',
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
                role: 'Photographer',
                status: 'Online',
                lastMessage: 'Perfect! I\'ll send the details tomorrow.',
                lastMessageTime: '2m ago',
                unread: true,
                messages: [
                    {
                        id: 1,
                        sender: 'marcus',
                        content: 'Hi Emma! I have an exciting photoshoot opportunity for you.',
                        timestamp: new Date(Date.now() - 3600000).toISOString(),
                        read: true
                    },
                    {
                        id: 2,
                        sender: 'emma',
                        content: 'That sounds amazing! Can you tell me more about it?',
                        timestamp: new Date(Date.now() - 3000000).toISOString(),
                        read: true
                    },
                    {
                        id: 3,
                        sender: 'marcus',
                        content: 'It\'s a fashion editorial for a major magazine. High-end luxury brand campaign.',
                        timestamp: new Date(Date.now() - 2400000).toISOString(),
                        read: true
                    },
                    {
                        id: 4,
                        sender: 'emma',
                        content: 'Perfect! I\'m very interested. What are the details?',
                        timestamp: new Date(Date.now() - 1800000).toISOString(),
                        read: true
                    },
                    {
                        id: 5,
                        sender: 'marcus',
                        content: 'Perfect! I\'ll send the details tomorrow.',
                        timestamp: new Date(Date.now() - 120000).toISOString(),
                        read: false
                    }
                ]
            },
            {
                id: 2,
                name: 'Sarah Mitchell',
                avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=100&h=100&fit=crop&crop=face',
                role: 'Creative Director',
                status: 'Online 2h ago',
                lastMessage: 'The portfolio looks fantastic!',
                lastMessageTime: '1h ago',
                unread: false,
                messages: [
                    {
                        id: 1,
                        sender: 'sarah',
                        content: 'Hi Emma, I reviewed your portfolio submission.',
                        timestamp: new Date(Date.now() - 7200000).toISOString(),
                        read: true
                    },
                    {
                        id: 2,
                        sender: 'sarah',
                        content: 'The portfolio looks fantastic!',
                        timestamp: new Date(Date.now() - 3600000).toISOString(),
                        read: true
                    }
                ]
            }
        ]);

        // Comp Card Data
        this.set('compCard', {
            photos: {
                headshot: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&h=400&fit=crop&crop=face',
                fullbody: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=400&fit=crop',
                halfbody: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=400&fit=crop',
                profile: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=300&h=400&fit=crop',
                specialty: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=300&h=400&fit=crop'
            },
            lastUpdated: new Date().toISOString(),
            version: 1.0
        });

        // Settings Data
        this.set('settings', {
            notifications: {
                emailNotifications: true,
                smsNotifications: false,
                bookingAlerts: true,
                messageAlerts: true,
                portfolioUpdates: true,
                weeklyReports: false
            },
            privacy: {
                profileVisible: true,
                showContactInfo: true,
                allowDirectBookings: true,
                showAvailability: true,
                indexBySearchEngines: true
            },
            preferences: {
                theme: 'light',
                language: 'en',
                timezone: 'America/New_York',
                currency: 'USD',
                autoSave: true,
                compactLayout: false
            },
            account: {
                twoFactorEnabled: false,
                emailVerified: true,
                phoneVerified: false
            }
        });

        // Applications Data
        this.set('applications', [
            {
                id: 1,
                title: 'Summer Fashion Campaign',
                company: 'Nike',
                status: 'accepted',
                appliedDate: '2024-01-15',
                responseDate: '2024-01-17',
                location: 'New York, NY',
                type: 'Commercial',
                rate: '$1,200/day',
                description: 'Summer athletic wear campaign for Nike\'s new collection.'
            },
            {
                id: 2,
                title: 'Magazine Editorial Shoot',
                company: 'Vogue',
                status: 'pending',
                appliedDate: '2024-01-20',
                responseDate: null,
                location: 'Manhattan, NY',
                type: 'Editorial',
                rate: '$800/day',
                description: 'High-fashion editorial spread for Vogue magazine spring issue.'
            },
            {
                id: 3,
                title: 'Beauty Product Campaign',
                company: 'L\'Oréal',
                status: 'rejected',
                appliedDate: '2024-01-10',
                responseDate: '2024-01-12',
                location: 'Brooklyn, NY',
                type: 'Beauty',
                rate: '$1,500/day',
                description: 'New skincare line launch campaign for L\'Oréal Paris.'
            }
        ]);

        // Calendar/Bookings Data
        this.set('bookings', [
            {
                id: 1,
                title: 'Nike Campaign Shoot',
                date: '2024-02-15',
                time: '09:00 - 17:00',
                location: 'Studio A, Manhattan',
                client: 'Nike',
                status: 'confirmed',
                type: 'shoot',
                fee: '$1,200',
                notes: 'Athletic wear campaign - bring sports attire'
            },
            {
                id: 2,
                title: 'Portfolio Review Meeting',
                date: '2024-02-20',
                time: '14:00 - 15:00',
                location: 'Vogue Offices',
                client: 'Vogue Magazine',
                status: 'pending',
                type: 'meeting',
                fee: null,
                notes: 'Editorial opportunity discussion'
            }
        ]);
    }

    /**
     * Get data from localStorage
     */
    get(key) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('Error getting from localStorage:', e);
            return null;
        }
    }

    /**
     * Set data to localStorage
     */
    set(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Error setting to localStorage:', e);
            return false;
        }
    }

    /**
     * Update profile data
     */
    updateProfile(data) {
        const profile = this.get('profile') || {};
        const updated = { ...profile, ...data, lastUpdated: new Date().toISOString() };
        return this.set('profile', updated);
    }

    /**
     * Add new portfolio item
     */
    addPortfolioItem(item) {
        const portfolio = this.get('portfolio') || [];
        const newItem = {
            ...item,
            id: Date.now(),
            views: 0,
            rating: 0,
            date: new Date().toISOString().split('T')[0]
        };
        portfolio.unshift(newItem);
        return this.set('portfolio', portfolio);
    }

    /**
     * Update portfolio item
     */
    updatePortfolioItem(id, data) {
        const portfolio = this.get('portfolio') || [];
        const index = portfolio.findIndex(item => item.id === id);
        if (index !== -1) {
            portfolio[index] = { ...portfolio[index], ...data };
            return this.set('portfolio', portfolio);
        }
        return false;
    }

    /**
     * Delete portfolio item
     */
    deletePortfolioItem(id) {
        const portfolio = this.get('portfolio') || [];
        const filtered = portfolio.filter(item => item.id !== id);
        return this.set('portfolio', filtered);
    }

    /**
     * Add new message to conversation
     */
    addMessage(conversationId, message) {
        const conversations = this.get('conversations') || [];
        const convIndex = conversations.findIndex(conv => conv.id === conversationId);
        
        if (convIndex !== -1) {
            const newMessage = {
                id: Date.now(),
                sender: 'emma',
                content: message,
                timestamp: new Date().toISOString(),
                read: true
            };
            
            conversations[convIndex].messages.push(newMessage);
            conversations[convIndex].lastMessage = message;
            conversations[convIndex].lastMessageTime = 'now';
            
            return this.set('conversations', conversations);
        }
        return false;
    }

    /**
     * Update comp card data
     */
    updateCompCard(data) {
        const compCard = this.get('compCard') || {};
        const updated = { 
            ...compCard, 
            ...data, 
            lastUpdated: new Date().toISOString(),
            version: (compCard.version || 1.0) + 0.1
        };
        return this.set('compCard', updated);
    }

    /**
     * Update settings
     */
    updateSettings(section, data) {
        const settings = this.get('settings') || {};
        settings[section] = { ...settings[section], ...data };
        return this.set('settings', settings);
    }

    /**
     * Add new application
     */
    addApplication(application) {
        const applications = this.get('applications') || [];
        const newApp = {
            ...application,
            id: Date.now(),
            appliedDate: new Date().toISOString().split('T')[0],
            status: 'pending'
        };
        applications.unshift(newApp);
        return this.set('applications', applications);
    }

    /**
     * Update application status
     */
    updateApplicationStatus(id, status, responseDate = null) {
        const applications = this.get('applications') || [];
        const index = applications.findIndex(app => app.id === id);
        if (index !== -1) {
            applications[index].status = status;
            if (responseDate) {
                applications[index].responseDate = responseDate;
            }
            return this.set('applications', applications);
        }
        return false;
    }

    /**
     * Add new booking
     */
    addBooking(booking) {
        const bookings = this.get('bookings') || [];
        const newBooking = {
            ...booking,
            id: Date.now(),
            status: 'pending'
        };
        bookings.push(newBooking);
        return this.set('bookings', bookings);
    }

    /**
     * Update booking
     */
    updateBooking(id, data) {
        const bookings = this.get('bookings') || [];
        const index = bookings.findIndex(booking => booking.id === id);
        if (index !== -1) {
            bookings[index] = { ...bookings[index], ...data };
            return this.set('bookings', bookings);
        }
        return false;
    }

    /**
     * Get analytics data
     */
    getAnalytics() {
        const portfolio = this.get('portfolio') || [];
        const applications = this.get('applications') || [];
        const bookings = this.get('bookings') || [];
        
        return {
            totalPhotos: portfolio.length,
            totalViews: portfolio.reduce((sum, item) => sum + (item.views || 0), 0),
            averageRating: portfolio.length > 0 ? 
                (portfolio.reduce((sum, item) => sum + (item.rating || 0), 0) / portfolio.length).toFixed(1) : 0,
            totalApplications: applications.length,
            acceptedApplications: applications.filter(app => app.status === 'accepted').length,
            pendingApplications: applications.filter(app => app.status === 'pending').length,
            totalBookings: bookings.length,
            confirmedBookings: bookings.filter(booking => booking.status === 'confirmed').length,
            totalEarnings: bookings
                .filter(booking => booking.status === 'confirmed' && booking.fee)
                .reduce((sum, booking) => {
                    const fee = parseInt(booking.fee.replace(/[^0-9]/g, '')) || 0;
                    return sum + fee;
                }, 0)
        };
    }

    /**
     * Export all data for backup
     */
    exportData() {
        const data = {};
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(this.prefix)) {
                const cleanKey = key.replace(this.prefix, '');
                data[cleanKey] = this.get(cleanKey);
            }
        });
        return data;
    }

    /**
     * Import data from backup
     */
    importData(data) {
        try {
            Object.keys(data).forEach(key => {
                this.set(key, data[key]);
            });
            return true;
        } catch (e) {
            console.error('Error importing data:', e);
            return false;
        }
    }

    /**
     * Clear all demo data
     */
    clearAll() {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(this.prefix)) {
                localStorage.removeItem(key);
            }
        });
        this.initializeDefaults();
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} position-fixed`;
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px; opacity: 0; transition: opacity 0.3s ease;';
        
        const icon = {
            'success': 'fas fa-check-circle',
            'error': 'fas fa-exclamation-circle',
            'warning': 'fas fa-exclamation-triangle',
            'info': 'fas fa-info-circle'
        }[type] || 'fas fa-info-circle';
        
        toast.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="${icon} me-2"></i>
                <span>${message}</span>
                <button type="button" class="btn-close ms-auto" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Fade in
        setTimeout(() => toast.style.opacity = '1', 50);
        
        // Auto remove
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);
        
        return toast;
    }
}

// Create global instance
window.demoStorage = new DemoStorage();

// Auto-save functionality for forms
class AutoSave {
    constructor(formSelector, storageKey, options = {}) {
        this.form = document.querySelector(formSelector);
        this.storageKey = storageKey;
        this.options = {
            debounceTime: 1000,
            showIndicator: true,
            ...options
        };
        
        if (this.form) {
            this.init();
        }
    }

    init() {
        this.loadData();
        this.attachListeners();
        
        if (this.options.showIndicator) {
            this.createSaveIndicator();
        }
    }

    loadData() {
        const data = window.demoStorage.get(this.storageKey);
        if (data && typeof data === 'object') {
            Object.keys(data).forEach(key => {
                const element = this.form.querySelector(`[name="${key}"], #${key}`);
                if (element) {
                    if (element.type === 'checkbox') {
                        element.checked = data[key];
                    } else if (element.type === 'radio') {
                        if (element.value === data[key]) {
                            element.checked = true;
                        }
                    } else {
                        element.value = data[key];
                    }
                }
            });
        }
    }

    attachListeners() {
        let saveTimeout;
        
        this.form.addEventListener('input', (e) => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                this.saveData();
            }, this.options.debounceTime);
        });

        this.form.addEventListener('change', () => {
            clearTimeout(saveTimeout);
            this.saveData();
        });
    }

    saveData() {
        const formData = new FormData(this.form);
        const data = {};
        
        // Handle form inputs
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        // Handle checkboxes that aren't checked
        this.form.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            if (!formData.has(cb.name) && cb.name) {
                data[cb.name] = false;
            } else if (cb.name) {
                data[cb.name] = cb.checked;
            }
        });

        window.demoStorage.set(this.storageKey, data);
        
        if (this.options.showIndicator && this.indicator) {
            this.showSaveIndicator();
        }
    }

    createSaveIndicator() {
        this.indicator = document.createElement('div');
        this.indicator.className = 'position-fixed';
        this.indicator.style.cssText = 'top: 20px; left: 20px; z-index: 9999; opacity: 0; transition: opacity 0.3s ease;';
        this.indicator.innerHTML = `
            <div class="alert alert-success">
                <i class="fas fa-save me-2"></i>Auto-saved
            </div>
        `;
        document.body.appendChild(this.indicator);
    }

    showSaveIndicator() {
        if (this.indicator) {
            this.indicator.style.opacity = '1';
            setTimeout(() => {
                this.indicator.style.opacity = '0';
            }, 2000);
        }
    }
}

// Make AutoSave available globally
window.AutoSave = AutoSave;