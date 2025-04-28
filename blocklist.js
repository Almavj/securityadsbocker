class BlocklistManager {
    constructor() {
        if (!document.querySelector('.domain-list')) return;
        
        this.domains = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.selectedSource = 'custom';
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadBlocklist();
    }

    setupEventListeners() {
        document.getElementById('add-domain')?.addEventListener('click', () => 
            this.showModal('add-domain-modal'));
            
        document.getElementById('domain-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addNewDomain();
        });
        
        document.getElementById('update-blocklists')?.addEventListener('click', () => 
            this.updateBlocklists());
            
        document.querySelector('.modal-close')?.addEventListener('click', () => 
            this.hideModal('add-domain-modal'));
            
        document.getElementById('source-filter')?.addEventListener('change', (e) => {
            this.selectedSource = e.target.value;
            this.loadBlocklist();
        });
    }

    async loadBlocklist() {
        try {
            this.showLoadingState();
            
            const response = await fetch(
                `/api/blocklist?source=${this.selectedSource}&page=${this.currentPage}&per_page=${this.itemsPerPage}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')}`
                    }
                }
            );
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            
            if (data.success) {
                this.domains = data.domains;
                this.renderDomains();
                this.renderPagination(data.total);
            } else {
                throw new Error(data.error || 'Failed to load blocklist');
            }
        } catch (error) {
            console.error('Blocklist load error:', error);
            this.showErrorState(error.message);
        }
    }

    renderDomains() {
        const tableBody = document.querySelector('.domain-list tbody');
        tableBody.innerHTML = '';

        if (this.domains.length === 0) {
            this.renderEmptyBlocklist();
            return;
        }

        this.domains.forEach(domain => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.escapeHtml(domain.name)}</td>
                <td>${domain.source || 'custom'}</td>
                <td>${new Date(domain.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm danger" data-domain="${this.escapeHtml(domain.name)}">
                        <i class="fas fa-trash-alt"></i> Remove
                    </button>
                </td>
            `;
            tableBody.appendChild(row);

            row.querySelector('button').addEventListener('click', () => 
                this.removeDomain(domain.name));
        });
    }

    renderPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const pagination = document.querySelector('.pagination');
        
        if (!pagination || totalPages <= 1) return;
        
        pagination.innerHTML = '';
        
        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.className = 'btn btn-sm' + (this.currentPage === 1 ? ' disabled' : '');
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.loadBlocklist();
            }
        });
        pagination.appendChild(prevBtn);
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = 'btn btn-sm' + (i === this.currentPage ? ' active' : '');
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                this.currentPage = i;
                this.loadBlocklist();
            });
            pagination.appendChild(pageBtn);
        }
        
        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'btn btn-sm' + (this.currentPage === totalPages ? ' disabled' : '');
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.addEventListener('click', () => {
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.loadBlocklist();
            }
        });
        pagination.appendChild(nextBtn);
    }

    async addNewDomain() {
        const domainInput = document.getElementById('domain-input');
        const domain = domainInput.value.trim();
        
        if (!this.isValidDomain(domain)) {
            this.showAlert('Please enter a valid domain (e.g., example.com)', 'error');
            return;
        }

        try {
            const response = await fetch('/api/blocklist', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')}`
                },
                body: JSON.stringify({ 
                    name: domain, 
                    source: 'custom' 
                })
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const result = await response.json();
            
            if (result.success) {
                domainInput.value = '';
                this.hideModal('add-domain-modal');
                await this.loadBlocklist();
                this.showToast('Domain added successfully!');
            } else {
                throw new Error(result.error || 'Failed to add domain');
            }
        } catch (error) {
            console.error('Add domain error:', error);
            this.showAlert(error.message || 'Failed to add domain', 'error');
        }
    }

    async removeDomain(domain) {
        if (!confirm(`Are you sure you want to remove ${domain}?`)) return;

        try {
            const response = await fetch(`/api/blocklist?domain=${encodeURIComponent(domain)}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')}`
                }
            });
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const result = await response.json();
            
            if (result.success) {
                await this.loadBlocklist();
                this.showToast('Domain removed successfully!');
            } else {
                throw new Error(result.error || 'Failed to remove domain');
            }
        } catch (error) {
            console.error('Remove domain error:', error);
            this.showAlert(error.message || 'Failed to remove domain', 'error');
        }
    }

    async updateBlocklists() {
        const btn = document.getElementById('update-blocklists');
        if (!btn) return;
        
        const originalText = btn.innerHTML;
        
        try {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
            
            const response = await fetch('/api/blocklist/update', { 
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')}`
                }
            });
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast('Blocklists updated successfully!');
                await this.loadBlocklist();
            } else {
                throw new Error(result.error || 'Failed to update blocklists');
            }
        } catch (error) {
            console.error('Update error:', error);
            this.showAlert(error.message || 'Failed to update blocklists', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }

    // Helper methods
    isValidDomain(domain) {
        return /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(domain);
    }

    escapeHtml(unsafe) {
        return unsafe.replace(/[&<"'>]/g, (m) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[m]));
    }

    showLoadingState() {
        const tableBody = document.querySelector('.domain-list tbody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="loading-state">
                        <i class="fas fa-spinner fa-spin"></i> Loading domains...
                    </td>
                </tr>
            `;
        }
    }

    showErrorState(message = 'Failed to load blocklist') {
        const tableBody = document.querySelector('.domain-list tbody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="error-state">
                        <i class="fas fa-exclamation-triangle"></i> ${message}
                        <button class="btn btn-sm" onclick="window.location.reload()">Retry</button>
                    </td>
                </tr>
            `;
        }
    }

    renderEmptyBlocklist() {
        const tableBody = document.querySelector('.domain-list tbody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-state">
                        No domains found in blocklist
                    </td>
                </tr>
            `;
        }
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast show';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    showAlert(message, type) {
        const alertBox = document.getElementById('alert-box');
        if (alertBox) {
            alertBox.textContent = message;
            alertBox.className = `alert ${type} show`;
            setTimeout(() => alertBox.classList.remove('show'), 5000);
        }
    }

    showModal(id) {
        document.getElementById(id)?.classList.add('show');
        document.getElementById(id)?.setAttribute('aria-hidden', 'false');
    }

    hideModal(id) {
        document.getElementById(id)?.classList.remove('show');
        document.getElementById(id)?.setAttribute('aria-hidden', 'true');
    }
}

// Initialize only if on blocklist page
if (window.location.pathname.includes('blocklist')) {
    document.addEventListener('DOMContentLoaded', () => new BlocklistManager());
}