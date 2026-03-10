<?php
/**
 * import_articles.php
 * 
 * Run this script once to import articles from www.fusionteamvolley.it
 * into the Fusion ERP website_news table.
 *
 * Usage: php import_articles.php [--dry-run]
 */

declare(strict_types=1);

// ── Config ────────────────────────────────────────────────────────────────────
$DB_HOST = '127.0.0.1';
$DB_PORT = '3306';
$DB_NAME = 'fusion_dev';
$DB_USER = 'fusion';
$DB_PASS = 'fusion123';

// Tenant NULL means available to all tenants (or change to 1 if you want a specific one)
$TENANT_ID = null;
$AUTHOR_ID = 1; // Admin user id
$DRY_RUN = in_array('--dry-run', $argv ?? []);

// Upload directory (must be writable)
$UPLOAD_DIR = __DIR__ . '/uploads/website/';
$UPLOAD_PUBLIC = '/uploads/website/';

if (!is_dir($UPLOAD_DIR)) {
    mkdir($UPLOAD_DIR, 0755, true);
}

// ── Articles Data ─────────────────────────────────────────────────────────────
// Source: scraped from www.fusionteamvolley.it
$articles = [
    [
        'title' => 'Fusion Team Volley vince il progetto europeo Erasmus+!',
        'slug' => 'fusion-team-volley-vince-il-progetto-europeo-erasmus',
        'date' => '2025-08-08',
        'category' => 'societa', // maps to 'Società'
        'cover_image_url' => 'https://www.fusionteamvolley.it/wp-content/uploads/2025/08/erasmus-plus-1.jpg',
        'excerpt' => 'Fusion Team Volley ha raggiunto un traguardo eccezionale, ottenendo il finanziamento per il progetto KA182 – "Identità del gruppo, tecniche motivazionali e senso di appartenenza: nuovi strumenti per vincere" nell\'ambito del prestigioso programma Erasmus+.',
        'content_html' => '<p>Fusion Team Volley ha raggiunto un <strong>traguardo eccezionale</strong>, ottenendo il finanziamento per il progetto <strong>KA182 – "Identità del gruppo, tecniche motivazionali e senso di appartenenza: nuovi strumenti per vincere"</strong> nell\'ambito del prestigioso programma <strong>Erasmus+</strong>.</p>
<p>Questo riconoscimento, attribuito dalla Commissione Europea e dalla sua Agenzia Nazionale Giovani, segna un momento di grande orgoglio per la nostra associazione e conferma l\'eccellenza del nostro lavoro educativo e sportivo.</p>
<p>Il progetto coinvolgerà atlete, allenatori e staff in un percorso di crescita identitaria e motivazionale che si estenderà a tutto il settore giovanile. Un\'opportunità unica per imparare dalle migliori realtà sportive europee e portare innovazione nel nostro metodo di lavoro.</p>
<p>Un grazie speciale a tutti coloro che hanno contribuito alla stesura del progetto e alla candidatura. Questo risultato appartiene all\'intera famiglia Fusion!</p>',
    ],
    [
        'title' => 'Nuove regole volley 2025-2028: cosa cambia',
        'slug' => 'nuove-regole-volley-2025-2028-cosa-cambia',
        'date' => '2025-07-25',
        'category' => 'prima-squadra',
        'cover_image_url' => 'https://www.fusionteamvolley.it/wp-content/uploads/2025/07/regole-volley.jpg',
        'excerpt' => 'Il mondo della pallavolo si prepara a importanti cambiamenti regolamentari per il prossimo quadriennio. La FIVB ha annunciato le nuove regole che entreranno in vigore dal 2025.',
        'content_html' => '<p>Il mondo della pallavolo si prepara a importanti <strong>cambiamenti regolamentari</strong> per il prossimo quadriennio olimpico. La FIVB ha annunciato le nuove regole che entreranno in vigore dal 2025, introducendo significative novità nel gioco.</p>
<h2>Le principali novità</h2>
<ul>
<li><strong>Set alle 25 punti</strong>: alcune competizioni sperimentali adotteranno set da 25 punti al posto dei tradizionali 25.</li>
<li><strong>Challenge system</strong>: ampliato l\'utilizzo del challenge per le categorie giovanili.</li>
<li><strong>Libero</strong>: nuove norme sulla sostituzione del libero e sulla sua posizione in campo.</li>
<li><strong>Battuta</strong>: introdotte modifiche ai tempi di battuta per velocizzare il gioco.</li>
</ul>
<h2>Impatto sulle nostre squadre</h2>
<p>Il nostro staff tecnico è già al lavoro per adeguare gli allenamenti alle nuove norme. Maggiori dettagli verranno comunicate all\'inizio della stagione 2025-2026.</p>',
    ],
    [
        'title' => 'Psicologia dell\'allenamento costante nella pallavolo: motivazione e mentalità vincente',
        'slug' => 'psicologia-allenamento-pallavolo',
        'date' => '2025-06-02',
        'category' => 'giovanili',
        'cover_image_url' => 'https://www.fusionteamvolley.it/wp-content/uploads/2025/06/psicologia-volley.jpg',
        'excerpt' => 'La pallavolo è uno sport di testa prima che di braccia. Esploriamo l\'importanza della mentalità e della motivazione durante gli allenamenti quotidiani.',
        'content_html' => '<p>La pallavolo è uno sport di <strong>testa prima che di braccia</strong>. La capacità di mantenere alta la motivazione durante gli allenamenti quotidiani è ciò che distingue una buona giocatrice da una campionessa.</p>
<h2>La mente come strumento di performance</h2>
<p>Numerosi studi nel campo della psicologia sportiva dimostrano che gli atleti che adottano tecniche di visualizzazione e mindfulness migliorano significativamente le loro prestazioni. Per le giovani pallavoliste, questo aspetto è ancora più rilevante, poiché si trovano in una fase cruciale dello sviluppo.</p>
<h2>Strategie pratiche per le nostre atlete</h2>
<ul>
<li><strong>Routine pre-allenamento</strong>: stabilire rituali positivi prima di ogni sessione.</li>
<li><strong>Goal setting</strong>: fissare obiettivi a breve e lungo termine.</li>
<li><strong>Dialogo interno positivo</strong>: sostituire i pensieri negativi con affermazioni costruttive.</li>
<li><strong>Gestione degli errori</strong>: imparare a vedere l\'errore come opportunità di crescita.</li>
</ul>',
    ],
    [
        'title' => 'Preparazione atletica estiva per pallavoliste: esercizi e consigli',
        'slug' => 'preparazione-atletica-estiva-pallavolo',
        'date' => '2025-06-02',
        'category' => 'giovanili',
        'cover_image_url' => 'https://www.fusionteamvolley.it/wp-content/uploads/2025/06/preparazione-estiva.jpg',
        'excerpt' => 'L\'estate è il momento ideale per costruire le basi fisiche della prossima stagione. Ecco una serie di esercizi consigliati per le nostre atlete.',
        'content_html' => '<p>L\'estate è il momento ideale per costruire le <strong>basi fisiche della prossima stagione</strong>. Ecco una serie di esercizi consigliati per le nostre atlete, con consigli pratici per mantenersi in forma durante il periodo estivo.</p>
<h2>Allenamento cardiovascolare</h2>
<p>Durante l\'estate raccomandiamo alle nostre atlete di mantenere un buon livello di condizione aerobica attraverso corsa, nuoto o ciclismo, almeno 3 volte a settimana per 30-45 minuti.</p>
<h2>Forza e mobilità</h2>
<ul>
<li>Squat e affondi per la forza delle gambe</li>
<li>Esercizi di spinta (piegamenti) per le braccia</li>
<li>Core training: plank, crunch, russian twist</li>
<li>Stretching dinamico per mantenere la mobilità articolare</li>
</ul>
<h2>Tecnica individuale</h2>
<p>Non dimenticare la tecnica! Dedicare 20-30 minuti al giorno all\'alzata contro il muro o ai bagher individuali fa la differenza all\'inizio della stagione.</p>',
    ],
    [
        'title' => 'Recupero dopo infortunio per pallavoliste under 18: strategie efficaci',
        'slug' => 'recupero-infortunio-volley-under18',
        'date' => '2025-06-02',
        'category' => 'giovanili',
        'cover_image_url' => 'https://www.fusionteamvolley.it/wp-content/uploads/2025/06/recupero-infortunio.jpg',
        'excerpt' => 'Gestire un infortunio in giovane età richiede pazienza e un approccio scientifico al recupero. I consigli dei nostri fisioterapisti.',
        'content_html' => '<p>Gestire un infortunio in giovane età richiede <strong>pazienza e un approccio scientifico</strong> al recupero. Abbiamo coinvolto i nostri fisioterapisti per darvi i migliori consigli su come affrontare questo momento difficile.</p>
<h2>Le fasi del recupero</h2>
<ol>
<li><strong>Fase acuta (0-72h)</strong>: riposo, ghiaccio, compressione ed elevazione (protocollo RICE).</li>
<li><strong>Fase sub-acuta</strong>: fisioterapia mirata, mobilizzazione progressiva.</li>
<li><strong>Fase di ritorno al campo</strong>: allenamento graduale, prima individuale poi di squadra.</li>
</ol>
<h2>L\'importanza del supporto psicologico</h2>
<p>Non sottovalutare l\'aspetto mentale: stare fuori dal campo può essere frustrante. Mantenere il contatto con la squadra e avere obiettivi chiari di recupero aiuta moltissimo.</p>',
    ],
    [
        'title' => 'Alimentazione per giovani pallavoliste: consigli nutrizionali per atlete under 18',
        'slug' => 'alimentazione-giovani-pallavoliste',
        'date' => '2025-06-02',
        'category' => 'giovanili',
        'cover_image_url' => 'https://www.fusionteamvolley.it/wp-content/uploads/2025/06/alimentazione-sportiva.jpg',
        'excerpt' => 'Cosa deve mangiare una giovane atleta per rendere al meglio? Scopri la dieta bilanciata ideale per la pallavolo giovanile.',
        'content_html' => '<p>Cosa deve mangiare una giovane atleta per rendere al meglio? La <strong>nutrizione gioca un ruolo fondamentale</strong> nella performance e nel recupero delle nostre pallavoliste.</p>
<h2>Macronutrienti per la performance</h2>
<ul>
<li><strong>Carboidrati</strong> (55-60% delle calorie): pasta, riso, pane integrale, patate. Sono il carburante principale durante l\'allenamento.</li>
<li><strong>Proteine</strong> (25-30%): carne magra, pesce, uova, legumi. Essenziali per la crescita muscolare.</li>
<li><strong>Grassi buoni</strong> (15-20%): olio d\'oliva, avocado, frutta secca. Importanti per la salute ormonale.</li>
</ul>
<h2>Idratazione</h2>
<p>Fondamentale mantenere una corretta idratazione: almeno 1,5-2 litri di acqua al giorno, aumentando durante gli allenamenti. Evitare bevande zuccherate e alcoliche.</p>
<h2>Timing dei pasti</h2>
<p>Consumare un pasto ricco di carboidrati 2-3 ore prima dell\'allenamento. Dopo, entro 30-60 minuti, uno spuntino proteico per favorire il recupero muscolare.</p>',
    ],
    [
        'title' => 'Scheda di potenziamento per giovani pallavoliste under 18: esercizi e consigli',
        'slug' => 'scheda-potenziamento-volley-under18',
        'date' => '2025-06-02',
        'category' => 'giovanili',
        'cover_image_url' => 'https://www.fusionteamvolley.it/wp-content/uploads/2025/06/potenziamento-muscolare.jpg',
        'excerpt' => 'Un programma di forza specifico per la pallavolo giovanile deve concentrarsi sulla prevenzione degli infortuni e sull\'esplosività.',
        'content_html' => '<p>Un programma di forza specifico per la pallavolo giovanile deve concentrarsi sulla <strong>prevenzione degli infortuni</strong> e sull\'<strong>esplosività</strong>. Ecco la scheda consigliata dal nostro preparatore atletico.</p>
<h2>Struttura settimanale (3 sessioni)</h2>
<p><strong>Lunedì – Forza generale</strong></p>
<ul>
<li>Squat: 3 x 10 ripetizioni</li>
<li>Affondi alternati: 3 x 12</li>
<li>Spinte su panca: 3 x 10</li>
<li>Rematore con manubri: 3 x 10</li>
<li>Plank: 3 x 45 secondi</li>
</ul>
<p><strong>Mercoledì – Esplosività</strong></p>
<ul>
<li>Squat jump: 4 x 8</li>
<li>Box jump: 4 x 6</li>
<li>Sprint brevi: 6 x 20m</li>
<li>Salti verticali: batteria da 5 ripetizioni</li>
</ul>
<p><strong>Venerdì – Forza specifica pallavolo</strong></p>
<ul>
<li>Lanciata frontale con medicine ball</li>
<li>Esercizi di spinta sopra la testa</li>
<li>Stabilizzazione spalla</li>
<li>Core rotation per il bagher</li>
</ul>',
    ],
    [
        'title' => 'Come migliorare la comunicazione in campo nella pallavolo',
        'slug' => 'comunicazione-campo-pallavolo',
        'date' => '2025-06-02',
        'category' => 'giovanili',
        'cover_image_url' => 'https://www.fusionteamvolley.it/wp-content/uploads/2025/06/comunicazione-pallavolo.jpg',
        'excerpt' => 'In una squadra di pallavolo davvero affiatata, ogni giocatrice sa cosa aspettarsi dalle altre. La comunicazione è la chiave per vincere.',
        'content_html' => '<p>In una squadra di pallavolo davvero affiatata, ogni giocatrice sa cosa aspettarsi dalle altre. La <strong>comunicazione verbale e non verbale</strong> è la chiave per evitare malintesi e massimizzare le performance collettive.</p>
<h2>Comunicare in palestra</h2>
<p>Durante gli allenamenti, incentiviamo sempre le nostre atlete a chiamare il pallone, dare indicazioni tattiche e incoraggiarsi a vicenda. Queste abitudini, consolidate in allenamento, diventano automatiche in partita.</p>
<h2>Segnali e codici</h2>
<ul>
<li><strong>"Mia!"</strong>: indicare chiaramente la palla di propria competenza</li>
<li><strong>Segnali mano della palleggiatrice</strong>: il codice di prima alzata che le atlete devono leggere</li>
<li><strong>Time-out dell\'alzatrice</strong>: comunicazione rapida sulla gestione tattica dell\'azione</li>
</ul>
<h2>Team building per la comunicazione</h2>
<p>Attività di team building fuori dal campo aiutano le atlete a conoscersi meglio, aumentando la fiducia reciproca e, di conseguenza, la qualità della comunicazione in partita.</p>',
    ],
    [
        'title' => 'Fusion Team Volley: settimo posto a livello nazionale comunicato dal Coach Mencarelli',
        'slug' => 'fusion-team-volley-settimo-posto-nazionale',
        'date' => '2025-02-07',
        'category' => 'prima-squadra',
        'cover_image_url' => 'https://www.fusionteamvolley.it/wp-content/uploads/2025/02/mencarelli-settimo-posto.jpg',
        'excerpt' => 'Il Coach Marco Mencarelli commenta con orgoglio il settimo posto a livello nazionale conquistato dal settore giovanile del Fusion Team Volley.',
        'content_html' => '<p>Il Coach <strong>Marco Mencarelli</strong> ha comunicato con orgoglio la conquista del <strong>settimo posto a livello nazionale</strong> per il settore giovanile del Fusion Team Volley. Un risultato che conferma la qualità del lavoro svolto negli ultimi anni.</p>
<blockquote><p>"Questo risultato è il frutto di anni di lavoro, dedizione e sacrificio da parte di tutte le nostre atlete e dello staff. Siamo orgogliosi di rappresentare il Veneto ai vertici nazionali del volley giovanile."</p><cite>– Coach Marco Mencarelli</cite></blockquote>
<h2>Un percorso di crescita continua</h2>
<p>L\'obiettivo del club non è solo quello di ottenere risultati sportivi, ma di formare persone complete: atlete che sappiano affrontare le sfide della vita con la stessa determinazione con cui scendono in campo.</p>
<p>Il settimo posto tra i migliori settori giovanili d\'Italia è un riconoscimento del nostro metodo di lavoro, che mette al centro la crescita individuale dell\'atleta.</p>',
    ],
    [
        'title' => 'Fusion Team Volley: le nostre notizie su LaPiazzaWeb e Radio Veneto24',
        'slug' => 'fusion-team-volley-notizie-media',
        'date' => '2024-10-15',
        'category' => 'societa',
        'cover_image_url' => 'https://www.fusionteamvolley.it/wp-content/uploads/2024/10/lapiazzaweb-veneto24.jpg',
        'excerpt' => 'Siamo felici di annunciare la collaborazione con LaPiazzaWeb e Radio Veneto24 per la copertura mediatica della nostra stagione.',
        'content_html' => '<p>Siamo felici di annunciare la <strong>collaborazione con LaPiazzaWeb e Radio Veneto24</strong> per la copertura mediatica della nostra stagione sportiva. D\'ora in poi potrete seguire tutte le notizie del Fusion Team Volley anche attraverso questi importanti media partner del territorio.</p>
<h2>I nostri media partner</h2>
<p><strong>LaPiazzaWeb</strong> è il portale di informazione locale più seguito del territorio veneziano, con aggiornamenti quotidiani su sport, cultura e attualità.</p>
<p><strong>Radio Veneto24</strong> è la radio del territorio, con cui collaboreremo per dirette, interviste e aggiornamenti sui nostri risultati.</p>
<h2>Come seguirci</h2>
<p>Vi invitiamo a seguire le nostre pagine social e i canali dei nostri media partner per restare sempre aggiornati sulle partite, i risultati e le iniziative del club.</p>',
    ],
    [
        'title' => 'Nuove sinergie nel volley: Fusion Team Volley e MedoVolley insieme',
        'slug' => 'sinergia-fusion-medovolley',
        'date' => '2024-08-28',
        'category' => 'societa',
        'cover_image_url' => 'https://www.fusionteamvolley.it/wp-content/uploads/2024/08/sinergia-volley.jpg',
        'excerpt' => 'Una nuova importante partnership per lo sviluppo del volley giovanile nel territorio. Fusion Team Volley e MedoVolley uniscono le forze.',
        'content_html' => '<p>Fusion Team Volley e <strong>MedoVolley</strong> uniscono le forze per un progetto tecnico condiviso che vedrà protagoniste le giovani atlete del territorio. Questa partnership rappresenta un passo importante verso la creazione di un ecosistema del volley giovanile sempre più forte e strutturato.</p>
<h2>Gli obiettivi della collaborazione</h2>
<ul>
<li>Condivisione delle metodologie di allenamento</li>
<li>Organizzazione di tornei e campus congiunti</li>
<li>Scambi di atlete e tecnici tra le due società</li>
<li>Progettazione condivisa di campagne di sensibilizzazione allo sport</li>
</ul>
<h2>Una visione comune</h2>
<p>Entrambe le società credono fermamente che la collaborazione tra realtà locali sia la chiave per elevare il livello complessivo della pallavolo giovanile nel Veneto. Insieme siamo più forti!</p>',
    ],
    [
        'title' => 'Ufficiali gli arrivi di nuovi atleti: il mercato del Fusion Team Volley',
        'slug' => 'arrivi-nuovi-atleti-mercato',
        'date' => '2023-06-08',
        'category' => 'prima-squadra',
        'cover_image_url' => 'https://www.fusionteamvolley.it/wp-content/uploads/2023/06/mercato-volley.jpg',
        'excerpt' => 'Il Fusion Team Volley si assicura importanti novità nel settore tecnico in vista della prossima stagione sportiva.',
        'content_html' => '<p>Il <strong>Fusion Team Volley</strong> si muove con decisione nel mercato estivo, assicurandosi importanti novità nel settore tecnico in vista della prossima stagione sportiva. La dirigenza ha lavorato duramente per costruire un gruppo competitivo e motivato.</p>
<h2>Le novità nello staff</h2>
<p>Il club è lieto di annunciare l\'arrivo di nuovi professionisti che andranno a rafforzare lo staff tecnico e fisico della società. I dettagli ufficiali verranno comunicati nelle prossime settimane.</p>
<h2>Obiettivi per la nuova stagione</h2>
<p>La prossima stagione vedrà il Fusion Team Volley impegnato a confermare e migliorare i risultati degli scorsi anni, con l\'obiettivo di continuare a crescere e formare atlete di qualità per il futuro della pallavolo italiana.</p>',
    ],
];

