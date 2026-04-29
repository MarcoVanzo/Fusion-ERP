declare global {
    interface Window {
        dataLayer: unknown[];
        gtag: (...args: unknown[]) => void;
    }
}

/**
 * Funzione per inviare i pageview virtuali a GA4.
 * Utile nelle Single Page Applications (SPA) con React Router.
 * Il consenso è gestito da Cookiebot tramite Google Consent Mode v2 (index.html).
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
};
