// ID Placeholder per Google Tag Manager
// Il cliente dovrà sostituirlo con il suo ID reale "GTM-XXXXXXX"
export const GTM_ID = 'GTM-XXXXXXX';

declare global {
    interface Window {
        dataLayer: unknown[];
        gtag: (...args: unknown[]) => void;
    }
}

let isGtmInitialized = false;

/**
 * Inizializza l'analitica aggiornando il consenso ai cookie.
 * Richiamato quando l'utente accetta i cookie dal banner o se li ha già accettati.
 */
export const initializeAnalytics = () => {
    if (isGtmInitialized) return;
    
    window.dataLayer = window.dataLayer || [];
    // eslint-disable-next-line prefer-rest-params
    window.gtag = window.gtag || function() { window.dataLayer.push(arguments); };
    
    // Aggiorna lo stato del consenso per GA4
    window.gtag('consent', 'update', {
        'ad_storage': 'granted',
        'ad_user_data': 'granted',
        'ad_personalization': 'granted',
        'analytics_storage': 'granted'
    });

    isGtmInitialized = true;
    console.log('[Analytics] GA4 Configured and Consent Granted.');
};

/**
 * Funzione per inviare i pageview virtuali a GA4.
 * Utile nelle Single Page Applications (SPA) con React Router.
 */
export const trackPageView = (url: string) => {
    window.dataLayer = window.dataLayer || [];
    // eslint-disable-next-line prefer-rest-params
    window.gtag = window.gtag || function() { window.dataLayer.push(arguments); };
    
    window.gtag('event', 'page_view', {
        page_path: url,
        page_location: window.location.href,
        send_to: 'G-TX0B96G1RY'
    });
    console.log(`[Analytics] Tracked PageView: ${url}`);
};
