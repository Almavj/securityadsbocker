<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config.php';

$blocklistFile = __DIR__ . '/../data/blocklist.json';
$sources = [
    'https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts',
    'https://mirror1.malwaredomains.com/files/justdomains',
    'https://pgl.yoyo.org/adservers/serverlist.php?hostformat=nohtml'
];

try {
    $existingData = file_exists($blocklistFile) ? 
        json_decode(file_get_contents($blocklistFile), true) : 
        ['domains' => [], 'last_updated' => 0];

    $newDomains = [];
    
    foreach ($sources as $source) {
        $content = file_get_contents($source);
        $lines = explode("\n", $content);
        
        foreach ($lines as $line) {
            if (empty($line) || strpos($line, '#') === 0) continue;
            
            // Extract domain (handles different formats)
            if (preg_match('/^(?:0\.0\.0\.0|127\.0\.0\.1)\s+([^\s#]+)/', $line, $matches)) {
                $domain = strtolower(trim($matches[1]));
                if (!in_array($domain, $existingData['domains'])) {
                    $newDomains[] = $domain;
                }
            } elseif (preg_match('/^([a-z0-9.-]+)$/i', $line, $matches)) {
                $domain = strtolower(trim($matches[1]));
                if (!in_array($domain, $existingData['domains'])) {
                    $newDomains[] = $domain;
                }
            }
        }
    }

    // Merge and deduplicate
    $updatedDomains = array_unique(array_merge(
        $existingData['domains'],
        $newDomains
    ));

    // Save updated list
    file_put_contents($blocklistFile, json_encode([
        'domains' => $updatedDomains,
        'last_updated' => time(),
        'new_domains' => count($newDomains)
    ]));

    echo json_encode([
        'success' => true,
        'updated' => count($updatedDomains),
        'added' => count($newDomains)
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}