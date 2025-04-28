import api from './api.js';

class StatsCharts {
    constructor() {
        this.ctx = document.getElementById('adsChart');
        if (!this.ctx) return;
        
        this.chart = null;
        this.timeRange = 'week';
        this.init();
    }

    async init() {
        try {
            await this.setupEventListeners();
            await this.loadData();
            this.renderChart();
        } catch (error) {
            console.error('Chart initialization failed:', error);
            this.showErrorState();
        }
    }

    async setupEventListeners() {
        document.querySelectorAll('.time-filter').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelector('.time-filter.active')?.classList.remove('active');
                btn.classList.add('active');
                this.timeRange = btn.dataset.range;
                this.refreshChart();
            });
        });

        document.getElementById('refresh-dashboard')?.addEventListener('click', () => {
            this.refreshChart();
        });
    }

    async loadData() {
        try {
            const { stats } = await api.getLogs({ range: this.timeRange });
            if (!stats) throw new Error('No stats data received');
            this.stats = stats;
        } catch (error) {
            console.error('Failed to load stats:', error);
            throw error;
        }
    }

    renderChart() {
        if (!this.stats) return;
        
        if (this.chart) {
            this.chart.destroy();
        }

        const labels = this.generateLabels();
        const data = this.generateData();

        this.chart = new Chart(this.ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Ads Blocked',
                    data: data,
                    backgroundColor: 'rgba(139, 92, 246, 0.7)',
                    borderColor: 'rgba(139, 92, 246, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: this.getChartOptions()
        });
    }

    generateLabels() {
        if (this.timeRange === 'day') {
            return Array.from({length: 24}, (_, i) => `${i}:00`);
        } else if (this.timeRange === 'week') {
            return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        } else {
            const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).getDate();
            return Array.from({length: daysInMonth}, (_, i) => i+1);
        }
    }

    generateData() {
        // This should be replaced with actual data mapping from API response
        const count = this.timeRange === 'day' ? 24 : 
                     this.timeRange === 'week' ? 7 : 
                     new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).getDate();
        
        return Array.from({length: count}, () => 
            Math.floor(Math.random() * 1000) * (this.timeRange === 'month' ? 5 : 1)
        );
    }

    getChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.dataset.label}: ${context.raw.toLocaleString()}`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: (value) => value.toLocaleString() }
                }
            }
        };
    }

    async refreshChart() {
        try {
            await this.loadData();
            this.renderChart();
        } catch (error) {
            console.error('Failed to refresh chart:', error);
            this.showErrorState();
        }
    }

    showErrorState() {
        this.ctx.closest('.chart-container').innerHTML = `
            <div class="chart-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load chart data</p>
                <button class="btn btn-sm" onclick="location.reload()">Retry</button>
            </div>
        `;
    }
}

// Initialize only if on dashboard page
if (window.location.pathname.includes('dashboard')) {
    document.addEventListener('DOMContentLoaded', () => new StatsCharts());
}