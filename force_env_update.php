<?php
$envFile = __DIR__ . '/.env';

if (!file_exists($envFile)) die('.env non trovato');

$content = file_get_contents($envFile);

if (strpos($content, 'SCOUTING_FUSION_FORM_ID') === false) {
    $append = "\n\n# ─── SCOUTING COGNITO FORMS ──────────────────────────────────────────────────\n"
            . "SCOUTING_FUSION_FORM_ID=9\n"
            . "SCOUTING_FUSION_VIEW_ID=1\n"
            . "SCOUTING_FUSION_API_KEY=eyJhbGciOiJIUzI1NiIsImtpZCI6Ijg4YmYzNWNmLWM3ODEtNDQ3ZC1hYzc5LWMyODczMjNkNzg3ZCIsInR5cCI6IkpXVCJ9.eyJvcmdhbml6YXRpb25JZCI6IjYzMDNjODZhLTFlOTItNDIwMC1hMGRmLTM5N2RjOGZiZWExNyIsImludGVncmF0aW9uSWQiOiI1ZGQyNzBmOC02MGFmLTRhNzUtOWQ1YS0yOTAyZGViZGY3NTUiLCJjbGllbnRJZCI6IjNkZTNmODMwLWNiYzctNDZlNi1iOTZlLTVmMDE2NzcyMTgzMCIsImp0aSI6IjJlNmUzZWE1LTg3OTAtNGU1OC1hNzg5LTVhZTFjYWEyYTY4NSIsImlhdCI6MTc3Mzc3MDU3MywiaXNzIjoiaHR0cHM6Ly93d3cuY29nbml0b2Zvcm1zLmNvbS8iLCJhdWQiOiJhcGkifQ._PfK1W8oenrK7OODEcg-8HdYMOBrBM837ysNy89H-IQ\n"
            . "SCOUTING_NETWORK_FORM_ID=11\n"
            . "SCOUTING_NETWORK_VIEW_ID=1\n"
            . "SCOUTING_NETWORK_API_KEY=eyJhbGciOiJIUzI1NiIsImtpZCI6Ijg4YmYzNWNmLWM3ODEtNDQ3ZC1hYzc5LWMyODczMjNkNzg3ZCIsInR5cCI6IkpXVCJ9.eyJvcmdhbml6YXRpb25JZCI6IjYzMDNjODZhLTFlOTItNDIwMC1hMGRmLTM5N2RjOGZiZWExNyIsImludGVncmF0aW9uSWQiOiI3ZTBiNDA4Zi1mM2NhLTRlMWUtOTRiYS1lMzZjNDhmZmZjOGUiLCJjbGllbnRJZCI6IjNkZTNmODMwLWNiYzctNDZlNi1iOTZlLTVmMDE2NzcyMTgzMCIsImp0aSI6IjY1MWNjOTcwLTNmYTEtNGNkMy1hNjkwLWExZjI0Mzg3YWMzOCIsImlhdCI6MTc3Mzc3MDM5NywiaXNzIjoiaHR0cHM6Ly93d3cuY29nbml0b2Zvcm1zLmNvbS8iLCJhdWQiOiJhcGkifQ.C_15NZfuVx0VGHkJdkO2W-67_Z19aNp7ar0zRHQk8L8\n";
            
     $result = file_put_contents($envFile, $append, FILE_APPEND | LOCK_EX);
     if ($result !== false) {
         echo "Successfully appended Scouting keys to .env.\n";
     } else {
         echo "Failed to write to .env (Check permissions).\n";
     }
} else {
    echo "Keys already present.\n";
}
