<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config.php';

// Validate admin session
session_start();
if (!isset($_SESSION['admin']) || !$_SESSION['admin']) {
    http_response_code(403);
    die(json_encode(['error' => 'Forbidden']));
}

// Validate input
$data = json_decode(file_get_contents('php://input'), true);
if (!isset($data['rules']) || !is_array($data['rules'])) {
    http_response_code(400);
    die(json_encode(['error' => 'Invalid input']));
}

// Allowed commands whitelist
$allowedCommands = [
    'INPUT -p tcp --dport 80 -j ACCEPT',
    'INPUT -p tcp --dport 443 -j ACCEPT',
    'INPUT -p icmp -j ACCEPT'
];

// Validate rules
$validRules = [];
foreach ($data['rules'] as $rule) {
    if (in_array($rule, $allowedCommands)) {
        $validRules[] = escapeshellarg($rule);
    }
}

// Execute commands safely
$output = [];
foreach ($validRules as $rule) {
    $cmd = "/sbin/iptables -A $rule 2>&1";
    exec($cmd, $cmdOutput, $returnCode);
    
    if ($returnCode !== 0) {
        // Revert changes
        exec('/sbin/iptables-restore < /etc/iptables.lastgood');
        http_response_code(500);
        die(json_encode(['error' => 'Failed to apply rules']));
    }
    
    $output[] = $cmdOutput;
}

// Save good config
exec('/sbin/iptables-save > /etc/iptables.lastgood');

http_response_code(200);
echo json_encode([
    'success' => true,
    'applied_rules' => count($validRules)
]);


<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config.php';

// Security check - only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Validate input
$input = json_decode(file_get_contents('php://input'), true);
if (!isset($input['rules']) || !is_array($input['rules'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid rules format']);
    exit;
}

try {
    $output = [];
    $success = true;
    
    // Flush existing rules
    exec('sudo iptables -F', $output, $returnCode);
    if ($returnCode !== 0) $success = false;
    
    // Apply new rules
    foreach ($input['rules'] as $rule) {
        $cmd = "sudo iptables -A " . escapeshellarg($rule);
        exec($cmd, $output, $returnCode);
        if ($returnCode !== 0) $success = false;
    }
    
    // Save rules
    exec('sudo iptables-save > /etc/iptables.rules', $output, $returnCode);
    if ($returnCode !== 0) $success = false;
    
    if ($success) {
        echo json_encode([
            'success' => true,
            'message' => 'iptables rules updated successfully'
        ]);
    } else {
        throw new Exception('Failed to apply all rules');
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
