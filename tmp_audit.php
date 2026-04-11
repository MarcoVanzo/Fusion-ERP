<?php

// A helper script to do static analysis and gather data for the audit report.
$report = [
    'router_actions' => [],
    'controller_actions' => [],
    'missing_auth' => [],
    'missing_tenant' => [],
    'unmatched_routes' => [],
    'todos' => [],
    'env_diff' => [],
    'db_columns_repo' => []
];

// Phase 2: Router and Controllers
$routerFile = __DIR__ . '/api/router.php'; // or where is the router?
if (!file_exists($routerFile)) {
    // Might be somewhere else
    $routerFile = glob(__DIR__ . '/api/*/router.php')[0] ?? glob(__DIR__ . '/api/router*.php')[0] ?? null;
}
if ($routerFile && file_exists($routerFile)) {
    $routerContent = file_get_contents($routerFile);
    // basic matching
}

$controllers = glob(__DIR__ . '/api/Modules/*/Controller.php');
if (is_array($controllers)) {
    foreach ($controllers as $ctrl) {
        $content = file_get_contents($ctrl);
        $moduleName = basename(dirname($ctrl));
        
        // Check all methods
        preg_match_all('/public\s+function\s+([a-zA-Z0-9_]+)/', $content, $matches);
        $methods = $matches[1];
        
        foreach ($methods as $method) {
            if ($method === '__construct') continue;
            
            $methodCode = '';
            $startPos = strpos($content, "function $method");
            if ($startPos !== false) {
                $nextPos = posix_next($content, $startPos);
                // simple substr up to next public function or end of file
                $nextFun = strpos($content, "public function", $startPos + 10);
                $len = $nextFun === false ? strlen($content) - $startPos : $nextFun - $startPos;
                $methodCode = substr($content, $startPos, $len);
                
                // Check auth for write operations
                $isWriteAction = preg_match('/(?:create|update|delete|save|insert|add|remove|edit)/i', $method);
                if ($isWriteAction) {
                    if (!preg_match('/Auth::(?:requireRole|requireWrite|requireRead|requireAdmin|requireSuperAdmin|requireManager|requireLogistics)/i', $methodCode) && !preg_match('/\$this->require(?:Role|Write|Read)/i', $methodCode)) {
                        $lineCount = substr_count(substr($content, 0, $startPos), "\n") + 1;
                        $report['missing_auth'][] = "api/Modules/$moduleName/Controller.php:$lineCount - $moduleName::$method (Write action lack of Auth::require*)";
                    }
                }
            }
        }
    }
}

function posix_next($str, $pos) { return $pos; } // ignored

// Phase 3 & 4: TODOs and Placeholders
$jsFiles = array_merge(glob(__DIR__ . '/js/modules/*/*.js') ?: [], glob(__DIR__ . '/mobile/js/*.js') ?: [], glob(__DIR__ . '/mobile/*.js') ?: []);
foreach ($jsFiles as $jsFile) {
    if (!is_file($jsFile)) continue;
    $content = file_get_contents($jsFile);
    if (preg_match_all('/(?:TODO|FIXME|placeholder|YOUR_)/i', $content, $matches, PREG_OFFSET_CAPTURE)) {
        foreach ($matches[0] as $m) {
            // Find line number
            $before = substr($content, 0, $m[1]);
            $line = substr_count($before, "\n") + 1;
            $report['todos'][] = str_replace(__DIR__ . '/', '', $jsFile) . ":$line - Contains '" . str_replace("\n", "", substr($content, $m[1], 40)) . "'";
        }
    }
}

// Phase 5: Env
$env1 = file_exists(__DIR__ . '/.env') ? parse_ini_file(__DIR__ . '/.env') : [];
$env2Str = file_exists(__DIR__ . '/.env.prod') ? file_get_contents(__DIR__ . '/.env.prod') : '';
preg_match_all('/^([A-Z0-9_]+)=(.*)$/m', $env2Str, $matches);
$envProd = array_combine($matches[1], $matches[2]);

foreach ($env1 as $key => $val) {
    if (!isset($envProd[$key])) {
        $report['env_diff'][] = ".env.prod is missing key: $key";
    } elseif (trim($env1[$key], "'\"") === trim($envProd[$key], "'\"") && in_array($key, ['APP_ENV', 'APP_DEBUG', 'TRUSTED_PROXY', 'STRIPE_PUBLIC_KEY', 'STRIPE_SECRET_KEY'])) {
        $report['env_diff'][] = ".env.prod has identical value as .env for $key: $val";
    }
}
foreach ($envProd as $key => $val) {
    if (preg_match('/(?:YOUR_|PLACEHOLDER|dummy)/i', $val)) {
        $report['env_diff'][] = ".env.prod has placeholder value: $key=$val";
    }
}

echo json_encode($report, JSON_PRETTY_PRINT);
