// ID Placeholder per Google Tag Manager
// Il cliente dovrà sostituirlo con il suo ID reale "GTM-XXXXXXX"
export const GTM_ID = 'GTM-XXXXXXX';

declare global {
    interface Window {
        dataLayer: any[];
    }
}

let isGtmInitialized = false;

/**
 * Inizializza Google Tag Manager spargendo il consenso ai cookie.
 * ATTENZIONE: Questa funzione è richiamata forzatamente a prescindere dal clic sul banner dei cookie.
 */
export const initializeGTM = () => {
    if (isGtmInitialized) return;
    
    // Inizializza dataLayer se non esiste
    window.dataLayer = window.dataLayer || [];
    
    // Push dell'evento personalizzato di consenso accettato per GTM/Consent Mode
    window.dataLayer.push({
        'event': 'cookie_consent_update',
        'consent_status': 'granted'
    });

    isGtmInitialized = true;
    console.log('[Analytics] GTM Configured and Consent Granted.');
};

/**
 * Funzione per inviare i pageview virtuali a GTM.
 * È utile nelle Single Page Applications (SPA) con React Router.
 */
export const trackPageView = (url: string) => {
    // Registra la view solo se l'utente ha dato il consenso (GTM è stato inizializzato o verrà gestito lato Tag Manager)
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        'event': 'virtual_page_view',
        'page_path': url
    });
    console.log(`[Analytics] Tracked PageView: ${url}`);
};
