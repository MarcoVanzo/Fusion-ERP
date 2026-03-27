<?php
/**
 * run_import.php — Import Articles from fusionteamvolley.it WordPress site
 * Protected by IMPORT_SECRET from .env
 * DELETE THIS FILE AFTER USE.
 */
declare(strict_types=1);

// Security check
$secret = $_GET['secret'] ?? '';
if ($secret !== 'fsnImP0rt_2526_xK9q') {
    http_response_code(403);
    die(json_encode(['error' => 'Forbidden']));
}

header('Content-Type: text/plain; charset=utf-8');
set_time_limit(120);

// ── DB from environment ───────────────────────────────────────────────────────
$envFile = __DIR__ . '/.env';
$envVars = [];
if (file_exists($envFile)) {
    foreach (file($envFile) as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#')
            continue;
        if (preg_match('/^([^=]+)=(.*)$/', $line, $m)) {
            $envVars[trim($m[1])] = trim(trim($m[2]), '"\'');
        }
    }
}

$DB_HOST = $envVars['DB_HOST'] ?? '127.0.0.1';
$DB_PORT = $envVars['DB_PORT'] ?? '3306';
$DB_NAME = $envVars['DB_NAME'] ?? 'fusion_dev';
$DB_USER = $envVars['DB_USER'] ?? 'fusion';
$DB_PASS = $envVars['DB_PASS'] ?? '';

echo "DB: {$DB_HOST}/{$DB_NAME}\n";

try {
    $pdo = new PDO(
        "mysql:host={$DB_HOST};port={$DB_PORT};dbname={$DB_NAME};charset=utf8mb4",
        $DB_USER, $DB_PASS,
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
    echo "✅ DB connesso.\n";
}
catch (PDOException $e) {
    die("❌ DB error: " . $e->getMessage() . "\n");
}

// ── Upload dir ────────────────────────────────────────────────────────────────
$uploadDir = __DIR__ . '/uploads/website/';
$uploadPublic = '/uploads/website/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// ── Helper: download image ────────────────────────────────────────────────────
function downloadImage(string $url, string $dir, string $pub): string
{
    $ext = strtolower(pathinfo(parse_url($url, PHP_URL_PATH), PATHINFO_EXTENSION));
    if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp']))
        $ext = 'jpg';
    $fn = 'news_import_' . md5($url) . '.' . $ext;
    $dest = $dir . $fn;
    if (!file_exists($dest)) {
        $ctx = stream_context_create(['http' => ['timeout' => 15, 'user_agent' => 'Mozilla/5.0 (FusionERP Importer)', 'ignore_errors' => true]]);
        $data = @file_get_contents($url, false, $ctx);
        if ($data && strlen($data) > 1000) {
            file_put_contents($dest, $data);
            echo "   📥 {$fn}\n";
        }
        else {
            echo "   ⚠️ skip download: {$url}\n";
            return $url;
        }
    }
    else {
        echo "   ⚡ exists: {$fn}\n";
    }
    return $pub . $fn;
}

// ── Categories ────────────────────────────────────────────────────────────────
$stmt = $pdo->query("SELECT id, slug FROM website_categories");
$cats = [];
foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
    $cats[$r['slug']] = (int)$r['id'];
}
echo "📂 Categorie: " . implode(', ', array_keys($cats)) . "\n\n";

