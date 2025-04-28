<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config.php';

// Security headers
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");

// Only allow authenticated requests
session_start();
if (!isset($_SESSION['authenticated'])) {
    http_response_code(403);
    die(json_encode(['error' => 'Unauthorized access']));
}

try {
    // Safe command execution wrapper
    function safe_exec($cmd) {
        $allowed_commands = [
            '/usr/bin/iptables -L -n',
            '/usr/bin/free -m'
        ];
        
        if (!in_array($cmd, $allowed_commands)) {
            throw new Exception("Command not allowed");
        }
        
        $output = [];
        $return_var = 0;
        exec("sudo " . escapeshellcmd($cmd) . " 2>&1", $output, $return_var);
        
        if ($return_var !== 0) {
            throw new Exception("Command execution failed");
        }
        
        return $output;
    }

    // Check services - more reliable method
    $services = [
        'iptables' => false,
        'firewalld' => false
    ];
    
    // Check iptables service properly
    $iptablesOutput = safe_exec('/usr/bin/iptables -L -n');
    $services['iptables'] = (strpos(implode("\n", $iptablesOutput), 'DROP') !== false);
    
    // Get system metrics with validation
    $load = sys_getloadavg();
    $load = array_map('floatval', $load); // Ensure numeric values
    
    $memory = [];
    $freeOutput = safe_exec('/usr/bin/free -m');
    if (preg_match('/Mem:\s+(\d+)\s+(\d+)/', implode("\n", $freeOutput), $matches)) {
        $memory = [
            'total' => (int)$matches[1],
            'used' => (int)$matches[2],
            'unit' => 'MB'
        ];
    }

    // Prepare response
    $response = [
        'success' => true,
        'status' => $services['iptables'] ? 'active' : 'inactive',
        'threats_blocked' => rand(0, 50), // Replace with actual metric
        'blocklist_count' => rand(5, 200), // Replace with actual count
        'system_load' => $load,
        'memory_usage' => $memory,
        'last_updated' => date('Y-m-d H:i:s'),
        'timestamp' => time()
    ];

    // Cache control
    header("Cache-Control: no-store, max-age=0");
    echo json_encode($response, JSON_NUMERIC_CHECK);

} catch (Exception $e) {
    http_response_code(500);
    error_log("System Status Error: " . $e->getMessage());
    echo json_encode([
        'error' => 'System status unavailable',
        'details' => (ENVIRONMENT === 'development') ? $e->getMessage() : null
    ]);
}