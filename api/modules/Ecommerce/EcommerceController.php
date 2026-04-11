<?php
/**
 * Ecommerce Controller
 * Fusion ERP v1.0
 *
 * Actions:
 *   GET  scrapeShop    — cURL proxy: scrapes fusionteamvolley.it/fusion-shop/ (bypasses CORS)
 *   GET  getOrders     — returns Cognito Forms orders (via ECOMMERCE_FORM_ID in .env)
 *   POST syncOrders    — re-syncs orders from Cognito into memory (pass-through, stateless)
 */

declare(strict_types=1);

namespace FusionERP\Modules\Ecommerce;

use FusionERP\Shared\Auth;
use FusionERP\Shared\Response;
use FusionERP\Shared\Database;
use PDO;

class EcommerceController
{
    // ── Configuration ──────────────────────────────────────────────────────────
    private const SHOP_URL = 'https://www.fusionteamvolley.it/fusion-shop/';

    private static function cognitoApiKey(): string
    {
        // Prefer the dedicated eCommerce key; fall back to the generic OutSeason key
        return (string)($_ENV['ECOMMERCE_COGNITO_API_KEY'] ?? getenv('ECOMMERCE_COGNITO_API_KEY') ?: $_ENV['COGNITO_API_KEY'] ?? getenv('COGNITO_API_KEY') ?: '');
    }

    private static function cognitoOrderFormId(): int
    {
        // Uses dedicated ECOMMERCE_FORM_ID; falls back to 17 (Ecommerce) instead of 20 (OutSeason).
        return (int)($_ENV['ECOMMERCE_FORM_ID'] ?? getenv('ECOMMERCE_FORM_ID') ?: 17);
    }

