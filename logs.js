document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const logsTable = document.getElementById('logs-table');
    const loadingIndicator = document.getElementById('loading-logs');
    const tbody = logsTable.querySelector('tbody');
    
    // Sample data (replace with real API calls)
    const sampleLogs = [
        {
            time: '2023-06-15 14:30:22',
            app: 'Chrome',
            domain: 'ads.google.com',
            status: 'blocked',
            action: 'view'
        },
        {
            time: '2023-06-15 14:31:45',
            app: 'Firefox',
            domain: 'analytics.facebook.com',
            status: 'blocked',
            action: 'view'
        },
        {
            time: '2023-06-15 14:32:10',
            app: 'Safari',
            domain: 'api.example.com',
            status: 'allowed',
            action: 'view'
        },
        {
            time: '2023-06-15 14:33:27',
            app: 'Edge',
            domain: 'tracker.adnetwork.com',
            status: 'blocked',
            action: 'view'
        },
        {
            time: '2023-06-15 14:35:42',
            app: 'Chrome',
            domain: 'metrics.company.org',
            status: 'allowed',
            action: 'view'
        }
    ];

    // Stats data
    const statsData = {
        totalRequests: 1248,
        blockedRequests: 892,
        allowedRequests: 356,
        uniqueDomains: 187
    };

    // Initialize the page
    function initPage() {
        loadLogs();
        updateStats();
        setupEventListeners();
    }

    // Load logs into the table
    function loadLogs() {
        loadingIndicator.style.display = 'flex';
        
        // Simulate API delay
        setTimeout(() => {
            tbody.innerHTML = '';
            
            sampleLogs.forEach(log => {
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td>${log.time}</td>
                    <td>${log.app}</td>
                    <td>${log.domain}</td>
                    <td><span class="badge ${log.status}">${log.status === 'blocked' ? 'Blocked' : 'Allowed'}</span></td>
                    <td><button class="btn-icon view-details" data-domain="${log.domain}"><i class="fas fa-eye"></i></button></td>
                `;
                
                tbody.appendChild(row);
            });
            
            loadingIndicator.style.display = 'none';
        }, 800);
    }

    // Update stats cards
    function updateStats() {
        const statsContainer = document.querySelector('.logs-stats');
        
        if (!statsContainer) return;
        
        statsContainer.innerHTML = `
            <div class="stat-card">
                <h3>Total Requests</h3>
                <div class="value">${statsData.totalRequests.toLocaleString()}</div>
            </div>
            <div class="stat-card">
                <h3>Blocked Requests</h3>
                <div class="value">${statsData.blockedRequests.toLocaleString()}</div>
            </div>
            <div class="stat-card">
                <h3>Allowed Requests</h3>
                <div class="value">${statsData.allowedRequests.toLocaleString()}</div>
            </div>
            <div class="stat-card">
                <h3>Unique Domains</h3>
                <div class="value">${statsData.uniqueDomains.toLocaleString()}</div>
            </div>
        `;
    }

    // Set up event listeners
    function setupEventListeners() {
        // View details button click
        document.addEventListener('click', function(e) {
            if (e.target.closest('.view-details')) {
                const button = e.target.closest('.view-details');
                const domain = button.getAttribute('data-domain');
                showLogDetails(domain);
            }
        });
        
        // You can add more event listeners here for filtering, pagination, etc.
    }

    // Show log details (example function)
    function showLogDetails(domain) {
        // In a real app, this would show a modal or navigate to a details page
        console.log(`Showing details for domain: ${domain}`);
        alert(`Details for: ${domain}\nThis would show more information about the request in a real application.`);
    }

    // Initialize the page
    initPage();
});