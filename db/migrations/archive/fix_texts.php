<?php
require_once __DIR__ . '/Shared/Database.php';

try {
    $db = \FusionERP\Shared\Database::getInstance();
    
    // Fix 1: Network "contate" -> "conta"
    $stmt = $db->query("SELECT id, description FROM network_collaborations WHERE description LIKE '%contate oltre 160 giovanissime atlete%'");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as $row) {
        $newDesc = str_replace('contate oltre 160 giovanissime atlete', 'conta oltre 160 giovanissime atlete', $row['description']);
        $upd = $db->prepare("UPDATE network_collaborations SET description = ? WHERE id = ?");
        $upd->execute([$newDesc, $row['id']]);
        echo "Fixed Network ID: {$row['id']}\n";
    }

    // Fix 2: Club values commas
    $stmt = $db->query("SELECT `values` FROM societa_profile LIMIT 1");
    $profile = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($profile && $profile['values']) {
        $vals = $profile['values'];
        $vals = str_replace(
            "Si vince si cade e ci si rialza sempre insieme",
            "Si vince, si cade e ci si rialza sempre insieme",
            $vals
        );
        $vals = str_replace(
            "il profondo rispetto per le compagne per gli avversari e per le regole",
            "il profondo rispetto per le compagne, per gli avversari e per le regole",
            $vals
        );
        $upd = $db->prepare("UPDATE societa_profile SET `values` = ?");
        $upd->execute([$vals]);
        echo "Fixed Societa Profile Values\n";
    }

    // Fix 3: Foresteria capitalization
    $stmt = $db->query("SELECT id, tenant_id, description FROM foresteria_info LIMIT 1");
    $foresteria = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($foresteria && $foresteria['description']) {
        $desc = $foresteria['description'];
        
        $lines = explode("\n", $desc);
        foreach ($lines as &$line) {
            $trimmed = trim($line);
            if (empty($trimmed)) continue;
            
            if (str_starts_with($trimmed, '-')) {
                // Capitalize after dash
                $line = preg_replace_callback('/^(\s*-\s*)([a-zèé])/', function($m) {
                    return $m[1] . mb_strtoupper($m[2], 'UTF-8');
                }, $line);
            } else {
                // Capitalize first letter
                $line = preg_replace_callback('/^(\s*)([a-zèé])/', function($m) {
                    return $m[1] . mb_strtoupper($m[2], 'UTF-8');
                }, $line);
            }
        }
        $newDesc = implode("\n", $lines);
        
        $upd = $db->prepare("UPDATE foresteria_info SET description = ? WHERE id = ?");
        $upd->execute([$newDesc, $foresteria['id']]);
        echo "Fixed Foresteria Description\n";
    }

    echo "DONE\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
