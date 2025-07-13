// Navigation Handler for Model Dashboard
// Makes sidebar navigation functional and updates content dynamically

document.addEventListener('DOMContentLoaded', function() {
    // Handle sidebar navigation clicks
    document.addEventListener('click', function(e) {
        const navLink = e.target.closest('.nav-link');
        if (!navLink || !navLink.getAttribute('href')?.startsWith('#')) return;
        
        e.preventDefault();
        const targetTab = navLink.getAttribute('href').substring(1);
        
        // Remove active class from all nav items
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active', 'bg-primary', 'rounded');
        });
        
        // Add active class to clicked item
        navLink.classList.add('active', 'bg-primary', 'rounded');
        
        // Show corresponding tab content
        showTabContent(targetTab);
    });
});

function showTabContent(tabName) {
    // Get the tab buttons and find the matching one
    const tabButtons = document.querySelectorAll('.nav-tabs .nav-link');
    const tabContents = document.querySelectorAll('.tab-pane');
    
    // Find and activate the correct tab
    tabButtons.forEach((button, index) => {
        const buttonText = button.textContent.trim().toLowerCase();
        const targetMatch = tabName.toLowerCase();
        
        if (buttonText.includes(targetMatch) || targetMatch.includes(buttonText)) {
            // Remove active from all tabs
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => {
                content.classList.remove('show', 'active');
            });
            
            // Activate the target tab
            button.classList.add('active');
            if (tabContents[index]) {
                tabContents[index].classList.add('show', 'active');
            }
        }
    });
    
    // Special handling for tabs that don't exist yet
    const specialTabs = {
        'profile': 'settings',
        'bookings': 'availability',
        'messages': 'messages',
        'academy': 'academy',
        'documents': 'documents'
    };
    
    if (specialTabs[tabName]) {
        const targetTabName = specialTabs[tabName];
        tabButtons.forEach((button, index) => {
            if (button.textContent.trim().toLowerCase().includes(targetTabName)) {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => {
                    content.classList.remove('show', 'active');
                });
                
                button.classList.add('active');
                if (tabContents[index]) {
                    tabContents[index].classList.add('show', 'active');
                }
            }
        });
    }
}

// Add smooth scrolling to top when changing tabs
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Auto-hide mobile sidebar after navigation
function hideMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('show');
    }
}

// Enhanced navigation with analytics tracking (for demo purposes)
function trackNavigation(section) {
    console.log(`Navigation: User viewed ${section} section`);
    
    // Update page title to reflect current section
    const baseTitle = 'Model Dashboard - Emma Johnson';
    document.title = section ? `${section} - ${baseTitle}` : baseTitle;
}