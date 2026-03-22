import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, Instagram, Facebook, Youtube, Users } from 'lucide-react';

const ERP_BASE = 'https://www.fusionteamvolley.it/ERP';
const API_URL = `${ERP_BASE}/api/router.php`;

interface Collaboration {
    id: string;
    partner_name: string;
    partner_type: string;
    agreement_type: string | null;
    start_date: string | null;
    end_date: string | null;
    status: string;
    referent_name: string | null;
    referent_contact: string | null;
    notes: string | null;
    logo_path: string | null;
    website: string | null;
    instagram: string | null;
    facebook: string | null;
    youtube: string | null;
    description: string | null;
}

interface HubConfig {
    text: string | null;
    logo_path: string | null;
}

const Network = () => {
    const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
    const [hubConfig, setHubConfig] = useState<HubConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [colsRes, hubRes] = await Promise.all([
                    fetch(`${API_URL}?module=network&action=getPublicCollaborations`),
                    fetch(`${API_URL}?module=network&action=getPublicHubConfig`)
                ]);
                
                const colsData = await colsRes.json();
                if (colsData.success) {
                    setCollaborations(colsData.data.filter((c: Collaboration) => c.status === 'attivo'));
                }
                
                const hubData = await hubRes.json();
                if (hubData.success && (hubData.data.text || hubData.data.logo_path)) {
                    setHubConfig(hubData.data);
                }
            } catch (error) {
                console.error('Failed to fetch network data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-zinc-500 font-heading tracking-widest uppercase">Caricamento Network...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 pb-20">
            {/* Hero Section */}
            <div className="relative pt-32 pb-24 border-b-2 border-brand-500/20 overflow-hidden">
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('/assets/hero-3.jpg')", filter: "brightness(0.5)" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-950/20 z-10"></div>
                <div className="absolute inset-0 bg-[url('/assets/pattern-dots.svg')] opacity-[0.05] z-10" />
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.7 }}
                        className="inline-flex items-center justify-center p-4 bg-brand-500/10 rounded-full mb-6 ring-1 ring-brand-500/30"
                    >
                        <Users className="text-brand-500" size={32} />
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-5xl md:text-7xl font-heading text-white uppercase tracking-tighter drop-shadow-xl"
                    >
                        IL NOSTRO <span className="text-brand-500">NETWORK</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="mt-6 text-xl text-zinc-400 max-w-3xl mx-auto font-sans leading-relaxed"
                    >
                        I partner e le collaborazioni che rendono possibile il Progetto Fusion.
                        Un ringraziamento a chi condivide i nostri valori in campo e fuori.
                    </motion.p>
                </div>
            </div>

            {/* Hub Banner */}
            {hubConfig && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 mb-12 -mt-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="group relative bg-zinc-900/40 overflow-hidden backdrop-blur-sm border border-zinc-800/60 hover:border-brand-500 transition-all duration-500 flex shadow-2xl hover:shadow-[0_0_30px_rgba(217,70,239,0.3)] flex-col md:flex-row rounded-[2rem] md:rounded-[3rem] md:h-[400px]"
                    >
                        {/* Glow effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/0 via-brand-500/5 to-brand-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                        {/* Logo Section */}
                        <div className="relative flex items-center justify-center bg-white shrink-0 p-8 md:p-12 md:w-2/5 min-h-[200px] md:min-h-0">
                            {hubConfig.logo_path ? (
                                <img 
                                    src={hubConfig.logo_path.startsWith('http') ? hubConfig.logo_path : `${ERP_BASE}/${hubConfig.logo_path}`} 
                                    alt="Savino del bene volley HUB" 
                                    className="max-h-full max-w-full object-contain filter grayscale-0 md:grayscale md:group-hover:grayscale-0 transition-all duration-700 hover:scale-105 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <span className="font-heading text-zinc-800 font-bold group-hover:text-brand-500 transition-colors duration-500 text-6xl">
                                        HUB
                                    </span>
                                </div>
                            )}
                            {/* Inset shadow bottom/right depending on layout */}
                            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t md:bg-gradient-to-l from-black/10 to-transparent"></div>
                        </div>

                        {/* Info Section */}
                        <div className="flex flex-col flex-grow min-h-0 overflow-hidden z-10 p-8 md:p-10 md:w-3/5">
                            <h2 className="text-3xl md:text-4xl font-heading text-white tracking-tight uppercase mb-4 flex items-center gap-3 shrink-0 group-hover:text-brand-400 transition-colors">
                                Savino del bene volley HUB
                            </h2>
                            <div 
                                className="relative mb-4 flex-grow min-h-0 overflow-visible md:overflow-y-auto pr-0 md:pr-4" 
                                style={{ scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 transparent' }}
                            >
                                <div 
                                    className="text-zinc-400 leading-relaxed font-light text-base"
                                    dangerouslySetInnerHTML={{ __html: hubConfig.text?.replace(/\n/g, '<br />') || '' }}
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Collaborations Grid */}
            <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 ${!hubConfig ? '-mt-8' : ''}`}>
                {collaborations.length === 0 ? (
                    <div className="text-center py-20 bg-zinc-900/50 rounded-2xl border border-zinc-800 backdrop-blur-sm">
                        <Users className="mx-auto text-zinc-600 mb-4" size={48} />
                        <h3 className="text-xl text-zinc-300 font-heading">Nessun partner trovato</h3>
                        <p className="text-zinc-500 mt-2">Torna a trovarci presto per scoprire il nostro network.</p>
                    </div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 lg:grid-cols-2 gap-10"
                    >
                        {collaborations.map((collab) => (
                                <motion.div
                                    key={collab.id}
                                    variants={itemVariants}
                                    whileHover={{ y: -10, scale: 1.02 }}
                                    className="group relative bg-zinc-900/40 overflow-hidden backdrop-blur-sm border border-zinc-800/60 hover:border-brand-500 transition-all duration-500 flex flex-col shadow-2xl hover:shadow-[0_0_30px_rgba(217,70,239,0.3)] rounded-[2rem] min-h-[500px] md:h-[500px]"
                                >
                                    {/* Glow effect on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-brand-500/0 via-brand-500/5 to-brand-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                                    {/* Header / Logo */}
                                    <div className="relative flex items-center justify-center bg-white shrink-0 p-6 h-40 sm:h-48">
                                        {collab.logo_path ? (
                                            <img
                                                src={collab.logo_path.startsWith('http') ? collab.logo_path : `${ERP_BASE}/${collab.logo_path}`}
                                                alt={`Logo ${collab.partner_name}`}
                                                className="max-h-full max-w-full object-contain filter grayscale-0 md:grayscale md:group-hover:grayscale-0 transition-all duration-700 hover:scale-105 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="font-heading text-zinc-800 font-bold group-hover:text-brand-500 transition-colors duration-500 text-4xl md:text-5xl">
                                                    {collab.partner_name.substring(0, 2).toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/10 to-transparent"></div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex flex-col flex-grow min-h-0 overflow-hidden z-10 p-6 md:p-8">
                                        <div className="mb-2 shrink-0">
                                            <span className="inline-block px-3 py-1 bg-zinc-800/80 text-brand-400 text-xs font-bold uppercase tracking-wider rounded-full border border-zinc-700">
                                                {collab.partner_type}
                                            </span>
                                        </div>
                                        <h3 className="text-2xl font-heading text-white uppercase tracking-wider group-hover:text-brand-400 transition-colors mb-3 shrink-0">
                                            {collab.partner_name}
                                        </h3>
                                        
                                        {collab.description ? (
                                            <div 
                                                className="relative mb-6 h-auto md:h-[92px] shrink-0 overflow-visible md:overflow-y-auto pr-0 md:pr-2" 
                                                style={{ scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 transparent' }}
                                            >
                                                <p className="text-zinc-400 leading-relaxed font-light text-sm" title={collab.description}>
                                                    {collab.description}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="flex-grow flex items-center mb-6 min-h-0">
                                                <div className="text-zinc-600 text-sm italic">Nessuna descrizione disponibile.</div>
                                            </div>
                                        )}

                                        {/* Social Links */}
                                        <div className="flex flex-wrap items-center gap-3 mt-auto pt-4 border-t border-zinc-800/50 shrink-0">
                                            {collab.website && (
                                                <a
                                                    href={collab.website.startsWith('http') ? collab.website : `https://${collab.website}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-center w-10 h-10 bg-zinc-800/80 rounded-full text-zinc-400 hover:text-white hover:bg-brand-600 transition-all duration-300 hover:scale-110"
                                                    title="Sito Web"
                                                >
                                                    <Globe size={18} strokeWidth={2} />
                                                </a>
                                            )}
                                            {collab.facebook && (
                                                <a
                                                    href={collab.facebook}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-center w-10 h-10 bg-zinc-800/80 rounded-full text-zinc-400 hover:text-white hover:bg-blue-600 transition-all duration-300 hover:scale-110"
                                                    title="Facebook"
                                                >
                                                    <Facebook size={18} strokeWidth={2} />
                                                </a>
                                            )}
                                            {collab.instagram && (
                                                <a
                                                    href={collab.instagram}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-center w-10 h-10 bg-zinc-800/80 rounded-full text-zinc-400 hover:text-white hover:bg-pink-600 transition-all duration-300 hover:scale-110"
                                                    title="Instagram"
                                                >
                                                    <Instagram size={18} strokeWidth={2} />
                                                </a>
                                            )}
                                            {collab.youtube && (
                                                <a
                                                    href={collab.youtube}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-center w-10 h-10 bg-zinc-800/80 rounded-full text-zinc-400 hover:text-white hover:bg-red-600 transition-all duration-300 hover:scale-110"
                                                    title="YouTube"
                                                >
                                                    <Youtube size={18} strokeWidth={2} />
                                                </a>
                                            )}
                                            
                                            {!collab.website && !collab.facebook && !collab.instagram && !collab.youtube && (
                                                <span className="text-xs text-zinc-600 italic">Nessun link social</span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default Network;
