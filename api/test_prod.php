<?php
$ch = curl_init('https://fusionteamvolley.it/api/router.php');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
// This is the auth method the UI uses. Wait... what if it's the `is_our_team` problem?
// The dashboard recent matches filter depends on "fusion". Oh wait! The query for recent matches is: `LOWER(m.home_team) LIKE '%fusion%' OR LOWER(m.away_team) LIKE '%fusion%'`.
// FIPAV Veneto Serie C returns "VEGA FUSION TEAM VOLLEY". 
// Wait, the API `getResults` does not filter by "fusion".