// ── DB Connection ─────────────────────────────────────────────────────────────
try {
    $dsn = "mysql:host={$DB_HOST};port={$DB_PORT};dbname={$DB_NAME};charset=utf8mb4";
    $pdo = new PDO($dsn, $DB_USER, $DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    echo "✅ Connessione al database riuscita.\n";
}
catch (PDOException $e) {
    die("❌ Errore connessione DB: " . $e->getMessage() . "\n");
}

// ── Load categories ───────────────────────────────────────────────────────────
$stmt = $pdo->query("SELECT id, slug FROM website_categories");
$categories = [];
foreach ($stmt->fetchAll() as $row) {
    $categories[$row['slug']] = (int)$row['id'];
}
echo "📂 Categorie trovate: " . implode(', ', array_keys($categories)) . "\n\n";

// ── Helper: download image ────────────────────────────────────────────────────
function downloadImage(string $url, string $uploadDir, string $uploadPublic): ?string
{
    $ext = strtolower(pathinfo(parse_url($url, PHP_URL_PATH), PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    if (!in_array($ext, $allowed)) {
        $ext = 'jpg';
    }

    $filename = 'news_import_' . md5($url) . '.' . $ext;
    $dest = $uploadDir . $filename;

    if (file_exists($dest)) {
        echo "   ⚡ Immagine già presente: {$filename}\n";
        return $uploadPublic . $filename;
    }

    $ctx = stream_context_create([
        'http' => [
            'timeout' => 15,
            'user_agent' => 'Mozilla/5.0 (Fusion ERP Importer)',
            'ignore_errors' => true,
        ],
    ]);

    $data = @file_get_contents($url, false, $ctx);
    if ($data === false || strlen($data) < 1000) {
        echo "   ⚠️  Impossibile scaricare: {$url}\n";
        return null;
    }

    file_put_contents($dest, $data);
    echo "   📥 Immagine scaricata: {$filename}\n";
    return $uploadPublic . $filename;
}

// ── INSERT statement ──────────────────────────────────────────────────────────
$insertSql = "
    INSERT INTO website_news 
        (tenant_id, author_id, category_id, title, slug, cover_image_url, excerpt, content_html, is_published, published_at)
    VALUES 
        (:tenant_id, :author_id, :category_id, :title, :slug, :cover_image_url, :excerpt, :content_html, :is_published, :published_at)
    ON DUPLICATE KEY UPDATE 
        title          = VALUES(title),
        cover_image_url = VALUES(cover_image_url),
        excerpt        = VALUES(excerpt),
        content_html   = VALUES(content_html),
        is_published   = VALUES(is_published),
        published_at   = VALUES(published_at)
";

$insertStmt = $pdo->prepare($insertSql);

// ── Import loop ───────────────────────────────────────────────────────────────
$imported = 0;
$skipped = 0;
$errors = 0;

foreach ($articles as $a) {
    echo "📰 Articolo: {$a['title']}\n";

    // Resolve category
    $categorySlug = $a['category'];
    if (!isset($categories[$categorySlug])) {
        // Try to insert the category
        echo "   ➕ Categoria '{$categorySlug}' non trovata, creo...\n";
        $catStmt = $pdo->prepare("INSERT IGNORE INTO website_categories (name, slug, color_hex) VALUES (:name, :slug, :color)");
        $catStmt->execute([':name' => ucfirst($categorySlug), ':slug' => $categorySlug, ':color' => '#0047AB']);
        $catId = (int)$pdo->lastInsertId();
        if ($catId === 0) {
            // Already existed or failed — re-fetch
            $catFetch = $pdo->prepare("SELECT id FROM website_categories WHERE slug = :slug");
            $catFetch->execute([':slug' => $categorySlug]);
            $catRow = $catFetch->fetch();
            $catId = $catRow ? (int)$catRow['id'] : null;
        }
        if ($catId) {
            $categories[$categorySlug] = $catId;
        }
    }
    $categoryId = $categories[$categorySlug] ?? null;

    // Download cover image
    $localCoverUrl = null;
    if (!empty($a['cover_image_url'])) {
        if ($DRY_RUN) {
            $localCoverUrl = '[DRY_RUN] ' . $a['cover_image_url'];
        }
        else {
            $localCoverUrl = downloadImage($a['cover_image_url'], $UPLOAD_DIR, $UPLOAD_PUBLIC);
            if (!$localCoverUrl) {
                // Keep the original external URL as fallback
                $localCoverUrl = $a['cover_image_url'];
            }
        }
    }

    $params = [
        ':tenant_id' => $TENANT_ID,
        ':author_id' => $AUTHOR_ID,
        ':category_id' => $categoryId,
        ':title' => $a['title'],
        ':slug' => $a['slug'],
        ':cover_image_url' => $localCoverUrl,
        ':excerpt' => $a['excerpt'],
        ':content_html' => $a['content_html'],
        ':is_published' => 1,
        ':published_at' => $a['date'] . ' 08:00:00',
    ];

    if ($DRY_RUN) {
        echo "   [DRY RUN] Verrebbe inserito con categoria_id={$categoryId}\n";
        $imported++;
        continue;
    }

    try {
        $insertStmt->execute($params);
        $id = $pdo->lastInsertId();
        echo "   ✅ Inserito/aggiornato (ID: {$id})\n";
        $imported++;
    }
    catch (PDOException $e) {
        echo "   ❌ Errore: " . $e->getMessage() . "\n";
        $errors++;
    }

    echo "\n";
}

echo str_repeat('─', 50) . "\n";
echo "✅ Importati:  {$imported}\n";
echo "⚠️  Saltati:   {$skipped}\n";
echo "❌ Errori:     {$errors}\n";

if ($DRY_RUN) {
    echo "\n[DRY RUN] Nessun dato è stato effettivamente scritto nel DB.\n";
    echo "Riesegui senza --dry-run per importare davvero.\n";
}