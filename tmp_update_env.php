<?php
$env_file = __DIR__ . '/.env';
if (file_exists($env_file)) {
    $content = file_get_contents($env_file);
    $new_content = preg_replace('/^META_CONFIG_ID=(.*)$/m', '# META_CONFIG_ID=$1', $content);
    if ($content !== $new_content) {
        file_put_contents($env_file, $new_content);
        echo "Successfully commented out META_CONFIG_ID in remote .env";
    }
    else {
        echo "META_CONFIG_ID not found or already commented out";
    }
}
else {
    echo ".env file not found at $env_file";
}