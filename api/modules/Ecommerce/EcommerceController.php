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
        return (string)(getenv('COGNITO_API_KEY') ?: '');
    }

    private static function cognitoOrderFormId(): int
    {
        // Uses dedicated ECOMMERCE_FORM_ID; falls back to COGNITO_FORM_ID if not set.
        return (int)(getenv('ECOMMERCE_FORM_ID') ?: getenv('COGNITO_FORM_ID') ?: 20);
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
     * _parseShopHtml — extracts product data from WooCommerce-style HTML
     * ────────────────────────────────────────────────────────────────────────── */
    private static function _parseShopHtml(string $html): array
    {
        $products = [];

        // Suppress XML parsing warnings (malformed HTML is common)
        $doc = new \DOMDocument('1.0', 'UTF-8');
        libxml_use_internal_errors(true);
        $doc->loadHTML('<?xml encoding="UTF-8">' . $html);
        libxml_clear_errors();

        $xpath = new \DOMXPath($doc);

        // WooCommerce standard product list items:  <li class="product ...">
        $productNodes = $xpath->query('//li[contains(@class,"product")]');

        if ($productNodes === false || $productNodes->length === 0) {
            // Fallback: try article elements
            $productNodes = $xpath->query('//article[contains(@class,"product")]');
        }

        if ($productNodes === false || $productNodes->length === 0) {
            // Return empty – the import wizard will show a manual-entry prompt
            return [];
        }

        foreach ($productNodes as $node) {
            $product = self::_extractProduct($xpath, $node);
            if ($product !== null) {
                $products[] = $product;
            }
        }

        return $products;
    }

    private static function _extractProduct(\DOMXPath $xpath, \DOMNode $node): ?array
    {
        // ── Name ────────────────────────────────────────────────────────────
        $nameNodes = $xpath->query('.//h2[contains(@class,"woocommerce-loop-product__title")]
            | .//h2[contains(@class,"product-title")]
            | .//h3[contains(@class,"product-title")]
            | .//h2
            | .//h3', $node);
        $name = '';
        if ($nameNodes && $nameNodes->length > 0) {
            $name = trim($nameNodes->item(0)->textContent ?? '');
        }

        if (empty($name)) {
            return null; // Skip nodes without a name
        }

        // ── Price ────────────────────────────────────────────────────────────
        $priceNodes = $xpath->query('.//*[contains(@class,"price")]', $node);
        $priceRaw = '';
        if ($priceNodes && $priceNodes->length > 0) {
            $priceRaw = trim($priceNodes->item(0)->textContent ?? '');
        }
        $price = self::_parsePrice($priceRaw);

        // ── Image ────────────────────────────────────────────────────────────
        $imgNodes = $xpath->query('.//img', $node);
        $imageUrl = '';
        if ($imgNodes && $imgNodes->length > 0) {
            /** @var \DOMElement $imgEl */
            $imgEl = $imgNodes->item(0);
            // Prefer data-src (lazy load) → src fallback
            $imageUrl = $imgEl->getAttribute('data-src')
                ?: $imgEl->getAttribute('src')
                ?: '';
            // If it's a placeholder/SVG, skip
            if (str_contains($imageUrl, 'data:image') || str_contains($imageUrl, '.svg')) {
                $imageUrl = '';
            }
        }

        // ── Product link ─────────────────────────────────────────────────────
        $linkNodes = $xpath->query('.//a[contains(@class,"woocommerce-loop-product__link")]
            | .//a[@href][1]', $node);
        $productUrl = '';
        if ($linkNodes && $linkNodes->length > 0) {
            /** @var \DOMElement $linkEl */
            $linkEl = $linkNodes->item(0);
            $productUrl = $linkEl->getAttribute('href') ?: '';
        }

        // ── Category (from wrapping structure, best-effort) ──────────────────
        $catNodes = $xpath->query('.//*[contains(@class,"product-category")]', $node);
        $category = '';
        if ($catNodes && $catNodes->length > 0) {
            $category = trim($catNodes->item(0)->textContent ?? '');
        }

        return [
            'nome' => $name,
            'prezzo' => $price,
            'immagineUrl' => $imageUrl,
            'descrizione' => '', // Detail page would need a second request; leave empty for wizard
            'categoria' => $category,
            'productUrl' => $productUrl,
        ];
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
        $url = "https://www.cognitoforms.com/api/odata/Forms({$formId})/Entries";

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

    /** Map raw Cognito entry fields → standardised order object */
    private static function _normalizeOrder(array $e): array
    {
        $rawDate = $e['Entry_DateSubmitted'] ?? $e['Entry.DateSubmitted'] ?? null;
        $dateStr = !empty($rawDate) ? date('Y-m-d H:i:s', (int)strtotime((string)$rawDate)) : null;

        return [
            'id' => $e['Id'] ?? null,
            'nomeCliente' => (string)($e['Name'] ?? $e['NomeECognome'] ?? $e['Nome'] ?? ''),
            'email' => $e['Email'] ?? null,
            'telefono' => $e['Telefono'] ?? $e['Cellulare'] ?? null,
            'articoli' => $e['Articoli'] ?? $e['Prodotti'] ?? $e['Items'] ?? '',
            'totale' => self::_parsePrice((string)($e['Totale'] ?? $e['Total'] ?? '')),
            'metodoPagamento' => $e['MetodoPagamento'] ?? $e['PaymentMethod'] ?? null,
            'dataOrdine' => $dateStr,
            'statoForms' => $e['Entry_Status'] ?? $e['Entry.Status'] ?? null,
            'orderSummary' => $e['Order_OrderSummary'] ?? $e['Order.OrderSummary'] ?? null,
            'rawEntry' => $e, // keep full entry for debugging
        ];
    }
}