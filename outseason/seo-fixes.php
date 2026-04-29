<?php
/**
 * Plugin Name: FTV SEO & Security Fixes
 * Description: Fix SEO critici per ftvoutseason.it — security headers, title tag, og:type, caching.
 * Version: 1.0.0
 * Author: Fusion Team Dev
 *
 * Questo è un mu-plugin (must-use). Viene caricato automaticamente da WordPress
 * senza necessità di attivazione dal pannello admin.
 */

defined('ABSPATH') || exit;

// ═══════════════════════════════════════════════════════════════
// 1. SECURITY HEADERS
// ═══════════════════════════════════════════════════════════════
add_action('send_headers', function () {
    // Prevent clickjacking
    header('X-Frame-Options: SAMEORIGIN');
    // Prevent MIME-type sniffing
    header('X-Content-Type-Options: nosniff');
    // XSS Protection (legacy browsers)
    header('X-XSS-Protection: 1; mode=block');
    // Referrer Policy
    header('Referrer-Policy: strict-origin-when-cross-origin');
    // HSTS — enforce HTTPS for 1 year
    header('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');
    // Permissions Policy (restrict sensitive APIs)
    header("Permissions-Policy: camera=(), microphone=(), geolocation=()");
});

// ═══════════════════════════════════════════════════════════════
// 2. FIX TITLE TAG — Rimuove il '#' iniziale
// ═══════════════════════════════════════════════════════════════
add_filter('pre_get_document_title', function ($title) {
    // Remove leading '#' if present
    return ltrim($title, '#');
}, 999);

// Also filter wp_title for compatibility
add_filter('wp_title', function ($title) {
    return ltrim($title, '#');
}, 999);

// AIOSEO filter — if AIOSEO generates the title
add_filter('aioseo_title', function ($title) {
    return ltrim($title, '#');
}, 999);

// ═══════════════════════════════════════════════════════════════
// 3. FIX og:type — Homepage deve essere 'website', non 'article'
//    + FIX alt text vuoti sulle immagini homepage
// ═══════════════════════════════════════════════════════════════
add_filter('aioseo_og_type', function ($type) {
    if (is_front_page() || is_home()) {
        return 'website';
    }
    return $type;
}, 999);

// Fallback aggressivo: usa output buffer per forzare la sostituzione
// nel caso AIOSEO ignori il filtro sopra
add_action('template_redirect', function () {
    if (is_front_page() || is_home()) {
        ob_start(function ($html) {
            // Fix og:type da article a website
            $html = preg_replace(
                '/<meta\s+property="og:type"\s+content="article"\s*\/?>/i',
                '<meta property="og:type" content="website" />',
                $html
            );

            // Fix immagini con alt="" vuoto — aggiungi alt descrittivi
            // per le immagini note della homepage
            $alt_map = [
                'chi_siamo_ftv_out_season'       => 'Chi siamo - Fusion Team Volley Out Season master pallavolo',
                'il-master_out_of_season'        => 'Il Master Out Season - programma allenamento volley',
                'staff_out_of_season'            => 'Staff e coach professionisti Out Season pallavolo',
                'date-tariffe_out_of_season'     => 'Date e tariffe Out Season 2026 camp volley',
                'registrazione_ftv_out_season'   => 'Registrazione iscrizione Out Season Fusion Team Volley',
                'contatti_fusion-team_out_of_season' => 'Contatti Fusion Team Volley Out Season',
                'fusion-team-volley-ftv-out-season' => 'Fusion Team Volley Out Season master alta specializzazione',
                'Fusion_OutSeason-Logo'          => 'Logo Fusion Out Season master pallavolo',
            ];
            foreach ($alt_map as $filename => $alt_text) {
                $html = preg_replace(
                    '/(<img[^>]*' . preg_quote($filename, '/') . '[^>]*)\balt=""\s*/i',
                    '$1alt="' . esc_attr($alt_text) . '" ',
                    $html
                );
            }

            // Fix H1 mancante — inietta un H1 SEO-friendly nella hero section
            // IMPORTANTE: opera solo sul <body> per non contaminare il <title>
            $body_pos = stripos($html, '<body');
            if ($body_pos !== false && stripos($html, '<h1') === false) {
                $head_part = substr($html, 0, $body_pos);
                $body_part = substr($html, $body_pos);
                $body_part = preg_replace(
                    '/(<(?:span|div|p)[^>]*>)\s*(Master di [Aa]lta [Ss]pecializzazione)\s*(<\/(?:span|div|p)>)/i',
                    '$1<h1 style="font-size:inherit;font-weight:inherit;margin:0;padding:0;line-height:inherit;color:inherit;display:inline;">$2</h1>$3',
                    $body_part,
                    1
                );
                $html = $head_part . $body_part;
            }

            return $html;
        });
    }
}, 0);

