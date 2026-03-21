import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, Instagram, Facebook, Youtube, Diamond } from 'lucide-react';

const ERP_BASE = 'https://www.fusionteamvolley.it/ERP';
const API_URL = `${ERP_BASE}/api/router.php`;

interface Sponsor {
    id: string;
    name: string;
    tipo: string | null;
    description: string | null;
    logo_path: string | null;
    website_url: string | null;
    instagram_url: string | null;
    facebook_url: string | null;
    linkedin_url: string | null;
    tiktok_url: string | null;
}

const Sponsors = () => {
    const [sponsors, setSponsors] = useState<Sponsor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSponsors = async () => {
            try {
                // If local API is available use it, else fallback or use the production backend
                const res = await fetch(`${API_URL}?module=societa&action=getPublicSponsors`);
                const data = await res.json();
                if (data.success) {
                    setSponsors(data.data);
                } else {
                    console.error('Failed to fetch sponsors:', data.error);
                }
            } catch (error) {
                console.error('Failed to fetch sponsors:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSponsors();
    }, []);

    // Grouping by type
    const groupedSponsors = sponsors.reduce((acc, sponsor) => {
        const tipo = sponsor.tipo || 'Sponsor';
        if (!acc[tipo]) acc[tipo] = [];
        acc[tipo].push(sponsor);
        return acc;
    }, {} as Record<string, Sponsor[]>);

    // Desired order of types: Main Sponsor > Title Sponsor > Sponsor Tecnico > Sponsor > others
    const sortOrder = ['Main Sponsor', 'Title Sponsor', 'Sponsor Tecnico', 'Sponsor'];
    
    const sortedGroups = Object.keys(groupedSponsors).sort((a, b) => {
        const idxA = sortOrder.indexOf(a);
        const idxB = sortOrder.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
    });

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, type: "spring" as const, stiffness: 100 } }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-zinc-500 font-heading tracking-widest uppercase">Caricamento Sponsor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 pb-20 overflow-hidden">
            {/* Hero Section */}
            <div className="relative pt-32 pb-32 border-b border-brand-500/10">
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('/demo/assets/hero-1.jpg')", filter: "brightness(0.3) saturate(1.2)" }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-950/60 to-zinc-950 z-10"></div>
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-zinc-950 to-transparent z-10"></div>
                <div className="absolute inset-0 bg-[url('/demo/assets/pattern-dots.svg')] opacity-[0.03] z-10" />
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ duration: 0.8, type: "spring" }}
                        className="inline-flex items-center justify-center p-5 bg-gradient-to-br from-brand-600/20 to-brand-400/5 rounded-2xl mb-8 ring-1 ring-brand-500/30 shadow-[0_0_50px_rgba(217,70,239,0.15)] backdrop-blur-md"
                    >
                        <Diamond className="text-brand-400" size={36} strokeWidth={1.5} />
                    </motion.div>
                    
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
                        className="text-6xl md:text-8xl font-heading text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500 uppercase tracking-tighter drop-shadow-2xl"
                    >
                        I NOSTRI <span className="text-brand-500">SPONSOR</span>
                    </motion.h1>
                    
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="mt-8 text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto font-sans leading-relaxed font-light"
                    >
                        Partner d'eccellenza che sostengono la nostra visione.
                        Insieme puntiamo a traguardi sempre più ambiziosi.
                    </motion.p>
                </div>
            </div>

            {/* Sponsors List */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 mt-12">
                {sponsors.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-center py-32 bg-zinc-900/30 rounded-3xl border border-zinc-800/50 backdrop-blur-xl"
                    >
                        <Diamond className="mx-auto text-zinc-700 mb-6" size={64} strokeWidth={1} />
                        <h3 className="text-2xl text-zinc-300 font-heading tracking-widest">Nessun sponsor trovato</h3>
                        <p className="text-zinc-500 mt-3 text-lg">In attesa di nuovi partner d'eccellenza.</p>
                    </motion.div>
                ) : (
                    <div className="space-y-32">
                        {sortedGroups.map((group, groupIdx) => (
                            <div key={group}>
                                {/* Group Header */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    transition={{ duration: 0.6 }}
                                    className="flex items-center gap-6 mb-12"
                                >
                                    <h2 className="text-3xl md:text-4xl font-heading text-white uppercase tracking-widest shrink-0">
                                        {group}
                                    </h2>
                                    <div className="h-[2px] w-full bg-gradient-to-r from-brand-500/50 via-zinc-800 to-transparent rounded-full"></div>
                                </motion.div>

                                {/* Group Grid */}
                                <motion.div
                                    variants={containerVariants}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true, margin: "-50px" }}
                                    className={`grid gap-8 ${
                                        group === 'Main Sponsor' ? 'grid-cols-1' :
                                        group === 'Title Sponsor' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
                                        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                                    }`}
                                >
                                    {groupedSponsors[group].map((sponsor, idx) => {
                                        const isMain = group === 'Main Sponsor';
                                        return (
                                        <motion.div
                                            key={sponsor.id}
                                            variants={itemVariants}
                                            whileHover={{ y: -10, scale: 1.02 }}
                                            className={`group relative bg-zinc-900/40 overflow-hidden backdrop-blur-sm border border-zinc-800/60 hover:border-brand-500 transition-all duration-500 flex shadow-2xl hover:shadow-[0_0_30px_rgba(217,70,239,0.3)] ${isMain ? 'flex-col md:flex-row rounded-[2rem] md:rounded-[3rem] min-h-[400px] md:h-[400px]' : 'flex-col rounded-[2rem] min-h-[450px] md:h-[450px]'}`}
                                        >
                                            {/* Glow effect on hover */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/0 via-brand-500/5 to-brand-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                                            {/* Logo Section */}
                                            <div className={`relative flex items-center justify-center bg-white shrink-0 ${isMain ? 'p-8 md:p-12 md:w-1/2 min-h-[200px] md:min-h-0' : 'p-6 h-40 sm:h-48'}`}>
                                                {sponsor.logo_path ? (
                                                    <img
                                                        src={sponsor.logo_path.startsWith('http') ? sponsor.logo_path : `${ERP_BASE}/${sponsor.logo_path}`}
                                                        alt={`Logo ${sponsor.name}`}
                                                        className="max-h-full max-w-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-700 hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <span className={`font-heading text-zinc-300 font-bold group-hover:text-brand-500 transition-colors duration-500 ${isMain ? 'text-7xl' : 'text-4xl md:text-6xl'}`}>
                                                            {sponsor.name.substring(0, 2).toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}
                                                
                                                {/* Inset shadow bottom/right depending on layout */}
                                                <div className={`absolute inset-0 pointer-events-none ${isMain ? 'bg-gradient-to-t md:bg-gradient-to-l' : 'bg-gradient-to-t'} from-black/10 to-transparent`}></div>
                                            </div>

                                            {/* Info Section */}
                                            <div className={`flex flex-col flex-grow min-h-0 overflow-hidden z-10 ${isMain ? 'p-8 md:p-10 md:w-1/2' : 'p-6'}`}>
                                                <h3 className={`${isMain ? 'text-3xl md:text-4xl mb-4' : 'text-2xl mb-4'} font-heading text-white uppercase tracking-wider group-hover:text-brand-400 transition-colors shrink-0`}>
                                                    {sponsor.name}
                                                </h3>
                                                
                                                {sponsor.description && (
                                                    <div 
                                                        className="relative mb-4 flex-grow min-h-0 overflow-visible md:overflow-y-auto pr-0 md:pr-4" 
                                                        style={{ scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 transparent' }}
                                                    >
                                                        <p className={`text-zinc-400 leading-relaxed font-light ${isMain ? 'text-base' : 'text-sm'}`}>
                                                            {sponsor.description}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Socials / Links */}
                                                <div className={`flex flex-wrap items-center gap-3 mt-auto pt-4 border-t border-zinc-800/50 shrink-0`}>
                                                    {sponsor.website_url && (
                                                        <a
                                                            href={sponsor.website_url.startsWith('http') ? sponsor.website_url : `https://${sponsor.website_url}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`flex items-center justify-center bg-zinc-800/80 rounded-full text-zinc-400 hover:text-white hover:bg-brand-600 hover:scale-110 transition-all duration-300 ${isMain ? 'w-12 h-12' : 'w-10 h-10'}`}
                                                            title="Sito Web"
                                                        >
                                                            <Globe size={isMain ? 22 : 18} strokeWidth={2} />
                                                        </a>
                                                    )}
                                                    {sponsor.facebook_url && (
                                                        <a
                                                            href={sponsor.facebook_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`flex items-center justify-center bg-zinc-800/80 rounded-full text-zinc-400 hover:text-white hover:bg-blue-600 hover:scale-110 transition-all duration-300 ${isMain ? 'w-12 h-12' : 'w-10 h-10'}`}
                                                            title="Facebook"
                                                        >
                                                            <Facebook size={isMain ? 22 : 18} strokeWidth={2} />
                                                        </a>
                                                    )}
                                                    {sponsor.instagram_url && (
                                                        <a
                                                            href={sponsor.instagram_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`flex items-center justify-center bg-zinc-800/80 rounded-full text-zinc-400 hover:text-white hover:bg-pink-600 hover:scale-110 transition-all duration-300 ${isMain ? 'w-12 h-12' : 'w-10 h-10'}`}
                                                            title="Instagram"
                                                        >
                                                            <Instagram size={isMain ? 22 : 18} strokeWidth={2} />
                                                        </a>
                                                    )}
                                                    {sponsor.linkedin_url && (
                                                        <a
                                                            href={sponsor.linkedin_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`flex items-center justify-center bg-zinc-800/80 rounded-full text-zinc-400 hover:text-white hover:bg-blue-800 hover:scale-110 transition-all duration-300 ${isMain ? 'w-12 h-12' : 'w-10 h-10'}`}
                                                            title="LinkedIn"
                                                        >
                                                            <Globe size={isMain ? 22 : 18} strokeWidth={2} />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )})}
                                </motion.div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
        </div>
    );
};

export default Sponsors;