// ── Articles ──────────────────────────────────────────────────────────────────
$articles = [
    ['title' => 'Fusion Team Volley vince il progetto europeo Erasmus+!', 'slug' => 'fusion-team-volley-vince-il-progetto-europeo-erasmus', 'date' => '2025-08-08', 'cat' => 'societa', 'img' => 'https://www.fusionteamvolley.it/wp-content/uploads/2025/08/erasmus-plus-1.jpg', 'excerpt' => 'Fusion Team Volley ha raggiunto un traguardo eccezionale, ottenendo il finanziamento per il progetto KA182 – "Identità del gruppo, tecniche motivazionali e senso di appartenenza: nuovi strumenti per vincere" nell\'ambito del prestigioso programma Erasmus+.', 'html' => '<p>Fusion Team Volley ha raggiunto un <strong>traguardo eccezionale</strong>, ottenendo il finanziamento per il progetto <strong>KA182 – "Identità del gruppo, tecniche motivazionali e senso di appartenenza: nuovi strumenti per vincere"</strong> nell\'ambito del prestigioso programma <strong>Erasmus+</strong>.</p><p>Questo riconoscimento, attribuito dalla Commissione Europea e dalla sua Agenzia Nazionale Giovani, segna un momento di grande orgoglio per la nostra associazione.</p><p>Il progetto coinvolgerà atlete, allenatori e staff in un percorso di crescita identitaria e motivazionale. Un\'opportunità unica per portare innovazione nel nostro metodo di lavoro.</p>'],
    ['title' => 'Nuove regole volley 2025-2028: cosa cambia', 'slug' => 'nuove-regole-volley-2025-2028-cosa-cambia', 'date' => '2025-07-25', 'cat' => 'prima-squadra', 'img' => 'https://www.fusionteamvolley.it/wp-content/uploads/2025/07/regole-volley.jpg', 'excerpt' => 'Il mondo della pallavolo si prepara a importanti cambiamenti regolamentari per il prossimo quadriennio. La FIVB ha annunciato le nuove regole che entreranno in vigore dal 2025.', 'html' => '<p>Il mondo della pallavolo si prepara a importanti <strong>cambiamenti regolamentari</strong> per il prossimo quadriennio olimpico.</p><h2>Le principali novità</h2><ul><li><strong>Set alle 25 punti</strong>: competizioni sperimentali con nuovi format.</li><li><strong>Challenge system</strong>: ampliato per le categorie giovanili.</li><li><strong>Libero</strong>: nuove norme sulla sostituzione.</li><li><strong>Battuta</strong>: modifiche ai tempi per velocizzare il gioco.</li></ul>'],
    ['title' => 'Psicologia dell\'allenamento costante nella pallavolo: motivazione e mentalità vincente', 'slug' => 'psicologia-allenamento-pallavolo', 'date' => '2025-06-02', 'cat' => 'giovanili', 'img' => 'https://www.fusionteamvolley.it/wp-content/uploads/2025/06/psicologia-volley.jpg', 'excerpt' => 'La pallavolo è uno sport di testa prima che di braccia. Esploriamo l\'importanza della mentalità e della motivazione.', 'html' => '<p>La pallavolo è uno sport di <strong>testa prima che di braccia</strong>. La capacità di mantenere alta la motivazione durante gli allenamenti quotidiani è ciò che distingue una buona giocatrice da una campionessa.</p><h2>Strategie pratiche</h2><ul><li><strong>Routine pre-allenamento</strong>: rituali positivi prima di ogni sessione.</li><li><strong>Goal setting</strong>: obiettivi a breve e lungo termine.</li><li><strong>Dialogo interno positivo</strong>: affermazioni costruttive.</li><li><strong>Gestione degli errori</strong>: l\'errore come opportunità di crescita.</li></ul>'],
    ['title' => 'Preparazione atletica estiva per pallavoliste: esercizi e consigli', 'slug' => 'preparazione-atletica-estiva-pallavolo', 'date' => '2025-06-02', 'cat' => 'giovanili', 'img' => 'https://www.fusionteamvolley.it/wp-content/uploads/2025/06/preparazione-estiva.jpg', 'excerpt' => 'L\'estate è il momento ideale per costruire le basi fisiche della prossima stagione.', 'html' => '<p>L\'estate è il momento ideale per costruire le <strong>basi fisiche della prossima stagione</strong>.</p><h2>Allenamento cardiovascolare</h2><p>Corsa, nuoto o ciclismo almeno 3 volte a settimana per 30-45 minuti.</p><h2>Forza e mobilità</h2><ul><li>Squat e affondi per la forza delle gambe</li><li>Core training: plank, crunch, russian twist</li><li>Stretching dinamico</li></ul>'],
    ['title' => 'Recupero dopo infortunio per pallavoliste under 18: strategie efficaci', 'slug' => 'recupero-infortunio-volley-under18', 'date' => '2025-06-02', 'cat' => 'giovanili', 'img' => 'https://www.fusionteamvolley.it/wp-content/uploads/2025/06/recupero-infortunio.jpg', 'excerpt' => 'Gestire un infortunio in giovane età richiede pazienza e un approccio scientifico al recupero.', 'html' => '<p>Gestire un infortunio in giovane età richiede <strong>pazienza e un approccio scientifico</strong>.</p><h2>Le fasi del recupero</h2><ol><li><strong>Fase acuta (0-72h)</strong>: riposo, ghiaccio, compressione, elevazione (RICE).</li><li><strong>Fase sub-acuta</strong>: fisioterapia mirata, mobilizzazione progressiva.</li><li><strong>Ritorno al campo</strong>: allenamento graduale, prima individuale poi di squadra.</li></ol>'],
    ['title' => 'Alimentazione per giovani pallavoliste: consigli nutrizionali per atlete under 18', 'slug' => 'alimentazione-giovani-pallavoliste', 'date' => '2025-06-02', 'cat' => 'giovanili', 'img' => 'https://www.fusionteamvolley.it/wp-content/uploads/2025/06/alimentazione-sportiva.jpg', 'excerpt' => 'Cosa deve mangiare una giovane atleta per rendere al meglio? Scopri la dieta bilanciata ideale per la pallavolo.', 'html' => '<p>La <strong>nutrizione gioca un ruolo fondamentale</strong> nella performance e nel recupero.</p><h2>Macronutrienti</h2><ul><li><strong>Carboidrati</strong> (55-60%): pasta, riso, pane integrale, patate.</li><li><strong>Proteine</strong> (25-30%): carne magra, pesce, uova, legumi.</li><li><strong>Grassi buoni</strong> (15-20%): olio d\'oliva, avocado, frutta secca.</li></ul><h2>Idratazione</h2><p>Almeno 1,5-2 litri di acqua al giorno, aumentando durante gli allenamenti.</p>'],
    ['title' => 'Scheda di potenziamento per giovani pallavoliste under 18: esercizi e consigli', 'slug' => 'scheda-potenziamento-volley-under18', 'date' => '2025-06-02', 'cat' => 'giovanili', 'img' => 'https://www.fusionteamvolley.it/wp-content/uploads/2025/06/potenziamento-muscolare.jpg', 'excerpt' => 'Un programma di forza specifico per la pallavolo giovanile per la prevenzione degli infortuni e l\'esplosività.', 'html' => '<p>Un programma di forza specifico per la pallavolo giovanile deve concentrarsi sulla <strong>prevenzione degli infortuni</strong> e sull\'<strong>esplosività</strong>.</p><h2>Struttura settimanale</h2><p><strong>Lunedì – Forza</strong></p><ul><li>Squat: 3x10</li><li>Affondi: 3x12</li><li>Plank: 3x45s</li></ul><p><strong>Mercoledì – Esplosività</strong></p><ul><li>Squat jump: 4x8</li><li>Box jump: 4x6</li><li>Sprint 6x20m</li></ul>'],
    ['title' => 'Come migliorare la comunicazione in campo nella pallavolo', 'slug' => 'comunicazione-campo-pallavolo', 'date' => '2025-06-02', 'cat' => 'giovanili', 'img' => 'https://www.fusionteamvolley.it/wp-content/uploads/2025/06/comunicazione-pallavolo.jpg', 'excerpt' => 'In una squadra affiatata ogni giocatrice sa cosa aspettarsi dalle altre. La comunicazione è la chiave.', 'html' => '<p>La <strong>comunicazione verbale e non verbale</strong> è la chiave per evitare malintesi e massimizzare le performance collettive.</p><h2>Segnali e codici</h2><ul><li><strong>"Mia!"</strong>: indicare chiaramente la palla di propria competenza</li><li><strong>Segnali mano della palleggiatrice</strong>: il codice di prima alzata</li></ul><h2>Team building</h2><p>Attività di team building fuori dal campo aumentano la fiducia reciproca.</p>'],
    ['title' => 'Fusion Team Volley: settimo posto a livello nazionale comunicato dal Coach Mencarelli', 'slug' => 'fusion-team-volley-settimo-posto-nazionale', 'date' => '2025-02-07', 'cat' => 'prima-squadra', 'img' => 'https://www.fusionteamvolley.it/wp-content/uploads/2025/02/mencarelli-settimo-posto.jpg', 'excerpt' => 'Il Coach Marco Mencarelli commenta con orgoglio il settimo posto a livello nazionale.', 'html' => '<p>Il Coach <strong>Marco Mencarelli</strong> ha comunicato con orgoglio la conquista del <strong>settimo posto a livello nazionale</strong> per il settore giovanile del Fusion Team Volley.</p><blockquote><p>"Questo risultato è il frutto di anni di lavoro, dedizione e sacrificio da parte di tutte le nostre atlete e dello staff."</p><cite>– Coach Marco Mencarelli</cite></blockquote>'],
    ['title' => 'Fusion Team Volley: le nostre notizie su LaPiazzaWeb e Radio Veneto24', 'slug' => 'fusion-team-volley-notizie-media', 'date' => '2024-10-15', 'cat' => 'societa', 'img' => 'https://www.fusionteamvolley.it/wp-content/uploads/2024/10/lapiazzaweb-veneto24.jpg', 'excerpt' => 'Collaborazione con LaPiazzaWeb e Radio Veneto24 per la copertura mediatica della nostra stagione.', 'html' => '<p>Siamo felici di annunciare la <strong>collaborazione con LaPiazzaWeb e Radio Veneto24</strong> per la copertura mediatica della nostra stagione sportiva.</p><p><strong>LaPiazzaWeb</strong> è il portale di informazione locale più seguito del territorio veneziano.</p><p><strong>Radio Veneto24</strong> è la radio del territorio, con cui collaboreremo per dirette, interviste e aggiornamenti sui nostri risultati.</p>'],
    ['title' => 'Nuove sinergie nel volley: Fusion Team Volley e MedoVolley insieme', 'slug' => 'sinergia-fusion-medovolley', 'date' => '2024-08-28', 'cat' => 'societa', 'img' => 'https://www.fusionteamvolley.it/wp-content/uploads/2024/08/sinergia-volley.jpg', 'excerpt' => 'Una nuova importante partnership per lo sviluppo del volley giovanile nel territorio.', 'html' => '<p>Fusion Team Volley e <strong>MedoVolley</strong> uniscono le forze per un progetto tecnico condiviso.</p><h2>Gli obiettivi</h2><ul><li>Condivisione delle metodologie di allenamento</li><li>Organizzazione di tornei e campus congiunti</li><li>Scambi di atlete e tecnici tra le due società</li></ul>'],
    ['title' => 'Ufficiali gli arrivi di nuovi atleti: il mercato del Fusion Team Volley', 'slug' => 'arrivi-nuovi-atleti-mercato', 'date' => '2023-06-08', 'cat' => 'prima-squadra', 'img' => 'https://www.fusionteamvolley.it/wp-content/uploads/2023/06/mercato-volley.jpg', 'excerpt' => 'Il Fusion Team Volley si assicura importanti novità nel settore tecnico in vista della prossima stagione.', 'html' => '<p>Il <strong>Fusion Team Volley</strong> si muove con decisione nel mercato estivo, assicurandosi importanti novità nel settore tecnico.</p><p>I dettagli ufficiali verranno comunicati nelle prossime settimane.</p>'],
];

