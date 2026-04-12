<?php
// diag_env_fusion.php
error_reporting(E_ALL);
ini_set('display_errors', '1');

echo "<h1>Fusion ERP Diagnostic</h1>";

// 1. PHP Version
echo "PHP Version: " . PHP_VERSION . "<br>";

// 2. Extensions
$exts = ['gd', 'mbstring', 'zlib', 'intl', 'xml', 'bcmath'];
echo "<h3>Extensions:</h3><ul>";
foreach ($exts as $e) {
    echo "<li>$e: " . (extension_loaded($e) ? "<span style='color:green'>YES</span>" : "<span style='color:red'>NO</span>") . "</li>";
}
echo "</ul>";

// 3. Memory Limit
echo "Memory Limit: " . ini_get('memory_limit') . "<br>";

// 4. Write Permissions
$testDirs = [
    'uploads/',
    'api/Modules/Tournaments/Services/',
    'vendor/mpdf/mpdf/tmp/'
];
echo "<h3>Write Permissions:</h3><ul>";
foreach ($testDirs as $dir) {
    $fullPath = __DIR__ . '/' . $dir;
    $isWritable = is_writable($fullPath);
    echo "<li>$dir: " . ($isWritable ? "<span style='color:green'>WRITABLE</span>" : "<span style='color:red'>NOT WRITABLE</span>") . "</li>";
    if ($isWritable) {
        $testFile = $fullPath . 'test_perm.txt';
        if (file_put_contents($testFile, "test")) {
            unlink($testFile);
        } else {
            echo " (But file_put_contents FAILED)";
        }
    }
}
echo "</ul>";

// 5. Try to generate a REAL PDF
echo "<h3>Real PDF Generation Test:</h3>";
try {
    require_once __DIR__ . '/vendor/autoload.php';
    if (class_exists('\Mpdf\Mpdf')) {
        $mpdf = new \Mpdf\Mpdf(['tempDir' => __DIR__ . '/uploads/']); 
        $mpdf->WriteHTML('<h1>Test PDF</h1><p>Generato correttamente il ' . date('Y-m-d H:i:s') . '</p>');
        $outPath = __DIR__ . '/uploads/test_real.pdf';
        $mpdf->Output($outPath, 'F');
        if (file_exists($outPath)) {
            echo "<span style='color:green'>Success! PDF file created at $outPath </span><br>";
            unlink($outPath);
        } else {
            echo "<span style='color:red'>Failed to create PDF file.</span><br>";
        }
    }
} catch (Throwable $e) {
    echo "<span style='color:red'>PDF Test Error: " . $e->getMessage() . " in " . $e->getFile() . ":" . $e->getLine() . "</span><br>";
}