// ═══════════════════════════════════════════════════════════════
// 4. DISABILITA PHPSESSID sulla homepage pubblica
//    (impedisce la cache CDN di Aruba)
// ═══════════════════════════════════════════════════════════════
add_action('init', function () {
    // Non avviare sessioni per utenti non loggati su pagine pubbliche
    if (!is_admin() && !is_user_logged_in() && !defined('DOING_AJAX')) {
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_write_close();
        }
        // Rimuovi il cookie di sessione se non necessario
        if (isset($_COOKIE['PHPSESSID']) && !is_user_logged_in()) {
            setcookie('PHPSESSID', '', time() - 3600, '/');
        }
    }
}, 1);

// Impedisci l'avvio di sessioni PHP su pagine pubbliche
add_action('plugins_loaded', function () {
    if (!is_admin() && !wp_doing_ajax()) {
        if (session_status() === PHP_SESSION_NONE) {
            // Non avviare la sessione — lascia che la pagina sia cachable
            ini_set('session.use_cookies', '0');
        }
    }
}, 1);

// ═══════════════════════════════════════════════════════════════
// 5. AGGIUNGI SCHEMA ORGANIZATION (JSON-LD)
// ═══════════════════════════════════════════════════════════════
add_action('wp_head', function () {
    if (!is_front_page() && !is_home()) {
        return;
    }
    $schema = [
        '@context'   => 'https://schema.org',
        '@type'      => 'SportsOrganization',
        'name'       => 'Fusion Team Volley A.S.D.',
        'alternateName' => 'FTV Out Season',
        'url'        => 'https://www.ftvoutseason.it',
        'logo'       => 'https://www.ftvoutseason.it/wp-content/uploads/2025/12/Logo-Colorato.png',
        'description'=> 'Master di Alta Specializzazione Volley. Allenamenti mirati, tecnologia avanzata e coaching di livello nazionale.',
        'sport'      => 'Volleyball',
        'address'    => [
            '@type'           => 'PostalAddress',
            'streetAddress'   => 'Via Vicentino n. 1',
            'addressLocality' => 'Trivignano Venezia',
            'addressRegion'   => 'VE',
            'postalCode'      => '30174',
            'addressCountry'  => 'IT',
        ],
        'contactPoint' => [
            '@type'       => 'ContactPoint',
            'telephone'   => '+39 0422 485757',
            'email'       => 'outseason@fusionteamvolley.it',
            'contactType' => 'customer service',
        ],
        'sameAs' => [
            'https://www.instagram.com/fusionteamvolley/',
            'https://www.facebook.com/FusionTeamVolley',
            'https://www.youtube.com/@fusionteamvolley9176',
        ],
        'event' => [
            [
                '@type'     => 'SportsEvent',
                'name'      => 'FTV Out Season — Settimana 1',
                'startDate' => '2026-06-29',
                'endDate'   => '2026-07-03',
                'location'  => [
                    '@type'   => 'Place',
                    'name'    => 'Fusion Team Volley',
                    'address' => 'Via Vicentino n. 1, 30174 Trivignano Venezia (VE)',
                ],
                'offers' => [
                    ['@type' => 'Offer', 'name' => 'Full Master',  'price' => '650', 'priceCurrency' => 'EUR', 'url' => 'https://www.ftvoutseason.it/ftv-out-season-registrati/'],
                    ['@type' => 'Offer', 'name' => 'Daily Master', 'price' => '400', 'priceCurrency' => 'EUR', 'url' => 'https://www.ftvoutseason.it/ftv-out-season-registrati/'],
                ],
            ],
            [
                '@type'     => 'SportsEvent',
                'name'      => 'FTV Out Season — Settimana 2',
                'startDate' => '2026-07-06',
                'endDate'   => '2026-07-10',
                'location'  => [
                    '@type'   => 'Place',
                    'name'    => 'Fusion Team Volley',
                    'address' => 'Via Vicentino n. 1, 30174 Trivignano Venezia (VE)',
                ],
                'offers' => [
                    ['@type' => 'Offer', 'name' => 'Full Master',  'price' => '650', 'priceCurrency' => 'EUR', 'url' => 'https://www.ftvoutseason.it/ftv-out-season-registrati/'],
                    ['@type' => 'Offer', 'name' => 'Daily Master', 'price' => '400', 'priceCurrency' => 'EUR', 'url' => 'https://www.ftvoutseason.it/ftv-out-season-registrati/'],
                ],
            ],
            [
                '@type'     => 'SportsEvent',
                'name'      => 'FTV Out Season — Settimana 3',
                'startDate' => '2026-07-13',
                'endDate'   => '2026-07-17',
                'location'  => [
                    '@type'   => 'Place',
                    'name'    => 'Fusion Team Volley',
                    'address' => 'Via Vicentino n. 1, 30174 Trivignano Venezia (VE)',
                ],
                'offers' => [
                    ['@type' => 'Offer', 'name' => 'Full Master',  'price' => '650', 'priceCurrency' => 'EUR', 'url' => 'https://www.ftvoutseason.it/ftv-out-season-registrati/'],
                    ['@type' => 'Offer', 'name' => 'Daily Master', 'price' => '400', 'priceCurrency' => 'EUR', 'url' => 'https://www.ftvoutseason.it/ftv-out-season-registrati/'],
                ],
            ],
        ],
    ];
    echo '<script type="application/ld+json">' . wp_json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . '</script>' . "\n";
}, 1);

