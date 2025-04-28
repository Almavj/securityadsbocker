// Main application functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize systems
    checkAuthStatus();
    initDarkMode();
    fetchSystemStatus();
    initAdBlocker();
    setupRouter();
    
    // Update dashboard metrics in real-time
    setInterval(updateDashboardMetrics, 3000);
    
    // Hide loading screen
    setTimeout(() => {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }, 1000);
});

// Dark mode toggle
function initDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Check for saved preference or use system preference
    const currentMode = localStorage.getItem('darkMode') || 
                       (prefersDarkScheme.matches ? 'enabled' : 'disabled');
    
    if (currentMode === 'enabled') {
        document.body.classList.add('dark-mode');
        darkModeToggle.setAttribute('aria-pressed', 'true');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // Toggle dark mode
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        
        darkModeToggle.setAttribute('aria-pressed', isDarkMode.toString());
        darkModeToggle.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        
        localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
    });
    
    // Watch for system preference changes
    prefersDarkScheme.addEventListener('change', e => {
        if (localStorage.getItem('darkMode') === null) {
            document.body.classList.toggle('dark-mode', e.matches);
            darkModeToggle.setAttribute('aria-pressed', e.matches.toString());
            darkModeToggle.innerHTML = e.matches ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        }
    });
}

// SPA Router
function setupRouter() {
    // Show home content by default
    window.location.hash = window.location.hash || '#home';
    
    // Handle navigation
    window.addEventListener('hashchange', function() {
        loadContent(window.location.hash.substring(1));
    });
    
    // Initial load
    loadContent(window.location.hash.substring(1));
}

function loadContent(section) {
    // Highlight active nav item
    document.querySelectorAll('.main-nav a').forEach(link => {
        const isActive = link.getAttribute('href') === `#${section}`;
        link.classList.toggle('active', isActive);
        link.setAttribute('aria-current', isActive ? 'page' : null);
    });
    
    // For demo purposes - in a real app, this would fetch content
    if (section !== 'home') {
        const homeContent = document.getElementById('home-content');
        if (homeContent) homeContent.style.display = 'none';
        
        const dynamicContent = document.getElementById('dynamic-content');
        if (dynamicContent) {
            dynamicContent.innerHTML = `
                <section class="content-section container">
                    <h2>${escapeHtml(section.charAt(0).toUpperCase() + section.slice(1))}</h2>
                    <p>This is the ${escapeHtml(section)} section. The persistent dashboard remains visible at the top.</p>
                    ${section === 'blocklist' ? `
                    <div class="blocklist-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>IP/Domain</th>
                                    <th>Threat Type</th>
                                    <th>First Detected</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>192.168.1.105</td>
                                    <td>Malware</td>
                                    <td>2024-03-15</td>
                                    <td><button class="btn small">Remove</button></td>
                                </tr>
                                <tr>
                                    <td>ads.malicious.com</td>
                                    <td>Adware</td>
                                    <td>2024-03-14</td>
                                    <td><button class="btn small">Remove</button></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    ` : ''}
                    ${section === 'dashboard' ? `
                    <div class="dashboard-grid">
                        <div class="dashboard-widget">
                            <h3><i class="fas fa-chart-line"></i> Traffic Overview</h3>
                            <div class="chart-container" id="traffic-chart"></div>
                        </div>
                        <div class="dashboard-widget">
                            <h3><i class="fas fa-shield-alt"></i> Threat Distribution</h3>
                            <div class="chart-container" id="threat-chart"></div>
                        </div>
                    </div>
                    ` : ''}
                    ${section === 'logs' ? `
                    <div class="logs-container">
                        <div class="log-filters">
                            <select class="log-type-filter">
                                <option value="all">All Logs</option>
                                <option value="security">Security</option>
                                <option value="network">Network</option>
                                <option value="system">System</option>
                            </select>
                            <input type="text" class="log-search" placeholder="Search logs...">
                        </div>
                        <div class="log-entries">
                            <div class="log-entry">
                                <div class="log-timestamp">2024-03-15 14:32:45</div>
                                <div class="log-type security">SECURITY</div>
                                <div class="log-message">Blocked malicious connection attempt from 192.168.1.105</div>
                            </div>
                            <div class="log-entry">
                                <div class="log-timestamp">2024-03-15 14:30:12</div>
                                <div class="log-type network">NETWORK</div>
                                <div class="log-message">Bandwidth threshold exceeded on port 443</div>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                </section>
            `;
            
            // Initialize charts if this is the dashboard
            if (section === 'dashboard' && typeof initCharts === 'function') {
                initCharts();
            }
        }
    } else {
        const homeContent = document.getElementById('home-content');
        if (homeContent) homeContent.style.display = 'block';
    }
}

// Enhanced System Status
function fetchSystemStatus() {
    // Simulate API call
    setTimeout(() => {
        const statusData = {
            status: 'active',
            threats_blocked: Math.floor(Math.random() * 100),
            blocklist_count: 2487,
            last_updated: new Date().toLocaleTimeString(),
            components: {
                firewall: { status: 'active', threats: 12 },
                ips: { status: 'active', threats: 5 },
                adblock: { status: 'active', blocked: 3421 }
            }
        };
        
        const statusContainer = document.getElementById('systemStatus');
        if (statusContainer) {
            statusContainer.innerHTML = `
                <div class="status-card ${statusData.status === 'active' ? 'success' : 'error'}">
                    <h3><i class="fas fa-firewall" aria-hidden="true"></i> Security Status</h3>
                    <p><span class="status-indicator status-${statusData.status === 'active' ? 'active' : 'danger'}" aria-hidden="true"></span>
                    ${escapeHtml(statusData.status === 'active' ? 'All systems operational' : 'Security systems impaired')}</p>
                    <p>Last Updated: ${escapeHtml(statusData.last_updated)}</p>
                </div>
                <div class="status-card ${statusData.threats_blocked > 0 ? 'warning' : 'success'}">
                    <h3><i class="fas fa-shield-virus" aria-hidden="true"></i> Threat Prevention</h3>
                    <p>${escapeHtml(statusData.threats_blocked)} threats blocked today</p>
                    <p>${escapeHtml(statusData.blocklist_count)} active protection rules</p>
                </div>
                <div class="status-card">
                    <h3><i class="fas fa-network-wired" aria-hidden="true"></i> Network Activity</h3>
                    <p>12.4 Mbps incoming / 5.2 Mbps outgoing</p>
                    <p>42 active connections</p>
                </div>
            `;
        }
    }, 800);
}

// Update persistent dashboard metrics
function updateDashboardMetrics() {
    // Simulate live data updates
    const liveThreats = document.getElementById('live-threats');
    if (liveThreats) {
        liveThreats.textContent = Math.floor(Math.random() * 10);
    }
    
    const adsBlocked = document.getElementById('ads-blocked');
    if (adsBlocked) {
        adsBlocked.textContent = (parseInt(adsBlocked.textContent) + Math.floor(Math.random() * 5)).toLocaleString();
    }
    
    const bandwidthUsage = document.getElementById('bandwidth-usage');
    if (bandwidthUsage) {
        bandwidthUsage.textContent = (10 + Math.random() * 5).toFixed(1) + ' Mbps';
    }
    
    const lastUpdated = document.getElementById('last-updated');
    if (lastUpdated) {
        lastUpdated.textContent = new Date().toLocaleTimeString();
    }
}

// Basic XSS protection
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Check auth status (placeholder)
function checkAuthStatus() {
    // In a real app, this would check cookies/localStorage for auth tokens
    // and verify them with the server
    console.log('[Auth] Checking authentication status');
}