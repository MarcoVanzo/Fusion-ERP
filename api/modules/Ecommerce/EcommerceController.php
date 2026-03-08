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
            Response::error("Il negozio ha risposto HTTP {$httpCode}. Potrebbe essere offline.", 502);
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
                yield fromself::_walkNodes($child);
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
     * getOrders — retrieves Cognito Forms orders (live, no DB caching)
     * GET /api?module=ecommerce&action=getOrders
     * ────────────────────────────────────────────────────────────────────────── */
    public function getOrders(): void
    {
        Auth::requireRead('ecommerce');

        $apiKey = self::cognitoApiKey();
        if (empty($apiKey)) {
            Response::error('COGNITO_API_KEY non configurata nel server.', 500);
        }

        $formId = self::cognitoOrderFormId();
        $url = "https://www.cognitoforms.com/api/odata/Forms({$formId})/Views(1)/Entries";

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $apiKey,
                'Accept: application/json',
            ],
            CURLOPT_TIMEOUT => 30,
        ]);
        $response = curl_exec($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr = curl_error($ch);
        curl_close($ch);

        if ($response === false || !empty($curlErr)) {
            Response::error('Errore di connessione a Cognito Forms: ' . $curlErr, 502);
        }

        if ($httpCode !== 200) {
            $msg = "Cognito Forms ha risposto HTTP {$httpCode}.";
            if ($httpCode === 401) {
                $msg = 'Token Cognito scaduto o non valido (HTTP 401). Rinnova la chiave su cognitoforms.com → Account → API Keys.';
            }
            elseif ($httpCode === 404) {
                $msg = "Form ID {$formId} non trovato (HTTP 404). Controlla ECOMMERCE_FORM_ID nel file .env.";
            }
            Response::error($msg, 502);
        }

        $decoded = json_decode((string)$response, true);
        $entries = $decoded['value'] ?? ($decoded ?: []);

        if (!is_array($entries)) {
            $entries = [];
        }

        // Normalize entries into a clean, predictable shape for the frontend
        $orders = array_map(fn($e) => self::_normalizeOrder($e), $entries);

        Response::success([
            'orders' => $orders,
            'count' => count($orders),
            'form_id' => $formId,
            'fetched_at' => date('Y-m-d H:i:s'),
        ]);
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
        // (Cognito orderSummary format: "Product × €50.00\nTotal: €50.00")
        if ($totale === 0.0 && !empty($orderSummary)) {
            $summaryText = strip_tags((string)$orderSummary);
            // Look for "Total: €XX" or "Totale: XX,00 €" pattern
            if (preg_match('/(?:Total[e]?|Totale)\s*[:\-]?\s*[€$£]?\s*([\d.,]+)/i', $summaryText, $tm)) {
                $totale = self::_parsePrice($tm[1]);
            }
            // Also try last money-like value in the string
            if ($totale === 0.0 && preg_match_all('/[€$£]\s*([\d.,]+)|([\d.,]+)\s*[€$£]/', $summaryText, $tm2)) {
                $lastMatch = end($tm2[1]) ?: end($tm2[2]);
                if ($lastMatch)
                    $totale = self::_parsePrice($lastMatch);
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
            // Debug: expose all top-level keys (helpful for first-time setup)
            '_campiDisponibili' => array_keys($e),
        ];
    }
}