<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config.php';

$logsFile = __DIR__ . '/../data/request_logs.json';

// Initialize if not exists
if (!file_exists($logsFile)) {
    file_put_contents($logsFile, json_encode([]));
}

try {
    $logs = json_decode(file_get_contents($logsFile), true);
    $filter = $_GET['filter'] ?? 'all';

    // Apply filter
    $filteredLogs = array_filter($logs, function($log) use ($filter) {
        if ($filter === 'all') return true;
        return $filter === 'blocked' ? $log['blocked'] : !$log['blocked'];
    });

    // Get stats
    $now = time();
    $today = strtotime('today midnight');
    $week = strtotime('-7 days');
    $month = strtotime('-30 days');

    $stats = [
        'total_blocked' => count(array_filter($logs, fn($log) => $log['blocked'])),
        'today_blocked' => count(array_filter($logs, fn($log) => 
            $log['blocked'] && $log['timestamp'] >= $today)),
        'week_blocked' => count(array_filter($logs, fn($log) => 
            $log['blocked'] && $log['timestamp'] >= $week)),
        'month_blocked' => count(array_filter($logs, fn($log) => 
            $log['blocked'] && $log['timestamp'] >= $month)),
        'bandwidth_saved' => array_sum(array_column($logs, 'size'))
    ];

    echo json_encode([
        'success' => true,
        'logs' => array_values($filteredLogs),
        'stats' => $stats
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}