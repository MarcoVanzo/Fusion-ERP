<?php
$ch = curl_init('https://fusionteamvolley.it/api/router.php');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
// Need to simulate a user session or get Results... actually, let's just use curl with getResults but no auth? Not possible, requires auth.
// I will deploy a test endpoint to prod to see exactly what gets inserted.