// ═══════════════════════════════════════════════════════════════
// 6. AGGIUNGI KEYWORD "VOLLEY" AI META TAG
// ═══════════════════════════════════════════════════════════════
add_filter('aioseo_description', function ($desc) {
    if (is_front_page() || is_home()) {
        // Se non contiene già "volley", aggiungi context
        if (stripos($desc, 'volley') === false) {
            $desc = str_replace(
                'performance reale.',
                'performance reale. Camp estivo di pallavolo con coach professionisti.',
                $desc
            );
        }
    }
    return $desc;
}, 999);

// ═══════════════════════════════════════════════════════════════
// 7. ELIMINA POST "HELLO WORLD" (ID 1) — esegue una sola volta
// ═══════════════════════════════════════════════════════════════
add_action('init', function () {
    // Esegui solo se non è già stato fatto
    if (get_option('ftv_seo_hello_world_removed')) {
        return;
    }
    $post = get_post(1);
    if ($post && $post->post_title === 'Hello world!') {
        wp_trash_post(1);
        update_option('ftv_seo_hello_world_removed', true);
    }
}, 20);

// ═══════════════════════════════════════════════════════════════
// 8. NOINDEX per pagine non necessarie (search, archive, attachment)
// ═══════════════════════════════════════════════════════════════
add_action('wp_head', function () {
    if (is_search() || is_attachment() || is_author() || is_date() || is_tag()) {
        echo '<meta name="robots" content="noindex, nofollow" />' . "\n";
    }
}, 1);

