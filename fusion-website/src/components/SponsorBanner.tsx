import { useState, useEffect, useRef } from 'react';
import { ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

interface Sponsor {
    id: string;
    name: string;
    tipo: string | null;
    description: string | null;
    logo_path: string | null;
    website_url: string | null;
}

const ERP_BASE = 'https://www.fusionteamvolley.it/ERP';

interface SponsorBannerProps {
    className?: string;
    placement?: string; // used for analytics validation and tracking placement
}

export const SponsorBanner = ({ className = '', placement = 'generic' }: SponsorBannerProps) => {
    const [sponsor, setSponsor] = useState<Sponsor | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const hasTrackedView = useRef(false);

    useEffect(() => {
        const fetchSponsor = async () => {
            try {
                const res = await fetch(`${ERP_BASE}/api/router.php?module=societa&action=getPublicSponsors`);
                const data = await res.json();
                if (data.success && data.data && data.data.length > 0) {
                    // Prediligere sponsor con logo (se possibile)
                    const withLogo = data.data.filter((s: Sponsor) => s.logo_path);
                    const listToPick = withLogo.length > 0 ? withLogo : data.data;
                    
                    // Scegli uno sponsor a caso dalla lista
                    const randomSponsor = listToPick[Math.floor(Math.random() * listToPick.length)];
                    setSponsor(randomSponsor);
                }
            } catch (error) {
                console.error('Failed to fetch sponsors for banner:', error);
            }
        };

        fetchSponsor();
    }, []);

    // Intersection Observer per triggerare la view visibile (per Analytics)
    useEffect(() => {
        if (!sponsor || hasTrackedView.current) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setIsVisible(true);
                // Invia evento a Google Analytics (se gtag è presente, che nel template base è disponibile globalmente)
                if (typeof window !== 'undefined' && (window as any).gtag) {
                    (window as any).gtag('event', 'view_sponsor_banner', {
                        event_category: 'Sponsorship',
                        event_label: sponsor.name,
                        value: placement
                    });
                }
                hasTrackedView.current = true;
                observer.disconnect();
            }
        }, { threshold: 0.5 }); // Lo considero "visto" se è al 50% visibile sullo schermo

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, [sponsor, placement]);

    const handleSponsorClick = () => {
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'click_sponsor_banner', {
                event_category: 'Sponsorship',
                event_label: sponsor?.name,
                value: placement
            });
        }
    };

    if (!sponsor) return null;

    const sponsorLink = sponsor.website_url 
        ? (sponsor.website_url.startsWith('http') ? sponsor.website_url : `https://${sponsor.website_url}`)
        : '/sponsors'; // Fallback a pagina sponsors generale se manca link

    return (
        <motion.div 
            ref={containerRef}
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className={`w-full max-w-4xl mx-auto my-12 relative group z-10 ${className}`}
        >
            {/* Effetto fucsia diffuso sul retro per dare importanza */}
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-600 to-fuchsia-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            
            <a 
                href={sponsorLink} 
                target={sponsor.website_url ? "_blank" : "_self"} 
                rel="noopener noreferrer"
                onClick={handleSponsorClick}
                className="relative block bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 hover:border-brand-500/50 rounded-2xl p-6 md:p-8 overflow-hidden transition-all duration-300 shadow-2xl"
            >
                {/* Riflesso luce decorativa interno */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 blur-[80px] rounded-full pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>
                
                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                    <div className="w-full md:w-1/3 flex items-center justify-center p-4 bg-white/5 rounded-xl border border-white/5 h-32 md:h-auto overflow-hidden">
                        {sponsor.logo_path ? (
                            <img 
                                src={sponsor.logo_path.startsWith('http') ? sponsor.logo_path : `${ERP_BASE}/${sponsor.logo_path}`} 
                                alt={`Logo ${sponsor.name}`} 
                                className="max-h-24 w-auto object-contain filter drop-shadow-lg"
                                loading="lazy"
                            />
                        ) : (
                            <span className="font-heading text-4xl text-zinc-300 font-bold tracking-tight">{sponsor.name}</span>
                        )}
                    </div>
                    
                    <div className="w-full md:w-2/3 flex flex-col justify-center text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                            <span className="text-[10px] uppercase tracking-widest text-brand-500 font-bold border border-brand-500/30 px-2.5 py-1 rounded-full bg-brand-500/10">Partner d'Eccellenza</span>
                            <span className="text-xs text-zinc-500 font-subheading uppercase">{sponsor.tipo || "Sponsor Ufficiale"}</span>
                        </div>
                        <h3 className="font-heading text-2xl md:text-3xl text-white mb-2 uppercase tracking-wide group-hover:text-brand-400 transition-colors">
                            {sponsor.name}
                        </h3>
                        {sponsor.description && (
                            <p className="text-sm md:text-base text-zinc-400 line-clamp-2 md:line-clamp-3 mb-4 font-light leading-relaxed">
                                {sponsor.description}
                            </p>
                        )}
                        <div className="mt-auto flex items-center justify-center md:justify-start gap-2 text-zinc-300 text-sm uppercase tracking-widest hover:text-white transition-colors group-hover:text-brand-400 font-medium">
                            {sponsor.website_url ? "Visita il sito web" : "Scopri di più"} <ExternalLink size={16} />
                        </div>
                    </div>
                </div>
                
                {/* Etichetta chiara per rispettare le normative ADV */}
                <div className="absolute top-0 right-0 py-1 px-3 bg-zinc-800/80 rounded-bl-lg border-l border-b border-zinc-700/50">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-zinc-500 font-heading">Sponsorship</span>
                </div>
            </a>
        </motion.div>
    );
};
