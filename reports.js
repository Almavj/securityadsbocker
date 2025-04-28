// ===== LOGS REPORT FUNCTIONALITY =====
document.addEventListener('DOMContentLoaded', function() {
    // Load logs from API (simulated)
    loadLogs();

    // Filter buttons
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('resetFilters').addEventListener('click', resetFilters);

    // Export buttons
    document.getElementById('exportPDF').addEventListener('click', exportPDF);
    document.getElementById('exportCSV').addEventListener('click', exportCSV);
    document.getElementById('exportJSON').addEventListener('click', exportJSON);

    // Pagination
    document.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', () => loadPage(parseInt(btn.textContent)));
    });

    // Sorting
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', () => sortTable(btn.getAttribute('data-column')));
    });
});

// Load logs (simulated API call)
function loadLogs() {
    fetch('/api/logs')
        .then(response => response.json())
        .then(data => renderLogs(data))
        .catch(error => console.error('Error loading logs:', error));
}

// Apply filters
function applyFilters() {
    const filters = {
        dateFrom: document.getElementById('dateFrom').value,
        dateTo: document.getElementById('dateTo').value,
        severity: document.getElementById('severity').value,
        sourceIP: document.getElementById('sourceIP').value,
        destinationIP: document.getElementById('destinationIP').value,
        eventType: document.getElementById('eventType').value
    };
    
    fetch('/api/logs?' + new URLSearchParams(filters))
        .then(response => response.json())
        .then(data => renderLogs(data));
}

// Reset filters
function resetFilters() {
    document.querySelectorAll('.filter-group input, .filter-group select').forEach(el => {
        el.value = el.tagName === 'SELECT' ? 'all' : '';
    });
    loadLogs();
}

// Render logs in table
function renderLogs(logs) {
    const tableBody = document.getElementById('logsTableBody');
    tableBody.innerHTML = logs.map(log => `
        <tr>
            <td>${log.timestamp}</td>
            <td><span class="log-severity severity-${log.severity}">${log.severity}</span></td>
            <td>${log.sourceIP}</td>
            <td>${log.destinationIP}</td>
            <td>${log.eventType}</td>
            <td>${log.description}</td>
            <td><button class="btn small" onclick="showLogDetails('${log.id}')"><i class="fas fa-search"></i> Details</button></td>
        </tr>
    `).join('');
}

// Export functions (placeholders)
function exportPDF() {
    alert("PDF export would generate here (use libraries like jsPDF)");
}

function exportCSV() {
    alert("CSV export would generate here");
}

function exportJSON() {
    alert("JSON export would generate here");
}

// Sort table
function sortTable(column) {
    const table = document.querySelector('.logs-table');
    const rows = Array.from(table.querySelectorAll('tr:not(:first-child)'));
    
    rows.sort((a, b) => {
        const aValue = a.querySelector(`td:nth-child(${getColumnIndex(column)})`).textContent;
        const bValue = b.querySelector(`td:nth-child(${getColumnIndex(column)})`).textContent;
        return aValue.localeCompare(bValue);
    });
    
    table.tBodies[0].append(...rows);
}

// Helper: Get column index by name
function getColumnIndex(columnName) {
    const headers = Array.from(document.querySelectorAll('.logs-table th'));
    return headers.findIndex(th => th.textContent.trim().startsWith(columnName)) + 1;
}