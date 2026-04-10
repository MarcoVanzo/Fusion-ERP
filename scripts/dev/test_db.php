<?php
$host = '31.11.39.161';
$db   = 'Sql1804377_2';
$user = 'Sql1804377';
$pass = 'u3z4t994$@psAPr';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    
    $tid = 'TNT_fusion';
    
    $queries = [
       "ATHLETES" => "SELECT CONCAT('Nuovo Tesseramento: ', full_name) as text, created_at as date FROM athletes WHERE tenant_id='$tid' AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) LIMIT 5",
       
       "ACWR" => "SELECT CONCAT('Alert ACWR: ', a.full_name, ' (Rischio)') as text, al.log_date as date FROM acwr_alerts al JOIN athletes a ON a.id = al.athlete_id WHERE a.tenant_id='$tid' AND al.log_date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY) AND al.risk_level IN ('high','extreme') LIMIT 3",
       
       "MATCHES" => "SELECT CONCAT('Risultato: ', IFNULL(th.name,'[N/D]'), ' vs ', IFNULL(ta.name,'[N/D]'), ' (', fm.home_score, '-', fm.away_score, ')') as text, fm.match_date as date 
             FROM federation_matches fm LEFT JOIN teams th ON th.id=fm.home_team_id LEFT JOIN teams ta ON ta.id=fm.away_team_id 
             WHERE fm.tenant_id='$tid' AND fm.match_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 14 DAY) AND CURDATE() AND fm.home_score IS NOT NULL LIMIT 4",
             
       "EVENTS" => "SELECT CONCAT('Aggiornato Trasporto: ', location) as text, event_date as date FROM events WHERE tenant_id='$tid' AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) LIMIT 4",
       
       "TASKS" => "SELECT CONCAT('Nuova Task: ', title) as text, created_at as date FROM tasks WHERE tenant_id='$tid' AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) LIMIT 4",
       
       "VEHICLES" => "SELECT CONCAT('Spostamento Veicolo: ', plate) as text, CAST(created_at AS CHAR) as date FROM vehicle_logs WHERE tenant_id='$tid' AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) LIMIT 4",
       
       "WHATSAPP" => "SELECT CONCAT('Invio verso ', recipient) as text, created_at as date FROM whatsapp_messages WHERE tenant_id='$tid' AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) LIMIT 5",
       
       "NEWSLETTER" => "SELECT CONCAT('Newsletter Inviata: ', subject) as text, sent_at as date FROM newsletter_campaigns WHERE tenant_id='$tid' AND sent_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) LIMIT 3",
       
       "WEBSITE_NEWS" => "SELECT CONCAT('Pubblicato articolo: ', title) as text, created_at as date FROM website_news WHERE tenant_id='$tid' AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) LIMIT 3",
       
       "PAYMENTS" => "SELECT CONCAT('Erogato rimborso: ', amount, ' €') as text, payment_date as date FROM staff_payments WHERE tenant_id='$tid' AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) LIMIT 4",
       
       "HOSTESS" => "SELECT CONCAT('Fattura/Spesa Hostess: ', amount, ' €') as text, created_at as date FROM hostess_expenses WHERE tenant_id='$tid' AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) LIMIT 4",
       
       "DOCUMENTS" => "SELECT CONCAT('Documento aggiornato: ', file_name) as text, uploaded_at as date FROM documents WHERE tenant_id='$tid' AND uploaded_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) LIMIT 3",
       
       "SPONSORS" => "SELECT CONCAT('Aggiornato Contratto: ', company_name) as text, created_at as date FROM sponsors WHERE tenant_id='$tid' AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) LIMIT 3",
       
       "STAFF" => "SELECT CONCAT('Nuovo Membro Organigramma: ', first_name, ' ', last_name) as text, created_at as date FROM staff_members WHERE tenant_id='$tid' AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) LIMIT 3",
       
       "EC_ORDERS" => "SELECT CONCAT('Nuovo ordine eShop nr. ', order_number, ' (', amount, '€)') as text, created_at as date FROM ec_orders WHERE tenant_id='$tid' AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) LIMIT 5",
       
       "OUTSEASON" => "SELECT CONCAT('Nuova iscrizione Camp: ', full_name) as text, created_at as date FROM outseason_entries WHERE tenant_id='$tid' AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) LIMIT 5",
    ];

    foreach ($queries as $name => $sql) {
        echo "Testing $name... ";
        try {
            $stmt = $pdo->query($sql);
            $count = $stmt->rowCount();
            echo "OK ($count rows)\n";
        } catch (\PDOException $e) {
            echo "ERROR: " . $e->getMessage() . "\n";
        }
    }
} catch (\PDOException $e) {
     echo "Connection failed: " . $e->getMessage();
}
