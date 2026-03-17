<?php
$files = [
    'check_path.php',
    'check_getEnvVar.php',
    'check_getEnvVar2.php',
    'flush_opcache.php',
    'read_errors.php',
    'direct_read.php',
    'find_envs.php',
    'dump_env.php',
    'force_env_update.php',
    'trace.php',
    'invalidate.php',
    'query.php',
    'debug_sync.php',
    'my_debug.log'
];

foreach ($files as $f) {
    if (file_exists(__DIR__ . '/' . $f)) {
        unlink(__DIR__ . '/' . $f);
        echo "Deleted $f\n";
    }
}
echo "Cleanup complete.\n";
unlink(__FILE__); // self destruct
