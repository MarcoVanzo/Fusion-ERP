import React, { useState, useEffect } from 'react';
import { initializeGTM } from '../utils/analytics';

const COOKIE_CONSENT_KEY = 'fusion_cookie_consent';

export const CookieBanner: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Controlla se l'utente ha già espresso una preferenza
        const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (!consent) {
            setIsVisible(true);
        } else if (consent === 'accepted') {
            // Inizializza GTM se aveva già accettato in passato
            initializeGTM();
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
        setIsVisible(false);
        initializeGTM();
    };

    const handleDecline = () => {
        localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 w-full z-[100] bg-zinc-950/95 backdrop-blur-md border-t border-brand-500/30 p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1 text-sm md:text-base text-zinc-300 font-subheading">
                    <p>
                        Utilizziamo i cookie per offrirti la migliore esperienza sul nostro sito web, 
                        per analizzare il traffico e per finalità di marketing. Puoi scegliere di accettare 
                        tutti i cookie o rifiutare quelli non necessari.
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
                    <button 
                        onClick={handleDecline}
                        className="flex-1 md:flex-none px-6 py-2.5 bg-zinc-800 text-zinc-300 font-heading tracking-widest text-sm uppercase rounded-sm hover:bg-zinc-700 transition-colors"
                    >
                        Rifiuta
                    </button>
                    <button 
                        onClick={handleAccept}
                        className="flex-1 md:flex-none px-6 py-2.5 bg-brand-500 text-zinc-950 font-heading tracking-widest text-sm uppercase rounded-sm hover:bg-brand-400 shadow-[0_0_15px_rgba(217,70,239,0.3)] hover:shadow-[0_0_20px_rgba(217,70,239,0.5)] transition-all"
                    >
                        Accetta Tutti
                    </button>
                </div>
            </div>
        </div>
    );
};