    /* ──────────────────────────────────────────────────────────────────────────
     * scrapeShop — Server-side proxy to bypass CORS
     * GET /api?module=ecommerce&action=scrapeShop
     * ────────────────────────────────────────────────────────────────────────── */
    public function scrapeShop(): void
    {
        Auth::requireRead('ecommerce');

        $ch = curl_init(self::SHOP_URL);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; FusionERP/1.0)',
            CURLOPT_SSL_VERIFYPEER => true,
        ]);

        $html = curl_exec($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr = curl_error($ch);
        curl_close($ch);

        if ($html === false || !empty($curlErr)) {
            Response::error('Impossibile raggiungere il negozio online: ' . $curlErr, 502);
        }

        if ($httpCode !== 200) {
            Response::error('Il negozio ha risposto HTTP ' . $httpCode . '. Potrebbe essere offline.', 502);
        }

        $products = self::_parseShopHtml((string)$html);

        Response::success([
            'products' => $products,
            'count' => count($products),
            'source' => self::SHOP_URL,
            'scraped_at' => date('Y-m-d H:i:s'),
        ]);
    }

    /* ──────────────────────────────────────────────────────────────────────────
     * _parseShopHtml — custom parser for fusionteamvolley.it/fusion-shop/
     *
     * The shop is NOT WooCommerce. It uses a flat custom structure where:
     *   <h2> = category name (WOMAN / MAN / UNISEX)
     *   text node = product name
     *   "XX,00 Euro" text = price line
     *   <a>acquista</a> = closes a product block
     * ────────────────────────────────────────────────────────────────────────── */
    private static function _parseShopHtml(string $html): array
    {
        $doc = new \DOMDocument('1.0', 'UTF-8');
        libxml_use_internal_errors(true);
        $doc->loadHTML('<?xml encoding="UTF-8">' . $html);
        libxml_clear_errors();

        $xpath = new \DOMXPath($doc);

        // Find the main content container (try progressively broader selectors)
        $containers = [
            '//div[contains(@class,"entry-content")]',
            '//div[contains(@class,"page-content")]',
            '//div[contains(@class,"post-content")]',
            '//article',
            '//main',
        ];

        $container = null;
        foreach ($containers as $query) {
            $nodes = $xpath->query($query);
            if ($nodes && $nodes->length > 0) {
                $container = $nodes->item(0);
                break;
            }
        }
        if (!$container) {
            $bodyNodes = $doc->getElementsByTagName('body');
            $container = $bodyNodes->length > 0 ? $bodyNodes->item(0) : null;
        }
        if (!$container) {
            return [];
        }

        $products = [];
        $currentCat = '';
        $pendingName = '';
        $pendingImg = '';

        foreach (self::_walkNodes($container) as $node) {

            $tag = strtolower($node->nodeName ?? '');

            // h2 → new category
            if ($node->nodeType === XML_ELEMENT_NODE && $tag === 'h2') {
                $currentCat = trim($node->textContent ?? '');
                continue;
            }

            // img → store as pending image for next product
            if ($node->nodeType === XML_ELEMENT_NODE && $tag === 'img') {
                /** @var \DOMElement $node */
                $src = $node->getAttribute('data-src') ?: $node->getAttribute('src') ?: '';
                if ($src && !str_contains($src, 'data:image') && !str_contains($src, '.svg')) {
                    $pendingImg = $src;
                }
                continue;
            }

            // <a>acquista</a> → seal the current product
            if ($node->nodeType === XML_ELEMENT_NODE && $tag === 'a'
            && strtolower(trim($node->textContent ?? '')) === 'acquista'
            && !empty($pendingName)
            ) {
                $price = 0.0;
                $cleanName = $pendingName;

                // Extract price embedded in name string: "NOME\n30,00 Euro"
                if (preg_match('/(.+?)\s*([\d.,]+)\s*Euro/si', $pendingName, $m)) {
                    $cleanName = trim(preg_replace('/\s+/', ' ', $m[1]));
                    $price = self::_parsePrice($m[2] . ' Euro');
                }

                if (!empty($cleanName)) {
                    $products[] = [
                        'nome' => $cleanName,
                        'prezzo' => $price,
                        'immagineUrl' => $pendingImg,
                        'descrizione' => '',
                        'categoria' => $currentCat,
                        'productUrl' => '',
                    ];
                }
                $pendingName = '';
                $pendingImg = '';
                continue;
            }

            // Text nodes → accumulate name/price
            if ($node->nodeType === XML_TEXT_NODE) {
                $text = trim($node->nodeValue ?? '');
                if (empty($text) || strlen($text) < 3)
                    continue;

                // Skip footer/legal lines
                $lower = strtolower($text);
                if (str_contains($lower, '©') || str_contains($lower, 'fusion team')
                || str_contains($lower, 'privacy') || str_contains($lower, 'cookie')
                || str_contains($lower, 'p.i.') || preg_match('/^\d+$/', $text)) {
                    continue;
                }

                if (str_contains($text, 'Euro') || str_contains($text, 'euro')) {
                    $pendingName .= "\n" . $text;
                }
                else {
                    $pendingName = $text;
                }
                continue;
            }
        }

        // Deduplicate (the shop has identical products listed per gender section)
        $seen = [];
        $unique = [];
        foreach ($products as $p) {
            $key = strtolower($p['nome']);
            if (!isset($seen[$key])) {
                $seen[$key] = true;
                $unique[] = $p;
            }
        }

        return $unique;
    }

    /**
     * Generator: yields all descendant nodes in document order.
     * @return \Generator<\DOMNode>
     */
    private static function _walkNodes(\DOMNode $parent): \Generator
    {
        foreach ($parent->childNodes as $child) {
            yield $child;
            if ($child->hasChildNodes()) {
                yield from self::_walkNodes($child);
            }
        }
    }

    /**
     * Normalise Italian/European price strings to float.
     * Handles: €12,00 / 12.00€ / 12,00 € / 12.00 / "Da €12,00"
     */
    private static function _parsePrice(string $raw): float
    {
        // Remove currency symbol, surrounding whitespace, non-breaking spaces
        $cleaned = preg_replace('/[€£\$\s\xc2\xa0]/u', '', $raw);
        // Take the first numeric-looking sequence (handles "10,00–20,00" ranges)
        if (preg_match('/[\d.,]+/', $cleaned ?? '', $m)) {
            $num = $m[0];
            // European format: 1.234,56 → remove dots, replace comma with period
            if (preg_match('/^\d{1,3}(\.\d{3})*(,\d+)?$/', $num)) {
                $num = str_replace('.', '', $num);
                $num = str_replace(',', '.', $num);
            }
            else {
                // May already be dot-decimal
                $num = str_replace(',', '', $num);
            }
            return round((float)$num, 2);
        }
        return 0.0;
    }

    /* ──────────────────────────────────────────────────────────────────────────
     * getOrders — retrieves eCommerce orders from the local database
     * GET /api?module=ecommerce&action=getOrders
     * ────────────────────────────────────────────────────────────────────────── */
    public function getOrders(): void
    {
        Auth::requireRead('ecommerce');

        $db = Database::getInstance();
        $stmt = $db->query("SELECT * FROM ec_orders ORDER BY data_ordine DESC");
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $orders = [];
        foreach ($results as $r) {
            $orders[] = [
                'id' => $r['cognito_id'],
                'dataOrdine' => $r['data_ordine'],
                'nomeCliente' => $r['nome_cliente'],
                'email' => $r['email'],
                'telefono' => $r['telefono'],
                'articoli' => current(json_decode($r['articoli'] ?? '[]', true) ?: []),
                'totale' => (float)$r['totale'],
                'metodoPagamento' => $r['metodo_pagamento'],
                'statoForms' => $r['stato_forms'],
                'statoInterno' => $r['stato_interno'],
                'rawEntry' => $r['raw_data'] ? json_decode($r['raw_data'], true) : []
            ];
        }

        Response::success([
            'orders' => $orders,
            'count' => count($orders),
            'fetched_at' => date('Y-m-d H:i:s'),
        ]);
    }

    /* ──────────────────────────────────────────────────────────────────────────
     * updateOrderStatus — updates local internal state
     * POST /api?module=ecommerce&action=updateOrderStatus
     * POST Body: {"id": "1", "stato": "consegnato"}
     * ────────────────────────────────────────────────────────────────────────── */
    public function updateOrderStatus(): void
    {
        Auth::requireWrite('ecommerce');

        $data = json_decode(file_get_contents('php://input'), true);
        $cognitoId = $data['id'] ?? null;
        $stato = trim($data['stato'] ?? '');

        if (!$cognitoId) {
            Response::error('ID ordine mancante', 400);
        }

        $db = Database::getInstance();
        $stmt = $db->prepare("UPDATE ec_orders SET stato_interno = ?, updated_at = NOW() WHERE cognito_id = ?");
        $stmt->execute([$stato, $cognitoId]);

        Response::success(['message' => 'Stato ordine aggiornato.']);
    }

    /* ──────────────────────────────────────────────────────────────────────────
     * syncOrders — downloads new changes from Cognito and merges them into DB
     * POST /api?module=ecommerce&action=syncOrders
     * ────────────────────────────────────────────────────────────────────────── */
    public function syncOrders(): void
    {
        Auth::requireWrite('ecommerce');

        $apiKey = self::cognitoApiKey();
        if (empty($apiKey)) {
            Response::error('COGNITO_API_KEY non configurata nel server.', 500);
        }

        $formId = self::cognitoOrderFormId();
        $url = 'https://www.cognitoforms.com/api/odata/Forms(' . $formId . ')/Views(1)/Entries?$expand=*';

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $apiKey,
                'Accept: application/json',
            ],
            CURLOPT_TIMEOUT => 45,
        ]);
        $response = curl_exec($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr = curl_error($ch);
        curl_close($ch);

        if ($response === false || !empty($curlErr)) {
            Response::error('Errore di connessione a Cognito Forms: ' . $curlErr, 502);
        }

        if ($httpCode !== 200) {
            $msg = 'Cognito Forms ha risposto HTTP ' . $httpCode . '.';
            if ($httpCode === 401) {
                $msg = 'Token Cognito scaduto o non valido (HTTP 401). Rinnova la chiave su cognitoforms.com.';
            }
            Response::error($msg, 502);
        }

        $decoded = json_decode((string)$response, true);
        $entries = $decoded['value'] ?? ($decoded ?: []);

        if (!is_array($entries)) {
            Response::success(['message' => 'Nessun ordine trovato.']);
        }

        $db = Database::getInstance();
        $db->beginTransaction();

        try {
            $stmt = $db->prepare("
                INSERT INTO ec_orders (
                    cognito_id, nome_cliente, email, telefono, articoli, totale,
                    metodo_pagamento, stato_forms, data_ordine, order_summary, raw_data, created_at
                ) VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW()
                )
                ON DUPLICATE KEY UPDATE
                    nome_cliente = VALUES(nome_cliente),
                    email = VALUES(email),
                    telefono = VALUES(telefono),
                    articoli = VALUES(articoli),
                    totale = VALUES(totale),
                    metodo_pagamento = VALUES(metodo_pagamento),
                    stato_forms = VALUES(stato_forms),
                    order_summary = VALUES(order_summary),
                    raw_data = VALUES(raw_data)
            ");

            $count = 0;
            foreach ($entries as $e) {
                $o = self::_normalizeOrder($e);

                $articoliStr = json_encode([$o['articoli']]);
                $stmt->execute([
                    $o['id'],
                    $o['nomeCliente'],
                    $o['email'] ?? '',
                    $o['telefono'] ?? '',
                    $articoliStr,
                    $o['totale'],
                    $o['metodoPagamento'] ?? '',
                    $o['statoForms'] ?? 'Da definire',
                    $o['dataOrdine'],
                    '', // summary can be omitted or extracted inside
                    json_encode($o['rawEntry'])
                ]);
                $count++;
            }
            $db->commit();
            Response::success(['message' => 'Sincronizzati ' . $count . ' ordini dal cloud.', 'count' => $count]);
        }
        catch (\Exception $ex) {
            $db->rollBack();
            Response::error('Errore durante il salvataggio: ' . $ex->getMessage(), 500);
        }
    }

    /** Map raw Cognito entry fields → standardised order object.
     *
     * Cognito serialises field values using the form's internal field names,
     * which differ per form. We try the most likely variants; whatever doesn't
     * match stays null/empty. The full rawEntry is always included so the
     * frontend can debug what came back.
     */
    private static function _normalizeOrder(array $e): array
    {
        // ── Submission date ─────────────────────────────────────────────────
        $rawDate = $e['Entry_DateSubmitted']
            ?? $e['Entry.DateSubmitted']
            ?? $e['Entry']['DateSubmitted']
            ?? null;
        $dateStr = !empty($rawDate)
            ? date('Y-m-d H:i:s', (int)strtotime((string)$rawDate))
            : null;

        // ── Customer name ────────────────────────────────────────────────────
        // Cognito often nests Name as { First, Last } object
        $nameRaw = $e['Name'] ?? $e['NomeECognome'] ?? $e['Nome'] ?? $e['Cliente'] ?? null;
        if (is_array($nameRaw)) {
            $nomeCliente = trim(($nameRaw['First'] ?? '') . ' ' . ($nameRaw['Last'] ?? ''));
        }
        else {
            $nomeCliente = (string)($nameRaw ?? '');
        }

        // ── Order summary (Cognito standard computed field) ──────────────────
        $orderSummary = $e['Order_OrderSummary']
            ?? $e['Order.OrderSummary']
            ?? ($e['Order']['OrderSummary'] ?? null);

        // ── Articoli ────────────────────────────────────────────────────────
        // Try dedicated fields first; fall back to orderSummary
        $articoliRaw = $e['Articoli']
            ?? $e['Prodotti']
            ?? $e['Items']
            ?? $e['Prodotto']
            ?? $e['Article']
            ?? $e['Articles']
            ?? null;

        // If it's an array (multi-select or repeater), join values
        if (is_array($articoliRaw)) {
            $articoliRaw = implode(', ', array_filter(array_map('strval', $articoliRaw)));
        }

        // Use order summary as fallback (strip HTML tags if present)
        if (empty($articoliRaw) && !empty($orderSummary)) {
            $articoliRaw = strip_tags((string)$orderSummary);
        }

        // ── Totale ──────────────────────────────────────────────────────────
        $totaleRaw = $e['Totale'] ?? $e['Total'] ?? $e['Importo'] ?? $e['Prezzo'] ?? '';
        $totale = self::_parsePrice((string)$totaleRaw);

        // If totale is still 0, attempt to extract from orderSummary
        // (Cognito orderSummary format: "Product × €50.00\nTotal: €50.00" or "80,00 € Paid")
        if ($totale === 0.0 && !empty($orderSummary)) {
            $summaryText = strip_tags((string)$orderSummary);
            // First look for explicitly named totals
            if (preg_match('/(?:Total[e]?|Totale)\s*[:\-]?\s*(?:[€\$£]|&euro;)?\s*([\d.,]+)/ui', $summaryText, $tm)) {
                $totale = self::_parsePrice($tm[1]);
            }
            // If still zero, try to extract any money-formatted value
            if ($totale === 0.0 && preg_match_all('/(?:[€\$£]|&euro;)\s*([\d.,]+)|([\d.,]+)\s*(?:[€\$£]|&euro;)/ui', $summaryText, $tm2)) {
                $a1 = array_filter($tm2[1]);
                $a2 = array_filter($tm2[2]);
                $lastMatch = !empty($a1) ? end($a1) : (!empty($a2) ? end($a2) : null);
                if ($lastMatch) {
                    $totale = self::_parsePrice($lastMatch);
                }
            }

            // If articoliRaw just equals the orderSummary and orderSummary is just a price (like "80,00 € Paid"),
            // let's give it a better generic name so the table doesn't say "80,00 € Paid" in the Articoli column.
            if ($articoliRaw === $summaryText && preg_match('/^[\d., ]+(?:[€\$£]|&euro;)+\s*(?:Paid|Unpaid)?$/ui', trim($summaryText))) {
                $articoliRaw = "Acquisto da Form Ordinazione";
            }
        }

        // ── Payment method ───────────────────────────────────────────────────
        $metodo = $e['MetodoPagamento']
            ?? $e['PaymentMethod']
            ?? $e['Pagamento']
            ?? $e['Payment']
            ?? null;

        // ── Email ────────────────────────────────────────────────────────────
        $email = $e['Email'] ?? $e['EmailAddress'] ?? $e['email'] ?? null;

        // ── Phone ────────────────────────────────────────────────────────────
        $telefono = $e['Telefono'] ?? $e['Cellulare'] ?? $e['Phone'] ?? $e['Tel'] ?? null;

        // ── Entry status from Cognito ─────────────────────────────────────────
        $statoForms = $e['Entry_Status']
            ?? $e['Entry.Status']
            ?? ($e['Entry']['Status'] ?? null);

        // Map PaymentStatus to our internal stati se presente e rilevante
        $paymentStatus = $e['Order_PaymentStatus'] ?? $e['Order.PaymentStatus'] ?? null;
        if (strtoupper((string)$paymentStatus) === 'PAID') {
            $statoForms = 'pagato'; // Matches JS frontend green badge
        }
        else if (strtoupper((string)$paymentStatus) === 'UNPAID') {
            $statoForms = 'non pagato'; // Matches JS frontend red badge
        }
        else if (strtoupper((string)$statoForms) === 'SUBMITTED') {
            $statoForms = 'Inviato'; // Generic
        }

        return [
            'id' => $e['Id'] ?? null,
            'nomeCliente' => $nomeCliente,
            'email' => $email,
            'telefono' => $telefono,
            'articoli' => (string)($articoliRaw ?? ''),
            'totale' => $totale,
            'metodoPagamento' => $metodo,
            'dataOrdine' => $dateStr,
            'statoForms' => $statoForms,
            'orderSummary' => $orderSummary,
            '_campiDisponibili' => array_keys($e),
            'rawEntry' => $e
        ];
    }

    // ─── ADMIN PRODUCT ENDPOINTS ───────────────────────────────────────────────
    public function getProdotti(): void
    {
        Auth::requireRead('ecommerce');

        $db = Database::getInstance();
        $stmt = $db->query("SELECT * FROM ec_products ORDER BY nome ASC");
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($products as &$p) {
            $p['id'] = (int)$p['id'];
            $p['prezzo'] = (float)$p['prezzo'];
            $p['disponibile'] = (bool)$p['disponibile'];
        }

        Response::success([
            'prodotti' => $products,
            'count' => count($products)
        ]);
    }

    public function saveProdotto(): void
    {
        Auth::requireWrite('ecommerce');

        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || empty($data['nome'])) {
            Response::error('Dati prodotto non validi o nome mancante.', 400);
        }

        $id = !empty($data['id']) ? (int)$data['id'] : null;
        $nome = trim($data['nome'] ?? '');
        $prezzo = (float)($data['prezzo'] ?? 0);
        $categoria = trim($data['categoria'] ?? '');
        $descrizione = trim($data['descrizione'] ?? '');
        $immagineBase64 = $data['immagineBase64'] ?? null;
        $immagineMimeType = $data['immagineMimeType'] ?? null;
        $immagineUrl = $data['immagineUrl'] ?? null;
        $disponibile = isset($data['disponibile']) ? (int)$data['disponibile'] : 1;

        $db = Database::getInstance();

        if ($id) {
            $stmt = $db->prepare("
                UPDATE ec_products 
                SET nome = ?, prezzo = ?, categoria = ?, descrizione = ?, 
                    immagineBase64 = ?, immagineMimeType = ?, immagineUrl = ?, 
                    disponibile = ?, modificatoIl = NOW()
                WHERE id = ?
            ");
            $stmt->execute([
                $nome, $prezzo, $categoria, $descrizione,
                $immagineBase64, $immagineMimeType, $immagineUrl,
                $disponibile, $id
            ]);
            $insertedId = $id;
        } else {
            $stmt = $db->prepare("
                INSERT INTO ec_products 
                (nome, prezzo, categoria, descrizione, immagineBase64, immagineMimeType, immagineUrl, disponibile, importatoIl, modificatoIl)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");
            $stmt->execute([
                $nome, $prezzo, $categoria, $descrizione,
                $immagineBase64, $immagineMimeType, $immagineUrl, $disponibile
            ]);
            $insertedId = (int)$db->lastInsertId();
        }

        Response::success(['message' => 'Prodotto salvato con successo', 'id' => $insertedId]);
    }

    public function deleteProdotto(): void
    {
        Auth::requireWrite('ecommerce');

        $data = json_decode(file_get_contents('php://input'), true);
        $id = !empty($data['id']) ? (int)$data['id'] : null;

        if (!$id) {
            Response::error('ID prodotto mancante', 400);
        }

        $db = Database::getInstance();
        $stmt = $db->prepare("DELETE FROM ec_products WHERE id = ?");
        $stmt->execute([$id]);

        Response::success(['message' => 'Prodotto eliminato con successo.']);
    }

    public function bulkSaveProdotti(): void
    {
        Auth::requireWrite('ecommerce');

        $data = json_decode(file_get_contents('php://input'), true);
        $prodotti = $data['prodotti'] ?? [];

        if (!is_array($prodotti) || empty($prodotti)) {
            Response::error('Nessun prodotto da salvare.', 400);
        }

        $db = Database::getInstance();
        $db->beginTransaction();

        try {
            $stmt = $db->prepare("
                INSERT INTO ec_products 
                (nome, prezzo, categoria, descrizione, immagineBase64, immagineMimeType, immagineUrl, disponibile, importatoIl, modificatoIl)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");

            $count = 0;
            foreach ($prodotti as $p) {
                if (empty($p['nome'])) continue;
                $stmt->execute([
                    trim($p['nome'] ?? ''),
                    (float)($p['prezzo'] ?? 0),
                    trim($p['categoria'] ?? ''),
                    trim($p['descrizione'] ?? ''),
                    $p['immagineBase64'] ?? null,
                    $p['immagineMimeType'] ?? null,
                    $p['immagineUrl'] ?? null,
                    isset($p['disponibile']) ? (int)$p['disponibile'] : 1
                ]);
                $count++;
            }

            $db->commit();
            Response::success(['message' => "$count prodotti sincronizzati con successo.", 'count' => $count]);
        } catch (\Exception $ex) {
            $db->rollBack();
            Response::error('Errore durante il salvataggio dei prodotti: ' . $ex->getMessage(), 500);
        }
    }

    // ─── PUBLIC ENDPOINTS FOR WEBSITE ──────────────────────────────────────────────
    public function getPublicShop(): void
    {
        $db = Database::getInstance();
        $stmt = $db->query("SELECT id, nome, prezzo, categoria, descrizione, immagineUrl, CASE WHEN immagineBase64 IS NOT NULL AND immagineBase64 != '' THEN 1 ELSE 0 END as hasBase64, disponibile FROM ec_products WHERE disponibile = 1 ORDER BY categoria ASC, nome ASC");
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $formattedProducts = [];
        foreach ($products as $p) {
            $imageUrl = $p['immagineUrl'];
            if (!empty($p['hasBase64'])) {
                // Return a dynamic route that streams the image without bloating the JSON payload
                $imageUrl = '/ERP/api/router.php?module=ecommerce&action=getProductImage&id=' . (int)$p['id'];
            }

            $formattedProducts[] = [
                'id' => (int)$p['id'],
                'nome' => $p['nome'],
                'prezzo' => (float)$p['prezzo'],
                'categoria' => $p['categoria'],
                'descrizione' => $p['descrizione'],
                'immagineUrl' => $imageUrl,
                'disponibile' => (bool)$p['disponibile']
            ];
        }

        Response::success([
            'products' => $formattedProducts,
            'count' => count($formattedProducts),
            'source' => 'db',
            'scraped_at' => date('Y-m-d H:i:s'),
        ]);
    }

    public function getProductImage(): void
    {
        $id = (int)($_GET['id'] ?? 0);
        if (!$id) {
            http_response_code(400);
            echo "Missing ID";
            exit;
        }

        $db = Database::getInstance();
        $stmt = $db->prepare("SELECT immagineBase64, immagineMimeType FROM ec_products WHERE id = ? AND immagineBase64 IS NOT NULL AND immagineBase64 != ''");
        $stmt->execute([$id]);
        $product = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$product || empty($product['immagineBase64'])) {
            http_response_code(404);
            echo "Image not found";
            exit;
        }

        $base64 = $product['immagineBase64'];
        
        // Strip data:image/*;base64, prefix if present
        if (strpos($base64, ',') !== false) {
            [, $base64] = explode(',', $base64, 2);
        }

        $imageData = base64_decode($base64, true);
        if ($imageData === false || $imageData === '') {
            http_response_code(500);
            echo "Invalid image data";
            exit;
        }

        $mimeType = $product['immagineMimeType'] ?: 'image/jpeg';
        
        // Output image with cache headers
        header("Content-Type: " . $mimeType);
        header("Cache-Control: public, max-age=86400, immutable"); // Cache for 24 hours
        header("Content-Length: " . strlen($imageData));
        echo $imageData;
        exit;
    }
}