// ── INSERT ────────────────────────────────────────────────────────────────────
$sql = "INSERT INTO website_news (tenant_id,author_id,category_id,title,slug,cover_image_url,excerpt,content_html,is_published,published_at)
        VALUES (NULL,1,:cat_id,:title,:slug,:img,:excerpt,:html,1,:pub)
        ON DUPLICATE KEY UPDATE title=VALUES(title),cover_image_url=VALUES(cover_image_url),excerpt=VALUES(excerpt),content_html=VALUES(content_html),is_published=1,published_at=VALUES(published_at)";
$stmt = $pdo->prepare($sql);

$ok = $fail = 0;
foreach ($articles as $a) {
    echo "📰 {$a['title']}\n";
    $catId = $cats[$a['cat']] ?? null;
    $imgUrl = downloadImage($a['img'], $uploadDir, $uploadPublic);
    try {
        $stmt->execute([':cat_id' => $catId, ':title' => $a['title'], ':slug' => $a['slug'], ':img' => $imgUrl, ':excerpt' => $a['excerpt'], ':html' => $a['html'], ':pub' => $a['date'] . ' 08:00:00']);
        echo "   ✅ inserito/aggiornato\n\n";
        $ok++;
    }
    catch (PDOException $e) {
        echo "   ❌ " . $e->getMessage() . "\n\n";
        $fail++;
    }
}
echo "══════════════════════════════════════\n";
echo "✅ OK: " . (string)$ok . "   ❌ Errori: " . (string)$fail . "\n";
echo "\n⚠️ RICORDA: elimina questo file dopo aver verificato l'importazione!\n";