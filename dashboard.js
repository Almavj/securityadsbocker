// dashboard.js

// Dark Mode Toggle Functionality
const darkModeToggle = document.getElementById('darkModeToggle');
const body = document.body;

darkModeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-theme');
    // Save the theme in localStorage to persist across sessions
    const theme = body.classList.contains('dark-theme') ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
});

// Load saved theme from localStorage
window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        body.classList.add('dark-theme');
    }
});

// Chart.js Configurations
const threatsChart = document.getElementById('threatsChart').getContext('2d');
const sourcesChart = document.getElementById('sourcesChart').getContext('2d');

// Dummy Data for Charts (Replace with real data)
const threatsData = {
    labels: ['7d', '30d', '90d'],
    datasets: [
        {
            label: 'Threats Blocked',
            data: [1248, 1532, 1890],
            borderColor: '#FF5733',
            backgroundColor: 'rgba(255, 87, 51, 0.2)',
            borderWidth: 2,
            tension: 0.3
        }
    ]
};

const sourcesData = {
    labels: ['Direct', 'Referral', 'Organic', 'Social'],
    datasets: [
        {
            label: 'Traffic Sources',
            data: [40, 20, 30, 10],
            backgroundColor: ['#FFEB3B', '#4CAF50', '#2196F3', '#F44336'],
            hoverOffset: 4
        }
    ]
};

// Initialize the Threats Blocked Chart (Line Chart)
new Chart(threatsChart, {
    type: 'line',
    data: threatsData,
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true
            }
        },
        plugins: {
            tooltip: {
                enabled: true
            },
            legend: {
                position: 'top'
            }
        }
    }
});

// Initialize the Traffic Sources Chart (Doughnut Chart)
new Chart(sourcesChart, {
    type: 'doughnut',
    data: sourcesData,
    options: {
        responsive: true,
        plugins: {
            tooltip: {
                enabled: true
            },
            legend: {
                position: 'top'
            }
        }
    }
});

// Time Filter for Threats Blocked Chart (7D, 30D, 90D)
const timeFilterButtons = document.querySelectorAll('.time-filter');
timeFilterButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        timeFilterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        const range = button.getAttribute('data-range');
        // Update the chart based on selected range
        updateThreatsChart(range);
    });
});

function updateThreatsChart(range) {
    const data = {
        '7d': [1248, 1532, 1890],
        '30d': [1567, 1789, 2023],
        '90d': [1789, 2000, 2200]
    };
    threatsChart.data.datasets[0].data = data[range];
    threatsChart.update();
}

// Notification System (Sample Logic)
const notificationBell = document.querySelector('.notification-bell');
const notificationCount = document.querySelector('.notification-count');

let notifications = [
    'Malware detected on malware-domain.com',
    'Ad Network Blocked: ads.doubleclick.net',
    'Phishing attempt blocked on fake-login.com'
];

// Update notification count
notificationCount.textContent = notifications.length;

// Display notifications (In this example, just logging to console)
notificationBell.addEventListener('click', () => {
    notifications.forEach(notification => {
        console.log(notification);
    });
    // Clear notifications (you could modify this as needed)
    notifications = [];
    notificationCount.textContent = '0';
});
