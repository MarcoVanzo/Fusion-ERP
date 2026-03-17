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

const Network = () => {
    const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCollaborations = async () => {
            try {
                // Modifica URL se occorre usare environment variable
                const res = await fetch(`${API_URL}?module=network&action=getPublicCollaborations`);
                const data = await res.json();
                if (data.success) {
                    // Filtriamo per status 'attivo' se necessario, oppure lasciamo tutto.
                    setCollaborations(data.data.filter((c: Collaboration) => c.status === 'attivo'));
                }
            } catch (error) {
                console.error('Failed to fetch collaborations:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCollaborations();
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
            <div className="relative pt-24 pb-20 bg-zinc-900 border-b-2 border-brand-500/20 overflow-hidden">
                <div className="absolute inset-0 bg-[url('/demo/assets/pattern-dots.svg')] opacity-[0.03]" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
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

            {/* Collaborations Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
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
                                className="group bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-2xl overflow-hidden hover:border-brand-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(217,70,239,0.15)] flex flex-col"
                            >
                                {/* Header / Logo */}
                                <div className="p-8 pb-6 flex items-center justify-center bg-zinc-900 border-b border-zinc-800/50 h-48">
                                    {collab.logo_path ? (
                                        <img
                                            src={`https://www.fusionteamvolley.it/ERP/${collab.logo_path}`}
                                            alt={`Logo ${collab.partner_name}`}
                                            className="max-h-full max-w-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-brand-500/20 transition-colors duration-300 ring-2 ring-zinc-700 group-hover:ring-brand-500/50">
                                            <span className="text-3xl font-heading text-zinc-500 group-hover:text-brand-400 transition-colors">
                                                {collab.partner_name.substring(0, 2).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-8 pt-6 flex flex-col flex-grow">
                                    <div className="mb-2">
                                        <span className="inline-block px-3 py-1 bg-zinc-800/80 text-brand-400 text-xs font-bold uppercase tracking-wider rounded-full mb-4 border border-zinc-700">
                                            {collab.partner_type}
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-heading text-white uppercase tracking-tight group-hover:text-brand-300 transition-colors mb-3">
                                        {collab.partner_name}
                                    </h3>
                                    
                                    {collab.description ? (
                                        <p className="text-zinc-400 text-sm leading-relaxed mb-6 flex-grow">
                                            {collab.description}
                                        </p>
                                    ) : (
                                        <div className="flex-grow flex items-center mb-6">
                                            <div className="text-zinc-600 text-sm italic">Nessuna descrizione disponibile.</div>
                                        </div>
                                    )}

                                    {/* Social Links */}
                                    <div className="flex items-center gap-3 pt-4 border-t border-zinc-800">
                                        {collab.website && (
                                            <a
                                                href={collab.website.startsWith('http') ? collab.website : `https://${collab.website}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 bg-zinc-800 rounded-full text-zinc-400 hover:text-white hover:bg-brand-600 transition-all duration-300 hover:scale-110"
                                                title="Sito Web"
                                            >
                                                <Globe size={18} />
                                            </a>
                                        )}
                                        {collab.facebook && (
                                            <a
                                                href={collab.facebook}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 bg-zinc-800 rounded-full text-zinc-400 hover:text-white hover:bg-blue-600 transition-all duration-300 hover:scale-110"
                                                title="Facebook"
                                            >
                                                <Facebook size={18} />
                                            </a>
                                        )}
                                        {collab.instagram && (
                                            <a
                                                href={collab.instagram}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 bg-zinc-800 rounded-full text-zinc-400 hover:text-white hover:bg-pink-600 transition-all duration-300 hover:scale-110"
                                                title="Instagram"
                                            >
                                                <Instagram size={18} />
                                            </a>
                                        )}
                                        {collab.youtube && (
                                            <a
                                                href={collab.youtube}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 bg-zinc-800 rounded-full text-zinc-400 hover:text-white hover:bg-red-600 transition-all duration-300 hover:scale-110"
                                                title="YouTube"
                                            >
                                                <Youtube size={18} />
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
