<?php
if (function_exists('shell_exec')) {
    echo "shell_exec exists\n";
    $output = shell_exec('echo hello');
    if ($output === null) {
        echo "shell_exec returned null (likely disabled via disable_functions)\n";
    } else {
        echo "shell_exec output: " . trim($output) . "\n";
    }
} else {
    echo "shell_exec DOES NOT EXIST\n";
}

$disabled = ini_get('disable_functions');
echo "disabled_functions: " . $disabled . "\n";
