<?php

$apiModulesDir = __DIR__ . '/../api/Modules/';

if (!is_dir($apiModulesDir)) {
    die("Directory non trovata: $apiModulesDir\n");
}

$modules = scandir($apiModulesDir);
$allEndpoints = [];
$syntaxErrors = [];

echo "=== INIZIO VERIFICA STATICA API ===\n";

foreach ($modules as $module) {
    if ($module === '.' || $module === '..') continue;
    
    $moduleDir = $apiModulesDir . $module;
    if (is_dir($moduleDir)) {
        $controllerFile = $moduleDir . '/' . $module . 'Controller.php';
        
        if (file_exists($controllerFile)) {
            // 1. Syntax check
            $output = [];
            $returnVar = 0;
            exec("php -l " . escapeshellarg($controllerFile) . " 2>&1", $output, $returnVar);
            if ($returnVar !== 0) {
                $syntaxErrors[$module] = implode("\n", $output);
                echo "❌ Errore Sintassi in $module" . "Controller.php\n";
            } else {
                echo "✅ Sintassi OK: $module\n";
            }
            
            // 2. Class Reflection extraction
            $className = "FusionERP\\Modules\\$module\\{$module}Controller";
            try {
                // We need to require the file to reflect it
                require_once $controllerFile;
                if (class_exists($className)) {
                    $reflection = new ReflectionClass($className);
                    $methods = $reflection->getMethods(ReflectionMethod::IS_PUBLIC);
                    $endpoints = [];
                    foreach ($methods as $method) {
                        // ignore constructors/magic methods
                        if (!str_starts_with($method->getName(), '__')) {
                            $endpoints[] = escapeshellarg($method->getName());
                        }
                    }
                    $allEndpoints[$module] = $endpoints;
                }
            } catch (Throwable $e) {
                echo "⚠️ Errore durante il caricamento di $className: " . $e->getMessage() . "\n";
            }
        } else {
            echo "⚠️ Controller NON TROVATO per $module in $controllerFile\n";
        }
    }
}

echo "\n\n=== RIEPILOGO ENDPOINT ===\n";
$totalModules = count($allEndpoints);
$totalEndpoints = 0;

foreach ($allEndpoints as $module => $endpoints) {
    echo str_pad($module, 20) . " | " . count($endpoints) . " endpoints: " . implode(", ", array_map(function($e) { return trim($e, "'\""); }, $endpoints)) . "\n";
    $totalEndpoints += count($endpoints);
}

echo "\n----------------------------------------\n";
echo "Moduli Trovati: $totalModules\n";
echo "Endpoint Totali Scoperti: $totalEndpoints\n";

if (!empty($syntaxErrors)) {
    echo "\n\n=== ERRORE SINTASSI PHP ===\n";
    foreach ($syntaxErrors as $mod => $err) {
        echo "[$mod]\n$err\n";
    }
} else {
    echo "\n✅ Nessun errore di sintassi PHP trovato in alcun modulo API.\n";
}

?>
