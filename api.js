class API {
    constructor() {
        this.baseUrl = '/api';
        this.token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    }

    async request(endpoint, method = 'GET', data = null) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const config = {
            method,
            headers,
            credentials: 'include'
        };

        if (data) {
            config.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, config);
            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.error || 'API request failed');
            }

            return responseData;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Blocklist API
    async getBlocklist() {
        return this.request('/blocklist');
    }

    async addDomain(domain) {
        return this.request('/blocklist', 'POST', { domain });
    }

    async removeDomain(domain) {
        return this.request(`/blocklist?domain=${encodeURIComponent(domain)}`, 'DELETE');
    }

    // Logs API
    async getLogs(filter = 'all') {
        return this.request(`/logs?filter=${filter}`);
    }

    async clearLogs() {
        return this.request('/logs', 'DELETE');
    }

    // System API
    async getSystemStatus() {
        return this.request('/system/status');
    }

    async updateIptables(rules) {
        return this.request('/system/iptables', 'POST', { rules });
    }

    // Auth API
    async login(email, password, remember) {
        const data = await this.request('/auth/login', 'POST', { email, password });
        if (remember) {
            localStorage.setItem('auth_token', data.token);
        } else {
            sessionStorage.setItem('auth_token', data.token);
        }
        this.token = data.token;
        return data;
    }

    async logout() {
        await this.request('/auth/logout', 'POST');
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
        this.token = null;
    }
}

const api = new API();
export default api;